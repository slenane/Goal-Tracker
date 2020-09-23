//##########################
// NPM PACKAGES
//##########################
const Quote = require("inspirational-quotes");

//##########################
// DATA CONTROLLER
//##########################
let dataController = (function () {
    class Goal {
        constructor(id, goal) {
            this.id = id;
            this.goal = goal;
            this.percentage = -1;
        }
    }

    class Category extends Goal {
        constructor(id, goal) {
            super(id, goal);
            this.subgoals = [];
            this.percentage = -1;
        }
    }

    class Quit extends Goal {
        constructor(id, goal, date) {
            super(id, goal);
            this.date = date;
            this.percentage = -1;
        }
    }

    class Subgoal {
        constructor(id, type, goal, target) {
            this.id = id;
            this.type = type;
            this.goal = goal;
            this.target = target;
        }
    }

    let allGoals = {
        goalType: {
            goal: [],
            quit: [],
        },
    };

    return {
        addGoal: function (type, goal, date) {
            let newGoal, ID;

            // Create an ID for the goal
            if (allGoals.goalType[type].length > 0) {
                ID =
                    allGoals.goalType[type][allGoals.goalType[type].length - 1]
                        .id + 1;
            } else {
                ID = 0;
            }
            // Create new goal based on type
            if (type === "goal") {
                newGoal = new Category(ID, goal);
            } else if (type === "quit") {
                newGoal = new Quit(ID, goal, date);
            }
            // Push new goal into goals array
            allGoals.goalType[type].push(newGoal);
            // Return the new goal
            console.log(newGoal, allGoals.goalType[type]);
            return newGoal;
        },

        addSubgoal: function (goal, parentID, type, target) {
            let newSubgoal, ID;

            if (allGoals.goalType["goal"][parentID].subgoals.length > 0) {
                ID = allGoals.goalType["goal"][parentID].subgoals.length;
            } else {
                ID = 0;
            }

            newSubgoal = new Subgoal(ID, type, goal, target);
            console.log(newSubgoal);

            allGoals.goalType["goal"][parentID].subgoals.push(newSubgoal);
            console.log(allGoals.goalType["goal"][parentID]);

            return newSubgoal;
        },
    };
})();

//##########################
// UI CONTROLLER
//##########################

let UIController = (function () {
    let DOMstrings = {
        goalType: ".add-goal-type",
        goalInput: ".add-goal-input",
        goalDate: ".add-goal-date",
        goalSubmit: ".add-goal-button",
        goalsList: ".goals",
        goalItem: ".grid-item",
        subgoalType: ".add-subgoal-type",
        subgoalInput: ".add-subgoal-input",
        subgoalTarget: ".add-subgoal-target",
        subgoalSubmit: ".add-subgoal-button",
        subgoalsList: ".subgoals-list",
        currentYear: ".current-year",
        hideMessage: ".no-goals",
    };

    let nodeListForEach = function (list, callback) {
        for (let i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getinput: function () {
            return {
                type: document.querySelector(DOMstrings.goalType).value,
                goal: document.querySelector(DOMstrings.goalInput).value,
                date: document.querySelector(DOMstrings.goalDate).value,
            };
        },

        getSubgoalInput: function () {
            let currentGoal, input;
            let allInputs = document.querySelectorAll(DOMstrings.subgoalInput);

            nodeListForEach(allInputs, function (current, index) {
                if (allInputs[index].value !== "") {
                    currentGoal = allInputs[index].parentElement;
                    input = allInputs[index].value;
                }
            });

            if (input) {
                return {
                    type: currentGoal.querySelector(DOMstrings.subgoalType)
                        .value,
                    goal: input,
                    target: currentGoal.querySelector(DOMstrings.subgoalTarget)
                        .value,
                };
            }
        },

        addListItem: function (obj, type, date, parentID) {
            let element, html, currentGoal, newHtml;
            let goalDate = date;
            // Create HTML string with placeholder text
            if (type === "goal") {
                element = DOMstrings.goalsList;

                html = `
                <div class="grid-item goal-item" id="goal-%id%">
                        <button class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                        <h2 class="goal-title-1">%title%</h2>
                        <div class="percentage">
                            <img
                                class="percentage-wheel"
                                src="./images/percentage-sample.jpg"
                                alt="percentage wheel"
                            />
                        </div>
                        <div class="subgoals">
                            <ul class="subgoals-list">
                            </ul>
                            <div class="add-subgoal">
                                <select name="type" class="add-subgoal-type">
                                    <option
                                        value="checkbox"
                                        selected
                                    >
                                        checkbox
                                    </option>
                                    <option value="target">
                                        target
                                    </option>
                                </select>
                                <input
                                    type="text"
                                    class="add-subgoal-input"
                                    placeholder="Add A Subgoal"
                                />
                                <input
                                    type="number"
                                    name="subgoal-target"
                                    placeholder="goal target"
                                    class="add-subgoal-target hide" 
                                    step="1"
                                />
                                <input
                                    type="button"
                                    class="add-subgoal-button"
                                    value="Add Goal"
                                />
                            </div>
                        </div>
                    </div>
             `;
            } else if (type === "quit") {
                element = DOMstrings.goalsList;
                html = `
                    <div class="grid-item quit-item" id="quit-%id%">
                        <button class="close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                        <h2 class="goal-title">%title%</h2>
                        <img
                            class="no-symbol"
                            src="./images/no-symbol.png"
                            alt="no-symbol"
                        />
                        <p class="days">%date% days</p>
                    </div>
                     `;
            } else if (type === "target") {
                let goals = document.querySelectorAll(DOMstrings.goalItem);

                nodeListForEach(goals, function (current, index) {
                    if (goals[index].id === `goal-${parentID}`) {
                        currentGoal = goals[index];
                    }
                });

                html = `
                <li
                    class="subgoal-item subgoal-target"
                    id="subgoal-%id%"
                >
                    <label>
                        <label for="target">%title%: 0</label>
                        <progress
                            id="target"
                            value="0"
                            max="%target%"
                        ></progress
                    >%target%</label>
                </li>
                `;
            } else if (type === "checkbox") {
                let goals = document.querySelectorAll(DOMstrings.goalItem);

                nodeListForEach(goals, function (current, index) {
                    if (goals[index].id === `goal-${parentID}`) {
                        currentGoal = goals[index];
                    }
                });

                html = `
                <li
                    class="subgoal-item subgoal-checkbox"
                    id="subgoal-%id%"
                >
                    <label>
                        %title%
                        <input
                            type="checkbox"
                            id="checkbox-%id%"
                    /></label>
                </li>
                `;
            }

            // Replace placeholder text with actual data
            newHtml = html.replace(/%id%/g, obj.id);
            newHtml = newHtml.replace(/%title%/g, obj.goal);
            newHtml = newHtml.replace(
                /%date%/g,
                Math.floor(
                    (new Date().getTime() - goalDate) / (60 * 60 * 24 * 1000)
                )
            );
            newHtml = newHtml.replace(/%target%/g, obj.target);
            // Insert into the DOM
            if (type === "target" || type === "checkbox") {
                currentGoal
                    .querySelector(DOMstrings.subgoalsList)
                    .insertAdjacentHTML("beforeend", newHtml);
            } else {
                document
                    .querySelector(element)
                    .insertAdjacentHTML("beforeend", newHtml);
            }
        },

        openGoal: function (goal) {
            if (goal.classList.contains("grid-item")) {
                // Close any open goals
                let allGoals = document.querySelectorAll(DOMstrings.goalItem);

                nodeListForEach(allGoals, function (current, index) {
                    allGoals[index].classList.remove("open");
                });

                // Open target gaol
                goal.classList.add("open");
            }
        },

        closeGoal: function (button) {
            if (button) {
                button.parentNode.classList.remove("open");
            }
        },

        clearFields: function () {
            let goalField = document.querySelector(DOMstrings.goalInput);
            let dateField = document.querySelector(DOMstrings.goalDate);
            let subgoalFields = document.querySelectorAll(
                DOMstrings.subgoalInput
            );
            let subgoalTargets = document.querySelectorAll(
                DOMstrings.subgoalTarget
            );

            goalField.value = "";
            dateField.value = "";

            nodeListForEach(subgoalFields, function (current, index) {
                if (subgoalFields[index]) {
                    subgoalFields[index].value = "";
                    subgoalTargets[index].value = "";
                }
            });
        },

        hideMessage: function () {
            document
                .querySelector(DOMstrings.hideMessage)
                .classList.add("hide");
        },

        changeType: function (e) {
            if (e.target.matches(".add-goal-type")) {
                document
                    .querySelector(DOMstrings.goalDate)
                    .classList.toggle("hide");
            } else if (e.target.matches(".add-subgoal-type")) {
                let subgoalTargets = document.querySelectorAll(
                    DOMstrings.subgoalTarget
                );
                nodeListForEach(subgoalTargets, function (current, index) {
                    if (subgoalTargets[index]) {
                        subgoalTargets[index].classList.toggle("hide");
                    }
                });
            }
        },

        displayYear: function () {
            let now = new Date();
            let year = now.getFullYear();

            document.querySelector(DOMstrings.currentYear).textContent = year;
        },

        displayQuote: function () {
            let dailyQuote, html, newHtml;

            dailyQuote = Quote.getQuote();

            html = `
                <p class="quote-text">
                    "%quote%"  -
                    <span class="quote-author">%quote-author%</span>
                </p>
            `;

            newHtml = html.replace(/%quote%/g, dailyQuote.text);
            newHtml = newHtml.replace(/%quote-author%/g, dailyQuote.author);

            document
                .querySelector(".quote")
                .insertAdjacentHTML("beforeend", newHtml);
        },

        getDOMstrings: function () {
            return DOMstrings;
        },
    };
})();

//##########################
// GLOBAL APP CONTROLLER
//##########################

let controller = (function (dataCtrl, UICtrl) {
    let setUpEventListeners = function () {
        let DOM = UICtrl.getDOMstrings();

        // Listen for click on add goal button
        document
            .querySelector(DOM.goalSubmit)
            .addEventListener("click", ctrlAddGoal);

        // Listen for enter keypress to add goal
        document.addEventListener("keypress", function (e) {
            // .which is used for compatability with older browsers that don't have the keyCode property
            if (e.keyCode === 13 || e.which === 13) {
                ctrlAddGoal();
            }
        });

        // Listen for click on add subgoal button
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlAddSubGoal);

        // Listen for click to open goal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlOpenGoal);

        // Listen for click to close goal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlCloseGoal);

        // Listen for goal type change
        document
            .querySelector(DOM.goalType)
            .addEventListener("change", UICtrl.changeType);

        // Listen for goal type change
        document
            .querySelector(DOM.goalsList)
            .addEventListener("change", UICtrl.changeType);
    };

    let ctrlAddGoal = function () {
        let input, newGoal, date, newDate;
        // Get input from user
        input = UICtrl.getinput();

        // If the type is goal and the field is not empty
        if (input.type === "goal" && input.goal !== "") {
            // Add the goal to the data controller
            newGoal = dataCtrl.addGoal(input.type, input.goal);

            // Remove add goal message and add the goal to the UI
            UICtrl.hideMessage();
            UICtrl.addListItem(newGoal, input.type);

            // Clear the input field
            UICtrl.clearFields();
        }

        // If the type is quit and the field/date are not empty
        if (
            input.type === "quit" &&
            input.goal !== "" &&
            input.date !== "" &&
            new Date(input.date) < new Date()
        ) {
            // Convert date into timestamp
            date = input.date.split("-");
            newDate = new Date(date[0], date[1] - 1, date[2]);
            newDate = newDate.getTime();

            // Add the goal to the data controller
            newGoal = dataCtrl.addGoal(input.type, input.goal, newDate);

            // Remove add goal message and add the goal to the UI
            UICtrl.hideMessage();
            UICtrl.addListItem(newGoal, input.type, newDate);

            // Clear the input field
            UICtrl.clearFields();
        } else if (new Date(input.date) > new Date()) {
            alert("Please enter a valid date");
        }
    };

    let ctrlAddSubGoal = function (e) {
        let button, parent, parentID, input, newSubgoal;

        button = e.target.matches(".add-subgoal-button");

        if (button) {
            parent = e.target.parentElement.parentElement.parentElement.id.split(
                "-"
            );
            parentID = parent[1];
            input = UICtrl.getSubgoalInput();

            if (input) {
                if (
                    input.type === "target" &&
                    input.goal !== "" &&
                    input.goal !== undefined &&
                    input.target !== "" &&
                    input.target > 0
                ) {
                    // Add the subgoal to the data controller
                    newSubgoal = dataCtrl.addSubgoal(
                        input.goal,
                        parentID,
                        input.type,
                        input.target
                    );
                    // Add subgoal to the UI
                    UICtrl.addListItem(
                        newSubgoal,
                        input.type,
                        undefined,
                        parentID
                    );
                    // Clear the input field
                    UICtrl.clearFields();
                } else if (input.type === "checkbox" && input.goal !== "") {
                    // Add the subgoal to the data controller
                    newSubgoal = dataCtrl.addSubgoal(
                        input.goal,
                        parentID,
                        input.type
                    );
                    // Add subgoal to the UI
                    UICtrl.addListItem(
                        newSubgoal,
                        input.type,
                        undefined,
                        parentID
                    );
                    // Clear the input field
                    UICtrl.clearFields();
                }
            }
        }
    };

    let ctrlOpenGoal = function (e) {
        // Add open class to element
        let goal = e.target.closest(".goal-item");
        if (goal) {
            UICtrl.openGoal(goal);
        }
    };

    let ctrlCloseGoal = function (e) {
        // Remove open class from element
        if (e.target.parentElement.parentElement.classList.contains("open")) {
            let close = e.target.closest(".close-btn");

            UICtrl.closeGoal(close);
        }
    };

    return {
        init: function () {
            console.log("The application has started");
            UICtrl.displayYear();
            UICtrl.displayQuote();
            setUpEventListeners();
        },
    };
})(dataController, UIController);

controller.init();
