window.Quiz = window.Quiz || {};
Quiz.engines = Quiz.engines || {};

Quiz.engines.auctionHouse = {
  init: function (container) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];

    var wrap = document.createElement("div");
    wrap.className = "auction-container";
    wrap.id = "auction-container";

    // Round info
    var info = document.createElement("div");
    info.className = "auction-info";
    info.id = "auction-info";
    wrap.appendChild(info);

    // Dome display
    var domeWrap = document.createElement("div");
    domeWrap.className = "auction-dome-wrap";
    domeWrap.id = "auction-dome-wrap";

    var dome = document.createElement("div");
    dome.className = "auction-dome";
    dome.id = "auction-dome";
    var domeIcon = document.createElement("div");
    domeIcon.className = "auction-dome-icon";
    domeIcon.id = "auction-dome-icon";
    domeIcon.textContent = "?";
    dome.appendChild(domeIcon);
    domeWrap.appendChild(dome);

    var base = document.createElement("div");
    base.className = "auction-base";
    domeWrap.appendChild(base);

    wrap.appendChild(domeWrap);

    // Bidding area
    var bidArea = document.createElement("div");
    bidArea.className = "auction-bid-area";
    bidArea.id = "auction-bid-area";
    wrap.appendChild(bidArea);

    container.appendChild(wrap);

    Quiz.log("Auction", "Init", { theme: state.themeId, round: state.round, totalRounds: state.totalRounds, scores: state.scores.slice() });
    this._renderPhase(state, theme);
  },

  _renderPhase: function (state, theme) {
    Quiz.log("Auction", "Phase", { phase: state.phase, round: state.round, gameOver: state.gameOver });
    if (state.gameOver) {
      this._showGameOver(state, theme);
      return;
    }

    if (state.phase === "reveal") {
      this._showRevealPhase(state, theme);
    } else if (state.phase === "bidding") {
      this._showBiddingPhase(state, theme);
    } else if (state.phase === "result") {
      this._showResultPhase(state, theme);
    }
  },

  _showRevealPhase: function (state, theme) {
    var info = document.getElementById("auction-info");
    info.innerHTML =
      '<span class="auction-round">Item ' + (state.round + 1) + ' of ' + state.totalRounds + '</span>' +
      '<span class="auction-prompt">A mystery item awaits...</span>';

    var domeIcon = document.getElementById("auction-dome-icon");
    domeIcon.textContent = "?";
    var dome = document.getElementById("auction-dome");
    dome.className = "auction-dome";

    var bidArea = document.getElementById("auction-bid-area");
    var self = this;
    bidArea.innerHTML =
      '<button class="auction-btn auction-btn-start" id="auction-start-btn">Start Bidding</button>';
    document.getElementById("auction-start-btn").addEventListener("click", function () {
      state = Quiz.state.load();
      state.phase = "bidding";
      state.currentBids = [0, 0];
      Quiz.log("Auction", "Bidding started", { round: state.round + 1 });
      Quiz.state.save(state);
      self._renderPhase(state, theme);
    });
  },

  _showBiddingPhase: function (state, theme) {
    var cfg = Quiz.config.auctionHouse;
    var info = document.getElementById("auction-info");
    info.innerHTML =
      '<span class="auction-round">Item ' + (state.round + 1) + ' of ' + state.totalRounds + '</span>' +
      '<span class="auction-prompt">Place your bids!</span>';

    var bidArea = document.getElementById("auction-bid-area");
    var self = this;

    var html = '<div class="auction-bid-panels">';
    for (var t = 0; t < 2; t++) {
      var teamName = Quiz.config.teams.names[t];
      var maxBid = state.scores[t];
      html +=
        '<div class="auction-bid-panel auction-bid-panel-' + t + '">' +
        '<div class="auction-bid-team">' + teamName + '</div>' +
        '<div class="auction-bid-bank">Bank: ' + state.scores[t] + '</div>' +
        '<div class="auction-bid-controls">' +
        '<button class="auction-bid-btn auction-bid-down" data-team="' + t + '" data-dir="-1">&minus;</button>' +
        '<span class="auction-bid-value" id="auction-bid-' + t + '">' + state.currentBids[t] + '</span>' +
        '<button class="auction-bid-btn auction-bid-up" data-team="' + t + '" data-dir="1">+</button>' +
        '</div>' +
        '</div>';
    }
    html += '</div>';
    html += '<button class="auction-btn auction-btn-gavel" id="auction-gavel-btn">Slam Gavel!</button>';

    bidArea.innerHTML = html;

    // Bind bid buttons
    bidArea.querySelectorAll(".auction-bid-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = parseInt(btn.dataset.team);
        var dir = parseInt(btn.dataset.dir);
        state = Quiz.state.load();
        state.currentBids[t] += dir * cfg.bidIncrement;
        if (state.currentBids[t] < 0) state.currentBids[t] = 0;
        if (state.currentBids[t] > state.scores[t]) state.currentBids[t] = state.scores[t];
        Quiz.state.save(state);
        document.getElementById("auction-bid-" + t).textContent = state.currentBids[t];
      });
    });

    // Gavel
    document.getElementById("auction-gavel-btn").addEventListener("click", function () {
      state = Quiz.state.load();
      if (state.currentBids[0] === 0 && state.currentBids[1] === 0) {
        Quiz.ui.showMessage("At least one team must bid!", 1500);
        return;
      }
      Quiz.log("Auction", "Gavel slammed", { bids: state.currentBids.slice() });
      state.phase = "result";
      Quiz.state.save(state);
      self._renderPhase(state, theme);
    });
  },

  _showResultPhase: function (state, theme) {
    var item = state.items[state.round];
    if (!item) { state.gameOver = true; Quiz.state.save(state); this._renderPhase(state, theme); return; }
    var bid0 = state.currentBids[0];
    var bid1 = state.currentBids[1];

    // Determine winner (highest bid wins; ties go to team with fewer points)
    var winner;
    if (bid0 > bid1) winner = 0;
    else if (bid1 > bid0) winner = 1;
    else winner = state.scores[0] <= state.scores[1] ? 0 : 1;

    var loser = winner === 0 ? 1 : 0;
    var winBid = state.currentBids[winner];

    // Winner pays their bid
    state.scores[winner] -= winBid;

    // Apply item effect
    var resultText = "";
    var itemLabel = theme.auctionLabels[item.type] || item.type;
    var itemIcon = theme.auctionIcons[item.type] || "?";

    if (item.type === "treasure" || item.type === "jackpot") {
      state.scores[winner] += Math.abs(item.value);
      resultText = Quiz.config.teams.names[winner] + " wins " + itemLabel + "! +" + Math.abs(item.value);
    } else if (item.type === "cursed") {
      state.scores[winner] += item.value;
      if (state.scores[winner] < 0) state.scores[winner] = 0;
      resultText = Quiz.config.teams.names[winner] + " got " + itemLabel + "! " + item.value;
    } else if (item.type === "steal") {
      var stealAmt = Math.min(item.value, state.scores[loser]);
      state.scores[loser] -= stealAmt;
      state.scores[winner] += stealAmt;
      resultText = Quiz.config.teams.names[winner] + " steals " + stealAmt + "!";
    }

    Quiz.log("Auction", "Result", { winner: winner, item: item.type, itemValue: item.value, bidPaid: winBid, scores: state.scores.slice() });

    // Advance round
    state.round++;
    state.phase = "reveal";
    state.currentBids = [0, 0];

    if (state.round >= state.totalRounds) {
      state.gameOver = true;
    }

    Quiz.state.save(state);
    Quiz.ui.renderScores(state);

    // Reveal dome animation
    var dome = document.getElementById("auction-dome");
    dome.classList.add("auction-dome-reveal");
    var domeIcon = document.getElementById("auction-dome-icon");
    domeIcon.textContent = itemIcon;

    var info = document.getElementById("auction-info");
    info.innerHTML =
      '<span class="auction-round">' + itemLabel + '</span>' +
      '<span class="auction-prompt">' + resultText + '</span>';

    var bidArea = document.getElementById("auction-bid-area");
    bidArea.innerHTML =
      '<div class="auction-result-text">' +
      Quiz.config.teams.names[winner] + ' paid ' + winBid + ' for this item' +
      '</div>';

    var self = this;
    setTimeout(function () {
      if (state.gameOver) {
        Quiz.ui.showOutcome("Auction Over!", "\u{1F3DB}\uFE0F", "Final scores tallied!", 2500, function () {
          self._renderPhase(state, theme);
        });
      } else {
        Quiz.ui.showOutcome(resultText, itemIcon, "Bid: " + winBid, 2500, function () {
          dome.classList.remove("auction-dome-reveal");
          self._renderPhase(state, theme);
        });
      }
    }, 800);
  },

  _showGameOver: function (state, theme) {
    var info = document.getElementById("auction-info");
    var winner = state.scores[0] > state.scores[1] ? 0 :
      state.scores[1] > state.scores[0] ? 1 : -1;
    var winText = winner === -1 ? "It's a tie!" :
      Quiz.config.teams.names[winner] + " wins the auction!";
    info.innerHTML =
      '<span class="auction-round">Auction Complete!</span>' +
      '<span class="auction-prompt">' + winText + '</span>';

    var bidArea = document.getElementById("auction-bid-area");
    bidArea.innerHTML = '<div class="auction-result-text">' + winText + '</div>';

    var domeIcon = document.getElementById("auction-dome-icon");
    domeIcon.textContent = "\u{1F3C6}";
  },
};
