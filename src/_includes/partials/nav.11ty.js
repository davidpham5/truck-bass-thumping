const linkmaker = require("../../utils/linkmaker");
const themes = require("../../_data/themes.js");
module.exports = function (data) {
	return /*html*/ `
	<script>
	function opennav(e){
		const topNav = querySelector('nav#top-nav');
		console.log(e.parentNode.parentNode); e.parentNode.parentNode.classList.toggle('is-open');
		console.log({topNav});
		topNav = topNav.classList.toggle('theme-picker-open');
	}
	function toggleThemePicker(e) {

		const picker = e.closest('#nav-menu-items').querySelector('.theme-picker-dropdown');
		if (picker) {

			picker.classList.toggle('is-open');
		}
	}
	</script>
	<nav id="top-nav">
	<div id="nav-icon">
		<img src="/assets/menu-icon.svg" width="25px" height="25px" alt="menu icon"/>
	</div>
	<h1 class="site-name">${linkmaker(data, "", data.site.title, "site-name")}</h1>
		<div id="nav-menu-items"><ul>
			<li>${linkmaker(data, "/songs/", "Songs")}</li>
			<li>${linkmaker(data, "/search/", "Search")}</li>
			<li>${linkmaker(data, "/song-tags/", "Tags")}</li>
			<li>${linkmaker(data, "/how-to-scrobble/", "Scrobble This Site")}</li>
			<li>${linkmaker(data, "/about/", "What is This?")}</li>
			<li>
				<button class="theme-picker-btn" onclick="toggleThemePicker(this)" aria-label="Theme Picker">
					The Drip
				</button>
			</li>
		</ul>

		<div class="theme-picker-dropdown">
			<h2>Choose Theme</h2>
			<ul class="theme-list">
				${themes
					.map(
						(theme) => `
					<li>
						<button class="theme-option" data-theme="${theme.id}">
							<span class="theme-name">${theme.name}</span>
							<span class="swatches">
								<span class="swatch" style="background-color: ${theme.colors.background}"></span>
								<span class="swatch" style="background-color: ${theme.colors.foreground}"></span>
								<span class="swatch" style="background-color: ${theme.colors.accent}"></span>
							</span>
						</button>
					</li>
				`
					)
					.join("")}
			</ul>
		</div>

	</div>

	<label class="switch">
		<span class="switch-text">Autoplay</span>
		<input type="checkbox" id="xplayer-autoplay-switch" checked>
		<span class="slider round"></span>
  </label>
</nav>
`;
};
