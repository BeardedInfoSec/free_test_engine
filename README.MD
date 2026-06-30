# Free Test Engine

A self-contained study engine for **Splunk certification** practice questions, with two ways to study from the same question banks:

- 🖥️ **Web Flashcard Trainer** — a polished, browser-based app (no install, no server). Just open an HTML file.
- ⌨️ **Python CLI** — a terminal quiz/test runner.

Both read the same JSON question format, so you can use whichever fits your workflow.

---

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
  - [Web Flashcard Trainer](#web-flashcard-trainer)
  - [Python CLI](#python-cli)
- [Question Banks](#question-banks)
- [Study Modes](#study-modes)
- [The Mastery System](#the-mastery-system)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Adding Your Own Questions](#adding-your-own-questions)
- [Question Format](#question-format)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Disclaimer](#disclaimer)

---

## Features

- **Three certification banks** included (Power User, Admin, Architect) — 437 questions with explanations and reference links.
- **Four study modes:** Learn, Test, Smart Study, and Retry Missed.
- **Mastery tracking** — a missed question must be answered correctly **three times in a row** before it's considered mastered.
- **Multiple-choice & multi-answer** support (single letter or "select all that apply").
- **Per-question explanations + resource links** to official Splunk docs.
- **Progress saved automatically** in your browser (`localStorage`) — close the tab and pick up where you left off.
- **Timed practice exams** with a per-question results breakdown.
- **No backend, no build step, no dependencies** for the web app — it runs entirely from local files.

---

## Quick Start

### Web Flashcard Trainer

1. Download or clone the repo.
2. Open **`Arch_Study_tool.html`** in any modern browser (double-click it).
3. Pick a certification from the **Question bank** dropdown and start studying.

That's it — the question banks are bundled and load automatically. Your progress is saved in the browser.

> No web server is required. The app loads its banks from a generated `flashcards/question-banks.js` so it works directly from `file://`.

### Python CLI

Requires Python 3.

```bash
git clone https://github.com/BeardedInfoSec/free_test_engine
cd free_test_engine
pip install -r requirements.txt
python quiz_app.py
```

You'll be prompted to pick a question set, then a mode (quiz / test / reset).

---

## Question Banks

Questions are organized by Splunk certification. The web app presents one bank per certification:

| Bank | Certification | Questions |
|------|---------------|-----------|
| **Power User (SPLK-1002)** | Splunk Core Certified Power User | 64 |
| **Admin (SPLK-1003)** | Splunk Enterprise Certified Admin | 132 |
| **Architect (SPLK-2002)** | Splunk Enterprise Certified Architect | 241 |

The Architect bank is merged and de-duplicated from several SPLK-2002 source sets (a practice test, three quizzes, and an additional sample set). Every question includes an explanation and, where available, links to authoritative Splunk documentation.

---

## Study Modes

| Mode | What it does |
|------|--------------|
| **Learn** | Work through the whole bank with immediate feedback, explanations, and resource links. |
| **Test** | A timed (90-minute), 85-question random exam. Scored at the end with a per-question results screen. Test scoring is kept separate from your study progress. |
| **Smart Study** | Adaptive 10-question sessions. Shuffled and weighted toward questions you haven't mastered yet, mixing in new material. |
| **Retry Missed** | Re-quiz only the questions you haven't mastered. |

You can also **flag** questions and filter the navigator to **Flagged** or **Missed** at any time.

---

## The Mastery System

The app tracks more than just right/wrong — it tracks **mastery**:

- A question answered correctly on the **first try** (never missed) is **mastered** immediately. ✅
- Once you **miss** a question, it must be answered correctly **3 times in a row** to become mastered. 🔁
- **Any wrong answer resets the streak** to zero.

Questions are color-coded in the navigator and stats panel:

| State | Meaning |
|-------|---------|
| 🟢 **Mastered** | Correct (and, if previously missed, on a 3-in-a-row streak) |
| 🟡 **Learning** | Missed before, now answering correctly but not yet at 3 in a row |
| 🔴 **Missed** | Last answer was wrong |
| ⚪ **New** | Not yet seen |

"Retry Missed" and the "Missed" filter include everything that isn't mastered yet, so questions keep coming back until they truly stick.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `A` `B` `C` `D` | Select the corresponding answer |
| `Enter` | Submit (multi-answer questions) |
| `Space` / `→` | Next question |
| `←` | Previous question |
| `L` | Learn mode |
| `T` | Test mode |
| `S` | Smart Study |
| `R` | Retry Missed |
| `F` | Finish the current test |

---

## Adding Your Own Questions

You can study any subject — just supply questions in the [JSON format](#question-format).

**Option A — load a file in the web app:** click **Upload your own** in the sidebar (or drag a `.json` file onto it).

**Option B — add a bundled bank:**

1. Drop your `myband.json` into `questions/`.
2. Regenerate the bundle so the web app picks it up:
   ```bash
   python build_banks.py
   ```
   (Edit the `BANK_SPECS` list at the top of `build_banks.py` to control the bank's display name and which files it merges.)

**Converting other formats into the JSON schema:**

- **`createQA.py`** — converts a plain-text file of questions into a bank. See `qa_badformat.txt` for the expected loose format (question lines, `A.`/`B.`/… choices, and an answer line).
- **`extract_docx.py`** — parses Splunk practice-test results exported as `.docx` (HTML-in-Word) into the JSON schema, including answers, explanations, and resource links.

---

## Question Format

Each bank is a JSON array of question objects:

```json
[
  {
    "question": "Which command is used to add a search head to an indexer cluster?",
    "choices": [
      "A. splunk edit cluster-master",
      "B. splunk add cluster-config",
      "C. splunk add cluster-master",
      "D. splunk edit cluster-config"
    ],
    "answer": "C",
    "explanation": "Optional. Shown in Learn and Smart Study modes.",
    "resources": ["https://docs.splunk.com/..."]
  }
]
```

- **`question`** *(required)* — the prompt text.
- **`choices`** *(required)* — array of options, each prefixed with a letter (`A. `, `B. `, …).
- **`answer`** *(required)* — a single letter (`"C"`) or, for "select all that apply" questions, an array (`["A", "C"]`). The app grades multi-answer questions by exact match.
- **`explanation`** *(optional)* — a string shown after answering.
- **`resources`** *(optional)* — an array of reference URLs.

---

## Project Structure

```
free_test_engine/
├── Arch_Study_tool.html      # Web app entry point (open this)
├── flashcards/
│   ├── app.js                # Web app logic
│   ├── styles.css            # Web app styling
│   ├── question-banks.js     # Generated bundle of all banks (built by build_banks.py)
│   └── questions.json        # A sample bank (also merged into Architect)
├── questions/                # Source question banks (one JSON file each)
│   ├── poweruser1002.json
│   ├── admin1003.json
│   ├── 2002_practice_test.json
│   └── 2002_quiz_{1,2,3}.json
├── quiz_app.py               # Python CLI quiz/test runner
├── createQA.py               # Plain-text → JSON converter
├── extract_docx.py           # Udemy .docx export → JSON converter
├── build_banks.py            # Bundles questions/ into flashcards/question-banks.js
├── requirements.txt          # Python deps (colorama, for the CLI)
└── README.MD
```

---

## How It Works

- The **web app** is plain HTML/CSS/JavaScript with no framework and no network calls. Question banks are bundled into a JavaScript file (`question-banks.js`) at build time so the app works offline from `file://` — browsers block `fetch()` of local files, but a `<script>` include works fine.
- **Progress** (per-question status, attempts, mastery streak) is stored in the browser's `localStorage`, keyed by question text. **Reset Progress** clears it.
- The **CLI** uses [`colorama`](https://pypi.org/project/colorama/) for colored terminal output and logs correct/incorrect answers under `results/`.

---

## Disclaimer

This project is an **unofficial, community study aid** and is **not affiliated with, endorsed by, or sponsored by Splunk Inc.** Splunk and the certification names (SPLK-1002, SPLK-1003, SPLK-2002) are trademarks of their respective owner.

The questions and answers are provided **for study purposes only** and may contain errors. Always verify against the [official Splunk documentation](https://docs.splunk.com/). Use it to practice — not as a substitute for understanding the material.
