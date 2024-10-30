const output = document.getElementById("output");
const showErrorsCheckbox = document.getElementById("showErrors");

const editor = CodeMirror.fromTextArea(document.getElementById("codeInput"), {
  lineNumbers: true,
  mode: "javascript",
  theme: "monokai",
  autoCloseBrackets: true,
});

const onChange = () => {
  try {
    const code = editor.getValue().trim();
    const lines = code.split("\n");
    const lastLine = lines.pop();
    const wrappedCode = [...lines, `return ${lastLine}`].join("\n");
    output.textContent = new Function(wrappedCode)();
  } catch (e) {
    output.textContent = showErrorsCheckbox.checked
      ? "Error: " + e.message
      : "";
  }
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
