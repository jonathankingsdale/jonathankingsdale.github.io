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

  auctionHouse: {
    totalRounds: 5,
    startingBank: 500,
    items: [
      { type: "treasure", value: 300, count: 2 },
      { type: "cursed", value: -200, count: 1 },
      { type: "steal", value: 150, count: 1 },
      { type: "jackpot", value: 500, count: 1 },
    ],
    bidIncrement: 25,
    minBid: 25,
  },

  bombDefusal: {
    wireCount: 7,
    outcomes: [
      { type: "points", value: 100, count: 2 },
      { type: "points", value: 200, count: 1 },
      { type: "bonus", value: 0, count: 2 },
      { type: "boom", value: -200, count: 2 },
    ],
    wireColors: ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22"],
  },

  treasureMap: {
    maxDepth: 4,
    maxTurns: 6,
    outcomes: [
      { type: "reward", value: 100, weight: 5 },
      { type: "reward", value: 150, weight: 3 },
      { type: "reward", value: 200, weight: 2 },
      { type: "hazard", value: -100, weight: 3 },
      { type: "deadEnd", value: 0, weight: 3 },
      { type: "treasure", value: 500, weight: 1 },
    ],
  },

  tugOfWar: {
    totalRounds: 3,
    winThreshold: 5,
    roundRewards: [200, 300, 500],
    pulls: [
      { type: "normal", min: 1, max: 3, chance: 0.7 },
      { type: "superPull", value: 5, chance: 0.1 },
      { type: "slip", value: -1, chance: 0.1 },
      { type: "anchor", value: 0, chance: 0.1 },
    ],
  },

  teams: {
    names: ["Team 1", "Team 2"],
    colors: ["#e74c3c", "#3498db"],
  },
};
