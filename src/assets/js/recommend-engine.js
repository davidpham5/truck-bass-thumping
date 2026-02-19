/**
 * This Is My Next Engine - Song Recommendation System
 * Compares user's Spotify playlist with friend's playlist (site songs)
 * and provides recommendations using similarity analysis
 */

(function() {
    'use strict';

    class RecommendEngine {
        constructor() {
            this.userPlaylist = [];
            this.friendsPlaylist = window.friendsPlaylist || [];
            this.recommendations = [];
            this.trustLevel = 7;
            
            this.init();
        }

        init() {
            // Set up trust slider
            const trustSlider = document.getElementById('trust-level');
            const trustValue = document.getElementById('trust-value');
            if (trustSlider && trustValue) {
                trustSlider.addEventListener('input', (e) => {
                    trustValue.textContent = e.target.value;
                    this.trustLevel = parseInt(e.target.value, 10);
                });
            }
            
            console.log(`This Is My Next Engine initialized with ${this.friendsPlaylist.length} songs from friend's playlist`);
        }

        /**
         * Parse Spotify playlist URL and extract playlist ID
         */
        parsePlaylistUrl() {
            const urlInput = document.getElementById('playlist-url');
            const url = urlInput?.value?.trim();
            
            if (!url) {
                this.showError('Please enter a Spotify playlist URL');
                return;
            }

            // Extract playlist ID from various Spotify URL formats
            const patterns = [
                /spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
                /spotify:playlist:([a-zA-Z0-9]+)/
            ];

            let playlistId = null;
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    playlistId = match[1];
                    break;
                }
            }

            if (!playlistId) {
                this.showError('Could not parse Spotify playlist URL. Please use a valid Spotify playlist link.');
                return;
            }

            // Since we can't access Spotify API directly without auth, 
            // show instructions for manual export
            this.showManualExportInstructions(playlistId);
        }

        /**
         * Show instructions for manual playlist export
         */
        showManualExportInstructions(playlistId) {
            const message = `
                <div class="export-instructions">
                    <h4>📋 Quick Export Guide</h4>
                    <p>To import your playlist, you can use one of these methods:</p>
                    <ol>
                        <li>Use <a href="https://exportify.net/" target="_blank" rel="noopener">Exportify</a> to export your playlist as JSON</li>
                        <li>Use the <a href="https://developer.spotify.com/console/get-playlist-tracks/?playlist_id=${playlistId}" target="_blank" rel="noopener">Spotify API Console</a> to get your tracks</li>
                        <li>Or manually enter your songs below</li>
                    </ol>
                    <p>Paste the exported data in the JSON field below, or enter songs manually:</p>
                    <div class="manual-entry">
                        <h5>Manual Entry (one song per line):</h5>
                        <textarea id="manual-songs" rows="8" placeholder="Artist - Song Title&#10;Another Artist - Another Song&#10;..."></textarea>
                        <button onclick="window.recommendEngine.parseManualEntry()">Import Manual List</button>
                    </div>
                </div>
            `;
            
            document.getElementById('import-section').insertAdjacentHTML('beforeend', message);
        }

        /**
         * Parse manually entered songs
         */
        parseManualEntry() {
            const textarea = document.getElementById('manual-songs');
            const text = textarea?.value?.trim();
            
            if (!text) {
                this.showError('Please enter at least one song');
                return;
            }

            const lines = text.split('\n').filter(line => line.trim());
            this.userPlaylist = lines.map(line => {
                const parts = line.split(' - ');
                if (parts.length >= 2) {
                    return {
                        artists: [{ name: parts[0].trim() }],
                        name: parts.slice(1).join(' - ').trim(),
                        tags: []
                    };
                } else {
                    return {
                        artists: [{ name: 'Unknown' }],
                        name: line.trim(),
                        tags: []
                    };
                }
            });

            this.displayUserPlaylist();
            this.showComparisonSection();
        }

        /**
         * Parse JSON playlist data
         */
        parsePlaylistJson() {
            const jsonInput = document.getElementById('playlist-json');
            const jsonText = jsonInput?.value?.trim();
            
            if (!jsonText) {
                this.showError('Please paste your playlist JSON data');
                return;
            }

            try {
                let data = JSON.parse(jsonText);
                
                // Handle different JSON formats
                if (data.items) {
                    // Spotify API format
                    data = data.items;
                } else if (data.tracks?.items) {
                    // Alternative Spotify format
                    data = data.tracks.items;
                }

                if (!Array.isArray(data)) {
                    data = [data];
                }

                this.userPlaylist = data.map(item => {
                    const track = item.track || item;
                    return {
                        name: track.name || track.songtitle || track.title,
                        artists: track.artists || [{ name: track.artist }],
                        album: track.album?.name || track.album,
                        tags: track.tags || [],
                        spotifyUri: track.uri || track.spotifyUri,
                        spotify: track.external_urls?.spotify || track.spotify
                    };
                }).filter(track => track.name);

                if (this.userPlaylist.length === 0) {
                    this.showError('No valid tracks found in the JSON data');
                    return;
                }

                this.displayUserPlaylist();
                this.showComparisonSection();

            } catch (e) {
                console.error('JSON parse error:', e);
                this.showError('Invalid JSON format. Please check your data and try again.');
            }
        }

        /**
         * Display the user's imported playlist
         */
        displayUserPlaylist() {
            const section = document.getElementById('your-playlist-section');
            const statsDiv = document.getElementById('your-playlist-stats');
            const songsDiv = document.getElementById('your-playlist-songs');
            
            if (!section || !statsDiv || !songsDiv) return;

            // Gather stats
            const artistSet = new Set();
            this.userPlaylist.forEach(track => {
                (track.artists || []).forEach(a => artistSet.add(a.name || a));
            });

            statsDiv.innerHTML = `
                <div class="playlist-stats">
                    <span class="stat"><strong>${this.userPlaylist.length}</strong> songs</span>
                    <span class="stat"><strong>${artistSet.size}</strong> artists</span>
                </div>
            `;

            // Display songs (first 20)
            const displayTracks = this.userPlaylist.slice(0, 20);
            songsDiv.innerHTML = `
                <ul class="song-list">
                    ${displayTracks.map(track => `
                        <li>
                            <span class="song-name">${this.escapeHtml(track.name)}</span>
                            <span class="song-artist">by ${this.escapeHtml(this.getArtistNames(track.artists))}</span>
                        </li>
                    `).join('')}
                    ${this.userPlaylist.length > 20 ? `<li class="more-songs">...and ${this.userPlaylist.length - 20} more songs</li>` : ''}
                </ul>
            `;

            section.classList.remove('hidden');
        }

        /**
         * Show the comparison section
         */
        showComparisonSection() {
            const section = document.getElementById('comparison-section');
            if (section) {
                section.classList.remove('hidden');
            }
        }

        /**
         * Main comparison and recommendation function
         */
        async compareAndRecommend() {
            this.showLoading('Analyzing your music taste...');
            
            // Small delay for UI feedback
            await this.delay(500);

            // Extract features from user's playlist
            const userFeatures = this.extractPlaylistFeatures(this.userPlaylist);
            
            this.updateLoadingMessage('Finding musical similarities...');
            await this.delay(300);

            // Score each song in friend's playlist
            const scoredSongs = this.friendsPlaylist.map(song => {
                const score = this.calculateSimilarityScore(song, userFeatures);
                return { ...song, score };
            });

            this.updateLoadingMessage('Generating recommendations...');
            await this.delay(300);

            // Sort by score and get top recommendations
            scoredSongs.sort((a, b) => b.score - a.score);
            
            // Apply trust level - higher trust = more adventurous recommendations
            const BASE_RECOMMENDATION_COUNT = 10;
            const numRecommendations = Math.min(BASE_RECOMMENDATION_COUNT + this.trustLevel, scoredSongs.length);
            this.recommendations = scoredSongs.slice(0, numRecommendations);

            // Filter out songs already in user's playlist
            this.recommendations = this.filterAlreadyOwned(this.recommendations);

            this.hideLoading();
            this.displayRecommendations(userFeatures);
        }

        /**
         * Extract features from a playlist
         */
        extractPlaylistFeatures(playlist) {
            const features = {
                artists: new Map(),
                tags: new Map(),
                artistList: [],
                tagList: []
            };

            playlist.forEach(track => {
                // Count artists
                (track.artists || []).forEach(artist => {
                    if (!artist) return;
                    const name = String(artist.name || artist).toLowerCase();
                    if (name) {
                        features.artists.set(name, (features.artists.get(name) || 0) + 1);
                    }
                });

                // Count tags/genres
                (track.tags || []).forEach(tag => {
                    if (!tag) return;
                    const tagLower = String(tag).toLowerCase();
                    if (tagLower) {
                        features.tags.set(tagLower, (features.tags.get(tagLower) || 0) + 1);
                    }
                });
            });

            // Convert to sorted arrays
            features.artistList = [...features.artists.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => ({ name, count }));
            
            features.tagList = [...features.tags.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => ({ name, count }));

            return features;
        }

        /**
         * Calculate similarity score between a song and user features
         */
        calculateSimilarityScore(song, userFeatures) {
            let score = 0;
            const weights = {
                exactArtist: 50,
                relatedArtist: 20,
                exactTag: 30,
                partialTag: 10,
                popularTag: 5
            };

            // Check artist matches
            (song.artists || []).forEach(artist => {
                if (!artist) return;
                const artistLower = String(artist).toLowerCase();
                if (userFeatures.artists.has(artistLower)) {
                    score += weights.exactArtist * userFeatures.artists.get(artistLower);
                }
            });

            // Check tag matches
            (song.tags || []).forEach(tag => {
                if (!tag) return;
                const tagLower = String(tag).toLowerCase();
                if (userFeatures.tags.has(tagLower)) {
                    score += weights.exactTag * Math.log2(userFeatures.tags.get(tagLower) + 1);
                } else {
                    // Check for partial matches
                    for (const [userTag] of userFeatures.tags) {
                        if (tagLower.includes(userTag) || userTag.includes(tagLower)) {
                            score += weights.partialTag;
                            break;
                        }
                    }
                }
            });

            // Bonus for popular genre matches
            const popularGenres = ['rock', 'pop', 'electronic', 'indie', 'alternative', 'hip-hop', 'jazz', 'folk'];
            (song.tags || []).forEach(tag => {
                if (!tag) return;
                const tagLower = String(tag).toLowerCase();
                if (popularGenres.some(genre => tagLower.includes(genre))) {
                    for (const [userTag] of userFeatures.tags) {
                        if (popularGenres.some(genre => userTag.includes(genre) && tagLower.includes(genre))) {
                            score += weights.popularTag;
                        }
                    }
                }
            });

            return score;
        }

        /**
         * Filter out songs the user already has
         */
        filterAlreadyOwned(recommendations) {
            const userSongNames = new Set(
                this.userPlaylist.map(t => t.name?.toLowerCase())
            );
            
            return recommendations.filter(song => {
                const songName = (song.songtitle || song.title || '').toLowerCase();
                return !userSongNames.has(songName);
            });
        }

        /**
         * Display recommendations
         */
        displayRecommendations(userFeatures) {
            const section = document.getElementById('results-section');
            const explanationDiv = document.getElementById('recommendation-explanation');
            const listDiv = document.getElementById('recommendations-list');
            
            if (!section || !explanationDiv || !listDiv) return;

            // Generate explanation
            const topTags = userFeatures.tagList.slice(0, 5).map(t => t.name);
            const topArtists = userFeatures.artistList.slice(0, 3).map(a => a.name);

            explanationDiv.innerHTML = `
                <div class="explanation-box">
                    <h4>🎵 Based on your music taste:</h4>
                    <p>
                        ${topTags.length > 0 ? `<strong>Genres you love:</strong> ${topTags.join(', ')}<br>` : ''}
                        ${topArtists.length > 0 ? `<strong>Artists you listen to:</strong> ${topArtists.join(', ')}<br>` : ''}
                    </p>
                    <p>Here are songs from your friend's collection that match your style:</p>
                </div>
            `;

            // Display recommendations
            if (this.recommendations.length === 0) {
                listDiv.innerHTML = `
                    <p class="no-recommendations">
                        No strong matches found. Try importing a larger playlist or adjusting your trust level!
                    </p>
                `;
            } else {
                listDiv.innerHTML = `
                    <div class="recommendations-grid">
                        ${this.recommendations.map((song, index) => this.renderRecommendationCard(song, index, userFeatures)).join('')}
                    </div>
                `;
            }

            section.classList.remove('hidden');
            section.scrollIntoView({ behavior: 'smooth' });
        }

        /**
         * Render a single recommendation card
         */
        renderRecommendationCard(song, index, userFeatures) {
            const matchReasons = this.getMatchReasons(song, userFeatures);
            const imageUrl = song.featuredImage ? `/img/${song.featuredImage}` : '/img/glass-horn.jpg';
            
            return `
                <div class="recommendation-card" style="--delay: ${index * 0.1}s">
                    <div class="card-rank">#${index + 1}</div>
                    <div class="card-image">
                        <img src="${imageUrl}" alt="Album art for ${this.escapeHtml(song.songtitle || song.title)}" loading="lazy" />
                    </div>
                    <div class="card-content">
                        <h4 class="card-title">
                            <a href="${song.url}" class="hxlink" hx-boost="true" hx-swap="outerHTML show:top" hx-target="#main-content" hx-select="#main-content" hx-push-url="true">
                                ${this.escapeHtml(song.songtitle || song.title)}
                            </a>
                        </h4>
                        <p class="card-artist">by ${this.escapeHtml((song.artists || []).join(', '))}</p>
                        <p class="card-album">${this.escapeHtml(song.album || '')}</p>
                        <div class="match-reasons">
                            ${matchReasons.map(reason => `<span class="match-tag">${reason}</span>`).join('')}
                        </div>
                        <div class="card-actions">
                            ${song.spotify ? `<a href="${song.spotify}" target="_blank" rel="noopener" class="action-btn spotify">Listen on Spotify</a>` : ''}
                            ${song.youtube ? `<a href="${song.youtube}" target="_blank" rel="noopener" class="action-btn youtube">Watch on YouTube</a>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        /**
         * Get reasons why a song was recommended
         */
        getMatchReasons(song, userFeatures) {
            const reasons = [];
            
            // Check artist matches
            (song.artists || []).forEach(artist => {
                if (!artist) return;
                const artistName = String(artist.name || artist);
                if (userFeatures.artists.has(artistName.toLowerCase())) {
                    reasons.push(`You like ${artistName}`);
                }
            });

            // Check tag matches (top 3)
            let tagMatches = 0;
            (song.tags || []).forEach(tag => {
                if (!tag) return;
                const tagStr = String(tag);
                if (tagMatches < 3 && userFeatures.tags.has(tagStr.toLowerCase())) {
                    reasons.push(tagStr);
                    tagMatches++;
                }
            });

            return reasons.slice(0, 4);
        }

        /**
         * Helper: Get artist names as string
         */
        getArtistNames(artists) {
            if (!artists || artists.length === 0) return 'Unknown Artist';
            return artists.map(a => a.name || a).join(', ');
        }

        /**
         * Helper: Escape HTML
         */
        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        /**
         * Helper: Show error message
         */
        showError(message) {
            // Remove existing error messages
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `<p>⚠️ ${message}</p>`;
            
            const container = document.getElementById('engine-container');
            if (container) {
                container.insertBefore(errorDiv, container.firstChild);
                setTimeout(() => errorDiv.remove(), 5000);
            }
        }

        /**
         * Helper: Show loading indicator
         */
        showLoading(message) {
            const loader = document.getElementById('loading-indicator');
            const messageEl = document.getElementById('loading-message');
            if (loader) {
                loader.classList.remove('hidden');
                if (messageEl) messageEl.textContent = message;
            }
        }

        /**
         * Helper: Update loading message
         */
        updateLoadingMessage(message) {
            const messageEl = document.getElementById('loading-message');
            if (messageEl) messageEl.textContent = message;
        }

        /**
         * Helper: Hide loading indicator
         */
        hideLoading() {
            const loader = document.getElementById('loading-indicator');
            if (loader) {
                loader.classList.add('hidden');
            }
        }

        /**
         * Helper: Delay promise
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // Initialize the engine when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.recommendEngine = new RecommendEngine();
        });
    } else {
        window.recommendEngine = new RecommendEngine();
    }

})();
