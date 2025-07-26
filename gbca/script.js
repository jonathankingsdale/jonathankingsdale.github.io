// Simple answer checking for Secret Room Mystery using data-answer attributes
let solvedClues = 0;
const clues = document.querySelectorAll(".clue");
const totalClues = clues.length;

// Timer logic with localStorage
let secondsElapsed = parseInt(localStorage.getItem("gbca-timer")) || 0;
const timerEl = document.getElementById("timer");
function updateTimer() {
  const min = Math.floor(secondsElapsed / 60);
  const sec = ("0" + (secondsElapsed % 60)).slice(-2);
  timerEl.textContent = `${min}:${sec}`;
}
updateTimer();
let timerInterval = setInterval(() => {
  secondsElapsed++;
  localStorage.setItem("gbca-timer", secondsElapsed);
  updateTimer();
}, 1000);

// Restore answers from localStorage
const savedAnswers = JSON.parse(localStorage.getItem("gbca-answers") || "{}");
clues.forEach((clue) => {
  const clueId = clue.getAttribute("data-clue");
  const input = clue.querySelector("input");
  const button = clue.querySelector("button");
  if (savedAnswers[clueId]) {
    input.value = savedAnswers[clueId].value;
    if (savedAnswers[clueId].correct) {
      clue.classList.add("correct");
      input.disabled = true;
      button.disabled = true;
      clue.querySelectorAll(":not(:first-child)").forEach((e) => e.remove());
      clue.innerHTML += `<b>Correct!</b>`;
      solvedClues++;
    }
  }
  input.addEventListener("keypress", (evt) => {
    if (evt.key === "Enter") {
      checkAnswer(clue);
    }
  });
  button.addEventListener("click", () => checkAnswer(clue));
});

function checkAnswer(clue) {
  const input = clue.querySelector("input");
  const button = clue.querySelector("button");
  if (input.disabled) return;
  const answers = clue.getAttribute("data-answer").trim().toLowerCase();
  const userAnswer = input.value.trim().toLowerCase();
  const clueId = clue.getAttribute("data-clue");
  if (userAnswer && answers.includes(userAnswer)) {
    clue.classList.remove("incorrect");
    clue.classList.add("correct");
    solvedClues++;
    input.disabled = true;
    button.disabled = true;
    clue.querySelectorAll(":not(:first-child)").forEach((e) => e.remove());
    clue.innerHTML += `<b>Correct!</b>`;
    saveAnswer(clueId, userAnswer, true);
    updateProgress();
    if (solvedClues === totalClues) {
      clearInterval(timerInterval);
      showCompletionModal();
    }
  } else {
    clue.classList.add("incorrect");
    setTimeout(() => {
      clue.classList.remove("incorrect");
    }, 1000);
    saveAnswer(clueId, userAnswer, false);
  }
}

function saveAnswer(clueId, value, correct) {
  const answers = JSON.parse(localStorage.getItem("gbca-answers") || "{}");
  answers[clueId] = { value, correct };
  localStorage.setItem("gbca-answers", JSON.stringify(answers));
}

function updateProgress() {
  const progressPercent = Math.min(
    100,
    Math.round((solvedClues / totalClues) * 100)
  );
  document.querySelector(".progress-fill").style.width = `${progressPercent}%`;
  document.querySelector(
    ".progress-text"
  ).textContent = `${progressPercent}% Complete`;
}

function showCompletionModal() {
  const modal = document.getElementById("completion-modal");
  const timeStr = timerEl.textContent;
  document.getElementById(
    "completion-time"
  ).textContent = `You completed the escape room in ${timeStr}!`;
  modal.classList.remove("hidden");
}

// Reset button logic
const resetBtn = document.getElementById("reset-btn");
resetBtn.addEventListener("click", () => {
  localStorage.removeItem("gbca-answers");
  localStorage.removeItem("gbca-timer");
  location.reload();
});

// Modal close button logic
const closeModalBtn = document.getElementById("close-modal-btn");
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    const modal = document.getElementById("completion-modal");
    modal.classList.add("hidden");
  });
}

updateProgress();
