import random
import os
import time

def clear_terminal():
    # Clear command as function of OS
    command = 'cls' if os.name == 'nt' else 'clear'
    os.system(command)

qa_pairs = [
    ("Selected fields are displayed ________ each event in the results.", ["A. below", "B. interesting fields", "C. other fields", "D. above"], "A"),
    ("Search terms are not case sensitive. (T/F)", ["T. True", "F. False"], "T"),
    ("These two searches will NOT return the same results.\nSEARCH 1: login failure\nSEARCH 2: \"login failure\" (T/F)", ["T. True", "F. False"], "T"),
    ("A space is implied ______________ in a search string.", ["A. OR", "B. AND", "C. ()", "D. NOT"], "B"),
    ("You can not specify a relative time range, such as 45 seconds ago, for a search (T/F)", ["T. True", "F. False"], "F"),
    ("To use field value data from an event in a Workflow Action, we need to:", ["A. Create tags for the fields.", "B. Select the GET method.", "C. Wrap the field in dollar signs."], "C"),
    ("This Workflow Action type sends field values to external resources.", ["A. POST", "B. GET", "C. Search"], "A"),
    ("Workflow Actions can only be applied to a single field.", ["T. True", "F. False"], "F"),
    ("Hidden fields in a data model:", ["A. will not be displayed to a Pivot user, but can be used to define other datasets", "B. will not be displayed in the dataset editor", "C. will be displayed to a Pivot user that has permissions to the field"], "A"),
    ("_____ datasets can be added to a root dataset to narrow down the search.", ["A. event", "B. child", "C. parent", "D. extracted"], "B"),
    ("Which of these are NOT Data Model dataset types:", ["A. Searches", "B. Events", "C. Transactions", "D. Lookups"], "D"),
    ("You can normalize data for CIM use:\nSelect all that apply.", ["A. Using Knowledge Objects.", "B. At index time.", "C. Only after adding the CIM Add-on."], ["A", "B"]),
    ("By default, data models in the CIM Add-on will search across all indexes.", ["T. True", "F. False"], "T"),
    ("The CIM Add-on indexes extra data and will affect license usage.", ["T. True", "F. False"], "F"),
    ("How many results are shown by default when using a Top or Rare Command?", [], "10"),
    ("Warm buckets in Splunk indexes are named by:", ["A. the timestamps of first and last event in the bucket", "B. a naming convention the administrator determines", "C. the server that sent the events"], "A"),
    ("Which of the following search modes automatically returns all extracted fields in the fields sidebar?", ["A. fast", "B. smart", "C. verbose"], "C"),
    ("Which type of visualization allows you to show a third dimension of data?", ["A. bubble chart", "B. scatter chart", "C. pie chart", "D. area chart"], "A"),
    ("Which option is NOT available with the chart and timechart commands?", ["A. usefill", "B. useother", "C. limit"], "A"),
    ("The ______ clause allows you to define which field is represented on the X axis of a chart.", ["A. over", "B. by"], "A"),
    ("Which of the following are valid options with the chart command?\nSelect all that apply.", ["A. usenull", "B. usefield", "C. fillfield", "D. useother"], ["A", "D"]),
    ("The geom command allows you to create:", ["A. radial gauges", "B. standard maps", "C. choropleth maps"], "C"),
    ("If you want to format values without changing their characteristics, which would you use?", ["A. The fieldformat command", "B. The eval tostring function"], "A"),
    ("You can only use one eval command per search.", ["T. True", "F. False"], "F"),
    ("The eval command 'if' function requires the following three arguments (in order):", ["A. result if false, result if true, boolean expression", "B. boolean expression, result if false, result if true", "C. boolean expression, result if true, result if false", "D. result if true, result if false, boolean expression"], "C"),
    ("Mark the terms that fill in the blanks in the correct order: Use _____ to see results of a calculation, or group events on a field value. Use _____ to see events correlated together, or grouped by start and end values.", ["A. transaction, stats", "B. stats, transaction"], "B"),
    ("You can create a transaction based on multiple fields.", ["T. True", "F. False"], "T"),
    ("Which function should you use with the transaction command to set the maximum total time between the earliest and latest events returned?", ["A. maxduration", "B. maxspan", "C. maxpause", "D. endswith"], "B"),
    ("Users with this role can reassign Knowledge Objects.", ["A. Admin", "B. User", "C. Power"], "A"),
    ("Knowledge Objects can be used to normalize data.", ["T. True", "F. False"], "T"),
    ("What are the predefined ways Knowledge Objects can be shared?", ["A. Specific App", "B. Private", "C. All Apps", "D. Sourcetype"], ["A", "B", "C"]),
    ("When extracting fields, we may choose to use our own regular expressions.", ["T. True", "F. False"], "T"),
    ("During the validation step of the Field Extractor workflow:", ["A. You cannot modify the field extraction", "B. You can validate where the data originated from", "C. You can remove values that aren't a match for the field you want to define"], "B"),
    ("Once a field is created using the regex method, you cannot modify the underlying regular expression.", ["T. True", "F. False"], "F"),
    ("Calculated fields are based on underlying:", ["A. eval expressions", "B. keyword searches", "C. stats commands"], "A"),
    ("Field aliases are used to _____ data.", ["A. transform", "B. clean", "C. calculate", "D. normalize"], "D"),
    ("Field aliases can only be applied to a single source type, source, or host.", ["T. True", "F. False"], "F"),
    ("Tags can be added to Event Types.", ["T. True", "F. False"], "T"),
    ("These allow you to categorize events based on search terms.", ["A. Macros", "B. Groups", "C. Event Types", "D. Tags"], "C"),
    ("You can only add one tag per field value pair.", ["T. True", "F. False"], "F"),
    ("You can pipe the results of a macro to other commands", ["T. True", "F. False"], "T"),
    ("What is the proper syntax for using a macro named \"us_sales\"", ["A. \"us_sales\"", "B. (us_sales)", "C. us_sales", "D. `us_sales`"], "D"),
    ("The search expansion tool:", ["A. Allows you to see what a macro will expand to before you run a search.", "B. Automatically fills in the variables before you run a search.", "C. Must be used before running a search with a macro."], "A"),
    ("Using the export function, you can export a maximum of 2000 results", ["T. True", "F. False"], "F"),
    ("Which of the following search control will not re-run the search?\nSelect all that apply.", ["A. zoom out", "B. selecting a bar on the timeline", "C. deselect", "D. selecting a range of bars on the timeline"], ["B", "C", "D"]),
    ("Highlighted search terms indicate ______ search results in Splunk.", ["A. display as a selected field", "B. Sorted", "C. Charred based on time", "D. Matching"], "D"),
    ("The Splunk search language does not support wildcards.", ["T. True", "F. False"], "F"),
    ("Historical searches provide a static snapshot of events at a given time.", ["T. True", "F. False"], "T"),
    ("Which of the following Statements about macros is true?\nSelect all that apply.", ["A. Arguments are defined at execution time.", "B. Arguments are defined when the macro is created.", "C. Argument values are used to resolve the search string at execution time.", "D. Argument values are used to resolve the search string when the macro is created"], ["A", "C"]),
    ("What is required for a macro to accept three arguments?", ["A. The macro's name ends with (3).", "B. The macro's name starts with (3).", "C. The macro's argument count setting is 3 or more.", "D. Nothing, all macros can accept any number of arguments."], "A"),
    ("Which of the following statements describes POST workflow actions?", ["A. POST workflow actions are always encrypted.", "B. POST workflow actions cannot use field values in their URI.", "C. POST workflow actions cannot be created on custom sourcetypes.", "D. POST workflow actions can open a web page in either the same window or a new one."], "D"),
    ("Which of the following searches show a valid use of macro?\nSelect all that apply.", ["A. index=main source=mySource oldField=* | 'makeMyField(oldField)' | table _time newField", "B. index=main source=mySource oldField=* | state if ('makeMyField(oldField ' ) | table _time", "C. index=main source=mySource oldField=* | eval newField= 'makeMyField(oldField) ' | table _time", "D. index=main source=mySource oldField=* | \"'newField('makeMyField(oldField) \" ) ' \" | table _time"], ["A", "C"]),
    ("Which of the following workflow actions can be executed from search results?\nSelect all that apply.", ["A. GET", "B. POST", "C. LOOKUP", "D. Search"], ["A", "B", "D"]),
    ("Which of the following is the correct way to use the data model command to search field in the data model within the web dataset?", ["A. | datamodel web search | filed web *", "B. | Search datamodel web web | filed web*", "C. | datamodel web web field | search web*", "D. Datamodel=web | search web | filed web*"], "A"),
    ("Which of the following searches will return events containing a tag named Privileged?", ["A. Tag= Priv", "B. Tag= Priv*", "C. Tag= Priv*", "D. Tag= Privileged"], "D"),
    ("Which of the following statements describes this search?\nsourcetype=access_combined | transaction JSESSIONID | timechart avg (duration)", ["A. This is a valid search and will display a timechart of the average duration, of each transaction event.", "B. This is a valid search and will display a stats table showing the maximum pause among transactions.", "C. No results will be returned because the transaction command must include the startswith and endswith options.", "D. No results will be returned because the transaction command must be the last command used in the search pipeline."], "A"),
    ("Calculated fields can be based on which of the following?", ["A. Tags", "B. Extracted fields", "C. Output fields for a lookup", "D. Fields generated from a search string"], "B"),
    ("When multiple event types with different color values are assigned to the same event, what determines the color displayed for the events?", ["A. Rank", "B. Weight", "C. Priority", "D. Precedence"], "C"),
    ("Which of the following statements describes the command below?\nSelect all that apply.\nsourcetype=access_combined | transaction JSESSIONID", ["A. An additional field named maxspan is created.", "B. An additional field named duration is created.", "C. An additional field named eventcount is created.", "D. Events with the same JSESSIONID will be grouped together into a single event."], ["B", "C"]),
    ("Which of the following can be used with the eval command tostring function?\nSelect all that apply.", ["A. 'hex'", "B. 'commas'", "C. 'Decimal'", "D. 'duration'"], ["A", "B", "D"]),
    ("Historical searches provide a static snapshot of events at a given time (T/F)", ["T. True", "F. False"], "T"),
    ("Using the export function, you can export a maximum of 2000 results. (T/F)", ["T. True", "F. False"], "F"),
    ("Which of the following search controls will not re-run the search?\nSelect all that apply.", ["A. zoom out", "B. selecting a bar on the timeline", "C. deselect", "D. selecting a range of bars on the timeline"], ["B", "C", "D"]),
    ("Highlighted search terms indicate ______ search results in Splunk.", ["A. display as selected field", "B. sorted", "C. chart based on time", "D. matching"], "D"),
    ("The Splunk search language does not support wildcards (T/F)", ["T. True", "F. False"], "F"),
    ("The Splunk search language supports the + wildcard (T/F)", ["T. True", "F. False"], "F"),
    ("When you mouse over and click to add a search term this/these boolean operator(s) is/are not implied.\nSelect all that apply.", ["A. OR", "B. ( )", "C. AND", "D. NOT"], "B"),
    ("Using the export function, you can export search results as _____\nSelect all that apply.", ["A. XML", "B. JSON", "C. HTML", "D. a PHP file"], ["A", "B"]),
    ("These kinds of fields are identified in your data at INDEX time.", ["A. data-specific fields", "B. default fields"], "B"),
    ("Default fields are not added to every event in Splunk at INDEX time. (T/F)", ["T. True", "F. False"], "F"),
    ("The fields sidebar does not show ______\nSelect all that apply.", ["A. interesting fields", "B. selected fields", "C. all extracted fields"], "C"),
    ("Only Splunk Admins can assign selected fields (T/F)", ["T. True", "F. False"], "F"),
    ("This search user!=*", ["A. displays only events that contain a value for the user", "B. displays all events", "C. displays only events that do not contain a value for the user"], "C"),
    ("The interesting fields in the fields sidebar is based on what fields you have requested in the past. (T/F)", ["T. True", "F. False"], "F"),
    ("Which mode automatically decides how to return fields based on your search?", ["A. Verbose", "B. Fast", "C. Smart"], "C"),
    ("Which search mode returns all fields?", ["A. Verbose", "B. Fast", "C. Smart"], "A"),
    ("Splunk alerts can be based on a search that run _________\nSelect all that apply.", ["A. in real time", "B. on a regular schedule", "C. and have no matching events"], ["A", "B"]),
    ("Alert throttling is used to ________", ["A. verify each alert", "B. stagger search request in a time-sequenced order", "C. stop spamming yourself with alerts", "D. check severity"], "C"),
    ("Scheduled alerts must be scheduled to run with cron job syntax only (T/F)", ["T. True", "F. False"], "F"),
    ("A report scheduled to run every 15 mins, but it takes 17 mins to complete, is in danger of being", ["A. skipped or deferred", "B. automatically accelerated", "C. deleted", "D. all the above"], "A"),
    ("Custom charts can be created in the fields sidebar (T/F)", ["T. True", "F. False"], "F"),
    ("Which of the following are valid options to speed up reports?\nSelect all that apply.", ["A. Edit permissions", "B. Edit description", "C. Edit acceleration", "D. Edit schedule"], "C"),
    ("After you create a pivot, you can save it as a _________\nSelect all that apply.", ["A. tag", "B. eventtype", "C. report", "D. dashboard panel"], ["C", "D"]),
    ("Pivot editor has a map visualization option (T/F)", ["T. True", "F. False"], "F"),
    ("New pivots automatically populate with ______\nSelect all that apply.", ["A. Split rows", "B. Split columns", "C. Count of hosts", "D. Time range filter"], "D"),
    ("Internal fields, such as _raw and _time can be explicitly removed from results with fields command (T/F)", ["T. True", "F. False"], "F"),
    ("This function on the stats command allows you to return the sample standard deviation of a field.", ["A. stdev", "B. dev", "C. count deviation", "D. by standarddev"], "A"),
    ("This clause is used to group the output of a stats command by a specific name", ["A. Rex", "B. As", "C. List", "D. By"], "D"),
    ("When a search returns _________ you can view it as a list", ["A. a list of events", "B. transactions", "C. statistical values"], "C"),
    ("Clicking on a SEGMENT on a chart __________.", ["A. drills down for that data", "B. highlights the field value across the chart", "C. adds the highlighted value to the search criteria"], "C")
]

def log_question(question, correct, filename):
    with open(filename, 'a') as file:
        file.write(f"Question: {question}\n")
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
        log_question(question, correct_answer, "correct_answers.txt")
    else:
        print(f"Incorrect. The correct answer is: {correct_answer}")
        time.sleep(5)
        log_question(question, correct_answer, "incorrect_answers.txt")

def main():
    random.shuffle(qa_pairs)
    for question, choices, correct_answer in qa_pairs:
        ask_question(question, choices, correct_answer)
        print()

if __name__ == "__main__":
    main()
