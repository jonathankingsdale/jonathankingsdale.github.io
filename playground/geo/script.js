google.charts.load("current", {
  packages: ["geochart"],
});
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

  let arr = [["Country", "Popularity"]];
  for (const country in jsonData) {
    const value = jsonData[country];
    arr.push([country, value]);
  }

  const data = google.visualization.arrayToDataTable(arr);

  // const regionToCodeMap = {
  //   Africa: "002",
  //   "Northern Africa": "015",
  //   "Western Africa": "011",
  //   "Middle Africa": "017",
  //   "Eastern Africa": "014",
  //   "Southern Africa": "018",
  //   Europe: "150",
  //   "Northern Europe": "154",
  //   "Western Europe": "155",
  //   "Eastern Europe": "151",
  //   "Southern Europe": "039",
  //   Americas: "019",
  //   "Northern America": "021",
  //   Caribbean: "029",
  //   "Central America": "013",
  //   "South America": "005",
  //   Asia: "142",
  //   "Central Asia": "143",
  //   "Eastern Asia": "030",
  //   "Southern Asia": "034",
  //   "South-Eastern Asia": "035",
  //   "Western Asia": "145",
  //   Oceania: "009",
  //   "Australia and New Zealand": "053",
  //   Melanesia: "054",
  //   Micronesia: "057",
  //   Polynesia: "061",
  // };

  const options = {};

  const chart = new google.visualization.GeoChart(
    document.getElementById("chart_div")
  );

  chart.draw(data, options);
}
