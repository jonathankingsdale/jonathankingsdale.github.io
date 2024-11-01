const headerTemplate = `
<header class="app-header">
    <div class="header-content">
        <h1 class="header-title" id="app-title">Current App Title</h1>
        <nav class="header-nav">
            <a href="/" class="header-link">🚀 Landing Page</a>
            <a href="/playground" class="header-link">🏠 Playground</a>
        </nav>
    </div>
</header>
`;

function initHeader(appTitle) {
  document.body.insertAdjacentHTML("afterbegin", headerTemplate);
  document.getElementById("app-title").textContent = appTitle;
}
