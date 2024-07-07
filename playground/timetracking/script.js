"use strict";

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
    addNewRow(date, dayOfWeek, time, "", "", "");
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

  clearButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear the table?")) {
      clearTable();
    }
  });

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
        addNewRow(
          row.date,
          row.dayOfWeek,
          row.startTime,
          row.endTime,
          row.category,
          row.note
        );
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

  function addNewRow(date, dayOfWeek, startTime, endTime, category, note) {
    const newRow = timeTable.insertRow();

    const dateCell = newRow.insertCell(0);
    dateCell.textContent = date;
    dateCell.contentEditable = true;

    const dayOfWeekCell = newRow.insertCell(1);
    dayOfWeekCell.textContent = dayOfWeek;
    dayOfWeekCell.contentEditable = true;

    const startCell = newRow.insertCell(2);
    startCell.textContent = startTime;
    startCell.contentEditable = true;

    const endCell = newRow.insertCell(3);
    endCell.textContent = endTime;
    endCell.contentEditable = true;

    const categoryCell = newRow.insertCell(4);
    categoryCell.textContent = endTime;
    categoryCell.contentEditable = true;

    const noteCell = newRow.insertCell(5);
    noteCell.textContent = note;
    noteCell.contentEditable = true;
  }

  // Save table data whenever content is edited
  timeTable.addEventListener("input", saveTableData);
});
