"use strict";

const LOGGING_ENABLED = false;

const categoryOptions = {
  mainWork: "Main Work",
  meeting: "Meeting",
  admin: "Admin",
  automation: "Automation",
};

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("startButton");
  const stopButton = document.getElementById("stopButton");
  const switchButton = document.getElementById("switchButton");
  const clearButton = document.getElementById("clearButton");
  const openChartButton = document.getElementById("chartButton");
  const downloadButton = document.getElementById("downloadButton");
  const triggerUploadButton = document.getElementById("triggerUploadButton");
  const uploadButton = document.getElementById("uploadButton");

  const timeTable = document
    .getElementById("timeTable")
    .getElementsByTagName("tbody")[0];

  const chartModal = document.getElementById("chartModal");
  const modalCloseButton = document.getElementsByClassName("modalClose")[0];

  loadTableData();
  let hasStarted = getHasStarted();
  updateButtonStates();
  updateTotalTimeWorked();

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
    updateDuration(lastRow);
    hasStarted = false;
    saveTableData();
  }

  startButton.addEventListener("click", () => {
    if (!hasStarted) {
      startTimer();
      updateButtonStates();
      updateTotalTimeWorked();
    }
  });

  stopButton.addEventListener("click", () => {
    if (hasStarted) {
      const { time } = getCurrentDateTime();
      endTimer(time);
      updateButtonStates();
      updateTotalTimeWorked();
    }
  });

  switchButton.addEventListener("click", () => {
    if (hasStarted) {
      const { time } = getCurrentDateTime();
      endTimer(time);
      startTimer();
      updateButtonStates();
      updateTotalTimeWorked();
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
    updateTotalTimeWorked();
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
    return Array.from(timeTable.rows).map((row) => {
      const cells = row.cells;
      return {
        date: cells[0].textContent,
        dayOfWeek: cells[1].textContent,
        startTime: cells[2].textContent,
        endTime: cells[3].textContent,
        category: cells[5].getElementsByTagName("select")[0].value,
        note: cells[6].textContent,
      };
    });
  }

  function updateButtonStates() {
    startButton.disabled = hasStarted;
    stopButton.disabled = !hasStarted;
    switchButton.disabled = !hasStarted;

    const isEmpty = timeTable.rows.length == 0;

    clearButton.disabled = isEmpty;
    openChartButton.disabled = isEmpty;
    downloadButton.disabled = isEmpty;
  }

  function addNewRow(date, dayOfWeek, startTime, endTime, category, note) {
    const newRow = timeTable.insertRow();

    const dateCell = newRow.insertCell(0);
    dateCell.textContent = date;

    const dayOfWeekCell = newRow.insertCell(1);
    dayOfWeekCell.textContent = dayOfWeek;

    const startCell = newRow.insertCell(2);
    startCell.textContent = startTime;
    startCell.contentEditable = true;
    startCell.addEventListener("input", () => updateDuration(newRow));

    const endCell = newRow.insertCell(3);
    endCell.textContent = endTime;
    endCell.contentEditable = true;
    endCell.addEventListener("input", () => updateDuration(newRow));

    const durationCell = newRow.insertCell(4);
    durationCell.textContent = calculateDuration(startTime, endTime, date);

    const categoryCell = newRow.insertCell(5);
    categoryCell.appendChild(createCategoryDropdown(category));

    const noteCell = newRow.insertCell(6);
    noteCell.textContent = note;
    noteCell.contentEditable = true;
  }

  function msToHHMMSS(ms) {
    return new Date(ms).toISOString().slice(11, 19); // HH:MM:SS
  }

  function calculateDuration(startTime, endTime, date) {
    const start = Date.parse(`${date}T${startTime}`);
    const end = Date.parse(`${date}T${endTime}`);

    if (isNaN(start) || isNaN(end)) return "";

    return msToHHMMSS(end - start);
  }

  function updateDuration(row) {
    const date = row.cells[0].textContent;
    const startTime = row.cells[2].textContent;
    const endTime = row.cells[3].textContent;
    row.cells[4].textContent = calculateDuration(startTime, endTime, date);
    saveTableData();
  }

  function createCategoryDropdown(selectedValue) {
    const select = document.createElement("select");

    Object.entries(categoryOptions).forEach(([value, text]) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = text;
      if (value === selectedValue) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    return select;
  }

  function calculateCategoryTotals() {
    const categoryTotals = {};

    getTableData().forEach((row) => {
      const start = Date.parse(`${row.date}T${row.startTime}`);
      const end = Date.parse(`${row.date}T${row.endTime}`);
      const category = categoryOptions[row.category];

      if (!isNaN(start) && !isNaN(end)) {
        const timeSpent = (end - start) / 3_600_000;

        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += timeSpent;
      }
    });

    return categoryTotals;
  }

  function calculateDayTotals() {
    const dayTotals = {};

    getTableData().forEach((row) => {
      const start = Date.parse(`${row.date}T${row.startTime}`);
      const end = Date.parse(`${row.date}T${row.endTime}`);

      if (!isNaN(start) && !isNaN(end)) {
        const timeSpent = end - start;

        if (!dayTotals[row.dayOfWeek]) {
          dayTotals[row.dayOfWeek] = 0;
        }
        dayTotals[row.dayOfWeek] += timeSpent;
      }
    });

    return dayTotals;
  }

  function updateTotalTimeWorked() {
    const totals = calculateDayTotals();
    const totalTimeList = document.getElementById("totalTimeList");
    totalTimeList.innerHTML = ""; // Clear the list

    Object.entries(totals).forEach(([day, total]) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${day}: ${msToHHMMSS(total)}`;
      totalTimeList.appendChild(listItem);
    });
  }

  openChartButton.addEventListener("click", () => {
    chartModal.style.display = "block";
    drawChart();
  });

  modalCloseButton.addEventListener("click", () => {
    chartModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target == chartModal) {
      chartModal.style.display = "none";
    }
  });

  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(drawChart);

  function drawChart() {
    let data = new google.visualization.DataTable();
    data.addColumn("string", "Category");
    data.addColumn("number", "Total Hours");
    data.addRows(
      Object.entries(calculateCategoryTotals()).map(
        ([category, totalHours]) => [category, totalHours]
      )
    );

    const chart = new google.visualization.PieChart(
      document.getElementById("piechart")
    );

    const options = {
      pieHole: 0.4,
    };
    chart.draw(data, options);
  }

  // Save table data whenever content is edited
  timeTable.addEventListener("input", () => {
    saveTableData();
    hasStarted = getHasStarted();
    updateButtonStates();
    updateTotalTimeWorked();
  });

  downloadButton.addEventListener("click", () => {
    const data = JSON.stringify(getTableData(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timesheet.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  uploadButton.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target.result;
        const data = JSON.parse(contents);
        clearTable();
        data.forEach((row) => {
          addNewRow(
            row.date,
            row.dayOfWeek,
            row.startTime,
            row.endTime,
            row.category,
            row.note
          );
        });
        uploadButton.value = null;
        saveTableData();
        hasStarted = getHasStarted();
        updateButtonStates();
        updateTotalTimeWorked();
      };
      reader.readAsText(file);
    }
  });

  triggerUploadButton.addEventListener("click", () => {
    uploadButton.click();
  });
});
