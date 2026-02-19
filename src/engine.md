---
title: "This Is My Next Engine"
internalPageTypes: ["engine"]
path: /engine/
layout: "engine.11ty.js"
eleventyExcludeFromCollections: true
description: "Import your Spotify playlist and get song recommendations based on your friend's taste in music."
---

Welcome to **This Is My Next Engine** - a song recommendation engine that compares your Spotify playlist with your friend's curated music collection.

## How It Works

1. **Import Your Playlist** - Paste your Spotify playlist URL or import directly
2. **Choose Your Mode** - Use our algorithm or let AI (via Ollama) analyze your taste
3. **Discover** - Get personalized recommendations based on what your friend loves

The songs on this site serve as your "friend's playlist" - a curated collection of musical obsessions. By comparing your listening habits with this collection, the engine identifies songs you're likely to enjoy.

<div id="engine-container">
  <div id="import-section">
    <h3>Step 1: Import Your Spotify Playlist</h3>
    <div class="import-methods">
      <div class="import-method">
        <label for="playlist-url">Paste Spotify Playlist URL:</label>
        <input type="text" id="playlist-url" placeholder="https://open.spotify.com/playlist/..." />
        <button id="parse-url-btn" onclick="window.recommendEngine.parsePlaylistUrl()">Import from URL</button>
      </div>
      <div class="import-divider">— or —</div>
      <div class="import-method">
        <label for="playlist-json">Paste Playlist JSON (from Spotify export):</label>
        <textarea id="playlist-json" rows="6" placeholder='[{"track": {"name": "Song Name", "artists": [{"name": "Artist"}], ...}}]'></textarea>
        <button id="parse-json-btn" onclick="window.recommendEngine.parsePlaylistJson()">Import JSON</button>
      </div>
    </div>
  </div>

  <div id="your-playlist-section" class="hidden">
    <h3>Your Playlist</h3>
    <div id="your-playlist-stats"></div>
    <div id="your-playlist-songs"></div>
  </div>

  <div id="comparison-section" class="hidden">
    <h3>Step 2: Configure & Compare</h3>
    <p>Your playlist has been loaded. Choose your recommendation mode:</p>
    
    <div class="mode-selector">
      <div class="mode-toggle">
        <label class="toggle-label">
          <input type="checkbox" id="llm-mode-toggle" />
          <span class="toggle-slider"></span>
          <span class="toggle-text">🤖 Use AI (Ollama) for recommendations</span>
        </label>
      </div>
      
      <div id="llm-settings" class="hidden">
        <div class="llm-settings-box">
          <h4>🔧 Ollama Settings</h4>
          <div id="ollama-status" class="ollama-status">
            <span class="status-unchecked">Click "Test Connection" to check</span>
          </div>
          <form id="ollama-settings-form">
            <div class="form-group">
              <label for="ollama-url">Ollama URL:</label>
              <input type="text" id="ollama-url" value="http://localhost:11434" placeholder="http://localhost:11434" />
            </div>
            <div class="form-group">
              <label for="ollama-model">Model:</label>
              <select id="ollama-model">
                <option value="llama3.2">llama3.2 (default)</option>
                <option value="llama3.1">llama3.1</option>
                <option value="mistral">mistral</option>
                <option value="phi3">phi3</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" id="test-ollama-btn">Test Connection</button>
              <button type="submit">Save Settings</button>
            </div>
          </form>
          <p class="llm-note">
            <strong>Note:</strong> You need <a href="https://ollama.ai" target="_blank" rel="noopener">Ollama</a> running locally.
            Run <code>ollama serve</code> to start, then <code>ollama pull llama3.2</code> to get the model.
          </p>
        </div>
      </div>
    </div>

    <div class="trust-slider">
      <label for="trust-level">How much do you trust your friend's taste?</label>
      <input type="range" id="trust-level" min="1" max="10" value="7" />
      <span id="trust-value">7</span>/10
    </div>
    <button id="compare-btn" onclick="window.recommendEngine.compareAndRecommend()">Find My Next Songs</button>
  </div>

  <div id="results-section" class="hidden">
    <h3>Step 3: Your Recommendations</h3>
    <div id="recommendation-explanation"></div>
    <div id="recommendations-list"></div>
  </div>

  <div id="loading-indicator" class="hidden">
    <div class="spinner"></div>
    <p id="loading-message">Analyzing your music taste...</p>
  </div>
</div>
