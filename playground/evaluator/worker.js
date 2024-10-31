self.onmessage = function (event) {
  const { code } = event.data;

  try {
    const lines = code.split("\n");
    const lastLine = lines.pop();
    const wrappedCode = [...lines, `return ${lastLine}`].join("\n");
    const result = new Function(wrappedCode)();

    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
