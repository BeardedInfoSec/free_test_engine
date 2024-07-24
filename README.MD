# Quiz Application
This Quiz Application is designed to help you study and test your knowledge using multiple-choice questions stored in a JSON file. It provides modes for both learning and testing, as well as a feature to reset your progress.

## Features
Quiz Mode: Study in batches of 15 questions. Incorrectly answered questions are reintroduced into the question pool until answered correctly.
Test Mode: Randomly selects a specified number of questions (default is 65) to test your knowledge. If you score higher than 75%, you pass; otherwise, you need to try again.
Reset Progress: Clears the logs of correct and incorrect answers, allowing you to start fresh.

## Installation
Clone the Repository:

```
git clone https://github.com/BeardedInfoSec/free_test_engine
cd free_test_engine
```
## Install Dependencies:
Ensure you have Python3 installed. Then, install the required packages using pip:

```pip install -r requirements.txt```

## Add Questions:
Create a questions.json file in the questions directory. 
Add your questions in the following format:
```
[
    {
        "question": "Which one of the following statements about the search command is true?",
        "choices": [
            "A. It does not allow the use of wildcards.",
            "B. It treats field values in a case-sensitive manner.",
            "C. It can only be used at the beginning of the search pipeline.",
            "D. It behaves exactly like search strings before the first pipe."
        ],
        "answer": "D"
    },
    {
        "question": "Which of the following actions can the eval command perform?",
        "choices": [
            "A. Remove fields from results.",
            "B. Create or replace an existing field.",
            "C. Group transactions by one or more fields.",
            "D. Save SPL commands to be reused in other searches."
        ],
        "answer": "B"
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

### Quiz Mode
The quiz is conducted in batches of 15 questions.
After each batch, the application shows your score and percentage.
Incorrect answers are reintroduced into the question pool until you answer them correctly.
### Test Mode
The test randomly selects 65 questions from the question pool by default.
You pass if you score higher than 75%; otherwise, you need to try again.
### Reset Progress
Clears the logs of correct and incorrect answers, allowing you to start fresh.
