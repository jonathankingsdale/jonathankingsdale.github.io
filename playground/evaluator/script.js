const output = document.getElementById("output");
const showErrorsCheckbox = document.getElementById("showErrors");

const editor = CodeMirror.fromTextArea(document.getElementById("codeInput"), {
  lineNumbers: true,
  mode: "javascript",
  theme: "monokai",
  autoCloseBrackets: true,
});

const onChange = async () => {
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
  worker.postMessage({ code: editor.getValue().trim() });
};

// Listen for changes in CodeMirror editor
editor.on("change", onChange);
showErrorsCheckbox.addEventListener("change", onChange);

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
