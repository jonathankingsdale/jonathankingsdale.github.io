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

  createAuctionHouseState: function (themeId) {
    var cfg = Quiz.config.auctionHouse;
    var items = [];
    cfg.items.forEach(function (o) {
      for (var i = 0; i < o.count; i++) {
        items.push({ type: o.type, value: o.value });
      }
    });
    // Shuffle (Fisher-Yates)
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }
    return {
      gameType: "auctionHouse",
      themeId: themeId,
      scores: [cfg.startingBank, cfg.startingBank],
      currentTeam: 0,
      scoresVisible: false,
      round: 0,
      totalRounds: cfg.totalRounds,
      items: items.slice(0, cfg.totalRounds),
      currentBids: [0, 0],
      phase: "reveal",
      gameOver: false,
    };
  },

  createBombDefusalState: function (themeId) {
    var cfg = Quiz.config.bombDefusal;
    var wires = [];
    cfg.outcomes.forEach(function (o) {
      for (var i = 0; i < o.count; i++) {
        wires.push({ type: o.type, value: o.value, cut: false });
      }
    });
    // Shuffle (Fisher-Yates)
    for (var i = wires.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = wires[i];
      wires[i] = wires[j];
      wires[j] = tmp;
    }
    // Assign colors
    for (var i = 0; i < wires.length; i++) {
      wires[i].color = cfg.wireColors[i];
    }
    return {
      gameType: "bombDefusal",
      themeId: themeId,
      scores: [0, 0],
      currentTeam: 0,
      scoresVisible: false,
      wires: wires,
      roundOver: false,
      gameOver: false,
    };
  },

  createTreasureMapState: function (themeId) {
    var cfg = Quiz.config.treasureMap;

    // Build a binary tree: array of nodes
    // Each node: { id, depth, type, value, left, right }
    // Root is id 0
    function pickOutcome(depth) {
      var totalWeight = 0;
      cfg.outcomes.forEach(function (o) { totalWeight += o.weight; });
      var r = Math.random() * totalWeight;
      var cum = 0;
      for (var i = 0; i < cfg.outcomes.length; i++) {
        cum += cfg.outcomes[i].weight;
        if (r < cum) {
          var o = cfg.outcomes[i];
          var val = o.value;
          // Depth-scaled multiplier for rewards
          if (o.type === "reward" && depth >= 2) {
            var multipliers = [1, 1, 1.5, 2, 3];
            val = Math.round(val * (multipliers[depth] || 1));
          }
          return { type: o.type, value: val };
        }
      }
      return { type: "reward", value: 100 };
    }

    var tree = [];
    var nextId = 0;
    function buildNode(depth) {
      if (depth > cfg.maxDepth) return -1;
      var id = nextId++;
      var outcome = pickOutcome(depth);
      tree.push({
        id: id,
        depth: depth,
        type: outcome.type,
        value: outcome.value,
        left: -1,
        right: -1,
        revealed: false,
      });
      // Leaf nodes at max depth, or dead ends / hazards stop branching
      if (depth < cfg.maxDepth && outcome.type !== "deadEnd") {
        tree[id].left = buildNode(depth + 1);
        tree[id].right = buildNode(depth + 1);
      }
      return id;
    }
    buildNode(0);

    return {
      gameType: "treasureMap",
      themeId: themeId,
      scores: [0, 0],
      currentTeam: 0,
      scoresVisible: false,
      mapTree: tree,
      currentNodeId: 0,
      revealedNodes: [],
      pathHistory: [0],
      turnsPlayed: 0,
      maxTurns: cfg.maxTurns,
      gameOver: false,
    };
  },

  createTugOfWarState: function (themeId) {
    var cfg = Quiz.config.tugOfWar;
    return {
      gameType: "tugOfWar",
      themeId: themeId,
      scores: [0, 0],
      currentTeam: 0,
      scoresVisible: false,
      ropePosition: 0,
      round: 0,
      totalRounds: cfg.totalRounds,
      roundWins: [0, 0],
      roundRewards: cfg.roundRewards,
      gameOver: false,
    };
  },
};
