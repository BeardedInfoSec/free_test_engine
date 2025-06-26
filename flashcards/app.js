
let questions = [], current = 0, mode = "learn", correct = new Set(), missed = [], answeredStatus = [], flagged = new Set(), startTime, timerId;

async function loadQuestions() {
  const res = await fetch('questions.json');
  questions = await res.json();
  answeredStatus = new Array(questions.length).fill('unanswered');
  displayQuestion(current);
  updateNavStatus();
}

function displayQuestion(index) {
  const q = questions[index];
  document.getElementById("question").innerText = q.question;
  const choicesDiv = document.getElementById("choices");
  choicesDiv.innerHTML = "";
  document.getElementById("explanation").innerText = (mode === "test") ? "" : "Explanation: " + (q.explanation || "None provided.");
  document.getElementById("flagQuestion").checked = flagged.has(index);

  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.innerText = choice;
    btn.onclick = () => selectAnswer(btn, q);
    choicesDiv.appendChild(btn);
  });

  updateNavStatus();
  updateScore();
}

function selectAnswer(btn, q) {
  if (mode === "test") {
    const buttons = document.querySelectorAll(".choices button");
    buttons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    const isCorrect = btn.innerText.startsWith(q.answer);
    answeredStatus[current] = isCorrect ? "answered" : "incorrect";
    if (isCorrect) correct.add(q.question);
    else missed.push(q);
  } else {
    const buttons = document.querySelectorAll(".choices button");
    buttons.forEach(b => {
      if (b.innerText.startsWith(q.answer)) b.classList.add("correct");
    });
    if (!btn.innerText.startsWith(q.answer)) btn.classList.add("incorrect");
    answeredStatus[current] = btn.innerText.startsWith(q.answer) ? "correct" : "incorrect";
    if (!btn.innerText.startsWith(q.answer)) missed.push(q);
    else correct.add(q.question);
  }
  updateNavStatus();
  updateScore();
}

function updateNavStatus() {
  const nav = document.getElementById("questionNav");
  nav.innerHTML = "";
  answeredStatus.forEach((status, idx) => {
    const marker = document.createElement("div");
    marker.innerText = idx + 1;
    if (status === "correct") marker.classList.add("correct-marker");
    else if (status === "incorrect") marker.classList.add("incorrect-marker");
    else if (status === "answered") marker.classList.add("answered-marker");
    else marker.classList.add("unanswered-marker");
    if (flagged.has(idx)) marker.classList.add("flagged-marker");
    marker.onclick = () => {
      current = idx;
      displayQuestion(current);
    };
    nav.appendChild(marker);
  });
}

function updateScore() {
  const score = document.getElementById("score");
  if (mode === "test") score.innerText = `Score: ${correct.size} / ${questions.length}`;
  else score.innerText = "";
}

function updateTimer() {
  const remaining = 90 * 60 - Math.floor((Date.now() - startTime) / 1000);
  const min = Math.floor(remaining / 60).toString().padStart(2, '0');
  const sec = (remaining % 60).toString().padStart(2, '0');
  document.getElementById("timer").innerText = `Time Left: ${min}:${sec}`;
  if (remaining <= 0) {
    clearInterval(timerId);
    alert("Time's up!");
    finishTest();
  }
}

function startTest() {
  mode = "test";
  current = 0;
  correct.clear();
  missed = [];
  flagged.clear();
  answeredStatus = new Array(questions.length).fill('unanswered');
  displayQuestion(current);
  updateNavStatus();
  document.getElementById("finishBtn").style.display = "block";
  startTime = Date.now();
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 1000);
}

function startLearn() {
  mode = "learn";
  current = 0;
  correct.clear();
  missed = [];
  flagged.clear();
  answeredStatus = new Array(questions.length).fill('unanswered');
  displayQuestion(current);
  updateNavStatus();
  document.getElementById("finishBtn").style.display = "none";
  clearInterval(timerId);
  document.getElementById("timer").innerText = "";
}

function startSmartStudy() {
  mode = "smart";
  questions = questions.filter(q => !correct.has(q.question)).slice(0, 5);
  answeredStatus = new Array(questions.length).fill('unanswered');
  current = 0;
  displayQuestion(current);
  updateNavStatus();
  document.getElementById("finishBtn").style.display = "none";
}

function retryMissed() {
  if (missed.length === 0) return alert("No missed questions.");
  questions = [...missed];
  answeredStatus = new Array(questions.length).fill('unanswered');
  current = 0;
  displayQuestion(current);
  updateNavStatus();
  document.getElementById("finishBtn").style.display = "none";
}

function finishTest() {
  clearInterval(timerId);
  alert(`Test completed! Score: ${correct.size}/${questions.length}`);
}

function resetProgress() {
  correct.clear();
  missed = [];
  flagged.clear();
  answeredStatus = new Array(questions.length).fill('unanswered');
  displayQuestion(current);
  updateNavStatus();
  updateScore();
  clearInterval(timerId);
  document.getElementById("timer").innerText = "";
}

function toggleFlag() {
  if (document.getElementById("flagQuestion").checked) flagged.add(current);
  else flagged.delete(current);
  updateNavStatus();
}

function prevQuestion() {
  if (current > 0) {
    current--;
    displayQuestion(current);
  }
}

function nextQuestion() {
  if (current < questions.length - 1) {
    current++;
    displayQuestion(current);
  }
}

document.addEventListener('keydown', function(e) {
  const key = e.key.toLowerCase();
  if (key === 't') startTest();
  else if (key === 'l') startLearn();
  else if (key === 's') startSmartStudy();
  else if (key === 'r') retryMissed();
  else if (key === 'f') finishTest();
  else if (key === 'arrowleft') prevQuestion();
  else if (key === 'arrowright') nextQuestion();
  else if (['a', 'b', 'c', 'd'].includes(key)) {
    const index = key.charCodeAt(0) - 97;
    const buttons = document.querySelectorAll('.choices button');
    if (buttons[index]) buttons[index].click();
  }
});

loadQuestions();