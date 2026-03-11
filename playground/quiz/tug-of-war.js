window.Quiz = window.Quiz || {};
Quiz.engines = Quiz.engines || {};

Quiz.engines.tugOfWar = {
  _meterRunning: false,
  _meterPos: 0,
  _meterDir: 1,
  _meterRAF: null,

  init: function (container) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var cfg = Quiz.config.tugOfWar;

    Quiz.log("TugOfWar", "Init", { theme: state.themeId, round: state.round, ropePosition: state.ropePosition });

    var wrap = document.createElement("div");
    wrap.className = "tow-container";
    wrap.id = "tow-container";

    // Round info
    var info = document.createElement("div");
    info.className = "tow-info";
    info.id = "tow-info";
    wrap.appendChild(info);

    // Arena
    var arena = document.createElement("div");
    arena.className = "tow-arena";
    arena.id = "tow-arena";

    // Team zones
    var zone1 = document.createElement("div");
    zone1.className = "tow-zone tow-zone-left";
    zone1.id = "tow-zone-left";
    arena.appendChild(zone1);

    var zone2 = document.createElement("div");
    zone2.className = "tow-zone tow-zone-right";
    zone2.id = "tow-zone-right";
    arena.appendChild(zone2);

    // Markers on track
    var track = document.createElement("div");
    track.className = "tow-track";
    for (var i = -cfg.winThreshold; i <= cfg.winThreshold; i++) {
      var marker = document.createElement("div");
      marker.className = "tow-marker";
      if (i === 0) marker.classList.add("tow-marker-center");
      track.appendChild(marker);
    }
    arena.appendChild(track);

    // Rope
    var rope = document.createElement("div");
    rope.className = "tow-rope";
    rope.id = "tow-rope";
    var knot = document.createElement("div");
    knot.className = "tow-knot";
    knot.id = "tow-knot";
    rope.appendChild(knot);
    arena.appendChild(rope);

    wrap.appendChild(arena);

    // Power meter
    var meterWrap = document.createElement("div");
    meterWrap.className = "tow-meter-wrap";
    meterWrap.id = "tow-meter-wrap";
    meterWrap.style.display = "none";

    var meterLabel = document.createElement("div");
    meterLabel.className = "tow-meter-label";
    meterLabel.textContent = "Time your pull!";
    meterWrap.appendChild(meterLabel);

    var meter = document.createElement("div");
    meter.className = "tow-meter";

    // Zone labels
    var zones = [
      { cls: "tow-zone-slip", label: "SLIP", w: 8 },
      { cls: "tow-zone-1", label: "1", w: 17 },
      { cls: "tow-zone-2", label: "2", w: 20 },
      { cls: "tow-zone-3", label: "3", w: 20 },
      { cls: "tow-zone-4", label: "4", w: 20 },
      { cls: "tow-zone-5", label: "5", w: 10 },
      { cls: "tow-zone-super", label: "SUPER!", w: 5 },
    ];
    zones.forEach(function (z) {
      var zoneEl = document.createElement("div");
      zoneEl.className = "tow-mzone " + z.cls;
      zoneEl.style.width = z.w + "%";
      zoneEl.innerHTML = '<span>' + z.label + '</span>';
      meter.appendChild(zoneEl);
    });

    var needle = document.createElement("div");
    needle.className = "tow-needle";
    needle.id = "tow-needle";
    meter.appendChild(needle);

    meterWrap.appendChild(meter);
    wrap.appendChild(meterWrap);

    // Pull button
    var pullBtn = document.createElement("button");
    pullBtn.className = "tow-pull-btn";
    pullBtn.id = "tow-pull-btn";
    wrap.appendChild(pullBtn);

    // Round wins
    var wins = document.createElement("div");
    wins.className = "tow-wins";
    wins.id = "tow-wins";
    wrap.appendChild(wins);

    container.appendChild(wrap);

    this._updateUI(state, theme);

    var self = this;
    pullBtn.addEventListener("click", function () {
      self._handleClick(state, theme);
    });
  },

  _updateUI: function (state, theme) {
    var cfg = Quiz.config.tugOfWar;

    var info = document.getElementById("tow-info");
    var roundName = theme.tugRoundNames[state.round] || ("Round " + (state.round + 1));
    var teamName = Quiz.config.teams.names[state.currentTeam];
    info.innerHTML =
      '<span class="tow-round-name">' + roundName + '</span>' +
      '<span class="tow-turn-label">' + teamName + '\'s turn</span>';

    // Rope position
    var rope = document.getElementById("tow-rope");
    var pct = (state.ropePosition / cfg.winThreshold) * 45;
    rope.style.transform = "translateX(" + pct + "%)";

    var knot = document.getElementById("tow-knot");
    knot.style.background = state.currentTeam === 0
      ? "var(--quiz-team1)" : "var(--quiz-team2)";

    // Zone intensity
    var leftZone = document.getElementById("tow-zone-left");
    var rightZone = document.getElementById("tow-zone-right");
    var intensity = Math.abs(state.ropePosition) / cfg.winThreshold;
    if (state.ropePosition < 0) {
      leftZone.style.opacity = 0.1 + intensity * 0.4;
      rightZone.style.opacity = 0.1;
    } else if (state.ropePosition > 0) {
      rightZone.style.opacity = 0.1 + intensity * 0.4;
      leftZone.style.opacity = 0.1;
    } else {
      leftZone.style.opacity = 0.1;
      rightZone.style.opacity = 0.1;
    }

    // Arena tilt
    var arena = document.getElementById("tow-arena");
    var tilt = (state.ropePosition / cfg.winThreshold) * 3;
    arena.style.transform = "perspective(800px) rotateY(" + tilt + "deg)";

    // Round wins
    var wins = document.getElementById("tow-wins");
    wins.innerHTML =
      '<span class="tow-win-team" style="color:var(--quiz-team1)">' +
      Quiz.config.teams.names[0] + ": " + state.roundWins[0] + '</span>' +
      '<span class="tow-win-vs">vs</span>' +
      '<span class="tow-win-team" style="color:var(--quiz-team2)">' +
      Quiz.config.teams.names[1] + ": " + state.roundWins[1] + '</span>';

    // Button state
    var btn = document.getElementById("tow-pull-btn");
    if (state.gameOver) {
      btn.disabled = true;
      btn.textContent = "Game Over";
    } else {
      btn.disabled = false;
      btn.textContent = theme.tugLabels.pull || "Pull!";
      btn.style.background = state.currentTeam === 0
        ? "linear-gradient(135deg, var(--quiz-team1), #c0392b)"
        : "linear-gradient(135deg, var(--quiz-team2), #2980b9)";
    }
  },

  _handleClick: function () {
    if (this._meterRunning) {
      // Stop the meter and apply pull
      this._stopMeter();
    } else {
      // Start the meter
      this._startMeter();
    }
  },

  _startMeter: function () {
    var state = Quiz.state.load();
    if (state.gameOver) return;

    this._meterRunning = true;
    this._meterPos = 0;
    this._meterDir = 1;

    // Speed increases each round
    this._meterSpeed = 1.2 + state.round * 0.6;

    var meterWrap = document.getElementById("tow-meter-wrap");
    meterWrap.style.display = "";

    var btn = document.getElementById("tow-pull-btn");
    btn.textContent = "STOP!";
    btn.classList.add("tow-btn-stop");

    Quiz.log("TugOfWar", "Meter started", { team: state.currentTeam, speed: this._meterSpeed, round: state.round });

    var self = this;
    function animate() {
      if (!self._meterRunning) return;
      self._meterPos += self._meterDir * self._meterSpeed;
      if (self._meterPos >= 100) { self._meterPos = 100; self._meterDir = -1; }
      if (self._meterPos <= 0) { self._meterPos = 0; self._meterDir = 1; }

      var needle = document.getElementById("tow-needle");
      if (needle) needle.style.left = self._meterPos + "%";

      self._meterRAF = requestAnimationFrame(animate);
    }
    this._meterRAF = requestAnimationFrame(animate);
  },

  _stopMeter: function () {
    this._meterRunning = false;
    if (this._meterRAF) cancelAnimationFrame(this._meterRAF);

    var pos = this._meterPos;
    var result = this._positionToResult(pos);

    var meterWrap = document.getElementById("tow-meter-wrap");
    meterWrap.style.display = "none";

    var btn = document.getElementById("tow-pull-btn");
    btn.classList.remove("tow-btn-stop");

    Quiz.log("TugOfWar", "Meter stopped", { position: Math.round(pos), pullType: result.type, pullStrength: result.value });

    this._applyPull(result);
  },

  _positionToResult: function (pos) {
    // Zones: 0-8 slip, 8-25 = 1, 25-45 = 2, 45-65 = 3, 65-85 = 4, 85-95 = 5, 95-100 = super
    if (pos < 8)  return { type: "slip", value: -1 };
    if (pos < 25) return { type: "normal", value: 1 };
    if (pos < 45) return { type: "normal", value: 2 };
    if (pos < 65) return { type: "normal", value: 3 };
    if (pos < 85) return { type: "normal", value: 4 };
    if (pos < 95) return { type: "normal", value: 5 };
    return { type: "superPull", value: 7 };
  },

  _applyPull: function (result) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var cfg = Quiz.config.tugOfWar;
    var team = state.currentTeam;

    // Team 0 pulls negative (left), team 1 pulls positive (right)
    var direction = team === 0 ? -1 : 1;
    state.ropePosition += direction * result.value;
    state.ropePosition = Math.max(-cfg.winThreshold, Math.min(cfg.winThreshold, state.ropePosition));

    Quiz.state.save(state);
    this._updateUI(state, theme);

    var self = this;
    var pullType = result.type === "slip" ? "slip" : result.type === "superPull" ? "superPull" : "pull";
    var icon = theme.tugIcons[pullType] || theme.tugIcons.pull;
    var label = theme.tugLabels[pullType] || theme.tugLabels.pull;
    var strengthText;
    if (result.type === "slip") {
      strengthText = label;
    } else if (result.type === "superPull") {
      strengthText = "SUPER! +" + result.value;
    } else {
      strengthText = "+" + result.value;
    }

    Quiz.log("TugOfWar", "Pull applied", { team: team, type: result.type, strength: result.value, ropePosition: state.ropePosition });

    Quiz.ui.showOutcome(strengthText, icon, label, 1200, function () {
      self._afterPull(state, theme);
    });
  },

  _afterPull: function (state, theme) {
    var cfg = Quiz.config.tugOfWar;

    if (state.ropePosition <= -cfg.winThreshold) {
      this._roundWin(state, theme, 0);
    } else if (state.ropePosition >= cfg.winThreshold) {
      this._roundWin(state, theme, 1);
    } else {
      Quiz.ui.nextTurn(state);
      state = Quiz.state.load();
      this._updateUI(state, theme);
    }
  },

  _roundWin: function (state, theme, winner) {
    var reward = state.roundRewards[state.round] || 200;
    state.scores[winner] += reward;
    state.roundWins[winner]++;
    state.round++;
    state.ropePosition = 0;

    var self = this;

    Quiz.log("TugOfWar", "Round won", { winner: winner, reward: reward, round: state.round, roundWins: state.roundWins.slice(), scores: state.scores.slice() });

    if (state.round >= state.totalRounds) {
      state.gameOver = true;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      this._updateUI(state, theme);

      var finalWinner = state.roundWins[0] > state.roundWins[1] ? 0 :
        state.roundWins[1] > state.roundWins[0] ? 1 : -1;
      var winText = finalWinner === -1 ? "It's a tie!" :
        Quiz.config.teams.names[finalWinner] + " wins!";

      Quiz.log("TugOfWar", "Game over", { finalWinner: finalWinner, scores: state.scores.slice() });

      Quiz.ui.showOutcome(winText, "\u{1F3C6}", "+" + reward + " for round win!", 3000);
    } else {
      state.currentTeam = winner;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      this._updateUI(state, theme);

      var teamName = Quiz.config.teams.names[winner];
      var roundName = theme.tugRoundNames[state.round] || ("Round " + (state.round + 1));
      Quiz.ui.showOutcome(
        teamName + " wins! +" + reward,
        "\u{1F4AA}",
        "Next: " + roundName,
        2000
      );
    }
  },
};
