import answers from "./answers.js";
import { decrypt, isCorrect } from "./decrypter.js";
import final from "./final.js";
import { email } from "./email.js";

const totalClues = 9;
let solvedClues = 0;

const _answers = [
  "ethics@belowsuspicion.com",
  "bullying",
  "greatness",
  "blsp",
  "www.cypher.tech",
  "letmein",
  "cyanide",
  "2578",
  "blood thinner",
];

let timerInterval;
const timerEl = document.getElementById("timer");
const emailLink = document.getElementById("recovered-email");

if (localStorage.getItem("started") == null) {
  const file = new Blob([email], { type: "text/plain" });
  emailLink.href = URL.createObjectURL(file);
  emailLink.download = "recovered-email.txt";

  emailLink.addEventListener("click", () => {
    localStorage.setItem("time", (0).toString());
    localStorage.setItem("started", "true");

    document.querySelector(".container").classList.remove("hidden");
    emailLink.classList.add("hidden");

    updateTimer();
    timerInterval = setInterval(() => updateTimer(), 1000);
  });
} else {
  emailLink.classList.add("hidden");
  document.querySelector(".container").classList.remove("hidden");
  emailLink.classList.add("hidden");
  updateTimer();
  timerInterval = setInterval(() => updateTimer(), 1000);
}

const clues = document.querySelectorAll(".clue");
clues.forEach((clue) => {
  const input = clue.querySelector("input");
  input.addEventListener("keypress", (evt) => {
    if (evt.key === "Enter") {
      checkAnswer(clue);
    }
  });
  const button = clue.querySelector("button");
  button.addEventListener("click", () => checkAnswer(clue));
});

document
  .getElementById("final-questions-submit")
  .addEventListener("click", async () => {
    const murderer = document.getElementById("murderer").value;
    const means = document.getElementById("means").value;
    const motive = document.getElementById("motive").value;

    const correct =
      (await checkPossibleAnswers("clue10", murderer)) &&
      (await checkPossibleAnswers("clue11", means)) &&
      (await checkPossibleAnswers("clue12", motive));

    if (!correct) {
      document.getElementById("wrong-final-answer").classList.remove("hidden");
      setTimeout(
        () =>
          document.getElementById("wrong-final-answer").classList.add("hidden"),
        4000,
      );
    } else {
      clearInterval(timerInterval);
      const password =
        murderer.split(" ").at(0) + means + motive.split(" ").at(0);
      document
        .querySelectorAll(".container *")
        .forEach((elem) => elem.classList.add("hidden"));

      document.getElementById("final-questions").classList.add("hidden");

      const time = document.getElementById("timer").innerText;

      const solution = (await decrypt(final, password)).replace("XX:YY", time);
      document.getElementById("final-answer").innerHTML += solution;
    }
  });

async function checkAnswer(clue) {
  const input = clue.querySelector("input");
  const clueId = clue.getAttribute("data-clue");

  if (input.disabled) return;

  const userAnswer = input.value.trim().toLowerCase();

  if (_answers.includes(userAnswer)) {
    document.querySelector("dialog > p").innerText = atob(
      "TmljZSB0cnkhIEhhdmUgZml2ZSBtaW51dGVzIGFkZGVkIHRvIHlvdXIgdGltZSBhcyBhIHJld2FyZCA6KQ==",
    );
    document.querySelector("dialog").showModal();
    localStorage.setItem("time", parseInt(localStorage.getItem("time")) + (5 * 60));
    return;
  }

  if (await checkPossibleAnswers(clueId, userAnswer)) {
    clue.classList.remove("incorrect");
    clue.classList.add("correct");

    solvedClues++;
    clue.querySelectorAll(":not(:first-child)").forEach((e) => e.remove());
    clue.innerHTML += `<b>Correct!</b>`;

    updateProgress();
    showFinalQuestions();
  } else {
    clue.classList.add("incorrect");
    setTimeout(() => {
      clue.classList.remove("incorrect");
    }, 1000);
  }
  const encryptedAnswers = answers[clueId];
  if (encryptedAnswers == null) {
    console.error("Clue ID not found: " + clueId);
    return false;
  }
}

async function checkPossibleAnswers(clueId, userAnswer) {
  const encryptedAnswers = answers[clueId];
  try {
    return await Promise.all(
      encryptedAnswers.map((encryptedAnswer) =>
        isCorrect(encryptedAnswer, userAnswer),
      ),
    ).then((matches) => matches.some((m) => m));
  } catch {
    return false;
  }
}

// Progress bar
function updateProgress() {
  const progressPercent = Math.min(
    100,
    Math.round((solvedClues / totalClues) * 100),
  );
  document.querySelector(".progress-fill").style.width = `${progressPercent}%`;
  document.querySelector(".progress-text").textContent =
    `${progressPercent}% Complete`;
}

// Check if we should show the final solution
function showFinalQuestions() {
  if (solvedClues < totalClues) {
    return;
  }

  document
    .querySelectorAll(".clue")
    .forEach((elem) => elem.classList.add("faded"));

  document.getElementById("final-questions").classList.remove("hidden");
}

function updateTimer() {
  const time = parseInt(localStorage.getItem("time"));
  const minutes = Math.floor(time / 60);
  const seconds = ("0" + (time % 60)).slice(-2);

  timerEl.textContent = `${minutes}:${seconds}`;

  localStorage.setItem("time", (time + 1).toString());
}
