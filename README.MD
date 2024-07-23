
## Quiz Application:

This Quiz Application is designed to help you study and test your knowledge using multiple-choice questions stored in a JSON file. It provides modes for both learning and testing, as well as a feature to reset your progress.

## Features

- **Quiz Mode**: Study in batches of 15 questions. Incorrectly answered questions are reintroduced into the question pool until answered correctly.
- **Test Mode**: Randomly selects 65 questions to test your knowledge. If you score higher than 75%, you pass; otherwise, you need to try again.
- **Reset Progress**: Clears the logs of correct and incorrect answers, allowing you to start fresh.

## Installation

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/BeardedInfoSec/free_test_engine
   cd <repository_directory>
## Install Dependencies:
Ensure you have Python installed. This script uses only the standard library, so no additional dependencies are needed.

## Add Questions:
Create a questions.json file in the same directory as the script. Add your questions in the following format:
```
[
    {
        "question": "Selected fields are displayed ________ each event in the results.",
        "choices": ["A. below", "B. interesting fields", "C. other fields", "D. above"],
        "answer": "A"
    },
    {
        "question": "Search terms are not case sensitive. (T/F)",
        "choices": ["T. True", "F. False"],
        "answer": "T"
    }
    // Add more questions here
]
```
## Usage
Run the Application:
```
python quiz_app.py
```
## Choose Mode:

##### quiz: 
Start the quiz in learning mode.
##### test: 
Take a test with 65 random questions.
##### reset: 
Reset your progress by clearing the logs.
## Quiz Mode:

The quiz is conducted in batches of 15 questions.
After each batch, the application shows your score and percentage.
Incorrect answers are reintroduced into the question pool until you answer them correctly.
## Test Mode:

The test randomly selects 65 questions from the question pool.
You pass if you score higher than 75%; otherwise, you need to try again.
## Reset Progress:

Clears the logs of correct and incorrect answers, allowing you to start fresh.
## Logging
Correct Answers: Logged in correct_answers.txt.
Incorrect Answers: Logged in incorrect_answers.txt.
The log format includes the question, choices, and the correct answer.

## Example
##### Choose mode: [quiz/test/reset] quiz
```
Question: Selected fields are displayed ________ each event in the results.
A. below
B. interesting fields
C. other fields
D. above
Your answer (enter the letter): A
Correct!
```
## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## Contact
For questions or feedback, please reach out to abarbas19@gmail.com.
