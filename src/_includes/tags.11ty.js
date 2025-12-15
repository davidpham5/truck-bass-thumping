const base = require("./base.11ty");
const linkmaker = require("../utils/linkmaker");
const pagination = require("./partials/pagination.11ty");

// Hash function to generate mediaId (same as in xplayer.js)
let simpleHash = (str) => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash &= hash; // Convert to 32bit integer
	}
	return new Uint32Array([hash])[0].toString(36);
};

module.exports = async function (data) {
	// console.log("tags data", data);
	let c = data.paged.posts.length;
	let top = data.paged.posts.length;
	let tags = data.paged.posts.reduce((accumulator, post) => {
		let imageName;
		c--;
		//console.log("c", c);
		if (!post.data.featuredImage) {
			imageName = "glass-horn-240.jpg";
		} else {
			let imageNameArray = post.data.featuredImage.split(".");
			imageName = post.data.featuredImage.replace(
				`.${imageNameArray[imageNameArray.length - 1]}`,
				""
			);
			imageName += `-240.jpg`;
		}
		let filteredTags = post.data.tags.filter((tag) => tag !== "songs");
		let tagText = filteredTags.map((tag) => {
			return `<span class="genre-tag">${tag}</span>`;
		});
		let imageAlt =
			data.featuredImageAlt ||
			`Cover of album that contains ${post.data.songtitle}`;

		// Generate mediaId and prepare media object for this song
		let mediaId = simpleHash(post.data.page.url);
		let youtubeId = "";
		if (post.data.youtube) {
			let finalString = post.data.youtube.replaceAll(
				"www.youtube.com/watch?v=",
				"www.youtube-nocookie.com/embed/"
			);
			finalString = finalString.replaceAll(
				"youtu.be/",
				"www.youtube-nocookie.com/embed/"
			);
			let videoId = finalString.split("embed/")[1];
			youtubeId = videoId ? videoId.split("?")[0] : "";
		}

		let spotifyUri = post.data.spotifyUri;
		if (post.data.spotify && !spotifyUri) {
			let spotifyUriPart = post.data.spotify.split("track/")[1];
			spotifyUri = spotifyUriPart
				? `spotify:track:${spotifyUriPart}`
				: "";
		}

		let mediaObj = {
			description: post.data.description,
			tags: post.data.tags,
			date: post.data.date,
			title: post.data.title,
			songtitle: post.data.songtitle,
			artists: post.data.artists,
			youtube: post.data.youtube,
			spotify: post.data.spotify,
			spotifyUri: spotifyUri,
			soundcloud: post.data.soundcloud,
			audiofile: post.data.audiofile
				? `/assets/media/${post.data.audiofile}`
				: false,
			lastfm: post.data.lastfm,
			album: post.data.album,
			playlists: post.data.playlists,
			featuredImage: post.data.featuredImage
				? `/img/${imageName}`
				: "/img/glass-horn-240.jpg",
			youtubeId: youtubeId,
			mediaId: mediaId,
			siteUrl: post.data.page.url,
		};

		// Check if song has playable media
		let hasSongData = !!(youtubeId || spotifyUri || post.data.audiofile);

		// Create buttons if song has playable media
		let songButtons = hasSongData
			? /*html*/ `
			<div class="song-buttons">
				<button class="play-song-btn" onclick="(function(){
					if (window.xplayer) {
						if (!window.xplayer.songDataStore || !window.xplayer.songDataStore['${mediaId}']) {
							window.xplayer.songDataStore = window.xplayer.songDataStore || {};
							window.xplayer.songDataStore['${mediaId}'] = ${JSON.stringify(mediaObj).replace(
					/"/g,
					"&quot;"
			  )};
						}
						window.xplayer.now = '${mediaId}';
					}
				})()">▶ Play</button>
				<button class="add-to-playlist-btn" onclick="(function(){
					if (window.xplayer && window.xplayer.addFromPage) {
						window.xplayer.addFromPage(${JSON.stringify(mediaObj).replace(/"/g, "&quot;")});
					}
				})()">+ Playlist</button>
			</div>
		`
			: "";

		//console.log("tagText", tagText);
		return (
			/*html*/ `
				<div class="media-entry h-entry" key="${c}">
					<div class="media-img">
					${linkmaker(
						post.data,
						post.data.page.url,
						`<img src="/img/${imageName}" ${
							c >= 5 ? 'loading="lazy"' : 'loading="eager"'
						} alt="${imageAlt}" width="240px" height="240px" />`
					)}
					</div>
					<div class="media-body">
						<h3 class="p-name">${linkmaker(
							post.data,
							post.data.page.url,
							`${post.data.title}`
						)}</h3>
						<p class="tag-list">${tagText.join(", ")}</p>
						${songButtons}
					</div>
				</div>
			` + accumulator
		);
	}, "");
	// console.log(data.content);
	let insert = {
		template: "tags",
		content: /*html*/ `
			${data.content}
			<br />
			${tags}
			${pagination(data)}
			<hr />

		`,
	};
	return base(data, insert);
};
