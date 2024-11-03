let chatMessages = document.getElementById("chat-messages");
let optionsContainer = document.getElementById("options-container");
let decisionTree = {};
let navigationStack = [];
let currentNodeKey = "start";

async function loadDecisionTree() {
  try {
    const response = await fetch("decisionTree.json");
    if (!response.ok) {
      throw new Error(`Failed to load JSON: ${response.statusText}`);
    }
    decisionTree = await response.json();
    startConversation();
  } catch (error) {
    console.error("Error loading decision tree:", error);
  }
}

function addMessage(text, isUser = false) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "bot"}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = text;

  messageDiv.appendChild(bubble);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function createButton(option) {
  const button = document.createElement("button");
  button.className = "option-button";
  button.textContent = option.text;
  button.addEventListener("click", () => handleOption(option));
  return button;
}

function showOptions(options) {
  optionsContainer.innerHTML = "";
  options.forEach((option) => {
    const button = createButton(option);
    optionsContainer.appendChild(button);
  });

  if (navigationStack.length > 0) {
    const backButton = createButton({ text: "↩️ Back", next: null });
    optionsContainer.appendChild(backButton);
  }
}

function handleOption(option) {
  addMessage(option.text, true);

  // Back button
  if (option.next === null) {
    const previousNodeKey = navigationStack.pop();
    if (previousNodeKey) {
      currentNodeKey = previousNodeKey;
      const previousNode = decisionTree[currentNodeKey];
      setTimeout(() => {
        addMessage(previousNode.question);
        showOptions(previousNode.options);
      }, 500);
    }
    return;
  }

  if (!decisionTree[option.next]) {
    console.error("Invalid option or next node not found.");
    return;
  }

  navigationStack.push(currentNodeKey);
  if (option.next === "end" && option.next !== "start") {
    setTimeout(() => {
      addMessage("Excellent choice! 😋");
      setTimeout(() => {
        const endNode = decisionTree.end;
        addMessage(endNode.question);
        showOptions(endNode.options);
      }, 1000);
    }, 500);
  } else {
    // Clear the history after a restart so you can't keep going back.
    if (option.next === "start") {
      navigationStack.length = 0;
    }

    currentNodeKey = option.next;
    const nextNode = decisionTree[currentNodeKey];
    setTimeout(() => {
      addMessage(nextNode.question);
      showOptions(nextNode.options);
    }, 500);
  }
}

function startConversation() {
  addMessage(decisionTree.start.question);
  showOptions(decisionTree.start.options);
}

// Load the decision tree and start the conversation
loadDecisionTree();
