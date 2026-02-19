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
2. **Compare** - We analyze the musical characteristics, tags, and artists
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
    <h3>Step 2: Compare Playlists</h3>
    <p>Your playlist has been loaded. Click below to find your musical matches!</p>
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
