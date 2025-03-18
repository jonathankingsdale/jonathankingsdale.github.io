// Function to convert text to Typst format
function convertToTypst(text) {
  const lines = text.split("\n");
  let output = `#import "@preview/droplet:0.3.1": dropcap\n#import "../utils.typ"\n\n`;
  output += `#let number = 1\n#let header = "N/A"\n#let author = "N/A"\n#let year = "N/A"\n\n`;
  output += `#utils.header(number, header)\n\n`;
  output += `#set align(left)\n#dropcap(gap: -2pt)[\n`;

  // Process each line
  let formattedLines = lines.map((line) => line.trim()).filter((line) => line); // Remove empty lines and trim

  // Add verse numbers and format lines
  let processedLines = [];
  for (let i = 0; i < formattedLines.length; i += 4) {
    if (i === 0) {
      // First verse, first line gets special formatting
      processedLines.push(`  #strong[${formattedLines[i]}]`);
      // Remaining lines of first verse
      for (let j = 1; j < 4 && i + j < formattedLines.length; j++) {
        if (j % 2 === 0) {
          processedLines.push(`  \\ ${formattedLines[i + j]}`);
        } else {
          processedLines.push(`  \\ #h(0.5em) ${formattedLines[i + j]}`);
        }
      }
    } else {
      // Other verses
      processedLines.push(`  \\ ${Math.floor(i / 4) + 1} ${formattedLines[i]}`);
      // Remaining lines of the verse
      for (let j = 1; j < 4 && i + j < formattedLines.length; j++) {
        if (j % 2 === 0) {
          processedLines.push(`  \\ ${formattedLines[i + j]}`);
        } else {
          processedLines.push(`  \\ #h(0.5em) ${formattedLines[i + j]}`);
        }
      }
    }
    // Add blank line between verses
    processedLines.push("  \\");
  }

  // Remove the last empty line if it exists
  if (processedLines[processedLines.length - 1] === "  \\") {
    processedLines.pop();
  }

  output += processedLines.join("\n");
  output += "\n]\n\n#utils.footer(author, year)";

  output = output.replaceAll("’", "'");

  return output;
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
