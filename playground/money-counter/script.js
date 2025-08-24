// Money Counter App Logic

document.addEventListener("DOMContentLoaded", () => {
  // Denomination group definitions
  const denominations = [
    { key: "50", label: "£50 notes", value: 50, type: "note" },
    { key: "20", label: "£20 notes", value: 20, type: "note" },
    { key: "10", label: "£10 notes", value: 10, type: "note" },
    { key: "5", label: "£5 notes", value: 5, type: "note" },
    { key: "1note", label: "£1 notes", value: 1, type: "note" },
    { key: "2coin", label: "£2 coins", value: 2, type: "coin" },
    { key: "1coin", label: "£1 coins", value: 1, type: "coin" },
    { key: "50p", label: "50p coins", value: 0.5, type: "coin" },
    { key: "10p", label: "10p coins", value: 0.1, type: "coin" },
    { key: "5p", label: "5p coins", value: 0.05, type: "coin" },
    { key: "2p", label: "2p coins", value: 0.02, type: "coin" },
    { key: "1p", label: "1p coins", value: 0.01, type: "coin" },
  ];

  // Emoji for each type
  const typeEmojis = {
    note: "💷",
    coin: "🪙",
  };

  // Render denomination input rows
  const denomContainer = document.getElementById("denominations");
  denominations.forEach((denom) => {
    const row = document.createElement("div");
    row.className = "denom-row";
    row.innerHTML = `
      <span class="denom-label">${typeEmojis[denom.type] || ""} ${
      denom.label
    }</span>
      <div class="denom-controls">
        <button type="button" class="denom-btn" data-action="minus" data-key="${
          denom.key
        }">-</button>
        <input type="number" min="0" step="1" class="denom-input" id="input-${
          denom.key
        }" value="0" data-key="${
      denom.key
    }" inputmode="numeric" pattern="[0-9]*">
        <button type="button" class="denom-btn" data-action="plus" data-key="${
          denom.key
        }">+</button>
      </div>
    `;
    denomContainer.appendChild(row);
  });

  // State: counts for each denomination
  const counts = {};
  denominations.forEach((d) => (counts[d.key] = 0));

  // Event handlers for plus/minus buttons and manual input
  denomContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("denom-btn")) {
      const key = e.target.dataset.key;
      const input = document.getElementById("input-" + key);
      let val = parseInt(input.value, 10) || 0;
      if (e.target.dataset.action === "plus") val++;
      if (e.target.dataset.action === "minus" && val > 0) val--;
      input.value = val;
      counts[key] = val;
      updateTotals();
    }
  });
  denomContainer.addEventListener("input", (e) => {
    if (e.target.classList.contains("denom-input")) {
      const key = e.target.dataset.key;
      let val = parseInt(e.target.value, 10) || 0;
      counts[key] = val;
      updateTotals();
    }
  });

  // Calculation and rendering of totals
  function updateTotals() {
    let total = 0;
    const tbody = document.getElementById("totals-body");
    tbody.innerHTML = "";
    // Grouped totals for display
    const groups = [
      { label: "£50 notes", keys: ["50"] },
      { label: "£20 notes", keys: ["20"] },
      { label: "£10 notes", keys: ["10"] },
      { label: "£5 notes", keys: ["5"] },
      { label: "£1 notes", keys: ["1note"] },
      { label: "£1 & £2 coins", keys: ["2coin", "1coin"] },
      { label: "50p coins", keys: ["50p"] },
      { label: "10p & 5p coins", keys: ["10p", "5p"] },
      { label: "2p & 1p coins", keys: ["2p", "1p"] },
    ];
    groups.forEach((group) => {
      let groupTotal = 0;
      group.keys.forEach((key) => {
        const denom = denominations.find((d) => d.key === key);
        groupTotal += (counts[key] || 0) * denom.value;
      });
      tbody.innerHTML += `<tr><td>${group.label}</td><td>£${groupTotal.toFixed(
        2
      )}</td></tr>`;
      total += groupTotal;
    });
    document.getElementById("grand-total").textContent = "£" + total.toFixed(2);
  }

  updateTotals();
});
