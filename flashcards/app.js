// === Config ===
const TEST_SIZE = 85;            // questions drawn for a timed test
const TEST_DURATION_SEC = 5400;  // 90-minute test timer
const MASTERY_REQUIRED = 3;      // after a miss, this many correct-in-a-row to "master" a question
const SMART_SESSION = 10;        // cards per Smart Study session

// Fisher-Yates shuffle (returns a new array).
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// === Core Data Structures ===
let questions = [];
let fullQuestionBank = [];
let current = 0;
let progressMap = {};
let answeredStatus = [];
let flags = [];
let startTime, timerId;
let mode = "learn";
let selectionMap = {}; // question text -> array of selected choice letters
let navFilter = "all"; // "all" | "incorrect" | "flagged"

// === Answer Helpers (support both single-answer strings and multi-answer arrays) ===
function answerLetters(answer) {
  // Normalize the question's answer to a Set of letters, e.g. "C" -> {"C"},
  // ["A","B"] -> {"A","B"}.
  return new Set((Array.isArray(answer) ? answer : [answer]).map(a => String(a).trim().toUpperCase()));
}
function choiceLetter(choice) {
  // Extract the leading letter from a choice label like "A. Something".
  const m = String(choice).trim().match(/^([A-Z])/i);
  return m ? m[1].toUpperCase() : "";
}
function isCorrectChoice(choice, answer) {
  return answerLetters(answer).has(choiceLetter(choice));
}
function isMultiAnswer(q) {
  return answerLetters(q.answer).size > 1;
}

// === Progress Persistence ===
// progressMap: question text -> { status, attempts, correct, incorrect, lastChoice,
//                                 lastSeen, everWrong, streak, mastered }
// Mastery rule: a question answered correctly on the first try (never wrong) is mastered.
// Once missed, it must be answered correctly MASTERY_REQUIRED times IN A ROW to become
// mastered again; any wrong answer resets the streak.
function normalizeRecord(rec) {
  if (typeof rec === 'string') {
    const s = rec;
    rec = {
      status: s, attempts: 1,
      correct: s === 'correct' ? 1 : 0,
      incorrect: s === 'incorrect' ? 1 : 0,
      lastChoice: [], lastSeen: 0
    };
  }
  if (rec.mastered === undefined) {
    rec.everWrong = (rec.incorrect || 0) > 0 || rec.status === 'incorrect';
    rec.streak = rec.status === 'correct' ? MASTERY_REQUIRED : 0;
    rec.mastered = rec.status === 'correct';
  }
  return rec;
}
function loadProgress() {
  const stored = localStorage.getItem("splunkProgress");
  if (!stored) { progressMap = {}; return; }
  try {
    progressMap = JSON.parse(stored) || {};
  } catch (e) {
    progressMap = {};
    return;
  }
  for (const k in progressMap) progressMap[k] = normalizeRecord(progressMap[k]);
}
function statRec(question) {
  const v = progressMap[question];
  return (v && typeof v === 'object') ? v : null;
}
function isSeen(question) {
  return question in progressMap;
}
function masteredOf(question) {
  const rec = statRec(question);
  return !!(rec && rec.mastered);
}
// Marker/score state: 'unanswered' | 'incorrect' (last wrong) | 'learning' (correct since a
// miss but not yet mastered) | 'correct' (mastered).
function displayStatusOf(question) {
  const rec = statRec(question);
  if (!rec) return 'unanswered';
  if (rec.mastered) return 'correct';
  return rec.status === 'correct' ? 'learning' : 'incorrect';
}
function recordAnswer(q, isCorrect, selectedLetters) {
  const key = q.question;
  let rec = normalizeRecord(progressMap[key] || { attempts: 0, correct: 0, incorrect: 0, lastChoice: [], lastSeen: 0, everWrong: false, streak: 0, mastered: false });
  rec.status = isCorrect ? 'correct' : 'incorrect';
  rec.attempts = (rec.attempts || 0) + 1;
  if (isCorrect) {
    rec.correct = (rec.correct || 0) + 1;
    rec.streak = (rec.streak || 0) + 1;
  } else {
    rec.incorrect = (rec.incorrect || 0) + 1;
    rec.streak = 0;
    rec.everWrong = true;
  }
  // Mastered when never wrong (1 correct suffices) or, after a miss, on a streak of MASTERY_REQUIRED.
  rec.mastered = rec.everWrong ? (rec.streak >= MASTERY_REQUIRED) : (rec.correct > 0);
  rec.lastChoice = selectedLetters ? [...selectedLetters] : (rec.lastChoice || []);
  rec.lastSeen = Date.now();
  progressMap[key] = rec;
  saveProgress();
}
function saveProgress() {
  // Test/review scoring is transient and must not overwrite saved study progress.
  if (mode === "test" || mode === "review") return;
  localStorage.setItem("splunkProgress", JSON.stringify(progressMap));
}
function clearProgress() {
  progressMap = {};
  localStorage.removeItem("splunkProgress");
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function loadSavedQuestions() {
  const raw = localStorage.getItem("splunkQuestions");
  if (raw) {
    try {
      questions = JSON.parse(raw);
      fullQuestionBank = [...questions];
      answeredStatus = questions.map(q => displayStatusOf(q.question));
      flags = Array(questions.length).fill(false);
      const savedName = localStorage.getItem("questionBankName");
      setBankName(savedName ? `${savedName} · ${questions.length} questions` : `${questions.length} questions loaded`);
      startLearn();
    } catch (e) {
      console.error("Failed to load saved question bank:", e);
    }
  }
}
loadProgress();
loadSavedQuestions();
initBanks();
initNavFilters();

function initNavFilters() {
  document.querySelectorAll('.nav-filter').forEach(btn => {
    btn.onclick = () => {
      navFilter = btn.dataset.filter;
      document.querySelectorAll('.nav-filter').forEach(b => b.classList.toggle('active', b === btn));
      updateNavStatus();
    };
  });
}

function showCardView() {
  const r = document.getElementById('resultsView');
  const c = document.getElementById('card');
  if (r) r.style.display = 'none';
  if (c) c.style.display = '';
}

// === Bundled Question Banks (auto-loaded; see build_banks.py) ===
function initBanks() {
  const select = document.getElementById("bankSelect");
  const banks = window.QUESTION_BANKS || {};
  const names = Object.keys(banks);

  if (!names.length) {
    const picker = document.querySelector(".bank-picker");
    if (picker) picker.style.display = "none";
    if (!localStorage.getItem("splunkQuestions")) {
      document.getElementById("question").innerText = "Upload a question bank to begin.";
    }
    return;
  }

  if (select) {
    select.innerHTML = "";
    names.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.innerText = name;
      select.appendChild(opt);
    });
    select.onchange = () => loadBundledBank(select.value);
  }

  const def = banks[window.DEFAULT_BANK] ? window.DEFAULT_BANK : names[0];
  const savedName = localStorage.getItem("questionBankName");
  const savedSource = localStorage.getItem("questionBankSource");

  if (!localStorage.getItem("splunkQuestions")) {
    // First visit: auto-load the default bank.
    if (select) select.value = def;
    loadBundledBank(def);
  } else if (savedSource !== "file" && !names.includes(savedName)) {
    // A previously-bundled bank whose label no longer exists (banks changed):
    // migrate to the default instead of getting stuck on stale data.
    if (select) select.value = def;
    loadBundledBank(def);
  } else if (select && names.includes(savedName)) {
    select.value = savedName;
  }
}

function loadBundledBank(name) {
  const data = (window.QUESTION_BANKS || {})[name];
  if (!data) return;
  questions = [...data];
  fullQuestionBank = [...data];
  localStorage.setItem("splunkQuestions", JSON.stringify(data));
  localStorage.setItem("questionBankLoaded", "true");
  localStorage.setItem("questionBankName", name);
  localStorage.setItem("questionBankSource", "bundled");
  setBankName(`${name} · ${data.length} questions`);
  answeredStatus = questions.map(q => displayStatusOf(q.question));
  flags = Array(questions.length).fill(false);
  startLearn();
}

// === Load File ===
function setBankName(name) {
  const el = document.getElementById("bankName");
  if (el) el.innerText = name;
}
document.getElementById("questionFileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) loadQuestionsFromFile(file);
});

// Drag-and-drop onto the upload zone
const dropZone = document.getElementById("dropZone");
if (dropZone) {
  ["dragover", "dragenter"].forEach(ev =>
    dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.classList.add("dragover"); }));
  ["dragleave", "dragend", "drop"].forEach(ev =>
    dropZone.addEventListener(ev, () => dropZone.classList.remove("dragover")));
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadQuestionsFromFile(file);
  });
}

function loadQuestionsFromFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      questions = JSON.parse(e.target.result);
      fullQuestionBank = [...questions];
      localStorage.setItem("splunkQuestions", e.target.result);
      localStorage.setItem("questionBankLoaded", "true");
      localStorage.setItem("questionBankName", file.name);
      localStorage.setItem("questionBankSource", "file");
      setBankName(`${file.name} · ${questions.length} questions`);
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
  showCardView();
  const q = questions[current];
  const choicesContainer = document.getElementById("choices");
  const explanation = document.getElementById("explanation");

  document.getElementById("question").innerText = q.question;
  document.getElementById("flagCheck").checked = flags[current];
  explanation.innerText = "";
  choicesContainer.innerHTML = "";

  const isAnswered = answeredStatus[current] !== 'unanswered';
  const multi = isMultiAnswer(q);
  const selected = new Set(selectionMap[q.question] || []);

  q.choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.innerText = choice;
    const letter = choiceLetter(choice);

    if (isAnswered) {
      if (mode === "test") {
        if (selected.has(letter)) btn.classList.add("selected");
      } else {
        if (isCorrectChoice(choice, q.answer)) {
          btn.classList.add("correct");
        } else if (selected.has(letter)) {
          btn.classList.add("incorrect");
        }
      }
    } else if (multi && selected.has(letter)) {
      btn.classList.add("selected");
    }

    btn.onclick = () => {
      if (isAnswered) return;

      if (multi) {
        // Toggle this choice; grading is deferred to the Submit button.
        if (selected.has(letter)) {
          selected.delete(letter);
          btn.classList.remove("selected");
        } else {
          selected.add(letter);
          btn.classList.add("selected");
        }
        selectionMap[q.question] = [...selected];
        return;
      }

      selected.clear();
      selected.add(letter);
      selectionMap[q.question] = [...selected];
      gradeCurrentQuestion();
    };

    choicesContainer.appendChild(btn);
  });

  if (multi && !isAnswered) {
    const submit = document.createElement("button");
    submit.innerText = "Submit Answer";
    submit.className = "submit-btn";
    submit.onclick = gradeCurrentQuestion;
    choicesContainer.appendChild(submit);
  }

  if (isAnswered && mode !== "test") {
    renderFeedback(q);
  }
}

function renderFeedback(q) {
  const explanation = document.getElementById("explanation");
  renderExplanation(q); // explanation text + resources (may leave the box empty)

  const rec = statRec(q.question);
  if (!rec) return;
  const line = document.createElement("div");
  if (rec.mastered) {
    line.className = "mastery-line mastered";
    line.innerText = "✅ Mastered";
  } else if (rec.status === 'correct') {
    const left = Math.max(0, MASTERY_REQUIRED - (rec.streak || 0));
    line.className = "mastery-line learning";
    line.innerText = `◐ Correct — ${left} more in a row to master`;
  } else {
    line.className = "mastery-line missed";
    line.innerText = `✖ Missed — answer correctly ${MASTERY_REQUIRED}× in a row to master`;
  }
  explanation.insertBefore(line, explanation.firstChild);
}

function renderExplanation(q) {
  const explanation = document.getElementById("explanation");
  explanation.innerHTML = "";

  const hasExp = q.explanation && q.explanation.trim();
  const hasRes = Array.isArray(q.resources) && q.resources.length;
  if (!hasExp && !hasRes) return; // nothing to show; the :empty CSS rule hides the box

  if (hasExp) {
    const body = document.createElement("div");
    body.innerText = "Explanation: " + q.explanation.trim();
    explanation.appendChild(body);
  }

  if (hasRes) {
    const wrap = document.createElement("div");
    wrap.className = "resources";
    const title = document.createElement("div");
    title.className = "resources-title";
    title.innerText = "Resources";
    wrap.appendChild(title);
    q.resources.forEach(url => {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerText = url;
      wrap.appendChild(a);
    });
    explanation.appendChild(wrap);
  }
}

function gradeCurrentQuestion() {
  const q = questions[current];
  const expected = answerLetters(q.answer);
  const selected = new Set(selectionMap[q.question] || []);
  const isCorrect = selected.size === expected.size && [...expected].every(l => selected.has(l));

  recordAnswer(q, isCorrect, [...selected]);
  // A test is a one-shot assessment (raw correctness); Learn reflects mastery progress.
  answeredStatus[current] = (mode === 'test') ? (isCorrect ? 'correct' : 'incorrect') : displayStatusOf(q.question);

  updateScore();
  updateNavStatus();
  displayQuestion(); // re-render to reveal correct/incorrect styling
}

function updateNavStatus() {
  const nav = document.getElementById("questionNav");
  nav.innerHTML = "";

  const needsWork = s => s === 'incorrect' || s === 'learning'; // "Missed" = not yet mastered
  const navTitle = document.getElementById("navTitle");
  if (navTitle) {
    const shown = navFilter === 'all' ? answeredStatus.length
      : answeredStatus.filter((s, i) => navFilter === 'incorrect' ? needsWork(s) : flags[i]).length;
    navTitle.innerText = navFilter === 'all'
      ? `Questions · ${answeredStatus.length}`
      : `Questions · ${shown} of ${answeredStatus.length}`;
  }

  answeredStatus.forEach((status, idx) => {
    if (navFilter === 'incorrect' && !needsWork(status)) return;
    if (navFilter === 'flagged' && !flags[idx]) return;

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
      displayQuestion();
    };

    nav.appendChild(marker);
  });

  updateProgress();
  updateStats();
}

function updateStats() {
  const panel = document.getElementById("statsPanel");
  if (!panel) return;
  const total = answeredStatus.length;
  if (!total) { panel.innerHTML = ""; return; }
  const mastered = answeredStatus.filter(s => s === 'correct').length;
  const learning = answeredStatus.filter(s => s === 'learning').length;
  const missed = answeredStatus.filter(s => s === 'incorrect').length;
  const unseen = total - mastered - learning - missed;
  const mastery = Math.round((mastered / total) * 100);
  panel.innerHTML = `
    <div class="stats-mastery">
      <div class="stats-mastery-num">${mastery}<span>%</span></div>
      <div class="stats-mastery-label">mastered</div>
    </div>
    <div class="stats-counts">
      <span class="stat-pill correct">✔ ${mastered} mastered</span>
      <span class="stat-pill learning">◐ ${learning} learning</span>
      <span class="stat-pill incorrect">✖ ${missed} missed</span>
      <span class="stat-pill unseen">○ ${unseen} new</span>
    </div>`;
}

function updateProgress() {
  const fill = document.getElementById("progressFill");
  const label = document.getElementById("progressLabel");
  if (!fill || !label) return;
  const total = questions.length;
  const answered = answeredStatus.filter(s => s !== 'unanswered').length;
  const pct = total ? Math.round((answered / total) * 100) : 0;
  fill.style.width = pct + "%";
  label.innerText = total ? `${answered} / ${total} answered` : "";
}

function updateScore() {
  if (mode !== "test") {
    const masteredCount = questions.filter(q => masteredOf(q.question)).length;
    document.getElementById("score").innerText = `Mastered: ${masteredCount} / ${questions.length}`;
  } else {
    document.getElementById("score").innerText = "";
  }
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const left = Math.max(0, TEST_DURATION_SEC - elapsed);
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
  // Draw a random subset for the test, but DON'T clobber the master bank —
  // Learn/Smart/Retry all read fullQuestionBank and need the complete set.
  questions = shuffle(fullQuestionBank).slice(0, TEST_SIZE);

  current = 0;
  progressMap = {};
  selectionMap = {};
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
  if (mode !== "test") return; // only meaningful during an active test
  clearInterval(timerId);
  document.getElementById("timer").style.display = "none";

  answeredStatus = questions.map(q => {
    const sel = new Set(selectionMap[q.question] || []);
    const exp = answerLetters(q.answer);
    const ok = sel.size === exp.size && [...exp].every(l => sel.has(l));
    return ok ? 'correct' : 'incorrect';
  });
  mode = "review";

  updateScore();
  updateNavStatus();
  showResults();
}

function showResults() {
  const view = document.getElementById('resultsView');
  const card = document.getElementById('card');
  if (!view) { displayQuestion(); return; }
  card.style.display = 'none';
  view.style.display = '';

  const correct = answeredStatus.filter(s => s === 'correct').length;
  const total = questions.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= 75;

  let rows = '';
  questions.forEach((q, idx) => {
    const ok = answeredStatus[idx] === 'correct';
    const yours = (selectionMap[q.question] || []).join(', ') || '—';
    const correctAns = [...answerLetters(q.answer)].join(', ');
    const res = Array.isArray(q.resources) ? q.resources : [];
    rows += `<div class="result-row ${ok ? 'ok' : 'bad'}">
      <div class="result-row-head" data-idx="${idx}">
        <span class="result-badge">${ok ? '✔' : '✖'}</span>
        <span class="result-q">${idx + 1}. ${escapeHtml(q.question)}</span>
      </div>
      ${ok ? '' : `<div class="result-detail">Your answer: <b>${escapeHtml(yours)}</b> &nbsp;·&nbsp; Correct: <b>${escapeHtml(correctAns)}</b></div>`}
      ${(!ok && res.length) ? `<div class="result-res">${res.map(u => `<a href="${escapeHtml(u)}" target="_blank" rel="noopener noreferrer">🔗 ${escapeHtml(u)}</a>`).join('')}</div>` : ''}
    </div>`;
  });

  view.innerHTML = `
    <div class="results-header">
      <div class="results-score ${passed ? 'pass' : 'fail'}">${pct}%</div>
      <div class="results-sub">${correct} / ${total} correct · ${passed ? 'Passed 🎉' : 'Keep studying'}</div>
      <div class="results-actions">
        <button onclick="startLearn()">← Back to Learn</button>
        <button onclick="retryMissed()">Retry Missed</button>
      </div>
    </div>
    <div class="results-list">${rows}</div>`;

  view.querySelectorAll('.result-row-head').forEach(head => {
    head.onclick = () => {
      current = parseInt(head.dataset.idx, 10);
      displayQuestion();
      updateNavStatus();
    };
  });
}

function startLearn() {
  mode = "learn";
  current = 0;
  loadProgress(); // restore persisted study progress (test mode left it transient)
  selectionMap = {};
  questions = [...fullQuestionBank];
  answeredStatus = questions.map(q => displayStatusOf(q.question));
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
  // Two shuffled pools: questions seen-but-not-mastered (review) and never-seen (new).
  const review = shuffle(fullQuestionBank.filter(q => isSeen(q.question) && !masteredOf(q.question)));
  const fresh = shuffle(fullQuestionBank.filter(q => !isSeen(q.question)));

  // Prioritize review (to drive questions toward mastery), but leave room for new
  // material when any review is present. Backfill from whichever pool has more.
  const maxReview = fresh.length ? Math.min(review.length, Math.ceil(SMART_SESSION * 0.7)) : SMART_SESSION;
  const picked = review.slice(0, maxReview);
  for (const q of fresh) { if (picked.length >= SMART_SESSION) break; picked.push(q); }
  for (const q of review) { if (picked.length >= SMART_SESSION) break; if (!picked.includes(q)) picked.push(q); }
  const sessionSet = shuffle(picked).slice(0, SMART_SESSION);

  if (sessionSet.length === 0) {
    alert("You've mastered every question in this bank. 🎉");
    return;
  }

  questions = sessionSet;
  current = 0;
  selectionMap = {};
  flags = Array(questions.length).fill(false);
  answeredStatus = Array(questions.length).fill('unanswered');

  clearInterval(timerId);
  document.getElementById("timer").style.display = "none";
  document.getElementById("finishBtn").style.display = "none";

  updateScore();
  updateNavStatus();
  displayQuestion(); // multiple-choice, auto-graded (same as Learn) on the curated set
}

function finishSmartSession() {
  const total = questions.length;
  const gotRight = answeredStatus.filter(s => s !== 'incorrect').length;
  const mastered = answeredStatus.filter(s => s === 'correct').length;
  alert(`Smart Study complete!\n${gotRight} / ${total} correct this session · ${mastered} now mastered.`);
  startLearn();
}

function retryMissed() {
  // Everything seen but not yet mastered (missed or still in progress toward mastery).
  const missedQuestions = fullQuestionBank.filter(q => isSeen(q.question) && !masteredOf(q.question));
  if (!missedQuestions.length) {
    alert("Nothing to retry — every question you've seen is mastered. 🎉");
    return;
  }

  mode = "learn";
  questions = shuffle(missedQuestions);
  current = 0;
  selectionMap = {};
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
  localStorage.removeItem("questionBankName");
  localStorage.removeItem("questionBankSource");
  localStorage.removeItem("lastSmartScore");

  questions = [];
  fullQuestionBank = [];
  answeredStatus = [];
  flags = [];
  selectionMap = {};
  setBankName("Drop a .json file or click");

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
  // In Smart Study, advancing past the last card (once all are answered) ends the session.
  if (mode === "smartFlashcard" && current >= questions.length - 1
      && answeredStatus.length && answeredStatus.every(s => s !== 'unanswered')) {
    finishSmartSession();
    return;
  }
  if (current < questions.length - 1) current++;
  displayQuestion();
  updateNavStatus();
}

function prevQuestion() {
  if (current > 0) current--;
  displayQuestion();
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
    const buttons = document.querySelectorAll(".choices button:not(.submit-btn)");
    if (buttons[idx]) buttons[idx].click();
  } else if (e.key === 'Enter') {
    const submit = document.querySelector(".choices button.submit-btn");
    if (submit) submit.click();
  } else if (key === ' ' || e.code === 'Space') {
    e.preventDefault();
    nextQuestion();
  } else if (e.key === 'ArrowRight') {
    nextQuestion();
  } else if (e.key === 'ArrowLeft') {
    prevQuestion();
  }
});
