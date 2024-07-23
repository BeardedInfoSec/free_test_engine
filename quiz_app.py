import json
import os
import random
import time

def clear_terminal():
    command = 'cls' if os.name == 'nt' else 'clear'
    os.system(command)

def load_questions(filename):
    with open(filename, 'r') as file:
        return json.load(file)

def log_question(question, choices, correct, folder, filename):
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, filename), 'a') as file:
        file.write(f"Question: {question}\n")
        for choice in choices:
            file.write(f"  {choice}\n")
        file.write(f"Answer: {correct}\n\n")

def ask_question(question, choices, correct_answer, result_folder):
    clear_terminal()

    print(f"Question: {question}")
    for choice in choices:
        print(f"  {choice}")
    
    user_answer = input("\nYour answer (enter the letter or 'q!' to return to the main menu): ").upper()
    if user_answer == 'Q!':
        return 'q!'

    if isinstance(correct_answer, list):
        correct = all(ans in user_answer for ans in correct_answer)
    else:
        correct = user_answer == correct_answer

    if correct:
        print("Correct!")
        log_question(question, choices, correct_answer, result_folder, "correct_answers.txt")
    else:
        print(f"Incorrect. The correct answer is: {correct_answer}")
        log_question(question, choices, correct_answer, result_folder, "incorrect_answers.txt")
        time.sleep(5)
    
    return correct

def run_quiz(questions, result_folder, batch_size=15):
    correct_count = 0
    incorrect_questions = []

    for i in range(0, len(questions), batch_size):
        batch = questions[i:i + batch_size]
        for question_data in batch:
            question, choices, correct_answer = question_data['question'], question_data['choices'], question_data['answer']
            result = ask_question(question, choices, correct_answer, result_folder)
            if result == 'q!':
                return 'q!'
            if result:
                correct_count += 1
            else:
                incorrect_questions.append(question_data)

        total_questions = len(batch)
        incorrect_count = total_questions - correct_count
        print(f"\nBatch Results: {correct_count} correct, {incorrect_count} incorrect.")
        percentage = (correct_count / total_questions) * 100
        print(f"Percentage: {percentage:.2f}%\n")
        correct_count = 0

        time.sleep(5)

    return incorrect_questions

def reset_progress(result_folder):
    if os.path.exists(result_folder):
        for file in os.listdir(result_folder):
            file_path = os.path.join(result_folder, file)
            if os.path.isfile(file_path):
                open(file_path, 'w').close()
    print("Progress has been reset.")

def select_question_set():
    question_sets = os.listdir('questions')
    index = 0

    while True:
        clear_terminal()
        for i in range(index, min(index + 5, len(question_sets))):
            print(f"{i + 1}. {question_sets[i]}")
        
        if len(question_sets) > 5:
            if index + 5 < len(question_sets):
                print("\nN. Next")
            if index > 0:
                print("B. Back")

        print("\nEnter the number of the question set to select, or 'q!' to quit.")
        choice = input("Choice: ").strip().upper()

        if choice == 'N' and index + 5 < len(question_sets):
            index += 5
        elif choice == 'B' and index > 0:
            index -= 5
        elif choice == 'Q!':
            return None
        elif choice.isdigit() and 1 <= int(choice) <= len(question_sets):
            return question_sets[int(choice) - 1]
        else:
            print("Invalid choice. Please try again.")
            time.sleep(2)

def main():
    while True:
        question_set = select_question_set()
        if question_set is None:
            break

        questions = load_questions(os.path.join('questions', question_set))
        result_folder = os.path.join('results', os.path.splitext(question_set)[0])

        while True:
            mode = input("Choose mode: [quiz/test/reset/change] ").strip().lower()
            if mode == 'quiz':
                all_questions = questions.copy()
                while questions:
                    result = run_quiz(questions, result_folder)
                    if result == 'q!':
                        break
                    all_questions.extend(questions)
                    questions = all_questions[:]
            elif mode == 'test':
                num_questions = 65
                try:
                    num_questions = int(input(f"Enter number of questions for the test (default is 65): ").strip())
                except ValueError:
                    print("Invalid input. Using default value of 65 questions.")

                if len(questions) < num_questions:
                    print("Not enough questions for a test.")
                    continue

                test_questions = random.sample(questions, num_questions)
                correct_count = 0

                for question_data in test_questions:
                    question, choices, correct_answer = question_data['question'], question_data['choices'], question_data['answer']
                    result = ask_question(question, choices, correct_answer, result_folder)
                    if result == 'q!':
                        break
                    if result:
                        correct_count += 1
                
                total_questions = len(test_questions)
                score = (correct_count / total_questions) * 100
                if score > 75:
                    print(f"You Passed with {score:.2f}%!")
                else:
                    print(f"Try again. Your score: {score:.2f}%")
            elif mode == 'reset':
                reset_progress(result_folder)
            elif mode == 'change':
                break
            elif mode == 'q!':
                break
            else:
                print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
