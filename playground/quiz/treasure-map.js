window.Quiz = window.Quiz || {};
Quiz.engines = Quiz.engines || {};

Quiz.engines.treasureMap = {
  init: function (container) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];

    Quiz.log("TreasureMap", "Init", { theme: state.themeId, treeSize: state.mapTree.length, turnsPlayed: state.turnsPlayed });

    var wrap = document.createElement("div");
    wrap.className = "tmap-container";
    wrap.id = "tmap-container";

    // Info
    var info = document.createElement("div");
    info.className = "tmap-info";
    info.id = "tmap-info";
    wrap.appendChild(info);

    // Map area (scrollable)
    var mapArea = document.createElement("div");
    mapArea.className = "tmap-area";
    mapArea.id = "tmap-area";
    wrap.appendChild(mapArea);

    // Action buttons
    var actions = document.createElement("div");
    actions.className = "tmap-actions";
    actions.id = "tmap-actions";
    wrap.appendChild(actions);

    container.appendChild(wrap);

    this._renderTree(state, theme);
    this._updateUI(state, theme);
  },

  _getNodesByLevel: function (tree) {
    // BFS to get nodes organized by depth level, with null placeholders
    var levels = [];
    var queue = [0]; // root node id

    while (queue.length > 0) {
      var level = [];
      var nextQueue = [];
      var hasReal = false;

      for (var i = 0; i < queue.length; i++) {
        var id = queue[i];
        if (id === -1 || id >= tree.length) {
          level.push(null);
          nextQueue.push(-1);
          nextQueue.push(-1);
        } else {
          var node = tree[id];
          level.push(node);
          nextQueue.push(node.left);
          nextQueue.push(node.right);
          if (node.left !== -1 || node.right !== -1) hasReal = true;
        }
      }

      levels.push(level);
      if (!hasReal) break;
      queue = nextQueue;
    }

    return levels;
  },

  _renderTree: function (state, theme) {
    var area = document.getElementById("tmap-area");
    area.innerHTML = "";

    var tree = state.mapTree;
    var levels = this._getNodesByLevel(tree);

    var treeEl = document.createElement("div");
    treeEl.className = "tmap-tree";

    for (var d = 0; d < levels.length; d++) {
      // Connector row (between levels, except before first)
      if (d > 0) {
        var connRow = document.createElement("div");
        connRow.className = "tmap-conn-row";
        // One connector pair per parent in previous level
        var parentLevel = levels[d - 1];
        for (var p = 0; p < parentLevel.length; p++) {
          var parent = parentLevel[p];
          var leftChild = levels[d][p * 2];
          var rightChild = levels[d][p * 2 + 1];

          var connPair = document.createElement("div");
          connPair.className = "tmap-conn-pair";

          var leftLine = document.createElement("div");
          leftLine.className = "tmap-conn-line tmap-conn-left";
          if (!parent || !leftChild) leftLine.classList.add("tmap-conn-hidden");

          var rightLine = document.createElement("div");
          rightLine.className = "tmap-conn-line tmap-conn-right";
          if (!parent || !rightChild) rightLine.classList.add("tmap-conn-hidden");

          connPair.appendChild(leftLine);
          connPair.appendChild(rightLine);
          connRow.appendChild(connPair);
        }
        treeEl.appendChild(connRow);
      }

      // Node row
      var row = document.createElement("div");
      row.className = "tmap-tree-row";

      for (var i = 0; i < levels[d].length; i++) {
        var node = levels[d][i];
        var nodeEl = document.createElement("div");

        if (!node) {
          nodeEl.className = "tmap-tree-cell tmap-tree-empty";
          row.appendChild(nodeEl);
          continue;
        }

        var isRevealed = state.revealedNodes.indexOf(node.id) !== -1;
        var isCurrent = node.id === state.currentNodeId;
        var isOnPath = state.pathHistory.indexOf(node.id) !== -1;
        // Adjacent = child of current node
        var currentNode = tree[state.currentNodeId];
        var isAdjacent = currentNode && (currentNode.left === node.id || currentNode.right === node.id);

        var cls = "tmap-tree-cell tmap-tree-node";
        if (isCurrent) cls += " tmap-current";
        if (isRevealed) cls += " tmap-revealed tmap-type-" + node.type;
        else if (isOnPath) cls += " tmap-visited";
        else if (isAdjacent) cls += " tmap-adjacent";
        else cls += " tmap-fog";

        nodeEl.className = cls;
        nodeEl.dataset.id = node.id;

        var icon, label;
        if (isRevealed || isOnPath) {
          icon = theme.mapIcons[node.type] || "\u{1F9ED}";
          label = isRevealed ? (theme.mapLabels[node.type] || "") : "";
        } else if (isAdjacent) {
          var pathName = theme.mapPaths[Math.min(node.depth, theme.mapPaths.length - 1)] || "?";
          icon = "\u{1F9ED}";
          label = pathName;
        } else {
          icon = "?";
          label = "";
        }

        var valStr = "";
        if (isRevealed && node.value !== 0) {
          valStr = (node.value > 0 ? "+" : "") + node.value;
        }

        nodeEl.innerHTML =
          '<div class="tmap-cell-icon">' + icon + '</div>' +
          (label ? '<div class="tmap-cell-label">' + label + '</div>' : '') +
          (valStr ? '<div class="tmap-cell-val">' + valStr + '</div>' : '');

        if (isCurrent) {
          var token = document.createElement("div");
          token.className = "tmap-token";
          token.style.borderColor = state.currentTeam === 0 ? "var(--quiz-team1)" : "var(--quiz-team2)";
          token.textContent = state.currentTeam === 0 ? "1" : "2";
          nodeEl.appendChild(token);
        }

        row.appendChild(nodeEl);
      }

      treeEl.appendChild(row);
    }

    area.appendChild(treeEl);
  },

  _updateUI: function (state, theme) {
    var info = document.getElementById("tmap-info");
    var teamName = Quiz.config.teams.names[state.currentTeam];
    var turnsLeft = state.maxTurns - state.turnsPlayed;
    info.innerHTML =
      '<span class="tmap-team-label">' + teamName + '\'s expedition</span>' +
      '<span class="tmap-turns">Turns left: ' + turnsLeft + '</span>';

    var actions = document.getElementById("tmap-actions");
    actions.innerHTML = "";

    if (state.gameOver) {
      actions.innerHTML = '<div class="tmap-game-over">Expedition Complete!</div>';
      return;
    }

    var node = state.mapTree[state.currentNodeId];
    var isRevealed = state.revealedNodes.indexOf(state.currentNodeId) !== -1;
    var self = this;

    if (!isRevealed) {
      var revealBtn = document.createElement("button");
      revealBtn.className = "tmap-btn tmap-btn-reveal";
      revealBtn.textContent = "Explore this area";
      revealBtn.addEventListener("click", function () {
        self._revealNode();
      });
      actions.appendChild(revealBtn);
    } else if (node.type !== "deadEnd" && node.left !== -1 && node.right !== -1) {
      // Show fork choice with theme-appropriate signpost
      var signpost = document.createElement("div");
      signpost.className = "tmap-signpost";

      var leftChild = state.mapTree[node.left];
      var rightChild = state.mapTree[node.right];
      var leftName = theme.mapPaths[Math.min(leftChild.depth, theme.mapPaths.length - 1)] || "Left";
      var rightName = theme.mapPaths[Math.min(rightChild.depth, theme.mapPaths.length - 1)] || "Right";

      signpost.innerHTML = '<div class="tmap-signpost-post"></div><div class="tmap-signpost-label">Choose your path</div>';
      actions.appendChild(signpost);

      var btnWrap = document.createElement("div");
      btnWrap.className = "tmap-fork-btns";

      var leftBtn = document.createElement("button");
      leftBtn.className = "tmap-btn tmap-btn-left";
      leftBtn.innerHTML = '\u2B05 ' + leftName;
      leftBtn.addEventListener("click", function () {
        self._choosePath("left");
      });

      var rightBtn = document.createElement("button");
      rightBtn.className = "tmap-btn tmap-btn-right";
      rightBtn.innerHTML = rightName + ' \u27A1';
      rightBtn.addEventListener("click", function () {
        self._choosePath("right");
      });

      btnWrap.appendChild(leftBtn);
      btnWrap.appendChild(rightBtn);
      actions.appendChild(btnWrap);
    } else {
      // Dead end or leaf -- auto-end turn after brief delay
      var endMsg = document.createElement("div");
      endMsg.className = "tmap-end-msg";
      endMsg.textContent = node.type === "deadEnd" ? "Dead end! Turn over." : "End of the road.";
      actions.appendChild(endMsg);

      setTimeout(function () {
        self._endTurn();
      }, 1500);
    }
  },

  _revealNode: function () {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var node = state.mapTree[state.currentNodeId];

    state.revealedNodes.push(state.currentNodeId);
    Quiz.log("TreasureMap", "Node revealed", { nodeId: node.id, depth: node.depth, type: node.type, value: node.value, team: state.currentTeam });

    var self = this;

    if (node.type === "reward" || node.type === "treasure") {
      state.scores[state.currentTeam] += node.value;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      this._renderTree(state, theme);

      var icon = theme.mapIcons[node.type] || "";
      var label = theme.mapLabels[node.type] || "";
      Quiz.ui.showOutcome("+" + node.value, icon, label, 1800, function () {
        self._updateUI(state, theme);
      });
    } else if (node.type === "hazard") {
      state.scores[state.currentTeam] += node.value;
      if (state.scores[state.currentTeam] < 0) state.scores[state.currentTeam] = 0;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      this._renderTree(state, theme);

      var icon = theme.mapIcons[node.type] || "";
      var label = theme.mapLabels[node.type] || "";
      Quiz.ui.showOutcome("" + node.value, icon, label, 1800, function () {
        self._updateUI(state, theme);
      });
    } else if (node.type === "deadEnd") {
      Quiz.state.save(state);
      this._renderTree(state, theme);

      var icon = theme.mapIcons.deadEnd || "";
      var label = theme.mapLabels.deadEnd || "Dead End!";
      Quiz.ui.showOutcome("Dead End!", icon, label, 1800, function () {
        self._endTurn();
      });
    }
  },

  _choosePath: function (direction) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var node = state.mapTree[state.currentNodeId];
    var nextId = direction === "left" ? node.left : node.right;
    if (nextId === -1) return;

    state.currentNodeId = nextId;
    state.pathHistory.push(nextId);
    Quiz.state.save(state);

    Quiz.log("TreasureMap", "Path chosen", { direction: direction, from: node.id, to: nextId, depth: state.mapTree[nextId].depth });

    this._renderTree(state, theme);
    this._updateUI(state, theme);
  },

  _endTurn: function () {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    state.turnsPlayed++;

    Quiz.log("TreasureMap", "Turn ended", { turnsPlayed: state.turnsPlayed, maxTurns: state.maxTurns, scores: state.scores.slice() });

    if (state.turnsPlayed >= state.maxTurns) {
      state.gameOver = true;
      Quiz.state.save(state);
      this._renderTree(state, theme);
      this._updateUI(state, theme);

      var winner = state.scores[0] > state.scores[1] ? 0 :
        state.scores[1] > state.scores[0] ? 1 : -1;
      var winText = winner === -1 ? "It's a tie!" :
        Quiz.config.teams.names[winner] + " wins!";
      Quiz.log("TreasureMap", "Game over", { winner: winner, scores: state.scores.slice() });
      Quiz.ui.showOutcome(winText, "\u{1F5FA}\uFE0F", "Expedition complete!", 3000);
      return;
    }

    // Reset for next team's turn
    Quiz.ui.nextTurn(state);
    state = Quiz.state.load();
    state.currentNodeId = 0;
    state.pathHistory = [0];
    Quiz.state.save(state);

    this._renderTree(state, theme);
    this._updateUI(state, theme);
  },
};
