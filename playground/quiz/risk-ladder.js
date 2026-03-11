window.Quiz = window.Quiz || {};
Quiz.engines = Quiz.engines || {};

Quiz.engines.riskLadder = {
  init: function (container) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var cfg = Quiz.config.riskLadder;
    Quiz.log("RiskLadder", "Init", { theme: state.themeId, traps: state.ladderTraps });

    var wrap = document.createElement("div");
    wrap.className = "ladder-container";

    var info = document.createElement("div");
    info.className = "ladder-pending";
    info.id = "ladder-info";
    wrap.appendChild(info);

    var ladder = document.createElement("div");
    ladder.className = "ladder";
    ladder.id = "ladder";

    for (var i = 0; i < cfg.steps.length; i++) {
      var step = document.createElement("div");
      step.className = "ladder-step";
      step.id = "ladder-step-" + i;
      step.innerHTML =
        '<span class="step-number">' + (i + 1) + "</span>" +
        '<span class="step-name">' + (theme.ladderSteps[i] || ("Step " + (i + 1))) + "</span>" +
        '<span class="step-reward">+' + cfg.steps[i].reward + "</span>" +
        '<span class="step-tokens" id="step-tokens-' + i + '"></span>';
      ladder.appendChild(step);
    }
    wrap.appendChild(ladder);

    var btns = document.createElement("div");
    btns.className = "ladder-buttons";
    btns.innerHTML =
      '<button class="btn-bank" id="btn-ladder-bank">' +
      theme.labels.bank +
      "</button>" +
      '<button class="btn-risk" id="btn-ladder-risk">' +
      theme.labels.risk +
      "</button>";
    wrap.appendChild(btns);

    container.appendChild(wrap);

    this._updateUI(state, theme);
    this._bindButtons(state, theme);
  },

  _updateUI: function (state, theme) {
    var cfg = Quiz.config.riskLadder;
    var team = state.currentTeam;
    var pos = state.ladderPositions[team];

    var info = document.getElementById("ladder-info");
    var teamName = Quiz.config.teams.names[team];
    if (pos < 0) {
      info.textContent = teamName + "'s turn \u2014 press " + theme.labels.risk + " to start climbing!";
    } else {
      var pending = state.pendingPoints[team];
      info.textContent =
        teamName + " \u2014 Pending: " + pending +
        " pts \u2014 Step " + (pos + 1) + "/" + cfg.steps.length;
    }

    for (var i = 0; i < cfg.steps.length; i++) {
      var stepEl = document.getElementById("ladder-step-" + i);
      stepEl.className = "ladder-step";
      var tokensEl = document.getElementById("step-tokens-" + i);
      tokensEl.innerHTML = "";
    }

    for (var t = 0; t < 2; t++) {
      var p = state.ladderPositions[t];
      if (p >= 0 && p < cfg.steps.length) {
        var stepEl = document.getElementById("ladder-step-" + p);
        stepEl.classList.add("current-" + t);
        var tokensEl = document.getElementById("step-tokens-" + p);
        var token = document.createElement("div");
        token.className = "ladder-token team-" + t;
        tokensEl.appendChild(token);
      }
    }

    var bankBtn = document.getElementById("btn-ladder-bank");
    bankBtn.disabled = pos < 0;
  },

  _bindButtons: function (state, theme) {
    var self = this;

    document
      .getElementById("btn-ladder-risk")
      .addEventListener("click", function () {
        self._doRisk();
      });

    document
      .getElementById("btn-ladder-bank")
      .addEventListener("click", function () {
        self._doBank();
      });
  },

  _doRisk: function () {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var cfg = Quiz.config.riskLadder;
    var team = state.currentTeam;
    var pos = state.ladderPositions[team];
    var nextPos = pos + 1;
    Quiz.log("RiskLadder", "Risk taken", { team: team, from: pos, to: nextPos });

    if (nextPos >= cfg.steps.length) {
      Quiz.ui.showMessage("Already at the top! You must bank.", 1500);
      return;
    }

    state.ladderPositions[team] = nextPos;

    if (state.ladderTraps.indexOf(nextPos) !== -1) {
      state.pendingPoints[team] = 0;
      state.ladderPositions[team] = -1;
      Quiz.state.save(state);
      this._updateUI(state, theme);

      var self = this;
      Quiz.ui.showOutcome(
        "TRAP!",
        "\u{1F4A5}",
        "Lost all pending points!",
        2000
      );
      setTimeout(function () {
        Quiz.ui.nextTurn(state);
        state = Quiz.state.load();
        self._updateUI(state, theme);
      }, 2200);
    } else {
      state.pendingPoints[team] += cfg.steps[nextPos].reward;
      Quiz.state.save(state);
      this._updateUI(state, theme);

      if (nextPos === cfg.steps.length - 1) {
        var self = this;
        Quiz.ui.showOutcome(
          "TOP!",
          "\u{1F3C6}",
          "Reached " + theme.ladderSteps[nextPos] + "! Auto-banking.",
          2000
        );
        setTimeout(function () {
          self._doBank();
        }, 2200);
      }
    }
  },

  _doBank: function () {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var team = state.currentTeam;
    var banked = state.pendingPoints[team];
    Quiz.log("RiskLadder", "Bank", { team: team, banked: banked, totalScore: state.scores[team] + banked });

    if (banked === 0 && state.ladderPositions[team] < 0) {
      return;
    }

    state.scores[team] += banked;
    state.pendingPoints[team] = 0;
    state.ladderPositions[team] = -1;
    Quiz.state.save(state);
    Quiz.ui.renderScores(state);
    this._updateUI(state, theme);

    var self = this;
    if (banked > 0) {
      Quiz.ui.showOutcome(
        "Banked " + banked + "!",
        "\u2705",
        theme.labels.bank,
        1500
      );
    }
    setTimeout(function () {
      Quiz.ui.nextTurn(state);
      state = Quiz.state.load();
      self._updateUI(state, theme);
    }, banked > 0 ? 1700 : 200);
  },
};
