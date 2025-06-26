// === Core Data Structures ===
let questions = [];
let fullQuestionBank = [];
let current = 0;
let progressMap = {};
let answeredStatus = [];
let flags = [];
let startTime, timerId;
let mode = "learn";
let selectedChoice = "";

// === Progress Persistence ===
function loadProgress() {
  const stored = localStorage.getItem("splunkProgress");
  if (stored) progressMap = JSON.parse(stored);
}
function saveProgress() {
  localStorage.setItem("splunkProgress", JSON.stringify(progressMap));
}
function clearProgress() {
  progressMap = {};
  localStorage.removeItem("splunkProgress");
}
function loadSavedQuestions() {
  const raw = localStorage.getItem("splunkQuestions");
  if (raw) {
    try {
      questions = JSON.parse(raw);
      fullQuestionBank = [...questions];
      answeredStatus = questions.map(q => progressMap[q.question] || 'unanswered');
      flags = Array(questions.length).fill(false);
      startLearn();
    } catch (e) {
      console.error("Failed to load saved question bank:", e);
    }
  }
}
loadProgress();
loadSavedQuestions();

// === Load File ===
document.getElementById("questionFileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) loadQuestionsFromFile(file);
});
function loadQuestionsFromFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      questions = JSON.parse(e.target.result);
      fullQuestionBank = [...questions];
      localStorage.setItem("splunkQuestions", e.target.result);
      localStorage.setItem("questionBankLoaded", "true");
      answeredStatus = questions.map(() => 'unanswered');
      flags = Array(questions.length).fill(false);
      startLearn();
    } catch (err) {
      alert("Invalid JSON file: " + err.message);
    }
  };
  reader.readAsText(file);
}

// === UI Functions ===
function displayQuestion() {
  const q = questions[current];
  const choicesContainer = document.getElementById("choices");
  const explanation = document.getElementById("explanation");

  document.getElementById("question").innerText = q.question;
  document.getElementById("flagCheck").checked = flags[current];
  explanation.innerText = "";
  choicesContainer.innerHTML = "";

  const isAnswered = answeredStatus[current] !== 'unanswered';

  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.innerText = choice;

    if (isAnswered) {
      if (mode === "test") {
        if (choice === selectedChoice) btn.classList.add("selected");
      } else {
        if (choice.startsWith(q.answer)) {
          btn.classList.add("correct");
        } else if (choice === selectedChoice) {
          btn.classList.add("incorrect");
        }
      }
    }

    btn.onclick = () => {
      if (isAnswered) return;
      selectedChoice = choice;

      if (mode === "test") {
        document.querySelectorAll(".choices button").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      }

      if (choice.startsWith(q.answer)) {
        if (mode !== "test") btn.classList.add("correct");
        answeredStatus[current] = 'correct';
        progressMap[q.question] = 'correct';
      } else {
        if (mode !== "test") btn.classList.add("incorrect");
        answeredStatus[current] = 'incorrect';
        progressMap[q.question] = 'incorrect';
      }

      if (mode !== "test") {
        document.querySelectorAll(".choices button").forEach(b => {
          if (b.innerText.startsWith(q.answer)) b.classList.add("correct");
        });
        explanation.innerText = "Explanation: " + (q.explanation || "None provided.");
      }

      saveProgress();
      updateScore();
      updateNavStatus();
    };

    choicesContainer.appendChild(btn);
  });
}

function updateNavStatus() {
  const nav = document.getElementById("questionNav");
  nav.innerHTML = "";

  answeredStatus.forEach((status, idx) => {
    const marker = document.createElement("div");
    marker.innerText = idx + 1;

    if (mode === "review") {
      marker.classList.add(status === 'correct' ? 'correct-marker' : 'incorrect-marker');
    } else if (mode === "test") {
      marker.classList.add("unanswered-marker");
    } else {
      marker.classList.add(`${status}-marker`);
    }

    if (flags[idx]) marker.classList.add("flagged-marker");
    if (idx === current) marker.classList.add("selected-marker");

    marker.onclick = () => {
      current = idx;
      if (mode === "smartFlashcard") displayFlashcard();
      else displayQuestion();
    };

    nav.appendChild(marker);
  });
}

function updateScore() {
  if (mode !== "test") {
    const correctCount = Object.values(progressMap).filter(v => v === 'correct').length;
    document.getElementById("score").innerText = `Score: ${correctCount} / ${questions.length}`;
  } else {
    document.getElementById("score").innerText = "";
  }
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const left = Math.max(0, 5400 - elapsed);
  const min = String(Math.floor(left / 60)).padStart(2, '0');
  const sec = String(left % 60).padStart(2, '0');
  document.getElementById("timer").innerText = `Time Left: ${min}:${sec}`;
  if (left === 0) {
    clearInterval(timerId);
    finishTest();
  }
}

// === Mode Handlers ===
function startTest() {
  mode = "test";
  const shuffled = [...fullQuestionBank].sort(() => Math.random() - 0.5);
  questions = shuffled.slice(0, 85);
  fullQuestionBank = [...questions];

  current = 0;
  progressMap = {};
  answeredStatus = Array(questions.length).fill('unanswered');
  flags = Array(questions.length).fill(false);

  startTime = Date.now();
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 1000);
  document.getElementById("timer").style.display = "block";
  document.getElementById("finishBtn").style.display = "block";

  saveProgress();
  updateScore();
  updateNavStatus();
  displayQuestion();
}

function finishTest() {
  clearInterval(timerId);
  document.getElementById("timer").style.display = "none";

  answeredStatus = questions.map(q =>
    progressMap[q.question] === 'correct' ? 'correct' : 'incorrect'
  );
  mode = "review";

  alert(`Test Complete! Score: ${answeredStatus.filter(x => x === 'correct').length} / ${questions.length}`);
  updateScore();
  updateNavStatus();
  displayQuestion();
}

function startLearn() {
  mode = "learn";
  current = 0;
  questions = [...fullQuestionBank];
  answeredStatus = questions.map(q => progressMap[q.question] || 'unanswered');
  flags = Array(questions.length).fill(false);
  clearInterval(timerId);

  document.getElementById("timer").innerText = "";
  document.getElementById("timer").style.display = "none";
  document.getElementById("finishBtn").style.display = "none";

  updateScore();
  updateNavStatus();
  displayQuestion();
}

function startSmartStudy() {
  mode = "smartFlashcard";
  const incorrect = fullQuestionBank.filter(q => progressMap[q.question] !== 'correct');
  const newPool = fullQuestionBank.filter(q => !(q.question in progressMap));
  const lastScore = parseInt(localStorage.getItem("lastSmartScore")) || 0;
  const toAdd = 10 - lastScore;

  const fromIncorrect = incorrect.slice(0, lastScore);
  const fromNew = newPool.filter(q => !fromIncorrect.includes(q)).slice(0, toAdd);
  const sessionSet = [...fromIncorrect, ...fromNew].slice(0, 10);

  if (sessionSet.length === 0) {
    alert("You've mastered all questions in Smart Study. 🎉");
    return;
  }

  questions = sessionSet;
  current = 0;
  flags = Array(questions.length).fill(false);
  answeredStatus = Array(questions.length).fill('unanswered');

  clearInterval(timerId);
  document.getElementById("timer").style.display = "none";
  document.getElementById("finishBtn").style.display = "none";

  updateNavStatus();
  displayFlashcard();
}

function markSmartAnswer(correct) {
  const q = questions[current];
  progressMap[q.question] = correct ? "correct" : "incorrect";
  answeredStatus[current] = correct ? "correct" : "incorrect";
  saveProgress();

  if (current < questions.length - 1) {
    current++;
    displayFlashcard();
    updateNavStatus();
  } else {
    const score = answeredStatus.filter(s => s === 'correct').length;
    const total = questions.length;
    const percent = Math.round((score / total) * 100);
    localStorage.setItem("lastSmartScore", score);
    alert(`Smart Study Complete!\nScore: ${score} / ${total} (${percent}%)`);
    startLearn();
  }
}

function displayFlashcard() {
  const q = questions[current];
  const choices = document.getElementById("choices");
  const explanation = document.getElementById("explanation");

  document.getElementById("question").innerText = q.question;
  document.getElementById("flagCheck").checked = flags[current];
  explanation.innerText = "";
  choices.innerHTML = `<button onclick="showSmartAnswer()">Show Answer</button>`;
}

function showSmartAnswer() {
  const q = questions[current];
  const choices = document.getElementById("choices");
  const explanation = document.getElementById("explanation");
  choices.innerHTML = "";

  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.innerText = choice;
    if (choice.startsWith(q.answer)) btn.classList.add("correct");
    choices.appendChild(btn);
  });

  const controls = document.createElement("div");
  controls.style.marginTop = "20px";
  controls.innerHTML = `
    <button onclick="markSmartAnswer(true)">✔ I got it right</button>
    <button onclick="markSmartAnswer(false)">✖ I got it wrong</button>
  `;
  choices.appendChild(controls);

  explanation.innerText = "Explanation: " + (q.explanation || "None provided.");
}

function retryMissed() {
  const missedQuestions = fullQuestionBank.filter(q => progressMap[q.question] === 'incorrect');
  if (!missedQuestions.length) {
    alert("No missed questions.");
    return;
  }

  questions = [...missedQuestions];
  current = 0;
  answeredStatus = Array(questions.length).fill('unanswered');
  flags = Array(questions.length).fill(false);

  updateScore();
  updateNavStatus();
  displayQuestion();
}

function resetProgress() {
  clearProgress();
  localStorage.removeItem("splunkQuestions");
  localStorage.removeItem("questionBankLoaded");
  localStorage.removeItem("lastSmartScore");

  questions = [];
  fullQuestionBank = [];
  answeredStatus = [];
  flags = [];

  clearInterval(timerId);
  document.getElementById("timer").innerText = "";
  document.getElementById("timer").style.display = "none";
  document.getElementById("finishBtn").style.display = "none";
  document.getElementById("question").innerText = "Upload a question bank to begin.";
  document.getElementById("choices").innerHTML = "";
  document.getElementById("explanation").innerText = "";
  document.getElementById("score").innerText = "";

  updateNavStatus();
  alert("Progress and question bank reset.");
}

function toggleFlag() {
  flags[current] = !flags[current];
  updateNavStatus();
}

function nextQuestion() {
  if (current < questions.length - 1) current++;
  mode === "smartFlashcard" ? displayFlashcard() : displayQuestion();
  updateNavStatus();
}

function prevQuestion() {
  if (current > 0) current--;
  mode === "smartFlashcard" ? displayFlashcard() : displayQuestion();
  updateNavStatus();
}

// === Keyboard Bindings ===
document.addEventListener('keydown', function(e) {
  const key = e.key.toLowerCase();
  if (key === 't') startTest();
  else if (key === 'l') startLearn();
  else if (key === 's') startSmartStudy();
  else if (key === 'r') retryMissed();
  else if (key === 'f') finishTest();
  else if (['a', 'b', 'c', 'd'].includes(key)) {
    const idx = key.charCodeAt(0) - 97;
    const buttons = document.querySelectorAll(".choices button");
    if (buttons[idx]) buttons[idx].click();
  } else if (key === ' ' || e.code === 'Space') {
    e.preventDefault();
    nextQuestion();
  } else if (e.key === 'ArrowRight') {
    nextQuestion();
  } else if (e.key === 'ArrowLeft') {
    prevQuestion();
  }
});
