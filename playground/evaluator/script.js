const output = document.getElementById("output");
const showErrorsCheckbox = document.getElementById("showErrors");

const editor = CodeMirror.fromTextArea(document.getElementById("codeInput"), {
  lineNumbers: true,
  mode: "javascript",
  theme: "monokai",
  autoCloseBrackets: true,
});

const onChange = async () => {
  const code = editor.getValue().trim();
  localStorage.setItem("savedCode", code);

  // Create a new worker
  const worker = new Worker("worker.js");
  const showErrors = showErrorsCheckbox.checked;

  // Set up a timeout to terminate the worker if it takes too long.
  const timeoutId = setTimeout(() => {
    worker.terminate();
    output.textContent = showErrors ? "Execution timed out" : "";
  }, 3000); // 3 seconds

  // Handle messages from the worker
  worker.onmessage = (event) => {
    clearTimeout(timeoutId); // Clear timeout on successful completion

    const { result, error } = event.data;
    if (error && showErrors) {
      output.textContent = "Error: " + error;
    } else if (result !== undefined) {
      output.textContent = result;
    }
  };

  // Start the worker with the user's code
  worker.postMessage({ code });
};

// Listen for changes in CodeMirror editor
editor.on("change", onChange);
showErrorsCheckbox.addEventListener("change", onChange);

// Load code from URL parameter or local storage on page load
window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get("code");
  const savedCode = localStorage.getItem("savedCode");

  if (codeFromUrl) {
    try {
      // Decode from Base64 and set in editor
      const decodedCode = atob(codeFromUrl);
      editor.setValue(decodedCode);

      // Optionally save to local storage for persistence
      localStorage.setItem("savedCode", decodedCode);
    } catch (e) {
      console.error("Failed to decode code from URL:", e);
      output.textContent = "Error: Invalid code in URL";
    }
  } else if (savedCode) {
    // Load saved code from local storage if no URL code is present
    editor.setValue(savedCode);
  }
};

// Function to format code
function formatCode() {
  const unformattedCode = editor.getValue();
  try {
    const formattedCode = prettier.format(unformattedCode, {
      parser: "babel",
      plugins: prettierPlugins,
    });
    editor.setValue(formattedCode);
  } catch (e) {
    console.error("Formatting error:", e);
    output.textContent = "Error: Could not format code.";
  }
}

function generateShareableLink() {
  const code = editor.getValue();
  const encodedCode = btoa(code); // Base64 encode the code
  const shareableUrl = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;

  // Copy the URL to the clipboard
  navigator.clipboard
    .writeText(shareableUrl)
    .then(() => {
      alert("Shareable URL copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy URL:", err);
      alert("Failed to copy URL. Please try again.");
    });
}
