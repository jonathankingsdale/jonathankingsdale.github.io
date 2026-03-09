window.Quiz = window.Quiz || {};
Quiz.engines = Quiz.engines || {};

Quiz.engines.wheel = {
  _spinning: false,
  _currentRotation: 0,

  // Hardcoded segment colors that are vibrant on any background
  COLORS: [
    "#c0392b", // red
    "#2980b9", // blue
    "#f39c12", // amber
    "#2c3e50", // dark
    "#27ae60", // green
    "#8e44ad", // purple
  ],

  init: function (container) {
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var segments = Quiz.config.wheel.segments;

    var wrap = document.createElement("div");
    wrap.className = "wheel-container";

    var wrapper = document.createElement("div");
    wrapper.className = "wheel-wrapper";

    var pointer = document.createElement("div");
    pointer.className = "wheel-pointer";
    pointer.textContent = "\u25BC";
    wrapper.appendChild(pointer);

    var canvas = document.createElement("canvas");
    canvas.className = "wheel-canvas";
    canvas.id = "wheel-canvas";
    var size = 600;
    canvas.width = size;
    canvas.height = size;
    wrapper.appendChild(canvas);

    var center = document.createElement("div");
    center.className = "wheel-center";
    wrapper.appendChild(center);

    wrap.appendChild(wrapper);

    var spinBtn = document.createElement("button");
    spinBtn.className = "btn-spin";
    spinBtn.id = "btn-spin";
    spinBtn.textContent = "SPIN!";
    wrap.appendChild(spinBtn);

    container.appendChild(wrap);

    // Compute segment angles (in degrees, clockwise from top)
    var totalWeight = 0;
    segments.forEach(function (s) { totalWeight += s.weight; });

    var segmentAngles = [];
    var cumDeg = 0;
    var self = this;

    segments.forEach(function (seg, i) {
      var spanDeg = (seg.weight / totalWeight) * 360;
      segmentAngles.push({
        startDeg: cumDeg,
        endDeg: cumDeg + spanDeg,
        segment: seg,
        color: self.COLORS[i % self.COLORS.length],
      });
      cumDeg += spanDeg;
    });

    this._segmentAngles = segmentAngles;
    this._totalWeight = totalWeight;

    this._drawWheel(canvas, segmentAngles, theme);

    spinBtn.addEventListener("click", function () {
      self._spin();
    });

    canvas.addEventListener("transitionend", function () {
      self._onSpinEnd();
    });
  },

  _drawWheel: function (canvas, segmentAngles, theme) {
    var ctx = canvas.getContext("2d");
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;
    var r = cx - 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each segment
    segmentAngles.forEach(function (a) {
      var startRad = (a.startDeg - 90) * Math.PI / 180;
      var endRad = (a.endDeg - 90) * Math.PI / 180;

      // Fill segment
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startRad, endRad);
      ctx.closePath();
      ctx.fillStyle = a.color;
      ctx.fill();

      // Segment border
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw labels - text runs outward along each segment's radius
    segmentAngles.forEach(function (a) {
      var midDeg = (a.startDeg + a.endDeg) / 2;
      var midRad = (midDeg - 90) * Math.PI / 180;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(midRad);

      // Text always reads outward from center. For the bottom half,
      // we flip so it's not upside-down.
      var normDeg = ((midDeg % 360) + 360) % 360;

      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 3;
      ctx.textBaseline = "middle";

      var icon = theme.icons[a.segment.type] || "";
      var label = a.segment.label;

      if (normDeg > 90 && normDeg <= 270) {
        // Bottom half: flip text so it reads from rim inward
        ctx.rotate(Math.PI);
        ctx.textAlign = "left";
        ctx.font = "bold 20px 'Nunito', Arial, sans-serif";
        ctx.fillText(label, -r * 0.82, 0);
        ctx.shadowBlur = 0;
        ctx.font = "24px sans-serif";
        ctx.fillText(icon, -r * 0.45, 0);
      } else {
        // Top half: text reads from center outward
        ctx.textAlign = "left";
        ctx.font = "bold 20px 'Nunito', Arial, sans-serif";
        ctx.fillText(label, r * 0.45, 0);
        ctx.shadowBlur = 0;
        ctx.font = "24px sans-serif";
        ctx.fillText(icon, r * 0.82, 0);
      }

      ctx.restore();
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Inner decorative ring
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tick marks at segment boundaries
    segmentAngles.forEach(function (a) {
      var rad = (a.startDeg - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * (r - 18), cy + Math.sin(rad) * (r - 18));
      ctx.lineTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 3;
      ctx.stroke();
    });
  },

  _spin: function () {
    if (this._spinning) return;
    this._spinning = true;

    document.getElementById("btn-spin").disabled = true;

    // Pick outcome using weighted random
    var segments = Quiz.config.wheel.segments;
    var total = this._totalWeight;
    var rand = Math.random() * total;
    var cumulative = 0;
    var chosenIndex = 0;

    for (var i = 0; i < segments.length; i++) {
      cumulative += segments[i].weight;
      if (rand < cumulative) {
        chosenIndex = i;
        break;
      }
    }

    this._chosenSegment = segments[chosenIndex];

    // Calculate target rotation so chosen segment lands under pointer (top)
    var angle = this._segmentAngles[chosenIndex];
    var midDeg = (angle.startDeg + angle.endDeg) / 2;
    var segSpan = angle.endDeg - angle.startDeg;

    // Add randomness within the segment (avoid edges)
    var jitter = (Math.random() - 0.5) * segSpan * 0.6;

    // The pointer is at top (0deg). To land midDeg under the pointer,
    // we need totalRotation % 360 == 360 - midDeg (+ jitter)
    var targetMod = ((360 - midDeg + jitter) % 360 + 360) % 360;
    var currentMod = this._currentRotation % 360;
    var delta = targetMod - currentMod;
    if (delta < 0) delta += 360;

    // Add full spins for dramatic effect
    var fullSpins = 5 + Math.floor(Math.random() * 3);
    var totalRotation = this._currentRotation + fullSpins * 360 + delta;

    this._currentRotation = totalRotation;

    var canvas = document.getElementById("wheel-canvas");
    canvas.style.transform = "rotate(" + totalRotation + "deg)";
  },

  _onSpinEnd: function () {
    if (!this._spinning) return;
    this._spinning = false;

    document.getElementById("btn-spin").disabled = false;

    var seg = this._chosenSegment;
    var state = Quiz.state.load();
    var theme = Quiz.themes[state.themeId];
    var team = state.currentTeam;
    var icon = theme.icons[seg.type] || "";
    var label = theme.labels[seg.type] || seg.label;

    if (seg.type === "points") {
      state.scores[team] += seg.value;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome("+" + seg.value, icon, label, 1800);
      setTimeout(function () { Quiz.ui.nextTurn(state); }, 2000);
    } else if (seg.type === "jackpot") {
      state.scores[team] += seg.value;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome("JACKPOT! +" + seg.value, icon, label, 2500);
      setTimeout(function () { Quiz.ui.nextTurn(state); }, 2700);
    } else if (seg.type === "steal") {
      var other = team === 0 ? 1 : 0;
      var stealAmt = Math.min(seg.value, state.scores[other]);
      state.scores[other] -= stealAmt;
      state.scores[team] += stealAmt;
      Quiz.state.save(state);
      Quiz.ui.renderScores(state);
      Quiz.ui.showOutcome("Steal " + stealAmt + "!", icon, label, 1800);
      setTimeout(function () { Quiz.ui.nextTurn(state); }, 2000);
    } else if (seg.type === "loseTurn") {
      Quiz.ui.showOutcome("Lose Turn!", icon, label, 1800);
      setTimeout(function () { Quiz.ui.nextTurn(state); }, 2000);
    } else if (seg.type === "double") {
      var current = state.scores[team];
      if (current > 0) {
        Quiz.ui.showRiskDecision(current, theme, function (doubled) {
          state = Quiz.state.load();
          if (doubled) {
            var won = Math.random() < 0.5;
            if (won) {
              state.scores[team] *= 2;
              Quiz.state.save(state);
              Quiz.ui.renderScores(state);
              Quiz.ui.showOutcome("DOUBLED!", "\u{1F389}", "Score doubled!", 2000);
            } else {
              state.scores[team] = 0;
              Quiz.state.save(state);
              Quiz.ui.renderScores(state);
              Quiz.ui.showOutcome("BUST!", "\u{1F4A5}", "Lost everything!", 2000);
            }
            setTimeout(function () { Quiz.ui.nextTurn(state); }, 2200);
          } else {
            Quiz.ui.nextTurn(state);
          }
        });
      } else {
        Quiz.ui.showOutcome("Nothing to double!", icon, label, 1500);
        setTimeout(function () { Quiz.ui.nextTurn(state); }, 1700);
      }
    }
  },
};
