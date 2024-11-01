const decisionTree = {
  start: {
    question:
      "Hi! I'll help you decide what to have for dinner. First, how hungry are you?",
    options: [
      { text: "Very hungry!", next: "very_hungry" },
      { text: "Moderately hungry", next: "moderate_hungry" },
      { text: "Just a little", next: "light_hungry" },
    ],
  },
  very_hungry: {
    question: "Great! Do you prefer something hearty or healthy?",
    options: [
      { text: "Hearty", next: "hearty" },
      { text: "Healthy", next: "healthy" },
      { text: "Bit of both", next: "balanced" },
    ],
  },
  moderate_hungry: {
    question: "Would you like something hot or cold?",
    options: [
      { text: "Hot meal", next: "hot_meal" },
      { text: "Cold meal", next: "cold_meal" },
    ],
  },
  light_hungry: {
    question: "Would you prefer something savory or sweet?",
    options: [
      { text: "Savory", next: "light_savory" },
      { text: "Sweet", next: "light_sweet" },
    ],
  },
  hearty: {
    question: "Here are some hearty dinner suggestions:",
    options: [
      { text: "Burger and fries 🍔", next: "end" },
      { text: "Pizza 🍕", next: "end" },
      { text: "Steak and potatoes 🥩", next: "end" },
    ],
  },
  healthy: {
    question: "Here are some healthy dinner suggestions:",
    options: [
      { text: "Grilled salmon with vegetables 🐟", next: "end" },
      { text: "Quinoa Buddha bowl 🥗", next: "end" },
      { text: "Chicken and vegetable stir-fry 🥢", next: "end" },
    ],
  },
  balanced: {
    question: "Here are some balanced dinner suggestions:",
    options: [
      { text: "Grilled chicken with sweet potato 🍗", next: "end" },
      { text: "Turkey wrap with avocado 🥑", next: "end" },
      { text: "Homemade rice bowl 🍚", next: "end" },
    ],
  },
  hot_meal: {
    question: "Here are some hot meal suggestions:",
    options: [
      { text: "Pasta with tomato sauce 🍝", next: "end" },
      { text: "Soup and sandwich 🥣", next: "end" },
      { text: "Rice and curry 🍛", next: "end" },
    ],
  },
  cold_meal: {
    question: "Here are some cold meal suggestions:",
    options: [
      { text: "Chicken Caesar salad 🥗", next: "end" },
      { text: "Sandwich platter 🥪", next: "end" },
      { text: "Cold noodle bowl 🥡", next: "end" },
    ],
  },
  light_savory: {
    question: "Here are some light savory suggestions:",
    options: [
      { text: "Caprese salad 🍅", next: "end" },
      { text: "Small quiche 🥧", next: "end" },
      { text: "Hummus with pita 🫓", next: "end" },
    ],
  },
  light_sweet: {
    question: "Here are some light sweet suggestions:",
    options: [
      { text: "Fruit and yogurt parfait 🍓", next: "end" },
      { text: "Smoothie bowl 🥝", next: "end" },
      { text: "Toast with honey and banana 🍯", next: "end" },
    ],
  },
  end: {
    question: "Enjoy your meal! Would you like to start over?",
    options: [{ text: "Start over", next: "start" }],
  },
};

let chatMessages = document.getElementById("chat-messages");
let optionsContainer = document.getElementById("options-container");

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

function showOptions(options) {
  optionsContainer.innerHTML = "";
  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.textContent = option.text;
    button.addEventListener("click", () => handleOption(option));
    optionsContainer.appendChild(button);
  });
}

function handleOption(option) {
  addMessage(option.text, true);

  if (option.next === "end" && option.text !== "Start over") {
    setTimeout(() => {
      addMessage("Excellent choice! 😋");
      setTimeout(() => {
        const endNode = decisionTree.end;
        addMessage(endNode.question);
        showOptions(endNode.options);
      }, 1000);
    }, 500);
  } else {
    const nextNode = decisionTree[option.next];
    setTimeout(() => {
      addMessage(nextNode.question);
      showOptions(nextNode.options);
    }, 500);
  }
}

// Start the conversation
addMessage(decisionTree.start.question);
showOptions(decisionTree.start.options);
