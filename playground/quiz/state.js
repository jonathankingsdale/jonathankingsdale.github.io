window.Quiz = window.Quiz || {};

Quiz.state = {
  KEY: "quiz-night-state",

  load: function () {
    try {
      var raw = sessionStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  save: function (state) {
    try {
      sessionStorage.setItem(this.KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state", e);
    }
  },

  reset: function () {
    sessionStorage.removeItem(this.KEY);
    window.location.href = "index.html";
  },

  createTileBoardState: function (themeId) {
    var cfg = Quiz.config.tileBoard;
    var tiles = [];
    cfg.outcomes.forEach(function (o) {
      for (var i = 0; i < o.count; i++) {
        tiles.push({ type: o.type, value: o.value, revealed: false });
      }
    });
    // Shuffle (Fisher-Yates)
    for (var i = tiles.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = tiles[i];
      tiles[i] = tiles[j];
      tiles[j] = tmp;
    }
    return {
      gameType: "tileBoard",
      themeId: themeId,
      scores: [0, 0],
      currentTeam: 0,
      scoresVisible: false,
      board: tiles,
      gameOver: false,
    };
  },

  createRiskLadderState: function (themeId) {
    var cfg = Quiz.config.riskLadder;
    var stepCount = cfg.steps.length;
    // Place traps randomly on upper steps only (index 2+), keeping early steps safe
    var possible = [];
    for (var i = 2; i < stepCount; i++) possible.push(i);
    // Shuffle and pick trapCount
    for (var i = possible.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = possible[i];
      possible[i] = possible[j];
      possible[j] = tmp;
    }
    var traps = possible.slice(0, cfg.trapCount);

    return {
      gameType: "riskLadder",
      themeId: themeId,
      scores: [0, 0],
      currentTeam: 0,
      scoresVisible: false,
      ladderTraps: traps,
      ladderPositions: [-1, -1],
      pendingPoints: [0, 0],
      gameOver: false,
    };
  },

  createWheelState: function (themeId) {
    return {
      gameType: "wheel",
      themeId: themeId,
      scores: [0, 0],
      currentTeam: 0,
      scoresVisible: false,
      lastSpin: null,
      gameOver: false,
    };
  },
};
