//##########################
// NPM PACKAGES + IMPORTS
//##########################
const Quote = require("inspirational-quotes");

import "../css/style.css";

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

        deleteGoal: function (type, id) {
            let ids, index;

            ids = allGoals.goalType[type].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                allGoals.goalType[type].splice(index, 1);
            }

            if (allGoals.goalType[type].length < 1) {
                document.querySelector(".no-goals").classList.remove("hide");
            }
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

        deleteSubgoal: function (id, parentID) {
            let ids, index;

            ids = allGoals.goalType["goal"][parentID].subgoals.map(function (
                current
            ) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                allGoals.goalType["goal"][parentID].subgoals.splice(index, 1);
            }

            if (allGoals.goalType["goal"][parentID].subgoals.length < 1) {
                let currentGoal = document.querySelector(`#goal-${parentID}`);
                currentGoal.querySelector(".no-goals").classList.remove("hide");
            }
        },
    };
})();

//##########################
// UI CONTROLLER
//##########################

let UIController = (function () {
    let DOMstrings = {
        navbar: ".navbar",
        addGoalButton: ".add-goal-icon",
        addGoalMenu: ".add-goal",
        goalType: ".add-goal-type",
        goalInput: ".add-goal-input",
        goalDate: ".add-goal-date",
        goalSubmit: ".add-goal-button",
        goalOptions: ".show-goal-options",
        goalsList: ".goals",
        goalItem: ".grid-item",
        subgoalType: ".add-subgoal-type",
        subgoalInput: ".add-subgoal-input",
        subgoalTarget: ".add-subgoal-target",
        subgoalSubmit: ".add-subgoal-button",
        subgoalsList: ".subgoals-list",
        subgoalItem: ".subgoal-item",
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

        showAddGoalMenu: function (button, target) {
            if (button) {
                let subgoal = button.querySelector(".add-subgoal");

                subgoal.classList.toggle("invisible");
                button.querySelector(".add-subgoal-input").focus();

                if (!subgoal.classList.contains("invisible")) {
                    target.parentElement.innerHTML = `<i class="fas fa-minus nav-icons show-add-subgoal"></i>`;
                } else {
                    target.parentElement.innerHTML = `<i class="fas fa-plus nav-icons show-add-subgoal"></i>`;
                }
            } else {
                let menu = document.querySelector(DOMstrings.addGoalMenu);

                menu.classList.toggle("invisible");
                document.querySelector(DOMstrings.goalInput).focus();

                if (!menu.classList.contains("invisible")) {
                    target.parentElement.innerHTML = `<i class="fas fa-minus nav-icons show-add-goal"></i>`;
                } else {
                    target.parentElement.innerHTML = `<i class="fas fa-plus nav-icons show-add-goal"></i>`;
                }
            }
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

        addListItem: function (obj, type, date, parentID) {
            let element, html, currentGoal, newHtml;
            let goalDate = date;
            // Create HTML string with placeholder text
            if (type === "goal") {
                element = DOMstrings.goalsList;

                html = `
                <div class="grid-item goal-item" id="goal-%id%">
                        <div class="subgoals">
                            <nav class="subgoals-nav">
                                <div class="buttons btn-1">
                                    <button class="add-subgoal-button">
                                        <i
                                            class="fas fa-plus nav-icons show-add-subgoal"
                                        ></i>
                                    </button>
                                </div>
                                <div class="add-subgoal invisible">
                                    <select
                                        name="type"
                                        class="add-subgoal-type"
                                    >
                                        <option value="checkbox" selected>
                                            checkbox
                                        </option>
                                        <option value="target">target</option>
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
                                <div class="buttons btn-2">
                                    <button class="show-options">
                                        <i
                                            class="fas fa-bars nav-icons sub-options-icon"
                                        ></i>
                                    </button>
                                </div>
                                <div class="buttons btn-3">
                                    <button class="close-btn">
                                        <i
                                            class="fas fa-times nav-icons close-icon"
                                        ></i>
                                    </button>
                                </div>
                            </nav>
                        </div>

                        <div class="main-goal">
                            <div class="edit-delete-options hide">
                                <button class="edit"><i class="fas fa-edit edit-icon"></i></button>
                                <button class="delete"><i class="fas fa-trash-alt delete-icon"></i></button>
                            </div>
                            <h2 class="goal-title">%title%</h2>
                            <div class="percentage">
                                <img
                                    class="percentage-wheel"
                                    src="./images/percentage-sample.jpg"
                                    alt="percentage wheel"
                                />
                            </div>
                        </div>
                        <div class="no-goals">
                            <p>Add a subgoal category +</p>
                        </div>

                        <ul class="subgoals-list"></ul>
                    </div>
             `;
            } else if (type === "quit") {
                element = DOMstrings.goalsList;
                html = `
                    <div class="grid-item quit-item" id="quit-%id%">
                        <div class="main-goal">
                            <div class="edit-delete-options hide">
                                <button class="edit"><i class="fas fa-edit edit-icon"></i></button>
                                <button class="delete"><i class="fas fa-trash-alt delete-icon"></i></button>
                            </div>
                            <h2 class="goal-title">%title%</h2>
                            <img
                                class="no-symbol"
                                src="./images/no-symbol.png"
                                alt="no-symbol"
                            />
                            <p class="days">%date% days</p>
                        </div>
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
                <p>%title%</p>
                <div class="progress">
                    <div class="progress-filled"></div>
                </div>
                <div class="subgoal-edit-delete-options hide">
                    <span class="option-icons">
                        <i class="fas fa-edit sub-edit-icon"></i> 
                    </span>
                    <span class="option-icons">
                        <i class="fas fa-trash-alt sub-delete-icon"></i>
                    </span>
                </div>
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
                <p class="subgoal-text">%title%</p>
                <p class="subgoal-check-icon"><i class="fas fa-square"></i></p>
                <div class="subgoal-edit-delete-options hide">
                    <span class="option-icons">
                        <i class="fas fa-edit sub-edit-icon"></i> 
                    </span>
                    <span class="option-icons">
                        <i class="fas fa-trash-alt sub-delete-icon"></i>
                    </span>
                </div>
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

        toggleGoalOptionsDisplay: function (type) {
            let goals, currentOptions, currentTitle;

            if (type === "goal") {
                goals = document.querySelectorAll(DOMstrings.goalItem);

                nodeListForEach(goals, function (current, index) {
                    currentOptions = goals[index].querySelector(
                        ".edit-delete-options"
                    );
                    currentTitle = goals[index].querySelector(".goal-title");
                    // Hide/display options
                    currentOptions.classList.toggle("hide");
                    currentTitle.classList.toggle("edit");
                });
            } else if (type === "subgoal") {
                goals = document.querySelectorAll(DOMstrings.subgoalItem);

                nodeListForEach(goals, function (current, index) {
                    currentOptions = goals[index].querySelector(
                        ".subgoal-edit-delete-options"
                    );
                    // Hide/display options
                    currentOptions.classList.toggle("hide");
                });
            }
        },

        removeGoalOptionsDisplay: function () {
            let goals, currentOptions, currentTitle;
            goals = document.querySelectorAll(DOMstrings.goalItem);

            nodeListForEach(goals, function (current, index) {
                currentOptions = goals[index].querySelector(
                    ".edit-delete-options"
                );
                currentTitle = goals[index].querySelector(".goal-title");

                currentOptions.classList.add("hide");
                currentTitle.classList.remove("edit");
            });
        },

        deleteGoalItem: function (goalID) {
            // Select the element to be removed
            let element = document.getElementById(goalID);
            // Move up then select child to delete
            element.parentElement.removeChild(element);
        },

        openGoal: function (goal) {
            if (!goal.classList.contains("open")) {
                let currentGoalIcon, currentGoalAddSubgoal;
                // Close the add subgoal options
                currentGoalIcon = goal.querySelector(".add-subgoal-button");
                currentGoalIcon.innerHTML = ` 
                    <i class="fas fa-plus nav-icons show-add-subgoal"></i> 
                `;

                currentGoalAddSubgoal = goal.querySelector(".add-subgoal");
                currentGoalAddSubgoal.classList.add("invisible");
            }

            if (goal.classList.contains("goal-item")) {
                // Close any open goals
                let allGoals = document.querySelectorAll(DOMstrings.goalItem);

                nodeListForEach(allGoals, function (current, index) {
                    allGoals[index].classList.remove("open");
                });

                // Hide main navbar and options
                document.querySelector(DOMstrings.navbar).classList.add("hide");
                this.removeGoalOptionsDisplay();

                // Open target gaol
                goal.classList.add("open");
            }
        },

        closeGoal: function (button) {
            if (button) {
                button.parentElement.parentElement.parentElement.parentElement.classList.remove(
                    "open"
                );
                // Show main navbar
                document
                    .querySelector(DOMstrings.navbar)
                    .classList.remove("hide");

                // Reset navbar menu if open
                document
                    .querySelector(DOMstrings.addGoalMenu)
                    .classList.add("invisible");
                document.querySelector(
                    DOMstrings.addGoalButton
                ).innerHTML = `<i class="fas fa-plus nav-icons show-add-goal"></i>`;
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

        hideMessage: function (type, parentID) {
            if (type === "goal") {
                document
                    .querySelector(DOMstrings.hideMessage)
                    .classList.add("hide");
            } else if (type === "subgoal") {
                let currentGoal = document.querySelector(`#goal-${parentID}`);
                currentGoal
                    .querySelector(DOMstrings.hideMessage)
                    .classList.add("hide");
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

        displayRandomQuote: function () {
            let dailyQuote, html, newHtml;

            dailyQuote = Quote.getRandomQuote();

            html = `
                <p class="quote-text">
                    "%quote%"
                </p>
            `;

            newHtml = html.replace(/%quote%/g, dailyQuote);

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
    let nodeListForEach = function (list, callback) {
        for (let i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    let setUpEventListeners = function () {
        let DOM = UICtrl.getDOMstrings();
        // Listen for click to show add goal menu
        document
            .querySelector(DOM.addGoalButton)
            .addEventListener("click", ctrlToggleAddGoalDisplay);

        // Listen for goal type change
        document
            .querySelector(DOM.goalType)
            .addEventListener("change", UICtrl.changeType);

        // Listen for click on add goal button
        document
            .querySelector(DOM.goalSubmit)
            .addEventListener("click", ctrlAddGoal);

        // Listen for enter keypress to add goal
        document.addEventListener("keypress", function (e) {
            // .which is used for compatability with older browsers that don't have the keyCode property
            if (e.keyCode === 13 || e.which === 13) {
                let allGoals = document.querySelectorAll(DOM.goalItem);

                nodeListForEach(allGoals, function (current, index) {
                    if (
                        allGoals[index] &&
                        allGoals[index].classList.contains("open")
                    ) {
                        return ctrlAddSubgoal(allGoals[index]);
                    }
                });

                ctrlAddGoal();
            }
        });

        // Listen for click to show edit/delete goal options
        document
            .querySelector(DOM.goalOptions)
            .addEventListener("click", ctrlToggleGoalOptionsDisplay);

        // Listen for click to edit goal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlEditGoal);

        // Listen for click to delete goal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlDeleteGoal);

        // Listen for click to open goal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlOpenGoal);

        // Listen for click to show add subgoal menu
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlToggleAddSubgoalDisplay);

        // Listen for subgoal type change
        document
            .querySelector(DOM.goalsList)
            .addEventListener("change", UICtrl.changeType);

        // Listen for click on add subgoal button
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlAddSubgoal);

        // Listen for click to show edit/delete subgoal options
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlToggleSubgoalOptionsDisplay);

        // Listen for click to delete subgoal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlDeleteSubgoal);

        // Listen for click to close goal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlCloseGoal);
    };

    let ctrlToggleAddGoalDisplay = function (e) {
        // Display add goal menu
        if (e.target.matches(".show-add-goal")) {
            UICtrl.showAddGoalMenu(undefined, e.target);
        }
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
            UICtrl.hideMessage("goal");
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
            UICtrl.hideMessage("goal");
            UICtrl.addListItem(newGoal, input.type, newDate);

            // Clear the input field
            UICtrl.clearFields();
        } else if (new Date(input.date) > new Date()) {
            alert("Please enter a valid date");
        }
    };

    let ctrlToggleGoalOptionsDisplay = function (e) {
        if (e.target.matches(".options")) {
            // Show options on UI
            UICtrl.toggleGoalOptionsDisplay("goal");
        }
    };

    let ctrlDeleteGoal = function (e) {
        let goalID, splitID, type, ID;

        if (e.target.matches(".delete-icon")) {
            goalID =
                e.target.parentElement.parentElement.parentElement.parentElement
                    .id;
            splitID = goalID.split("-");
            type = splitID[0];
            ID = parseInt(splitID[1]);

            // Delete goal from the data structure
            dataCtrl.deleteGoal(type, ID);

            // Delete goal from UI
            UICtrl.deleteGoalItem(goalID);
        }
    };

    let ctrlOpenGoal = function (e) {
        if (!e.target.matches(".delete-icon")) {
            // Add open class to element
            let goal = e.target.closest(".goal-item");
            if (goal) {
                UICtrl.openGoal(goal);
            }
        }
    };

    let ctrlToggleAddSubgoalDisplay = function (e) {
        if (e.target.matches(".show-add-subgoal")) {
            UICtrl.showAddGoalMenu(
                e.target.parentElement.parentElement.parentElement,
                e.target
            );
        }
    };

    let ctrlAddSubgoal = function (e) {
        let parent, parentID, input, newSubgoal;

        if (e.target !== undefined && e.target.matches(".add-subgoal-button")) {
            parent = e.target.parentElement.parentElement.parentElement.parentElement.id.split(
                "-"
            );
            parentID = parent[1];
        } else if (e.target === undefined && e.id.includes("goal")) {
            parent = e.id.split("-");
            parentID = parent[1];
        }

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
                // Remove no goals message and add subgoal to the UI
                UICtrl.hideMessage("subgoal", parentID);
                UICtrl.addListItem(newSubgoal, input.type, undefined, parentID);
                // Clear the input field
                UICtrl.clearFields();
            } else if (input.type === "checkbox" && input.goal !== "") {
                // Add the subgoal to the data controller
                newSubgoal = dataCtrl.addSubgoal(
                    input.goal,
                    parentID,
                    input.type
                );
                // Remove message and add subgoal to the UI
                UICtrl.hideMessage("subgoal", parentID);
                UICtrl.addListItem(newSubgoal, input.type, undefined, parentID);
                // Clear the input field
                UICtrl.clearFields();
            }
        }
    };

    let ctrlToggleSubgoalOptionsDisplay = function (e) {
        if (e.target.matches(".sub-options-icon")) {
            // Show options on UI
            UICtrl.toggleGoalOptionsDisplay("subgoal");
        }
    };

    let ctrlDeleteSubgoal = function (e) {
        let goalID, splitID, ID, parent, parentSplit, parentID;

        if (e.target.matches(".sub-delete-icon")) {
            // Get subgoal ID
            goalID = e.target.parentElement.parentElement.parentElement.id;
            splitID = goalID.split("-");
            ID = parseInt(splitID[1]);
            // Get parent ID
            parent =
                e.target.parentElement.parentElement.parentElement.parentElement
                    .parentElement.id;
            parentSplit = parent.split("-");
            parentID = parseInt(parentSplit[1]);

            // Delete subgoal from the data structure
            dataCtrl.deleteSubgoal(ID, parentID);

            // Delete goal from UI
            UICtrl.deleteGoalItem(goalID);
        }
    };

    let ctrlCloseGoal = function (e) {
        if (e.target.matches(".close-icon")) {
            // Remove open class from element
            if (
                e.target.parentElement.parentElement.parentElement.parentElement.parentElement.classList.contains(
                    "open"
                )
            ) {
                UICtrl.closeGoal(e.target.closest(".close-btn"));
            }
        }
    };

    return {
        init: function () {
            console.log("The application has started");
            UICtrl.displayYear();
            UICtrl.displayRandomQuote();
            setUpEventListeners();
        },
    };
})(dataController, UIController);

controller.init();
