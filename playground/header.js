// Header template with theme switcher
const headerTemplate = `
<header class="app-header">
    <div class="header-content">
        <h1 class="header-title" id="app-title">Current App Title</h1>
        <nav class="header-nav">
        <a href="/" class="header-link">🚀 Landing Page</a>
        <a href="/playground" class="header-link">🏠 Playground</a>
        <button id="theme-toggle" class="theme-toggle">🌞</button>
        </nav>
    </div>
</header>
`;

function initHeader(appTitle) {
  document.body.insertAdjacentHTML("afterbegin", headerTemplate);
  document.getElementById("app-title").textContent = appTitle;

  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeToggle = document.getElementById("theme-toggle");
  updateThemeButton(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeButton(newTheme);
  });
}

function updateThemeButton(theme) {
  const button = document.getElementById("theme-toggle");
  button.textContent = theme === "light" ? "🌞" : "🌙";
  button.setAttribute(
    "aria-label",
    `Switch to ${theme === "light" ? "dark" : "light"} mode`
  );
}
