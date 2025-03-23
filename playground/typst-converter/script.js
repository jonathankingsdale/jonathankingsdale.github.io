// Function to convert text to Typst format
function convertToTypst(text) {
  let output = `#import "@preview/droplet:0.3.1": dropcap\n#import "../utils.typ"\n\n`;
  output += `#let number = 1\n#let header = ""\n#let author = ""\n#let year = ""\n\n`;
  output += `#utils.header(number, header)\n\n`;

  let converted = generateHymn(text);

  output += converted;
  output += "\n\n#utils.footer(author, year)";

  output = output
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("`", '"')
    .replaceAll("—", "-");

  return output;
}

function generateHymn(input) {
  const verses = input.trim().split(/\n\s*\n/);

  return verses
    .map((verse, verseIndex) => {
      const lines = verse.split("\n").map((line) => line.trim());

      const otherLines = lines.slice(1).map((line, lineIndex) => {
        if (lineIndex % 2 === 0) {
          return `  \\ #h(0.5em) ${line}\n`;
        } else {
          return `  \\ ${line}\n`;
        }
      });

      if (verseIndex === 0) {
        return `#dropcap(gap: -2pt)[\n  #strong[${lines[0]}]\n${otherLines.join(
          ""
        )}]`;
      }
      return `#utils.verse(\n  "${verseIndex + 1}",\n  [\n    ${
        lines[0]
      }\n${otherLines.map((line) => "  " + line).join("")}  ],\n)`;
    })
    .join("\n\n");
}

// Function to generate filename from first line
function generateFilename(text) {
  const firstLine = text.split("\n")[0];
  return (
    firstLine
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .trim()
      .replace(/\s+/g, "-") + // Replace spaces with hyphens
    ".typ"
  );
}

// Function to download text as a file
function downloadAsFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Get DOM elements
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const convertBtn = document.getElementById("convertBtn");
const downloadBtn = document.getElementById("downloadBtn");

// Convert button click handler
convertBtn.addEventListener("click", () => {
  const text = inputText.value;
  const converted = convertToTypst(text);
  outputText.value = converted;
});

// Download button click handler
downloadBtn.addEventListener("click", () => {
  const text = outputText.value;
  const filename = generateFilename(inputText.value);
  downloadAsFile(text, filename);
});
