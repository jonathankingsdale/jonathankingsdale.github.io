window.Quiz = window.Quiz || {};
Quiz.engines = Quiz.engines || {};

Quiz.engines.bombDefusal = {
  init: function (container) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];

    var wrap = document.createElement("div");
    wrap.className = "bomb-container";
    wrap.id = "bomb-container";

    // Info
    var info = document.createElement("div");
    info.className = "bomb-info";
    info.id = "bomb-info";
    wrap.appendChild(info);

    // Device
    var device = document.createElement("div");
    device.className = "bomb-device";
    device.id = "bomb-device";

    // LED display
    var led = document.createElement("div");
    led.className = "bomb-led";
    led.id = "bomb-led";
    device.appendChild(led);

    // Wire panel
    var panel = document.createElement("div");
    panel.className = "bomb-wire-panel";
    panel.id = "bomb-wire-panel";

    state.wires.forEach(function (wire, i) {
      var wireEl = document.createElement("div");
      wireEl.className = "bomb-wire" + (wire.cut ? " bomb-wire-cut" : "");
      wireEl.dataset.index = i;
      wireEl.style.setProperty("--wire-color", wire.color);

      var glow = document.createElement("div");
      glow.className = "bomb-wire-glow";
      wireEl.appendChild(glow);

      var label = document.createElement("span");
      label.className = "bomb-wire-label";
      label.textContent = wire.cut ? (wire.type === "boom" ? "\u{1F4A5}" : "\u2713") : "?";
      wireEl.appendChild(label);

      if (!wire.cut && !state.roundOver) {
        wireEl.addEventListener("click", function () {
          Quiz.engines.bombDefusal._cutWire(i);
        });
      }

      panel.appendChild(wireEl);
    });

    device.appendChild(panel);
    wrap.appendChild(device);
    container.appendChild(wrap);

    Quiz.log("Bomb", "Init", { theme: state.themeId, wires: state.wires.map(function(w){return w.type}), colors: state.wires.map(function(w){return w.color}) });
    this._updateUI(state, theme);
  },

  _updateUI: function (state, theme) {
    var remaining = state.wires.filter(function (w) { return !w.cut; }).length;

    var info = document.getElementById("bomb-info");
    var teamName = Quiz.config.teams.names[state.currentTeam];
    if (state.roundOver) {
      info.innerHTML = '<span class="bomb-status bomb-status-safe">' +
        (theme.bombLabels.defused || "Defused!") + '</span>';
    } else {
      info.innerHTML =
        '<span class="bomb-team-label">' + teamName + '\'s turn</span>' +
        '<span class="bomb-remaining">' + remaining + ' wires left</span>';
    }

    // LED countdown
    var led = document.getElementById("bomb-led");
    led.textContent = remaining;
    led.className = "bomb-led";
    if (remaining <= 2) led.classList.add("bomb-led-danger");
    else if (remaining <= 4) led.classList.add("bomb-led-warning");

    // Pulse speed increases as wires deplete
    var device = document.getElementById("bomb-device");
    var total = state.wires.length;
    var speed = 2 - (1.5 * (1 - remaining / total));
    device.style.setProperty("--pulse-speed", Math.max(0.3, speed) + "s");
  },

  _cutWire: function (index) {
    var state = Quiz.state.load();
    if (state.wires[index].cut || state.roundOver) return;

    var theme = Quiz.themes[state.themeId];
    state.wires[index].cut = true;
    Quiz.state.save(state);

    var wire = state.wires[index];
    Quiz.log("Bomb", "Wire cut", { wire: index, color: wire.color, type: wire.type, value: wire.value, team: state.currentTeam });
    var wireEl = document.querySelectorAll(".bomb-wire")[index];
    wireEl.classList.add("bomb-wire-cut");
    var label = wireEl.querySelector(".bomb-wire-label");

    var self = this;

    if (wire.type === "boom") {
      label.textContent = "\u{1F4A5}";
      state.roundOver = true;
      state.scores[state.currentTeam] += wire.value;
      if (state.scores[state.currentTeam] < 0) state.scores[state.currentTeam] = 0;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);

      // Screen shake
      var container = document.getElementById("bomb-container");
      container.classList.add("bomb-shake");

      var icon = theme.bombIcons.boom || "\u{1F4A5}";
      var boomLabel = theme.bombLabels.boom || "BOOM!";
      Quiz.ui.showOutcome("BOOM! " + wire.value, icon, boomLabel, 2500, function () {
        container.classList.remove("bomb-shake");
        self._checkGameEnd(state, theme);
      });
    } else if (wire.type === "bonus") {
      label.textContent = "\u{1F47C}";
      Quiz.state.save(state);
      this._updateUI(state, theme);

      var icon = theme.bombIcons.bonus || "\u2744\uFE0F";
      var bonusLabel = theme.bombLabels.bonus || "Bonus!";
      Quiz.ui.showOutcome("Bonus Turn!", icon, bonusLabel, 1500, function () {
        // Same team goes again - don't switch turns
        self._checkAllCut(state, theme);
      });
    } else {
      // Points
      label.textContent = "+" + wire.value;
      state.scores[state.currentTeam] += wire.value;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      this._updateUI(state, theme);

      var icon = theme.bombIcons.points || "\u{1F4BF}";
      var ptsLabel = theme.bombLabels.points || "Points!";
      Quiz.ui.showOutcome("+" + wire.value, icon, ptsLabel, 1500, function () {
        Quiz.ui.nextTurn(state);
        state = Quiz.state.load();
        self._updateUI(state, theme);
        self._checkAllCut(state, theme);
      });
    }
  },

  _checkAllCut: function (state, theme) {
    var remaining = state.wires.filter(function (w) { return !w.cut; }).length;
    if (remaining === 0) {
      state.roundOver = true;
      state.gameOver = true;
      Quiz.state.save(state);
      this._updateUI(state, theme);
      var defIcon = theme.bombIcons.defused;
      var defLabel = theme.bombLabels.defused;
      Quiz.ui.showOutcome("All Clear!", defIcon, defLabel, 2500);
    }
  },

  _checkGameEnd: function (state, theme) {
    // After a boom, switch turns and continue if wires remain
    var remaining = state.wires.filter(function (w) { return !w.cut; }).length;
    if (remaining === 0) {
      state.gameOver = true;
      Quiz.state.save(state);
      this._updateUI(state, theme);
      Quiz.ui.showOutcome("Game Over!", "\u{1F3C1}", "All wires resolved", 2500);
    } else {
      // Reset roundOver so play can continue
      state.roundOver = false;
      Quiz.ui.nextTurn(state);
      state = Quiz.state.load();
      Quiz.state.save(state);
      this._updateUI(state, theme);
      // Re-enable clicks on remaining wires
      this._rebindWires(state);
    }
  },

  _rebindWires: function (state) {
    var wireEls = document.querySelectorAll(".bomb-wire");
    wireEls.forEach(function (el, i) {
      if (!state.wires[i].cut) {
        var newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        newEl.addEventListener("click", function () {
          Quiz.engines.bombDefusal._cutWire(i);
        });
      }
    });
  },
};
