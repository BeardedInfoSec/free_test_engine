import json
import os
import random
import time
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

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
            file.write(f"{choice}\n")
        file.write(f"Answer: {correct}\n\n")

def ask_question(question, choices, correct_answer, result_folder):
    clear_terminal()

    print(Fore.WHITE + "('q!' to return to the main menu):\n")
    print(Fore.CYAN + f"Question: {question}")
    for choice in choices:
        print(Fore.YELLOW + f"  {choice}")
    
    try:
        user_answer = input(Fore.WHITE + "\nYour answer: ").upper()
    except EOFError:
        print(Fore.RED + "\nInput error occurred. Returning to the main menu.")
        return 'q!'
    except Exception as e:
        print(Fore.RED + f"\nAn error occurred: {e}. Returning to the main menu.")
        return 'q!'

    if user_answer == 'Q!':
        return 'q!'

    if isinstance(correct_answer, list):
        correct = all(ans in user_answer for ans in correct_answer)
    else:
        correct = user_answer == correct_answer

    if correct:
        print(Fore.GREEN + "Correct!")
        log_question(question, choices, correct_answer, result_folder, "correct_answers.txt")
        time.sleep(0.5)
    else:
        print(Fore.RED + f"Incorrect. The correct answer is: {correct_answer}")
        log_question(question, choices, correct_answer, result_folder, "incorrect_answers.txt")
        time.sleep(5)
    
    return correct

def run_quiz(questions, result_folder, correct_questions_set, batch_size=15):
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
                correct_questions_set.add(question)
            else:
                incorrect_questions.append(question_data)

        total_questions = len(batch)
        incorrect_count = total_questions - correct_count
        print(Fore.CYAN + f"\nBatch Results: {correct_count} correct, {incorrect_count} incorrect.")
        percentage = (correct_count / total_questions) * 100
        print(Fore.CYAN + f"Percentage: {percentage:.2f}%\n")
        correct_count = 0

        time.sleep(5)

    return incorrect_questions

def reset_progress(result_folder, correct_questions_set):
    if os.path.exists(result_folder):
        for file in os.listdir(result_folder):
            file_path = os.path.join(result_folder, file)
            if os.path.isfile(file_path):
                open(file_path, 'w').close()
    correct_questions_set.clear()
    print(Fore.GREEN + "Progress has been reset.")

def select_question_set():
    question_sets = os.listdir('questions')
    index = 0

    while True:
        clear_terminal()
        print(Fore.CYAN + "Select a Question Set:\n")
        for i in range(index, min(index + 5, len(question_sets))):
            print(Fore.YELLOW + f"{i + 1}. {question_sets[i]}")
        
        if len(question_sets) > 5:
            if index + 5 < len(question_sets):
                print(Fore.MAGENTA + "\nN. Next")
            if index > 0:
                print(Fore.MAGENTA + "B. Back")

        print(Fore.MAGENTA + "\nEnter the number of the question set to select, or 'q!' to quit.")
        choice = input(Fore.WHITE + "Choice: ").strip().upper()

        if choice == 'N' and index + 5 < len(question_sets):
            index += 5
        elif choice == 'B' and index > 0:
            index -= 5
        elif choice == 'Q!':
            return None
        elif choice.isdigit() and 1 <= int(choice) <= len(question_sets):
            return question_sets[int(choice) - 1]
        else:
            print(Fore.RED + "Invalid choice. Please try again.")
            time.sleep(2)

def main():
    correct_questions_set = set()

    while True:
        question_set = select_question_set()
        if question_set is None:
            break

        questions = load_questions(os.path.join('questions', question_set))
        result_folder = os.path.join('results', os.path.splitext(question_set)[0])

        while True:
            print(Fore.CYAN + "\nChoose Mode:")
            print(Fore.YELLOW + "  1. quiz")
            print(Fore.YELLOW + "  2. test")
            print(Fore.YELLOW + "  3. reset")
            print(Fore.YELLOW + "  4. change")
            mode = input(Fore.WHITE + "\nEnter your choice (1-4) or 'q!' to quit: ").strip().lower()

            if mode == '1' or mode == 'quiz':
                questions_to_ask = [q for q in questions if q['question'] not in correct_questions_set]
                if not questions_to_ask:
                    print(Fore.GREEN + "All questions have been answered correctly. Consider resetting progress to start over.")
                    continue

                all_questions = questions_to_ask.copy()
                while questions_to_ask:
                    result = run_quiz(questions_to_ask, result_folder, correct_questions_set)
                    if result == 'q!':
                        break
                    all_questions.extend(questions_to_ask)
                    questions_to_ask = [q for q in all_questions if q['question'] not in correct_questions_set]
            elif mode == '2' or mode == 'test':
                num_questions = 65
                try:
                    num_questions = int(input(Fore.MAGENTA + f"Enter number of questions for the test (default is 65): ").strip())
                except ValueError:
                    print(Fore.RED + "Invalid input. Using default value of 65 questions.")

                if len(questions) < num_questions:
                    print(Fore.RED + "Not enough questions for a test.")
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
                    print(Fore.GREEN + f"You Passed with {score:.2f}%!")
                else:
                    print(Fore.RED + f"Try again. Your score: {score:.2f}%")
            elif mode == '3' or mode == 'reset':
                reset_progress(result_folder, correct_questions_set)
            elif mode == '4' or mode == 'change':
                break
            elif mode == 'q!':
                break
            else:
                print(Fore.RED + "Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
