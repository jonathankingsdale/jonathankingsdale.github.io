window.Quiz = window.Quiz || {};

Quiz.log = function (engine, action, data) {
  var msg = "[Quiz:" + engine + "] " + action;
  if (data !== undefined) console.log(msg, data);
  else console.log(msg);
};

Quiz.ui = {
  applyTheme: function (themeId) {
    var theme = Quiz.themes[themeId];
    if (!theme) return;
    var root = document.documentElement;
    var c = theme.colors;
    var isDark = root.getAttribute("data-theme") === "dark";
    root.style.setProperty("--quiz-primary", c.primary);
    root.style.setProperty("--quiz-accent", c.accent);
    root.style.setProperty("--quiz-tile-back", c.tileBack);
    root.style.setProperty("--quiz-team1", c.team1);
    root.style.setProperty("--quiz-team2", c.team2);
    if (isDark) {
      root.style.setProperty("--quiz-background", "#1a1a1a");
      root.style.setProperty("--quiz-secondary", "#1e2a36");
      root.style.setProperty("--quiz-tile-front", "#2a2a2a");
    } else {
      root.style.setProperty("--quiz-background", c.background);
      root.style.setProperty("--quiz-secondary", c.secondary);
      root.style.setProperty("--quiz-tile-front", c.tileFront);
    }
    if (theme.backgroundImage) {
      root.style.setProperty("--quiz-bg-image", "url('" + theme.backgroundImage + "')");
    } else {
      root.style.setProperty("--quiz-bg-image", "none");
    }
  },

  renderScores: function () {
    var state = Quiz.state.load();
    if (!state) return;
    var visible = sessionStorage.getItem("quiz-scores-visible") === "true";
    for (var i = 0; i < 2; i++) {
      var el = document.getElementById("score-value-" + i);
      if (el) {
        el.textContent = visible ? state.scores[i] : "???";
      }
      var teamEl = document.getElementById("score-team-" + i);
      if (teamEl) {
        teamEl.classList.toggle("active", state.currentTeam === i);
      }
    }
    document.body.setAttribute("data-active-team", state.currentTeam);
  },

  nextTurn: function () {
    var state = Quiz.state.load();
    state.currentTeam = state.currentTeam === 0 ? 1 : 0;
    Quiz.state.save(state);
    this.renderScores();
  },

  showOutcome: function (text, icon, subText, duration, onDismiss) {
    duration = duration || 2000;
    var overlay = document.createElement("div");
    overlay.className = "outcome-overlay";
    overlay.innerHTML =
      '<div class="outcome-card">' +
      '<div class="outcome-icon">' + icon + "</div>" +
      '<div class="outcome-text">' + text + "</div>" +
      (subText ? '<div class="outcome-sub">' + subText + "</div>" : "") +
      "</div>";
    document.body.appendChild(overlay);

    var dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onDismiss) onDismiss();
    }

    overlay.addEventListener("click", dismiss);
    setTimeout(dismiss, duration);
  },

  showRiskDecision: function (pointsAtStake, theme, callback) {
    var overlay = document.createElement("div");
    overlay.className = "risk-modal";
    overlay.innerHTML =
      '<div class="risk-modal-card">' +
      "<h2>Double or Nothing?</h2>" +
      "<p>You won " + pointsAtStake + " points. Risk it all to double?</p>" +
      '<div class="risk-modal-buttons">' +
      '<button class="btn-keep">Keep ' + pointsAtStake + "</button>" +
      '<button class="btn-double">Double or Nothing!</button>' +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);

    overlay.querySelector(".btn-keep").addEventListener("click", function () {
      overlay.parentNode.removeChild(overlay);
      callback(false);
    });

    overlay.querySelector(".btn-double").addEventListener("click", function () {
      overlay.parentNode.removeChild(overlay);
      callback(true);
    });
  },

  showMessage: function (text, duration) {
    this.showOutcome(text, "", null, duration || 1500);
  },

  initScoreBar: function () {
    var state = Quiz.state.load();
    var teams = Quiz.config.teams;
    var bar = document.getElementById("score-bar");
    bar.innerHTML =
      '<div class="score-team score-team-1" id="score-team-0">' +
      '<span class="score-label">' + teams.names[0] + '</span>' +
      '<span class="score-value" id="score-value-0">0</span>' +
      "</div>" +
      '<span class="score-vs">VS</span>' +
      '<div class="score-team score-team-2" id="score-team-1">' +
      '<span class="score-label">' + teams.names[1] + '</span>' +
      '<span class="score-value" id="score-value-1">0</span>' +
      "</div>" +
      '<button class="score-toggle" id="score-toggle" title="Toggle score visibility">\u{1F441}\uFE0F</button>';

    document
      .getElementById("score-toggle")
      .addEventListener("click", function () {
        var visible = sessionStorage.getItem("quiz-scores-visible") === "true";
        sessionStorage.setItem("quiz-scores-visible", visible ? "false" : "true");
        Quiz.log("UI", "Score visibility toggled", { visible: !visible });
        Quiz.ui.renderScores();
      });

    this.renderScores();
  },
};
