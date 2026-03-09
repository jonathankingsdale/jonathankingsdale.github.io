window.Quiz = window.Quiz || {};

Quiz.config = {
  tileBoard: {
    rows: 5,
    cols: 5,
    outcomes: [
      { type: "points", value: 100, count: 8 },
      { type: "points", value: 200, count: 5 },
      { type: "points", value: 300, count: 3 },
      { type: "negative", value: -100, count: 3 },
      { type: "steal", value: 100, count: 2 },
      { type: "bonusTurn", value: 0, count: 2 },
      { type: "jackpot", value: 500, count: 2 },
    ],
  },

  riskLadder: {
    steps: [
      { reward: 50 },
      { reward: 100 },
      { reward: 200 },
      { reward: 300 },
      { reward: 500 },
    ],
    trapCount: 1,
  },

  wheel: {
    segments: [
      { type: "points", value: 100, label: "+100", weight: 6 },
      { type: "points", value: 300, label: "+300", weight: 3 },
      { type: "steal", value: 100, label: "Steal", weight: 2 },
      { type: "loseTurn", value: 0, label: "Lose Turn", weight: 2 },
      { type: "double", value: 0, label: "Double", weight: 2 },
      { type: "jackpot", value: 500, label: "Jackpot", weight: 1 },
    ],
  },

  teams: {
    names: ["Team 1", "Team 2"],
    colors: ["#e74c3c", "#3498db"],
  },
};
