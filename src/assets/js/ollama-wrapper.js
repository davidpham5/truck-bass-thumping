/**
 * Ollama LLM Wrapper for This Is My Next Engine
 * Provides song recommendations using local LLM via Ollama
 */

(function() {
    'use strict';

    class OllamaWrapper {
        constructor() {
            // Default Ollama settings
            this.baseUrl = 'http://localhost:11434';
            this.model = 'llama3.2';
            this.isConnected = false;
            this.loadSettings();
        }

        /**
         * Load settings from localStorage
         */
        loadSettings() {
            const saved = localStorage.getItem('ollamaSettings');
            if (saved) {
                try {
                    const settings = JSON.parse(saved);
                    this.baseUrl = settings.baseUrl || this.baseUrl;
                    this.model = settings.model || this.model;
                } catch (e) {
                    console.warn('Failed to load Ollama settings:', e);
                }
            }
        }

        /**
         * Save settings to localStorage
         */
        saveSettings() {
            localStorage.setItem('ollamaSettings', JSON.stringify({
                baseUrl: this.baseUrl,
                model: this.model
            }));
        }

        /**
         * Update Ollama settings
         */
        updateSettings(baseUrl, model) {
            this.baseUrl = baseUrl || this.baseUrl;
            this.model = model || this.model;
            this.saveSettings();
        }

        /**
         * Check if Ollama is available
         */
        async checkConnection() {
            try {
                const response = await fetch(`${this.baseUrl}/api/tags`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.isConnected = true;
                    return {
                        connected: true,
                        models: data.models || []
                    };
                }
                this.isConnected = false;
                return { connected: false, error: 'Failed to connect to Ollama' };
            } catch (error) {
                this.isConnected = false;
                return { 
                    connected: false, 
                    error: `Cannot connect to Ollama at ${this.baseUrl}. Make sure Ollama is running.`
                };
            }
        }

        /**
         * Generate song recommendations using LLM
         */
        async generateRecommendations(userPlaylist, friendsPlaylist, trustLevel) {
            if (!this.isConnected) {
                const check = await this.checkConnection();
                if (!check.connected) {
                    throw new Error(check.error);
                }
            }

            // Prepare the prompt with playlist data
            const prompt = this.buildRecommendationPrompt(userPlaylist, friendsPlaylist, trustLevel);
            
            try {
                const response = await fetch(`${this.baseUrl}/api/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        prompt: prompt,
                        stream: false,
                        options: {
                            temperature: 0.7,
                            num_predict: 2000
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Ollama API error: ${response.status}`);
                }

                const data = await response.json();
                return this.parseRecommendationResponse(data.response, friendsPlaylist);
            } catch (error) {
                console.error('Ollama generation error:', error);
                throw error;
            }
        }

        /**
         * Build the recommendation prompt
         */
        buildRecommendationPrompt(userPlaylist, friendsPlaylist, trustLevel) {
            // Extract user's music preferences
            const userSongs = userPlaylist.slice(0, 20).map(track => {
                const artists = (track.artists || []).map(a => a.name || a).join(', ');
                const tags = (track.tags || []).join(', ');
                return `- "${track.name}" by ${artists}${tags ? ` [${tags}]` : ''}`;
            }).join('\n');

            // Extract friend's playlist (limited to prevent context overflow)
            const friendsSongs = friendsPlaylist.slice(0, 50).map(song => {
                const artists = (song.artists || []).join(', ');
                const tags = (song.tags || []).slice(0, 3).join(', ');
                return `- "${song.songtitle || song.title}" by ${artists}${tags ? ` [${tags}]` : ''}`;
            }).join('\n');

            // Build the prompt
            return `You are a music recommendation expert. Analyze the user's music taste and recommend songs from their friend's playlist.

USER'S PLAYLIST (what they like):
${userSongs}

FRIEND'S PLAYLIST (songs to recommend from):
${friendsSongs}

TRUST LEVEL: ${trustLevel}/10 (higher = recommend more diverse songs, lower = stick to similar genres)

TASK: Based on the user's music taste, recommend the TOP 10 songs from the friend's playlist that they would most likely enjoy. Consider:
1. Genre/tag matches
2. Artist similarity
3. Musical style compatibility
4. Trust level for diversity

OUTPUT FORMAT: Return ONLY a JSON array with exactly this structure, no other text:
[
  {
    "title": "exact song title from friend's playlist",
    "reason": "brief explanation why user would like this (max 20 words)"
  }
]

Important: Only recommend songs that are EXACTLY in the friend's playlist. Match titles precisely.`;
        }

        /**
         * Parse LLM response and match with actual songs
         */
        parseRecommendationResponse(response, friendsPlaylist) {
            try {
                // Try to extract JSON from the response
                let jsonStr = response;
                
                // Look for JSON array in the response
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }

                const recommendations = JSON.parse(jsonStr);
                
                if (!Array.isArray(recommendations)) {
                    throw new Error('Response is not an array');
                }

                // Match recommended songs with actual playlist data
                const matchedRecommendations = [];
                
                for (const rec of recommendations) {
                    if (!rec.title) continue;
                    
                    // Find matching song in friend's playlist (fuzzy match)
                    const matchedSong = this.findMatchingSong(rec.title, friendsPlaylist);
                    
                    if (matchedSong) {
                        matchedRecommendations.push({
                            ...matchedSong,
                            llmReason: rec.reason || 'Recommended by AI',
                            score: 100 - matchedRecommendations.length * 5 // Descending score
                        });
                    }
                }

                return matchedRecommendations;
            } catch (error) {
                console.error('Failed to parse LLM response:', error);
                console.log('Raw response:', response);
                return [];
            }
        }

        /**
         * Find a matching song using fuzzy matching
         */
        findMatchingSong(title, playlist) {
            const normalizedTitle = this.normalizeString(title);
            
            // Try exact match first
            let match = playlist.find(song => {
                const songTitle = this.normalizeString(song.songtitle || song.title || '');
                return songTitle === normalizedTitle;
            });
            
            if (match) return match;
            
            // Try partial match
            match = playlist.find(song => {
                const songTitle = this.normalizeString(song.songtitle || song.title || '');
                return songTitle.includes(normalizedTitle) || normalizedTitle.includes(songTitle);
            });
            
            if (match) return match;
            
            // Try word-based matching (at least 50% words match)
            const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 2);
            
            for (const song of playlist) {
                const songTitle = this.normalizeString(song.songtitle || song.title || '');
                const songWords = songTitle.split(/\s+/).filter(w => w.length > 2);
                
                if (titleWords.length === 0 || songWords.length === 0) continue;
                
                const matchCount = titleWords.filter(word => 
                    songWords.some(sw => sw.includes(word) || word.includes(sw))
                ).length;
                
                if (matchCount / Math.max(titleWords.length, songWords.length) >= 0.5) {
                    return song;
                }
            }
            
            return null;
        }

        /**
         * Normalize string for comparison
         */
        normalizeString(str) {
            return String(str)
                .toLowerCase()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        }

        /**
         * Stream generate recommendations (for real-time feedback)
         */
        async *streamRecommendations(userPlaylist, friendsPlaylist, trustLevel) {
            if (!this.isConnected) {
                const check = await this.checkConnection();
                if (!check.connected) {
                    throw new Error(check.error);
                }
            }

            const prompt = this.buildRecommendationPrompt(userPlaylist, friendsPlaylist, trustLevel);
            
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: true,
                    options: {
                        temperature: 0.7,
                        num_predict: 2000
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                
                // Process complete JSON objects
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const json = JSON.parse(line);
                            if (json.response) {
                                yield json.response;
                            }
                        } catch (e) {
                            // Skip malformed JSON
                        }
                    }
                }
            }
        }
    }

    // Export to global scope
    window.OllamaWrapper = OllamaWrapper;
    window.ollamaWrapper = new OllamaWrapper();

})();
