function toggleThemePicker() {
	const themePickerBtn = document.querySelector(".theme-picker-btn");
	const themePicker = document.querySelector(".theme-picker-dropdown");
	if (themePickerBtn) {
		themePicker.classList.toggle("open");
	}
}
function setTheme(themeName) {
	localStorage.setItem("theme", themeName);
	document.documentElement.className = "theme-" + themeName;

	// Update active state on theme buttons
	const allButtons = document.querySelectorAll(".theme-option");
	allButtons.forEach((btn) => {
		if (btn.dataset.theme === themeName) {
			btn.classList.add("active");
		} else {
			btn.classList.remove("active");
		}
	});
}

document.addEventListener("DOMContentLoaded", function () {
	const selectTheme = (e) => {
		const btn = e.currentTarget;
		if (!btn.dataset.theme) {
			return;
		}
		setTheme(btn.dataset.theme);
	};

	// Attach event listeners to all theme option buttons
	Array.from(document.querySelectorAll(".theme-option")).forEach((el) => {
		el.addEventListener("click", selectTheme);
	});

	// Apply saved theme or default to maggie
	setTheme(localStorage.getItem("theme") || "ftl");
});
