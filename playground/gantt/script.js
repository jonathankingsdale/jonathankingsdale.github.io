google.charts.load("current", { packages: ["gantt"] });
google.charts.setOnLoadCallback(initialize);

function initialize() {
  document.getElementById("jsonInput").addEventListener("input", drawChart);

  drawChart();
}

function drawChart() {
  var jsonInput = document.getElementById("jsonInput").value;

  try {
    var jsonData = JSON.parse(jsonInput);
  } catch (e) {
    console.error("Failed to parse JSON.");
    return;
  }

  var data = new google.visualization.DataTable();
  data.addColumn("string", "Task ID");
  data.addColumn("string", "Task Name");
  data.addColumn("string", "Resource");
  data.addColumn("date", "Start Date");
  data.addColumn("date", "End Date");
  data.addColumn("number", "Duration");
  data.addColumn("number", "Percent Complete");
  data.addColumn("string", "Dependencies");

  var rows = jsonData.map((task) => {
    return [
      task.task_id,
      task.task_name,
      task.resource,
      new Date(task.start_time),
      new Date(task.end_time),
      null,
      100,
      null,
    ];
  });

  data.addRows(rows);

  var options = {
    height: 400,
    gantt: {
      criticalPathEnabled: false,
      trackHeight: 30,
    },
  };

  var chart = new google.visualization.Gantt(
    document.getElementById("chart_div")
  );

  chart.draw(data, options);
}
