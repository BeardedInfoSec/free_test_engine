#!/usr/bin/env python3
"""Extract SPLK-2002 quiz questions from Udemy results pages saved as .docx.

The .docx files are ZIP archives; word/document.xml contains Udemy results
HTML that has been double-HTML-escaped and interleaved with Word's own
<w:...> run/paragraph tags. This script recovers that HTML and parses each
question block into the JSON schema used by the app.

Standard library only (zipfile, re, html, json).
"""

import zipfile
import re
import html
import json
import os

FILES = [
    "2002_practice_test.docx",
    "2002_quiz_1.docx",
    "2002_quiz_2.docx",
    "2002_quiz_3.docx",
]

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# Links we never want to keep (survey / feedback / pure navigation).
EXCLUDE_LINK_PATTERNS = (
    "survey.alchemer.com",
    "share-feedback",
    "udemy.com",
    "/feedback",
)


def recover_html(path):
    """Return the Udemy results HTML embedded in a .docx file."""
    xml = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8", "replace")
    # Strip Word's own tags: <w:...>, <w14:...>, <wp:...>, etc.
    xml = re.sub(r"</?w[0-9a-zA-Z]*:[^>]*>", "", xml)
    # The embedded HTML is double-escaped; unescape twice.
    h = html.unescape(xml)
    h = html.unescape(h)
    return h


def strip_tags(fragment):
    """Turn an HTML fragment into readable plain text."""
    if fragment is None:
        return ""
    # Drop code-block line-number list markers but keep their text.
    text = fragment
    # Convert common block/line elements to spacing so words don't run together.
    text = re.sub(r"</(p|div|li|h[1-6]|pre|ol|ul|tr)>", "\n", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    # Remove all remaining tags.
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    # Normalise whitespace: collapse runs of spaces, trim each line, drop blanks.
    lines = [re.sub(r"[ \t ]+", " ", ln).strip() for ln in text.split("\n")]
    lines = [ln for ln in lines if ln]
    return "\n".join(lines).strip()


def find_div_end(s, start):
    """Given index of a '<div' at `start`, return index just past its matching
    </div>, accounting for nested divs."""
    depth = 0
    i = start
    tag_re = re.compile(r"<(/?)div\b", re.I)
    for m in tag_re.finditer(s, start):
        if m.group(1):  # closing
            depth -= 1
            if depth == 0:
                # find the '>' that closes this </div>
                gt = s.find(">", m.end())
                return gt + 1 if gt != -1 else len(s)
        else:
            depth += 1
    return len(s)


# A question block begins at a question-result-panel/header. The most reliable
# anchor present once per question is the "question-prompt" container.
PROMPT_RE = re.compile(
    r'<div[^>]*id="question-prompt"[^>]*>(.*?)</div>', re.I | re.S
)


def extract_questions(h):
    questions = []

    # Split the document into per-question regions using the question-prompt
    # anchor as the start of each block; a block runs until the next prompt.
    prompt_positions = [m.start() for m in PROMPT_RE.finditer(h)]
    if not prompt_positions:
        return questions

    bounds = prompt_positions + [len(h)]
    for idx in range(len(prompt_positions)):
        block = h[bounds[idx]:bounds[idx + 1]]

        # --- prompt ---
        pm = PROMPT_RE.search(block)
        prompt = strip_tags(pm.group(1)) if pm else ""
        prompt = " ".join(prompt.split("\n")).strip()
        if not prompt:
            continue

        # --- options ---
        # Each option is an answer pane div whose class encodes correctness:
        #   answer-result-pane--answer-correct--...   -> correct
        #   answer-result-pane--answer-incorrect--... -> wrong (user picked)
        #   answer-result-pane--answer-skipped--...   -> wrong (not picked)
        # The option text lives in an id="answer-text" container inside it.
        choices = []
        correct_indices = []
        opt_re = re.compile(
            r'<div class="answer-result-pane--answer-(correct|incorrect|skipped)[^"]*"'
            r'[^>]*data-purpose="answer"',
            re.I,
        )
        for om in opt_re.finditer(block):
            state = om.group(1).lower()
            pane = block[om.start():find_div_end(block, om.start())]
            tm = re.search(
                r'<div[^>]*id="answer-text"[^>]*>(.*?)</div>', pane, re.I | re.S
            )
            if not tm:
                continue
            text = " ".join(strip_tags(tm.group(1)).split("\n")).strip()
            if not text:
                continue
            i = len(choices)
            choices.append(f"{LETTERS[i]}. {text}")
            if state == "correct":
                correct_indices.append(i)

        if len(choices) < 2 or not correct_indices:
            continue

        # --- answer letter(s) ---
        if len(correct_indices) == 1:
            answer = LETTERS[correct_indices[0]]
        else:
            answer = [LETTERS[i] for i in correct_indices]

        # --- overall explanation ---
        em = re.search(
            r'<div[^>]*id="overall-explanation"[^>]*>(.*?)</div>\s*</div>\s*'
            r'(?:<div[^>]*data-purpose="resource-pane"|<div[^>]*resource-pane)',
            block,
            re.I | re.S,
        )
        if not em:
            em = re.search(
                r'<div[^>]*id="overall-explanation"[^>]*>(.*?)</div>',
                block,
                re.I | re.S,
            )
        explanation = strip_tags(em.group(1)) if em else ""

        # --- resource links ---
        resources = []
        seen = set()
        rp = re.search(
            r'<div[^>]*data-purpose="resource-pane"', block, re.I
        )
        search_region = (
            block[rp.start():find_div_end(block, rp.start())] if rp else block
        )
        for lm in re.finditer(r'href="(https?://[^"]+)"', search_region):
            url = html.unescape(lm.group(1)).strip()
            low = url.lower()
            if any(p in low for p in EXCLUDE_LINK_PATTERNS):
                continue
            if url not in seen:
                seen.add(url)
                resources.append(url)

        questions.append(
            {
                "question": prompt,
                "choices": choices,
                "answer": answer,
                "explanation": explanation,
                "resources": resources,
            }
        )

    return questions


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(here, "questions")
    os.makedirs(out_dir, exist_ok=True)

    summary = {}
    for fname in FILES:
        path = os.path.join(here, fname)
        h = recover_html(path)
        qs = extract_questions(h)
        out_path = os.path.join(out_dir, fname.replace(".docx", ".json"))
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(qs, fh, indent=2, ensure_ascii=False)
        summary[fname] = len(qs)
        print(f"{fname}: {len(qs)} questions -> {out_path}")

    return summary


if __name__ == "__main__":
    main()
