import json
import os
import re

def txt_to_json(txt_file, json_file):
    result = []
    question = None
    choices = []
    answer = None

    with open(txt_file, 'r', encoding='utf-8') as file:
        block = []
        for line in file:
            if line.strip() == "":
                if block:
                    result.append(parse_block(block))
                    block = []
            else:
                block.append(line.strip())
        if block:
            result.append(parse_block(block))  # Last block

    # Warn about blocks that didn't parse cleanly so they aren't silently shipped.
    missing_answer = [q['question'] for q in result if not q['answer']]
    missing_choices = [q['question'] for q in result if not q['choices']]
    if missing_answer:
        print(f"WARNING: {len(missing_answer)} question(s) have no detected answer:")
        for q in missing_answer:
            print(f"  - {q[:80]}")
    if missing_choices:
        print(f"WARNING: {len(missing_choices)} question(s) have no detected choices.")

    # Ensure the folder exists
    os.makedirs(os.path.dirname(json_file), exist_ok=True)

    # Write JSON
    with open(json_file, 'w', encoding='utf-8') as out_file:
        json.dump(result, out_file, indent=4, ensure_ascii=False)
    print(f"Saved {len(result)} questions to {json_file}")

def parse_block(lines):
    question_lines = []
    choices = []
    answer = None

    for line in lines:
        if re.match(r"^[A-Z]\.\s", line):  # Choice like "A. Something"
            choices.append(line)
        elif re.fullmatch(r"[A-Z](?:[, ]?[A-Z])*|True|False", line):  # Answer line
            cleaned = line.replace(",", " ").split()
            answer = cleaned if len(cleaned) > 1 else cleaned[0]
        else:
            question_lines.append(line)

    question = " ".join(question_lines)
    return {
        "question": question,
        "choices": choices,
        "answer": answer
    }

# Run the script
output = input("Enter the name of the output file (no extension): ")
output_path = os.path.join("questions", output + ".json")
txt_to_json("qa_badformat.txt", output_path)
