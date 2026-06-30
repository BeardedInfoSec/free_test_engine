"""Merge agent-authored explanation sidecars into the question banks.

Sidecars live in questions/explanations/<bank>.json as a list of
{ "index", "question_prefix", "explanation", "resources" }.

For each entry we set the bank question's `explanation` (only if currently
empty) and merge any `resources` URLs (deduped, appended). The `question_prefix`
is verified against the actual question text as a safety check before writing.

Run:  python merge_explanations.py   (then re-run build_banks.py)
"""
import json
import os

SIDE_DIR = os.path.join("questions", "explanations")


def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    if not os.path.isdir(SIDE_DIR):
        print(f"No sidecar dir at {SIDE_DIR}; nothing to do.")
        return

    total_exp, total_res, total_skipped, total_mismatch = 0, 0, 0, 0

    for fn in sorted(os.listdir(SIDE_DIR)):
        if not fn.lower().endswith(".json"):
            continue
        bank_path = os.path.join("questions", fn)
        side_path = os.path.join(SIDE_DIR, fn)
        if not os.path.exists(bank_path):
            print(f"WARNING: no bank for sidecar {fn}; skipping.")
            continue

        bank = load(bank_path)
        side = load(side_path)
        exp_added = res_added = skipped = mismatch = 0

        for entry in side:
            idx = entry.get("index")
            if not isinstance(idx, int) or idx < 0 or idx >= len(bank):
                print(f"  {fn}: bad index {idx!r}; skipping entry.")
                continue
            q = bank[idx]

            # Safety: verify the prefix matches before touching this question.
            prefix = (entry.get("question_prefix") or "").strip()
            if prefix and not q["question"].startswith(prefix[:40]):
                mismatch += 1
                print(f"  {fn}[{idx}]: prefix mismatch; skipping.\n"
                      f"      sidecar: {prefix[:50]!r}\n"
                      f"      bank:    {q['question'][:50]!r}")
                continue

            new_exp = (entry.get("explanation") or "").strip()
            if new_exp and not (q.get("explanation") or "").strip():
                q["explanation"] = new_exp
                exp_added += 1

            new_res = entry.get("resources") or []
            if new_res:
                existing = q.get("resources") or []
                merged = list(existing)
                for url in new_res:
                    if url not in merged:
                        merged.append(url)
                        res_added += 1
                q["resources"] = merged

        with open(bank_path, "w", encoding="utf-8") as f:
            json.dump(bank, f, indent=4, ensure_ascii=False)

        print(f"{fn}: +{exp_added} explanations, +{res_added} resource links"
              + (f", {mismatch} prefix mismatches" if mismatch else ""))
        total_exp += exp_added
        total_res += res_added
        total_skipped += skipped
        total_mismatch += mismatch

    print(f"\nTotal: +{total_exp} explanations, +{total_res} resource links"
          + (f", {total_mismatch} mismatches skipped" if total_mismatch else ""))


if __name__ == "__main__":
    main()
