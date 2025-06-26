import json
import os
import re

def txt_to_json(txt_file, json_file):
    result = []
    question = None
    choices = []
    answer = None

    with open(txt_file, 'r') as file:
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

    # Ensure the folder exists
    os.makedirs(os.path.dirname(json_file), exist_ok=True)

    # Write JSON
    with open(json_file, 'w') as out_file:
        json.dump(result, out_file, indent=4)
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
