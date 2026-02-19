const base = require("./base.11ty");
const imageCheck = require("../utils/imageCheck");
const linkmaker = require("../utils/linkmaker");

module.exports = async function (data) {
	// Get all songs data for the recommendation engine
	let allSongs = data.collections.songs || [];
	
	// Prepare songs data for client-side use
	let songsData = allSongs.map(song => ({
		title: song.data.title,
		songtitle: song.data.songtitle,
		artists: song.data.artists || [],
		tags: (song.data.tags || []).filter(tag => 
			!["all", "tags", "songs", "songsPages", "tagList", "deepTagList", "Undefined", "undefined"].includes(tag)
		),
		album: song.data.album,
		spotify: song.data.spotify,
		spotifyUri: song.data.spotifyUri,
		youtube: song.data.youtube,
		lastfm: song.data.lastfm,
		url: song.data.page?.url || song.url,
		featuredImage: song.data.featuredImage
	}));

	let insert = {
		template: "engine",
		earlyHead: `
			<script>
				window.friendsPlaylist = ${JSON.stringify(songsData)};
			</script>
		`,
		content: /*html*/ `
			<div class="engine-intro">
				${data.content}
			</div>
			<script src="/assets/js/recommend-engine.js" defer></script>
		`,
	};
	return base(data, insert);
};
