import json
import os

def txt_to_json(txt_file, json_file):
    result = []
    question = None
    choices = []
    answer = None
    choice_stage = True

    with open(txt_file, 'r') as file:
        for line in file:
            line = line.strip()

            # If line is not a choice or answer, it's a new question
            if not line.startswith(("A.", "B.", "C.", "D.")):
                if question:
                    # Append the previous question before starting a new one
                    result.append({
                        "question": question,
                        "choices": choices,
                        "answer": answer
                    })
                # Start a new question
                question = line
                choices = []
                answer = None
                choice_stage = True  # Set flag to start collecting choices

            # If we are in the choices section and the line is a choice
            elif line.startswith(("A.", "B.", "C.", "D.")) and choice_stage:
                if len(choices) < 4:
                    choices.append(line)
                else:
                    # Once 4 choices have been collected, the next "A." line should be an answer
                    answer = line.split(".")[0]
                    choice_stage = False  # Stop collecting choices, start collecting answers

            # Handle multiple answers
            elif not choice_stage:
                if answer and isinstance(answer, str):
                    answer = [answer]  # Convert to list if there's a second answer
                if answer:
                    answer.append(line.split(".")[0])

        # Append the last question
        if question:
            result.append({
                "question": question,
                "choices": choices,
                "answer": answer
            })

    # Ensure the folder "questions" exists
    os.makedirs(os.path.dirname(json_file), exist_ok=True)

    # Write the result to a JSON file
    with open(json_file, 'w') as out_file:
        json.dump(result, out_file, indent=4)

# Call the function
output = input('Enter the name of the output file without the extension: ')
output_path = os.path.join('questions', output + '.json')
txt_to_json('qa_badformat.txt', output_path)
