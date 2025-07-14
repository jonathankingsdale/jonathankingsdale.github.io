// Simple answer checking for Secret Room Mystery using data-answer attributes
let solvedClues = 0;
const clues = document.querySelectorAll(".clue");
const totalClues = clues.length;

// Timer logic
let secondsElapsed = 0;
const timerEl = document.getElementById("timer");
function updateTimer() {
  const min = Math.floor(secondsElapsed / 60);
  const sec = ("0" + (secondsElapsed % 60)).slice(-2);
  timerEl.textContent = `${min}:${sec}`;
}
updateTimer();
const timerInterval = setInterval(() => {
  secondsElapsed++;
  updateTimer();
}, 1000);

clues.forEach((clue) => {
  const input = clue.querySelector("input");
  const button = clue.querySelector("button");
  input.addEventListener("keypress", (evt) => {
    if (evt.key === "Enter") {
      checkAnswer(clue);
    }
  });
  button.addEventListener("click", () => checkAnswer(clue));
});

function checkAnswer(clue) {
  const input = clue.querySelector("input");
  if (input.disabled) return;
  const answers = clue
    .getAttribute("data-answer")
    .split(",")
    .map((a) => a.trim().toLowerCase());
  const userAnswer = input.value.trim().toLowerCase();
  if (answers.includes(userAnswer)) {
    clue.classList.remove("incorrect");
    clue.classList.add("correct");
    solvedClues++;
    clue.querySelectorAll(":not(:first-child)").forEach((e) => e.remove());
    clue.innerHTML += `<b>Correct!</b>`;
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
  }
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

updateProgress();
