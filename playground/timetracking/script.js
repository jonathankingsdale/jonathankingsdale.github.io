const LOGGING_ENABLED = false;

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const switchButton = document.getElementById("switchButton");
  const clearButton = document.getElementById("clearButton");
  const timeTable = document
    .getElementById("timeTable")
    .getElementsByTagName("tbody")[0];

  loadTableData();
  let hasStarted = getHasStarted();
  updateButtonStates();

  function getCurrentDateTime() {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const dayOfWeek = now.toLocaleString("en-US", { weekday: "long" });
    const time = now.toLocaleTimeString("en-US", { hour12: false });
    return { date, dayOfWeek, time };
  }

  function startTimer() {
    hasStarted = true;
    const { date, dayOfWeek, time } = getCurrentDateTime();
    const newRow = timeTable.insertRow();
    newRow.insertCell(0).textContent = date;
    newRow.insertCell(1).textContent = dayOfWeek;
    newRow.insertCell(2).textContent = time;
    newRow.insertCell(3).textContent = "";
    newRow.insertCell(4).textContent = "";
    newRow.insertCell(5).textContent = "";
    makeCellsEditable(newRow);
    saveTableData();
  }

  function getHasStarted() {
    if (LOGGING_ENABLED) {
      console.log(`TimeTable has ${timeTable.rows.length} rows.`);
    }

    if (timeTable.rows.length === 0) {
      return false;
    }

    const lastRow = timeTable.rows[timeTable.rows.length - 1];
    return lastRow.cells[3].textContent === "";
  }

  function endTimer(endTime) {
    const lastRow = timeTable.rows[timeTable.rows.length - 1];
    lastRow.cells[3].textContent = endTime;
    hasStarted = false;
    saveTableData();
  }

  function makeCellsEditable(row) {
    for (let i = 0; i < row.cells.length; i++) {
      row.cells[i].contentEditable = true;
    }
  }

  startButton.addEventListener("click", () => {
    if (!hasStarted) {
      startTimer();
      updateButtonStates();
    }
  });

  stopButton.addEventListener("click", () => {
    if (hasStarted) {
      const { time } = getCurrentDateTime();
      endTimer(time);
      updateButtonStates();
    }
  });

  switchButton.addEventListener("click", () => {
    if (hasStarted) {
      const { time } = getCurrentDateTime();
      endTimer(time);
      startTimer();
      updateButtonStates();
    }
  });

  clearButton.addEventListener("click", clearTable);

  function saveTableData() {
    localStorage.setItem("timeTable", JSON.stringify(getTableData()));
  }

  function clearTable() {
    hasStarted = false;
    while (timeTable.rows.length > 0) {
      timeTable.deleteRow(0);
    }
    localStorage.removeItem("timeTable");
    updateButtonStates();
  }

  function loadTableData() {
    const storedData = localStorage.getItem("timeTable");
    if (storedData) {
      if (LOGGING_ENABLED) console.log("Loading table from storage...");

      const tableData = JSON.parse(storedData);
      tableData.forEach((row) => {
        const newRow = timeTable.insertRow();
        newRow.insertCell(0).textContent = row.date;
        newRow.insertCell(1).textContent = row.dayOfWeek;
        newRow.insertCell(2).textContent = row.startTime;
        newRow.insertCell(3).textContent = row.endTime;
        newRow.insertCell(4).textContent = row.category;
        newRow.insertCell(5).textContent = row.note;
        makeCellsEditable(newRow);
      });
    } else {
      if (LOGGING_ENABLED) console.log("No table found in storage.");
    }
  }

  function getTableData() {
    const tableData = [];
    for (let i = 0; i < timeTable.rows.length; i++) {
      const cells = timeTable.rows[i].cells;
      const row = {
        date: cells[0].textContent,
        dayOfWeek: cells[1].textContent,
        startTime: cells[2].textContent,
        endTime: cells[3].textContent,
        category: cells[4].textContent,
        note: cells[5].textContent,
      };
      tableData.push(row);
    }
    return tableData;
  }

  function updateButtonStates() {
    startButton.disabled = hasStarted;
    stopButton.disabled = !hasStarted;
    switchButton.disabled = !hasStarted;
    clearButton.disabled = timeTable.rows.length === 0;
  }

  // Save table data whenever content is edited
  timeTable.addEventListener("input", saveTableData);
});
