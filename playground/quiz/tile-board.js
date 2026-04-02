window.Quiz = window.Quiz || {};
Quiz.engines = Quiz.engines || {};

Quiz.engines.tileBoard = {
  init: function (container) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    Quiz.log("TileBoard", "Init", { theme: state.themeId, revealed: state.board.filter(function(t){return t.revealed}).length + "/" + state.board.length });

    var grid = document.createElement("div");
    grid.className = "tile-grid";

    state.board.forEach(function (tile, i) {
      var el = document.createElement("div");
      el.className = "tile" + (tile.revealed ? " revealed" : "");
      if (tile.revealed && tile.revealedBy != null) {
        el.className += " team-" + tile.revealedBy;
      }
      el.dataset.index = i;

      var tileLabel = Quiz.engines.tileBoard._getLabel(tile, theme);
      var tileIcon = Quiz.engines.tileBoard._getIcon(tile, theme);
      var valueStr = Quiz.engines.tileBoard._getValue(tile);
      var tileNum = i + 1;

      el.innerHTML =
        '<div class="tile-inner">' +
        '<div class="tile-face tile-back">' + tileNum + "</div>" +
        '<div class="tile-face tile-front">' +
        '<span class="tile-icon">' + tileIcon + "</span>" +
        '<span class="tile-value">' + valueStr + "</span>" +
        '<span class="tile-label">' + tileLabel + "</span>" +
        "</div>" +
        "</div>";

      if (!tile.revealed) {
        el.addEventListener("click", function () {
          Quiz.engines.tileBoard._reveal(i, el);
        });
      }

      grid.appendChild(el);
    });

    container.appendChild(grid);

    var allRevealed = state.board.every(function (t) {
      return t.revealed;
    });
    if (allRevealed) {
      Quiz.ui.showMessage("Game Over! All tiles revealed.", 3000);
    }
  },

  _reveal: function (index, el) {
    var state = Quiz.state.load();
    if (state.board[index].revealed) return;

    state.board[index].revealed = true;
    state.board[index].revealedBy = state.currentTeam;
    Quiz.log("TileBoard", "Tile revealed", { tile: index, team: state.currentTeam, type: state.board[index].type, value: state.board[index].value });
    Quiz.state.save(state);

    el.classList.add("revealed");
    el.classList.add("team-" + state.currentTeam);

    var tile = state.board[index];
    var theme = Quiz.themes[state.themeId];
    var label = this._getLabel(tile, theme);
    var icon = this._getIcon(tile, theme);
    var self = this;

    setTimeout(function () {
      self._processOutcome(tile, icon, label, state);
    }, 650);
  },

  _processOutcome: function (tile, icon, label, state) {
    var self = this;
    var team = state.currentTeam;

    if (tile.type === "points" || tile.type === "jackpot") {
      var pts = tile.value;
      state.scores[team] += pts;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);

      if (pts >= 200) {
        Quiz.ui.showOutcome("+" + pts, icon, label, 1800, function () {
          Quiz.ui.showRiskDecision(pts, Quiz.themes[state.themeId], function (doubled) {
            state = Quiz.state.load();
            if (doubled) {
              var won = Math.random() < 0.5;
              if (won) {
                state.scores[team] += pts;
                Quiz.state.save(state);
                Quiz.ui.renderScores(state);
                Quiz.ui.showOutcome("+" + pts + " more!", "\u{1F389}", "Double pays off!", 1800, function () {
                  self._endTurn(state, false);
                });
              } else {
                state.scores[team] -= pts;
                Quiz.state.save(state);
                Quiz.ui.renderScores(state);
                Quiz.ui.showOutcome("Lost " + pts + "!", "\u{1F4A5}", "Bad luck!", 1800, function () {
                  self._endTurn(state, false);
                });
              }
            } else {
              self._endTurn(state, false);
            }
          });
        });
      } else {
        Quiz.ui.showOutcome("+" + pts, icon, label, 1800, function () {
          self._endTurn(state, false);
        });
      }
    } else if (tile.type === "negative") {
      state.scores[team] += tile.value;
      if (state.scores[team] < 0) state.scores[team] = 0;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome(tile.value, icon, label, 1800, function () {
        self._endTurn(state, false);
      });
    } else if (tile.type === "steal") {
      var other = team === 0 ? 1 : 0;
      var stealAmt = Math.min(tile.value, state.scores[other]);
      state.scores[other] -= stealAmt;
      state.scores[team] += stealAmt;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome("Steal " + stealAmt + "!", icon, label, 1800, function () {
        self._endTurn(state, false);
      });
    } else if (tile.type === "bonusTurn") {
      Quiz.ui.showOutcome("Bonus Turn!", icon, label, 1800, function () {
        self._endTurn(state, true);
      });
    } else if (tile.type === "swap") {
      var tmp = state.scores[0];
      state.scores[0] = state.scores[1];
      state.scores[1] = tmp;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome("Scores Swapped!", icon, label, 2200, function () {
        self._endTurn(state, false);
      });
    } else if (tile.type === "mystery") {
      // Pick a random outcome from the non-mystery types
      var pool = [
        { type: "points", value: 100 },
        { type: "points", value: 200 },
        { type: "points", value: 300 },
        { type: "negative", value: -100 },
        { type: "steal", value: 100 },
        { type: "bonusTurn", value: 0 },
        { type: "jackpot", value: 500 },
        { type: "swap", value: 0 },
        { type: "tithe", value: 0 },
        { type: "earthquake", value: -150 },
        { type: "gift", value: 150 },
      ];
      var pick = pool[Math.floor(Math.random() * pool.length)];
      pick.variant = Math.floor(Math.random() * 10);
      var theme = Quiz.themes[state.themeId];
      var pickIcon = self._getIcon(pick, theme);
      var pickLabel = self._getLabel(pick, theme);
      Quiz.ui.showOutcome("Mystery...", icon, label, 1200, function () {
        self._processOutcome(pick, pickIcon, pickLabel, Quiz.state.load());
      });
    } else if (tile.type === "tithe") {
      var other = team === 0 ? 1 : 0;
      var titheAmt = Math.round(state.scores[other] * 0.25);
      state.scores[other] -= titheAmt;
      state.scores[team] += titheAmt;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome("Tithe: +" + titheAmt + "!", icon, label, 1800, function () {
        self._endTurn(state, false);
      });
    } else if (tile.type === "earthquake") {
      state.scores[0] = Math.max(0, state.scores[0] + tile.value);
      state.scores[1] = Math.max(0, state.scores[1] + tile.value);
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome("Earthquake! " + tile.value + " each!", icon, label, 2000, function () {
        self._endTurn(state, false);
      });
    } else if (tile.type === "gift") {
      var other = team === 0 ? 1 : 0;
      var giftAmt = Math.min(tile.value, state.scores[team]);
      state.scores[team] -= giftAmt;
      state.scores[other] += giftAmt;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome("Gifted " + giftAmt + "!", icon, label, 1800, function () {
        self._endTurn(state, false);
      });
    }
  },

  _endTurn: function (state, bonusTurn) {
    state = Quiz.state.load();
    Quiz.log("TileBoard", "End turn", { team: state.currentTeam, scores: state.scores.slice(), bonusTurn: bonusTurn });
    var allRevealed = state.board.every(function (t) {
      return t.revealed;
    });
    if (allRevealed) {
      state.gameOver = true;
      Quiz.state.save(state);
      Quiz.ui.showMessage("Game Over! All tiles revealed.", 3000);
      return;
    }
    if (!bonusTurn) {
      Quiz.ui.nextTurn(state);
    } else {
      Quiz.ui.renderScores(state);
    }
  },

  _getLabel: function (tile, theme) {
    var label = theme.labels[tile.type];
    if (!label) return tile.type;
    if (Array.isArray(label)) {
      var idx = tile.variant != null ? tile.variant : 0;
      return label[idx % label.length];
    }
    return label;
  },

  _getIcon: function (tile, theme) {
    var icon = theme.icons[tile.type];
    if (!icon) return "";
    if (Array.isArray(icon)) {
      var idx = tile.variant != null ? tile.variant : 0;
      return icon[idx % icon.length];
    }
    return icon;
  },

  _getValue: function (tile) {
    if (tile.type === "bonusTurn") return "";
    if (tile.type === "steal") return "Steal " + tile.value;
    if (tile.type === "swap") return "Swap!";
    if (tile.type === "mystery") return "???";
    if (tile.type === "tithe") return "25%";
    if (tile.type === "earthquake") return "Both " + tile.value;
    if (tile.type === "gift") return "Give " + tile.value;
    if (tile.value > 0) return "+" + tile.value;
    if (tile.value < 0) return "" + tile.value;
    return "";
  },
};
