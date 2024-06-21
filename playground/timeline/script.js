google.charts.load("current", { packages: ["timeline"] });
google.charts.setOnLoadCallback(initialize);

function initialize() {
  document.getElementById("jsonInput").addEventListener("input", drawChart);

  drawChart();
}

function drawChart() {
  const jsonInput = document.getElementById("jsonInput").value;

  let jsonData;
  try {
    jsonData = JSON.parse(jsonInput);
  } catch (e) {
    console.error("Failed to parse JSON.");
    return;
  }

  const dataTable = new google.visualization.DataTable();
  dataTable.addColumn({ type: "string", id: "Position" });
  dataTable.addColumn({ type: "string", id: "Name" });
  dataTable.addColumn({ type: "date", id: "Start" });
  dataTable.addColumn({ type: "date", id: "End" });

  const rows = jsonData.map((task) => {
    return [
      task.resource,
      task.task_name,
      new Date(task.start_time),
      new Date(task.end_time),
    ];
  });

  dataTable.addRows(rows);

  const chart = new google.visualization.Timeline(
    document.getElementById("chart_div")
  );
  chart.draw(dataTable);
}
