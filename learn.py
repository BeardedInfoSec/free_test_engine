import json
import random
import os
import time

def clear_terminal():
    command = 'cls' if os.name == 'nt' else 'clear'
    os.system(command)

def load_questions(filename):
    with open(filename, 'r') as file:
        return json.load(file)

def log_question(question, choices, correct, filename):
    with open(filename, 'a') as file:
        file.write(f"Question: {question}\n")
        for choice in choices:
            file.write(f"{choice}\n")
        file.write(f"Answer: {correct}\n\n")

def ask_question(question, choices, correct_answer):
    clear_terminal()
    
    print(f"Question: {question}")
    for choice in choices:
        print(choice)
    
    user_answer = input("Your answer (enter the letter): ").upper()
    
    if isinstance(correct_answer, list):
        correct = all(ans in user_answer for ans in correct_answer)
    else:
        correct = user_answer == correct_answer

    if correct:
        print("Correct!")
        log_question(question, choices, correct_answer, "correct_answers.txt")
    else:
        print(f"Incorrect. The correct answer is: {correct_answer}")
        log_question(question, choices, correct_answer, "incorrect_answers.txt")
        time.sleep(5)
    
    return correct

def run_quiz(questions, batch_size=15):
    correct_count = 0
    incorrect_questions = []

    for i in range(0, len(questions), batch_size):
        batch = questions[i:i + batch_size]
        for question_data in batch:
            question, choices, correct_answer = question_data['question'], question_data['choices'], question_data['answer']
            correct = ask_question(question, choices, correct_answer)
            if correct:
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

def reset_progress():
    open("correct_answers.txt", 'w').close()
    open("incorrect_answers.txt", 'w').close()
    print("Progress has been reset.")

def main():
    questions = load_questions('questions.json')
    mode = input("Choose mode: [quiz/test/reset] ").strip().lower()
    
    if mode == 'quiz':
        all_questions = questions.copy()
        while questions:
            questions = run_quiz(questions)
            all_questions.extend(questions)
            questions = all_questions[:]
    elif mode == 'test':
        if len(questions) < 65:
            print("Not enough questions for a test.")
            return

        test_questions = random.sample(questions, 65)
        correct_count = 0

        for question_data in test_questions:
            question, choices, correct_answer = question_data['question'], question_data['choices'], question_data['answer']
            correct = ask_question(question, choices, correct_answer)
            if correct:
                correct_count += 1
        
        total_questions = len(test_questions)
        score = (correct_count / total_questions) * 100
        if score > 75:
            print(f"You Passed with {score:.2f}%!")
        else:
            print(f"Try again. Your score: {score:.2f}%")
    elif mode == 'reset':
        reset_progress()

if __name__ == "__main__":
    main()
