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
            this.subgoals = [];
            this.percentage = -1;
            this.isComplete = false;
        }
    }

    Goal.prototype.calcPercentage = function (subgoals) {
        if (subgoals.length > 0) {
            let totalItems,
                totalCompletedItems,
                incompletePercentage,
                total,
                checkItems,
                targetItems,
                completeCheckItems,
                completeTargetItems,
                incompleteTargetItems;

            totalItems = subgoals.length;
            totalCompletedItems = 0;
            incompletePercentage = 0;
            total = 100 / totalItems;

            checkItems = subgoals.filter(
                current => current.type === "checkbox"
            );
            targetItems = subgoals.filter(current => current.type === "target");

            if (checkItems.length > 0) {
                completeCheckItems = checkItems.filter(
                    current => current.isComplete === true
                ).length;
                totalCompletedItems += completeCheckItems;
            }

            if (targetItems.length > 0) {
                completeTargetItems = targetItems.filter(
                    current => current.isComplete === true
                ).length;
                totalCompletedItems += completeTargetItems;
            }

            incompleteTargetItems = targetItems.filter(
                current => current.isComplete === false
            );

            // Find the percentage completion of each subgoal target based on the percentage value of each subgoal
            if (incompleteTargetItems.length > 0) {
                incompleteTargetItems.forEach(function (current) {
                    incompletePercentage += (total / 100) * current.percentage;
                });
            }

            this.percentage = Math.round(
                (totalCompletedItems / totalItems) * 100
            );

            // Add the percentage completeion value of each incomplete target
            if (incompletePercentage > 0) {
                this.percentage += Math.round(incompletePercentage);
            }
        } else {
            this.percentage = 0;
        }
    };

    Goal.prototype.getPercentage = function () {
        return this.percentage;
    };

    class Quit {
        constructor(id, goal, date) {
            this.id = id;
            this.goal = goal;
            this.date = date;
        }
    }

    class Checkbox {
        constructor(id, goal) {
            this.id = id;
            this.goal = goal;
            this.isComplete = false;
            this.type = "checkbox";
        }
    }

    class Target {
        constructor(id, goal, currentValue, target) {
            this.id = id;
            this.goal = goal;
            this.currentValue = currentValue;
            this.target = target;
            this.isComplete = false;
            this.targetItems = [];
            this.percentage = -1;
            this.type = "target";
        }
    }

    Target.prototype.calcTargetCurrentValue = function (targetItems) {
        if (targetItems.length > 0) {
            this.currentValue = targetItems.reduce(
                (prev, curr) => prev + curr.value,
                0
            );
            return this.currentValue;
        } else {
            return (this.currentValue = 0);
        }
    };

    Target.prototype.calcTargetPercentage = function (targetItems) {
        if (targetItems.length > 0) {
            this.percentage = Math.round(
                (this.currentValue / this.target) * 100
            );
        } else {
            this.percentage = 0;
        }
    };

    Target.prototype.getTargetPercentage = function () {
        return this.percentage;
    };

    Target.prototype.checkIsComplete = function () {
        if (this.currentValue >= this.target || this.percentage >= 100) {
            return (this.isComplete = true);
        } else {
            return (this.isComplete = false);
        }
    };

    class TargetItem {
        constructor(id, note, value, date) {
            this.id = id;
            this.note = note;
            this.value = value;
            this.date = date;
        }
    }

    let allGoals = {
        goalType: {
            goal: [],
            quit: [],
        },
    };

    return {
        findGoal: function (type, parentID, subgoalID, targetID) {
            let goal, ids, index;

            console.log(type, parentID, subgoalID, targetID);
            if (type === "quit") {
                ids = allGoals.goalType[type].map(function (current) {
                    return current.id;
                });

                index = ids.indexOf(parseInt(parentID));

                if (index !== -1) {
                    goal = allGoals.goalType[type][index];
                }
                // Return the quit goal
                return goal;
            }

            if (parentID >= 0) {
                ids = allGoals.goalType["goal"].map(function (current) {
                    return current.id;
                });

                index = ids.indexOf(parseInt(parentID));

                if (index !== -1) {
                    goal = allGoals.goalType["goal"][index];
                }

                if (subgoalID >= 0) {
                    ids = goal.subgoals.map(function (current) {
                        return current.id;
                    });

                    index = ids.indexOf(parseInt(subgoalID));

                    if (index !== -1) {
                        goal = goal.subgoals[index];
                    }

                    if (targetID >= 0) {
                        ids = goal.targetItems.map(function (current) {
                            return current.id;
                        });

                        index = ids.indexOf(parseInt(targetID));

                        if (index !== -1) {
                            goal = goal.targetItems[index];
                        }

                        // If the goal is a target item - return path to that target item
                        return goal;
                    }
                    // If the goal is a subgoal - return path to that subgoal
                    return goal;
                }
                // If the goal is a goal - return path to that goal
                return goal;
            }
        },

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
                newGoal = new Goal(ID, goal);
            } else if (type === "quit") {
                newGoal = new Quit(ID, goal, date);
            }
            // Push new goal into goals array
            allGoals.goalType[type].push(newGoal);
            // Return the new goal
            console.log(newGoal, allGoals.goalType[type]);
            return newGoal;
        },

        editGoal: function (editedGoal, type, id, editedDate) {
            let currentGoal;
            // Select goal by id and type
            currentGoal = this.findGoal(type, id);
            // Replace goal title
            currentGoal.goal = editedGoal;

            if (type === "quit") {
                // Replace goal date
                currentGoal.date = editedDate;
            }
            // Return edited goal
            return currentGoal;
        },

        deleteGoal: function (type, id) {
            let currentGoal, ids, index;

            ids = allGoals.goalType[type].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                allGoals.goalType[type].splice(index, 1);
            }
            // Show no goals message if goal arrays are empty
            if (
                allGoals.goalType["goal"].length < 1 &&
                allGoals.goalType["quit"].length < 1
            ) {
                document.querySelector(".no-goals").classList.remove("hide");
            }
        },

        addSubgoal: function (goal, parentID, type, currentValue, target) {
            let currentGoal, newSubgoal, ID;

            currentGoal = this.findGoal(undefined, parentID);

            // Set subgoal ID
            if (currentGoal.subgoals.length > 0) {
                ID =
                    currentGoal.subgoals[currentGoal.subgoals.length - 1].id +
                    1;
            } else {
                ID = 0;
            }

            if (type === "checkbox") {
                newSubgoal = new Checkbox(ID, goal);
            } else if (type === "target") {
                newSubgoal = new Target(ID, goal, currentValue, target);
            }

            console.log(newSubgoal);

            currentGoal.subgoals.push(newSubgoal);
            console.log(currentGoal);

            return newSubgoal;
        },

        editSubgoal: function (id, parentID, editedGoal, editedTarget) {
            let currentGoal;
            // Select goal by parent id and subgoal id
            currentGoal = this.findGoal(undefined, parentID, id);
            // Replace goal title
            currentGoal.goal = editedGoal;

            if (editedTarget) {
                // Replace goal target if it exists
                currentGoal.target = editedTarget;

                // Update current value
                currentGoal.calcTargetCurrentValue(currentGoal.targetItems);

                //Update the percentage
                currentGoal.calcTargetPercentage(currentGoal.targetItems);

                // Get target percentage
                currentGoal.getTargetPercentage();

                // Check if target is now compplete
                currentGoal.checkIsComplete();
            }
            // Return edited goal
            return currentGoal;
        },

        deleteSubgoal: function (id, parentID) {
            let goal, ids, index;

            goal = this.findGoal(undefined, parentID);

            ids = goal.subgoals.map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                goal.subgoals.splice(index, 1);
            }

            if (goal.subgoals.length < 1) {
                let currentGoal = document.querySelector(`#goal-${parentID}`);
                currentGoal.querySelector(".no-goals").classList.remove("hide");
            }
        },

        toggleSubgoalIsComplete: function (id, parentID) {
            let currentGoal;
            // Select subgoal by ID and parent goal ID
            currentGoal = this.findGoal(undefined, parentID, id);

            // Toggle isComplete value
            currentGoal.isComplete = !currentGoal.isComplete;

            // return the updated goal
            return currentGoal;
        },

        addTargetItem: function (parentID, id, note, value, date) {
            let goal, newTargetItem, ID;

            // Find goal using function
            goal = this.findGoal(undefined, parentID, id);

            // Set target item ID
            if (goal.targetItems.length > 0) {
                ID = goal.targetItems[goal.targetItems.length - 1].id + 1;
            } else {
                ID = 0;
            }

            newTargetItem = new TargetItem(ID, note, value, date);

            console.log(newTargetItem);

            goal.targetItems.push(newTargetItem);
            console.log(goal);

            return newTargetItem;
        },

        editTargetItem: function (
            ID,
            subgoalID,
            parentID,
            newNote,
            newValue,
            newDate
        ) {
            let goal, ids, index, currentTargetItem;

            goal = this.findGoal(undefined, parentID, subgoalID);

            ids = goal.targetItems.map(function (current) {
                return current.id;
            });

            index = ids.indexOf(ID);

            // Select the current target item by ID
            currentTargetItem = goal.targetItems[index];

            // Replace the values with the new ones
            currentTargetItem.note = newNote;
            currentTargetItem.value = newValue;
            currentTargetItem.date = newDate;

            console.log(currentTargetItem);

            // Return the updated  goal
            return currentTargetItem;
        },

        deleteTargetItem: function (id, subgoalID, parentID) {
            let goal, ids, index;

            goal = this.findGoal(undefined, parentID, subgoalID);

            ids = goal.targetItems.map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                goal.targetItems.splice(index, 1);
            }
        },

        calculatePercentages: function () {
            allGoals.goalType["goal"].forEach(function (current) {
                current.calcPercentage(current.subgoals);
            });
        },

        getPercentages: function () {
            let allPercentages = allGoals.goalType["goal"].map(function (
                current
            ) {
                return current.getPercentage();
            });
            return allPercentages;
        },

        calculateTargetCurrentValue: function (subgoalID, parentID) {
            let currentTarget = this.findGoal(undefined, parentID, subgoalID);

            // Calculate the current value of all targets
            return currentTarget.calcTargetCurrentValue(
                currentTarget.targetItems
            );
        },

        calculateTargetPercentages: function (subgoalID, parentID) {
            let goal, ids, index, currentTarget;

            goal = this.findGoal(undefined, parentID);

            ids = goal.subgoals.map(function (current) {
                return current.id;
            });

            index = ids.indexOf(subgoalID);

            if (index !== -1) {
                // Select the current target item by ID
                currentTarget = goal.subgoals[index];

                // Check if target is now compplete
                currentTarget.checkIsComplete();

                // Calculate the target percentage
                return currentTarget.calcTargetPercentage(
                    currentTarget.targetItems
                );
            }
        },

        getTargetPercentages: function (subgoalID, parentID) {
            let goal, ids, index, currentTarget;

            goal = this.findGoal(undefined, parentID);

            ids = goal.subgoals.map(function (current) {
                return current.id;
            });

            index = ids.indexOf(subgoalID);

            if (index !== -1) {
                // Select the current target item by ID
                currentTarget = goal.subgoals[index];

                // Check if target is now compplete
                currentTarget.checkIsComplete();

                // Calculate the target percentage
                return currentTarget.getTargetPercentage();
            }
        },

        getisComplete: function (subgoalID, parentID) {
            let goal, ids, index, currentTarget;

            goal = this.findGoal(undefined, parentID);

            ids = goal.subgoals.map(function (current) {
                return current.id;
            });

            index = ids.indexOf(subgoalID);

            if (index !== -1) {
                // Select the current target item by ID
                currentTarget = goal.subgoals[index];

                // Check if target is now compplete
                return currentTarget.isComplete;
            }
        },
    };
})();

//##########################
// UI CONTROLLER
//##########################

let UIController = (function () {
    let DOMstrings = {
        // Header
        currentYear: ".current-year",
        hideMessage: ".no-goals",
        // Goal strings
        navbar: ".navbar",
        addGoalButton: ".add-goal-icon",
        addGoalMenu: ".add-goal",
        addGoalType: ".add-goal-type",
        addGoalInput: ".add-goal-input",
        addGoalDate: ".add-goal-date",
        addGoalSubmit: ".add-goal-button",
        goalOptions: ".show-goal-options",
        goalOptionsIcons: ".edit-delete-options",
        goalsList: ".goals",
        goalItem: ".grid-item",
        goalTitle: ".goal-title",
        goalPercentage: ".goal-percentage",
        days: ".days",
        editGoal: ".edit-goal",
        editGoalInput: ".edit-goal-input",
        editGoalDate: ".edit-goal-date",

        // Subgoal strings
        subgoalNavbar: ".subgoals-nav",
        addSubgoal: ".add-subgoal",
        addSubgoalIcon: ".add-subgoal-icon",
        addSubgoalType: ".add-subgoal-type",
        addSubgoalInput: ".add-subgoal-input",
        addSubgoalTarget: ".add-subgoal-target",
        addSubgoalSubmit: ".add-subgoal-button",
        subgoalListContainer: ".subgoal-list-container",
        subgoalsList: ".subgoals-list",
        subgoalItem: ".subgoal-item",
        subgoalTitle: ".subgoal-title",
        subgoalCurrentValue: ".subgoal-current-value",
        subgoalProgressBar: ".progress-filled",
        subgoalUpdateIcons: ".subgoal-update",
        subgoalCheckbox: ".subgoal-check-icon",
        subgoalTarget: ".subgoal-current-target",
        subgoalOptionsIcons: ".subgoal-edit-delete-options",
        editSubgoal: ".edit-subgoal",
        editSubgoalInput: ".edit-subgoal-input",
        editSubgoalTarget: ".edit-subgoal-target",

        // Subgoal target strings
        updateTarget: ".update-target-info",
        updateTargetIcon: ".update-target",
        addTargetInputs: ".update-target-inputs",
        addTargetNote: ".target-add-note",
        addTargetValue: ".target-add-value",
        addTargetDate: ".target-add-date",
        addTargetSaveIcon: ".target-add-save",
        targetItems: ".target-items",
        targetItemsList: ".target-items-list",
        targetListItem: ".target-list-item",
        targetInfo: ".target-info",
        targetNote: ".target-list-item-note",
        targetValue: ".target-list-item-value",
        targetDate: ".target-list-item-date",
        targetPercentage: ".progress-percentage",
        targetItemsOptions: ".target-list-item-edit-delete-options",
        editTargetInputs: ".edit-target",
        editTargetNote: ".edit-target-item-note",
        editTargetValue: ".edit-target-item-value",
        editTargetDate: ".edit-target-item-date",
        editTargetSaveIcon: ".target-edit-save",
    };

    let nodeListForEach = function (list, callback) {
        for (let i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        /*##################################################
                            GET INPUTS
        ####################################################*/
        getinput: function () {
            return {
                type: document.querySelector(DOMstrings.addGoalType).value,
                goal: document.querySelector(DOMstrings.addGoalInput).value,
                date: document.querySelector(DOMstrings.addGoalDate).value,
            };
        },

        getEditInput: function (currentGoal) {
            let quitDate = currentGoal.querySelector(DOMstrings.editGoalDate);

            if (quitDate) {
                return {
                    goal: currentGoal.querySelector(DOMstrings.editGoalInput)
                        .value,
                    date: currentGoal.querySelector(DOMstrings.editGoalDate)
                        .value,
                };
            } else {
                return {
                    goal: currentGoal.querySelector(DOMstrings.editGoalInput)
                        .value,
                };
            }
        },

        getSubgoalInput: function (currentGoal) {
            return {
                type: currentGoal.querySelector(DOMstrings.addSubgoalType)
                    .value,
                goal: currentGoal.querySelector(DOMstrings.addSubgoalInput)
                    .value,
                currentValue: 0,
                target: parseInt(
                    currentGoal.querySelector(DOMstrings.addSubgoalTarget).value
                ),
            };
        },

        getTargetItemInput: function (currentGoal) {
            return {
                note: currentGoal.querySelector(DOMstrings.addTargetNote).value,
                value: parseInt(
                    currentGoal.querySelector(DOMstrings.addTargetValue).value
                ),
                date: currentGoal.querySelector(DOMstrings.addTargetDate).value,
            };
        },

        getSubgoalEditInput: function (currentGoal, parent) {
            let parentGoal = document.querySelector(`#${parent}`);
            let currentSubgoal = parentGoal.querySelector(`#${currentGoal}`);

            let currentTarget = currentSubgoal.querySelector(
                DOMstrings.editSubgoalTarget
            );

            if (currentTarget) {
                return {
                    goal: currentSubgoal.querySelector(
                        DOMstrings.editSubgoalInput
                    ).value,
                    target: parseInt(currentTarget.value),
                };
            } else {
                return {
                    goal: currentSubgoal.querySelector(
                        DOMstrings.editSubgoalInput
                    ).value,
                };
            }
        },

        getTargetEditInput: function (id, subgoalID, parentID) {
            let goal = document.querySelector(`#goal-${parentID}`);
            let subgoal = goal.querySelector(`#subgoal-${subgoalID}`);
            let target = subgoal.querySelector(`#target-${id}`);

            return {
                note: target.querySelector(DOMstrings.editTargetNote).value,
                value: parseInt(
                    target.querySelector(DOMstrings.editTargetValue).value
                ),
                date: target.querySelector(DOMstrings.editTargetDate).value,
            };
        },

        /*##############################################
                        ADD GOAL OPTIONS
        ################################################*/

        showAddGoalMenu: function (button, target) {
            if (button) {
                let subgoal = button.querySelector(DOMstrings.addSubgoal);

                subgoal.classList.toggle("invisible");
                button.querySelector(DOMstrings.addSubgoalInput).focus();

                if (!subgoal.classList.contains("invisible")) {
                    target.parentElement.innerHTML = `<i class="fas fa-minus nav-icons show-add-subgoal"></i>`;
                } else {
                    target.parentElement.innerHTML = `<i class="fas fa-plus nav-icons show-add-subgoal"></i>`;
                }
            } else {
                let menu = document.querySelector(DOMstrings.addGoalMenu);

                menu.classList.toggle("invisible");
                document.querySelector(DOMstrings.addGoalInput).focus();

                if (!menu.classList.contains("invisible")) {
                    target.parentElement.innerHTML = `<i class="fas fa-minus nav-icons show-add-goal"></i>`;
                } else {
                    target.parentElement.innerHTML = `<i class="fas fa-plus nav-icons show-add-goal"></i>`;
                }
            }
        },

        hideAddSubgoalMenu: function () {
            let goals;

            goals = document.querySelectorAll(DOMstrings.subgoalNavbar);

            nodeListForEach(goals, function (current, index) {
                goals[index]
                    .querySelector(DOMstrings.addSubgoal)
                    .classList.add("invisible");

                goals[index].querySelector(
                    DOMstrings.addSubgoalIcon
                ).innerHTML = `<i class="fas fa-plus nav-icons show-add-subgoal"></i>`;
            });
        },

        changeType: function (e) {
            if (e.target.matches(".add-goal-type")) {
                document
                    .querySelector(DOMstrings.addGoalDate)
                    .classList.toggle("hide");

                // Focus on input field
                document.querySelector(DOMstrings.addGoalInput).focus();
            } else if (e.target.matches(".add-subgoal-type")) {
                let subgoalTargets = document.querySelectorAll(
                    DOMstrings.addSubgoalTarget
                );
                let subgoalInputs = document.querySelectorAll(
                    DOMstrings.addSubgoal
                );

                nodeListForEach(subgoalTargets, function (current, index) {
                    if (subgoalTargets[index]) {
                        subgoalTargets[index].classList.toggle("hide");
                    }
                });

                nodeListForEach(subgoalInputs, function (current, index) {
                    if (subgoalInputs[index]) {
                        subgoalInputs[index]
                            .querySelector(DOMstrings.addSubgoalInput)
                            .focus();
                    }
                });
            }
        },

        /*###########################################
                        ADD LIST ITEMS
        #############################################*/

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
                                    <button class="add-subgoal-icon">
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
                            <div class="edit-goal hide">
                                <input type="text" class="edit-goal-input" value="%title%">
                                <button class="edit-goal-button"><i class="fas fa-check edit-save"></i></button>
                            </div>
                            <h2 class="goal-title">%title%</h2>
                            <div class="goal-percentage">
                            </div>
                        </div>
                        <div class="no-goals">
                            <p>Add a subgoal category +</p>
                        </div>
                        <div class="subgoal-list-container hide">
                            <ul class="subgoals-list"></ul>
                        </div>
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
                            <div class="edit-goal hide">
                                <input type="text" class="edit-goal-input" value="%title%">
                                <button class="edit-goal-button"><i class="fas fa-check edit-save"></i></button>
                                <input type="date" class="edit-goal-date" value="%fulldate%"/>
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
                    <div class="edit-subgoal hide">
                        <input type="text" class="edit-subgoal-input" value="%title%">
                        <input type="number" name="edit-subgoal-target" value="%target%" class="edit-subgoal-target" step="1"/>
                        <button class="edit-subgoal-button"><i class="fas fa-check sub-edit-save"></i></button>
                    </div>
                    <p class="subgoal-title">%title%</p>
                    <div class="target-container">
                        <p class="subgoal-current-value">%currentValue%</p>
                        <div class="progress">
                            <div class="progress-filled"></div>
                        </div>
                        <p class="subgoal-current-target">%target%</p>
                        <p class="progress-percentage"></p>
                        <p class="subgoal-update update-target-info check-target-icon"><i
                        class="fas fa-plus update-target"
                        ></i></p>
                    </div>
                    <div class="subgoal-edit-delete-options hide">
                        <span class="option-icons">
                            <i class="fas fa-edit sub-edit-icon"></i> 
                        </span>
                        <span class="option-icons">
                            <i class="fas fa-trash-alt sub-delete-icon"></i>
                        </span>
                    </div>
                    <div class="update-target-inputs hide">
                        <input type="text" class="target-add-note" placeholder="Add a note">
                        <input type="number" class="target-add-value" placeholder="Value">
                        <input type="date" class="target-add-date">
                        <button class="target-save"><i class="fas fa-check target-add-save"></i></button>
                    </div>
                    <div class="target-items">
                        <ul class="target-items-list"></ul>
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
                <div class="edit-subgoal hide">
                    <input type="text" class="edit-subgoal-input" value="%title%">
                    <button class="edit-subgoal-button"><i class="fas fa-check sub-edit-save"></i></button>
                </div>
                <p class="subgoal-title">%title%</p>
                <p class="subgoal-update subgoal-check-icon check-target-icon"><i class="fas fa-square sub-check"></i></p>
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
            let goalStartDate, startYear, startMonth, startDay;

            let formatDate = function (goalDate) {
                goalStartDate = new Date(goalDate);
                startYear = goalStartDate.getUTCFullYear();
                startMonth = goalStartDate.getMonth() + 1;
                startDay = goalStartDate.getDate();

                if (startMonth < 10) {
                    startMonth = `0${startMonth}`;
                }
                if (startDay < 10) {
                    startDay = `0${startDay}`;
                }

                return `${startYear}-${startMonth}-${startDay}`;
            };

            // Replace placeholder text with actual data
            newHtml = html.replace(/%id%/g, obj.id);
            newHtml = newHtml.replace(/%title%/g, obj.goal);
            newHtml = newHtml.replace(/%currentValue%/g, obj.currentValue);
            newHtml = newHtml.replace(/%fulldate%/g, formatDate(goalDate));
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

                currentGoal.querySelector(DOMstrings.addSubgoalInput).focus();
            } else {
                document
                    .querySelector(element)
                    .insertAdjacentHTML("beforeend", newHtml);

                document.querySelector(DOMstrings.addGoalInput).focus();
            }
        },

        addTargetListItem: function (currentGoal, obj) {
            let html, newHtml;

            html = `
                <li class="target-list-item" id="target-%id%">
                    <div class="edit-target hide">
                        <input type="text" class="edit-target-item-note" value="%note%">
                        <input type="number" name="edit-target-item-value" value="%value%" class="edit-target-item-value" step="1"/>
                        <input type="date" class="edit-target-item-date" value="%originaldate%"/>
                        <button class="edit-target-button"><i class="fas fa-check target-edit-save"></i></button>
                    </div>
                    <p class="target-info target-list-item-note">%note%</p>
                    <p class="target-info target-list-item-value">%value%</p>
                    <p class="target-info target-list-item-date">%date%</p>
                    <div class="target-list-item-edit-delete-options hide">
                        <span class="target-list-item-options-icons">
                            <i class="fas fa-edit target-edit-icon"></i> 
                        </span>
                        <span class="target-list-item-options-icons">
                            <i class="fas fa-trash-alt target-delete-icon"></i>
                        </span>
                    </div>
                </li>
            `;

            let formatDate = function (date) {
                let split = date.split("-");
                let day = split[2];
                let month = split[1];

                return `${day}/${month}`;
            };

            let formatCalendarDate = function (date) {
                let goalStartDate = new Date(date);
                let startYear = goalStartDate.getUTCFullYear();
                let startMonth = goalStartDate.getMonth() + 1;
                let startDay = goalStartDate.getDate() + 1;

                if (startMonth < 10) {
                    startMonth = `0${startMonth}`;
                }
                if (startDay < 10) {
                    startDay = `0${startDay}`;
                }

                return `${startYear}-${startMonth}-${startDay}`;
            };

            newHtml = html.replace(/%id%/g, obj.id);
            newHtml = newHtml.replace(/%note%/g, obj.note);
            newHtml = newHtml.replace(/%value%/g, obj.value);
            newHtml = newHtml.replace(/%date%/g, formatDate(obj.date));
            newHtml = newHtml.replace(
                /%originaldate%/g,
                formatCalendarDate(obj.date)
            );

            currentGoal
                .querySelector(DOMstrings.targetItemsList)
                .insertAdjacentHTML("beforeend", newHtml);

            currentGoal.querySelector(DOMstrings.addTargetNote).focus();
        },

        /*##################################################
                           OPTIONS DISPLAY 
        ####################################################*/

        toggleGoalOptionsDisplay: function (type) {
            let goals,
                currentTitle,
                currentOptions,
                targetItems,
                currentTargetOptions,
                currentGoalUpdate;

            if (type === "goal") {
                goals = document.querySelectorAll(DOMstrings.goalItem);

                nodeListForEach(goals, function (current, index) {
                    currentOptions = goals[index].querySelector(
                        DOMstrings.goalOptionsIcons
                    );
                    currentTitle = goals[index].querySelector(
                        DOMstrings.goalTitle
                    );
                    // Hide display options
                    currentOptions.classList.toggle("hide");
                    currentTitle.classList.toggle("edit");
                });
            } else if (type === "subgoal") {
                goals = document.querySelectorAll(DOMstrings.subgoalItem);
                // Hide add subgoal menu
                this.hideAddSubgoalMenu();

                nodeListForEach(goals, function (current, index) {
                    currentOptions = goals[index].querySelector(
                        DOMstrings.subgoalOptionsIcons
                    );

                    if (currentOptions) {
                        // Hide/display options
                        currentOptions.classList.toggle("hide");
                    }

                    currentGoalUpdate = goals[index].querySelector(
                        DOMstrings.subgoalUpdateIcons
                    );

                    if (currentGoalUpdate) {
                        currentGoalUpdate.classList.toggle("hide");
                    }

                    targetItems = goals[index].querySelectorAll(
                        DOMstrings.targetListItem
                    );

                    nodeListForEach(targetItems, function (current, index) {
                        currentTargetOptions = targetItems[index].querySelector(
                            DOMstrings.targetItemsOptions
                        );

                        if (currentTargetOptions) {
                            // Hide/display target list item options
                            currentTargetOptions.classList.toggle("hide");
                        }
                    });
                });
            }
        },

        removeGoalOptionsDisplay: function (e) {
            let goals, currentOptions, currentTitle;

            goals = document.querySelectorAll(DOMstrings.goalItem);

            nodeListForEach(goals, function (current, index) {
                currentOptions = goals[index].querySelector(
                    DOMstrings.goalOptionsIcons
                );
                currentTitle = goals[index].querySelector(DOMstrings.goalTitle);

                currentOptions.classList.add("hide");
                currentTitle.classList.remove("edit");
            });
        },

        removeSubgoalOptionsDisplay: function () {
            let goals, currentOptions, currentTitle, currentGoalUpdate;
            goals = document.querySelectorAll(DOMstrings.subgoalItem);

            nodeListForEach(goals, function (current, index) {
                currentOptions = goals[index].querySelector(
                    DOMstrings.subgoalOptionsIcons
                );
                currentTitle = goals[index].querySelector(
                    DOMstrings.subgoalTitle
                );
                currentGoalUpdate = goals[index].querySelector(
                    DOMstrings.subgoalUpdateIcons
                );

                currentOptions.classList.add("hide");
                currentTitle.classList.remove("edit");
                currentGoalUpdate.classList.remove("hide");
            });
        },

        removeTargetOptionsDisplay: function () {
            let goals, targetItems, currentTargetOptions;
            goals = document.querySelectorAll(DOMstrings.subgoalItem);

            nodeListForEach(goals, function (current, index) {
                targetItems = goals[index].querySelectorAll(
                    DOMstrings.targetListItem
                );

                nodeListForEach(targetItems, function (current, index) {
                    currentTargetOptions = targetItems[index].querySelector(
                        DOMstrings.targetItemsOptions
                    );

                    if (currentTargetOptions) {
                        // Hide/display target list item options
                        currentTargetOptions.classList.add("hide");
                    }
                });
            });
        },

        /*##################################################
                            INPUT DISPLAY 
        ####################################################*/

        toggleEditGoalInputDisplay: function (type, id) {
            let currentGoal = document.querySelector(`#${type}-${id}`);

            currentGoal
                .querySelector(DOMstrings.editGoal)
                .classList.toggle("hide");
            currentGoal
                .querySelector(DOMstrings.goalTitle)
                .classList.toggle("hide");

            currentGoal.querySelector(DOMstrings.editGoalInput).focus();
        },

        toggleEditSubgoalInputDisplay: function (id, parentID) {
            let currentGoal = document.querySelector(`#goal-${parentID}`);
            let currentSubgoal = currentGoal.querySelector(`#subgoal-${id}`);

            currentSubgoal
                .querySelector(DOMstrings.editSubgoal)
                .classList.toggle("hide");
            currentSubgoal
                .querySelector(DOMstrings.subgoalTitle)
                .classList.toggle("hide");

            // Hide add subgoal menu
            this.hideAddSubgoalMenu();

            currentSubgoal.querySelector(DOMstrings.editSubgoalInput).focus();
        },

        hideEditGoalInputDisplay: function (currentGoal) {
            let allGoals, goal;

            if (currentGoal) {
                currentGoal
                    .querySelector(DOMstrings.editGoal)
                    .classList.add("hide");
                currentGoal
                    .querySelector(DOMstrings.goalTitle)
                    .classList.remove("hide");
            } else {
                allGoals = document.querySelectorAll(DOMstrings.goalItem);

                nodeListForEach(allGoals, function (current, index) {
                    goal = allGoals[index];
                    goal.querySelector(DOMstrings.editGoal).classList.add(
                        "hide"
                    );
                    goal.querySelector(DOMstrings.goalTitle).classList.remove(
                        "hide"
                    );
                });
            }
        },

        hideEditSubgoalInputDisplay: function (currentGoal) {
            let allGoals, goal;

            if (currentGoal) {
                currentGoal
                    .querySelector(DOMstrings.editSubgoal)
                    .classList.add("hide");
                currentGoal
                    .querySelector(DOMstrings.subgoalTitle)
                    .classList.remove("hide");
            } else {
                allGoals = document.querySelectorAll(DOMstrings.subgoalItem);

                nodeListForEach(allGoals, function (current, index) {
                    goal = allGoals[index];
                    goal.querySelector(DOMstrings.editSubgoal).classList.add(
                        "hide"
                    );
                    goal.querySelector(
                        DOMstrings.subgoalTitle
                    ).classList.remove("hide");
                });
            }
        },

        toggleTargetInputDisplay: function (id, parentID) {
            let currentGoal = document.querySelector(`#goal-${parentID}`);
            let currentSubgoal = currentGoal.querySelector(`#subgoal-${id}`);

            if (
                currentSubgoal
                    .querySelector(DOMstrings.addTargetInputs)
                    .classList.contains("hide")
            ) {
                // Change icon to minus symbol
                currentSubgoal.querySelector(
                    DOMstrings.updateTarget
                ).innerHTML = `<i
                        class="fas fa-minus update-target"
                        ></i>`;

                // Show input fields
                currentSubgoal
                    .querySelector(DOMstrings.addTargetInputs)
                    .classList.remove("hide");

                // Hide add subgoal menu
                this.hideAddSubgoalMenu();
            } else {
                // Chnage icon to add symbol
                currentSubgoal.querySelector(
                    DOMstrings.updateTarget
                ).innerHTML = `<i
                        class="fas fa-plus update-target"
                        ></i>`;
                // remove input fields
                currentSubgoal
                    .querySelector(DOMstrings.addTargetInputs)
                    .classList.add("hide");
            }

            currentSubgoal.querySelector(DOMstrings.addTargetNote).focus();

            // Get date for default date setting
            let getCurrentDate = function () {
                let currentDate, year, month, day;
                currentDate = new Date();
                year = currentDate.getFullYear();
                month = currentDate.getMonth() + 1;
                day = currentDate.getDate();

                if (month < 10) {
                    month = `0${month}`;
                }
                if (day < 10) {
                    day = `0${day}`;
                }

                return `${year}-${month}-${day}`;
            };

            currentSubgoal.querySelector(
                DOMstrings.addTargetDate
            ).value = getCurrentDate();
        },

        removeTargetInputDisplay: function () {
            let goals, icon, target;
            goals = document.querySelectorAll(DOMstrings.subgoalItem);

            nodeListForEach(goals, function (current, index) {
                target = goals[index].querySelector(DOMstrings.addTargetInputs);
                icon = goals[index].querySelector(DOMstrings.updateTarget);
                // Hide inout display
                if (target) {
                    target.classList.add("hide");
                }

                if (icon) {
                    // Chnage icon to add symbol
                    icon.innerHTML = `<i
                        class="fas fa-plus update-target"
                        ></i>`;
                }
            });
        },

        toggleEditTargetItemInputDisplay: function (id, subgoalID, parentID) {
            let goal = document.querySelector(`#goal-${parentID}`);
            let subgoal = goal.querySelector(`#subgoal-${subgoalID}`);
            let target = subgoal.querySelector(`#target-${id}`);

            let info = target.querySelectorAll(DOMstrings.targetInfo);

            nodeListForEach(info, function (current, index) {
                info[index].classList.toggle("hide");
            });

            target
                .querySelector(DOMstrings.editTargetInputs)
                .classList.toggle("hide");

            target.querySelector(DOMstrings.editTargetNote).focus();
        },

        hideEditTargetItemInputDisplay: function (currentTarget) {
            let info = currentTarget.querySelectorAll(DOMstrings.targetInfo);

            nodeListForEach(info, function (current, index) {
                info[index].classList.remove("hide");
            });

            currentTarget
                .querySelector(DOMstrings.editTargetInputs)
                .classList.add("hide");
        },

        /*##################################################
                           UPDATE LIST ITEMS
        ####################################################*/

        updateListItem: function (currentGoal, updatedGoal, type, updatedDate) {
            // Select the title of the current goal
            let title = currentGoal.querySelector(DOMstrings.goalTitle);
            // Set the innerHTML to to the updated goal
            title.innerHTML = `${updatedGoal.goal}`;

            if (type === "quit") {
                // Select the date of the current goal
                let date = currentGoal.querySelector(DOMstrings.days);
                // Set the innerHTML to to the updated date
                date.innerHTML = `${updatedDate} days`;
            }
        },

        updateSubgoalListItem: function (currentGoal, updatedSubgoal) {
            // Select the title of the current goal
            let title = currentGoal.querySelector(DOMstrings.subgoalTitle);
            // Set the innerHTML to to the updated goal
            title.innerHTML = `${updatedSubgoal.goal}`;

            if (updatedSubgoal.target) {
                // Select the date of the current goal
                let target = currentGoal.querySelector(
                    DOMstrings.subgoalTarget
                );
                // Set the innerHTML to to the updated target
                target.innerHTML = `${updatedSubgoal.target}`;
            }
        },

        updateTargetListItem: function (currentGoal, updatedTargetItem) {
            // Select the values of the current target
            let note = currentGoal.querySelector(DOMstrings.targetNote);
            let value = currentGoal.querySelector(DOMstrings.targetValue);
            let date = currentGoal.querySelector(DOMstrings.targetDate);

            let formatDate = function (date) {
                let split = date.split("-");
                let day = split[2];
                let month = split[1];

                return `${day}/${month}`;
            };

            // Update list items
            note.innerHTML = `${updatedTargetItem.note}`;
            value.innerHTML = `${updatedTargetItem.value}`;
            date.innerHTML = `${formatDate(updatedTargetItem.date)}`;
        },

        /*##################################################
                        DELETE LIST ITEM
        ####################################################*/

        deleteGoalItem: function (goalID) {
            // Select the element to be removed
            let element = document.getElementById(goalID);
            // Move up then select child to delete
            element.parentElement.removeChild(element);
        },

        /*##################################################
                          CHECKED ITEMS
        ####################################################*/

        toggleCheckedIcon: function (currentGoal, isComplete) {
            let goal = currentGoal.querySelector(DOMstrings.subgoalCheckbox);
            let title = currentGoal.querySelector(DOMstrings.subgoalTitle);

            if (isComplete) {
                goal.innerHTML = `<i class="fas fa-check-square sub-check"></i>`;
                title.classList.add("subgoal-complete");
            } else {
                goal.innerHTML = `<i class="fas fa-square sub-check"></i>`;
                title.classList.remove("subgoal-complete");
            }
        },

        toggleTargetComplete: function (subgoalID, parentID, isComplete) {
            let goal = document.querySelector(`#goal-${parentID}`);
            let subgoal = goal.querySelector(`#subgoal-${subgoalID}`);

            let title = subgoal.querySelector(DOMstrings.subgoalTitle);

            if (isComplete) {
                title.classList.add("subgoal-complete");
            } else {
                title.classList.remove("subgoal-complete");
            }
        },

        /* ##################
            GENERAL TAGS 
        #####################*/

        clearFields: function () {
            let goalField = document.querySelector(DOMstrings.addGoalInput);
            let dateField = document.querySelector(DOMstrings.addGoalDate);
            let subgoalFields = document.querySelectorAll(
                DOMstrings.addSubgoalInput
            );
            let subgoalTargets = document.querySelectorAll(
                DOMstrings.addSubgoalTarget
            );
            let targetNoteFields = document.querySelectorAll(
                DOMstrings.addTargetNote
            );
            let targetValueFields = document.querySelectorAll(
                DOMstrings.addTargetValue
            );

            goalField.value = "";
            dateField.value = "";

            nodeListForEach(subgoalFields, function (current, index) {
                if (subgoalFields[index]) {
                    subgoalFields[index].value = "";
                    subgoalTargets[index].value = "";
                }
            });

            nodeListForEach(targetNoteFields, function (current, index) {
                if (targetNoteFields[index]) {
                    targetNoteFields[index].value = "";
                    targetValueFields[index].value = "";
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

        openGoal: function (goal) {
            if (!goal.classList.contains("open")) {
                let currentGoalIcon, currentGoalAddSubgoal;
                // Close the add subgoal options
                currentGoalIcon = goal.querySelector(DOMstrings.addSubgoalIcon);
                currentGoalIcon.innerHTML = ` 
                    <i class="fas fa-plus nav-icons show-add-subgoal"></i> 
                `;

                currentGoalAddSubgoal = goal.querySelector(
                    DOMstrings.addSubgoal
                );
                currentGoalAddSubgoal.classList.add("invisible");
            }

            if (goal.classList.contains("goal-item")) {
                // Close any open goals
                let allGoals = document.querySelectorAll(DOMstrings.goalItem);

                nodeListForEach(allGoals, function (current, index) {
                    allGoals[index].classList.remove("open");

                    // Add the hide class to the subgoals list
                    allGoals[index]
                        .querySelector(DOMstrings.subgoalListContainer)
                        .classList.add("hide");
                });

                // Hide main navbar and options
                document.querySelector(DOMstrings.navbar).classList.add("hide");
                this.removeGoalOptionsDisplay();

                // Remove the hide class from subgoals list
                goal.querySelector(
                    DOMstrings.subgoalListContainer
                ).classList.remove("hide");

                // Open target gaol
                goal.classList.add("open");
            }
        },

        closeGoal: function (button) {
            if (button) {
                let goal =
                    button.parentElement.parentElement.parentElement
                        .parentElement;

                goal.classList.remove("open");
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

                // Add the hide class to the subgoals list
                goal.querySelector(
                    DOMstrings.subgoalListContainer
                ).classList.add("hide");
            }
        },

        displayPercentages: function (percentages) {
            let goals = document.querySelectorAll(DOMstrings.goalPercentage);

            nodeListForEach(goals, function (current, index) {
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + "%";
                } else {
                    current.textContent = "0%";
                }
            });
        },

        updateCurrentValue: function (currentValue, currentSubgoal) {
            // Select the element to insert the update
            let element = document.getElementById(currentSubgoal);

            console.log(currentValue);
            // Update the current value
            element.querySelector(
                DOMstrings.subgoalCurrentValue
            ).textContent = `${currentValue}`;
        },

        displayTargetPercentage: function (subgoalID, parentID, percentage) {
            let goal = document.querySelector(`#goal-${parentID}`);
            let subgoal = goal.querySelector(`#subgoal-${subgoalID}`);

            subgoal.querySelector(
                DOMstrings.targetPercentage
            ).innerHTML = `${percentage}%`;

            subgoal.querySelector(
                DOMstrings.subgoalProgressBar
            ).style.flexBasis = `${percentage}%`;

            if (percentage >= 100) {
                subgoal.querySelector(
                    DOMstrings.subgoalProgressBar
                ).style.background = "#90EE90";
            } else {
                subgoal.querySelector(
                    DOMstrings.subgoalProgressBar
                ).style.background = "orange";
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
    let optionsDisplayed = false;
    let subOptionDisplayed = false;

    let nodeListForEach = function (list, callback) {
        for (let i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    let setUpEventListeners = function () {
        let DOM = UICtrl.getDOMstrings();

        /* #################################
                        GOALS
         ################################### */
        // Listen for click to show add goal menu
        document
            .querySelector(DOM.addGoalButton)
            .addEventListener("click", ctrlToggleAddGoalDisplay);

        // Listen for goal type change
        document
            .querySelector(DOM.addGoalType)
            .addEventListener("change", UICtrl.changeType);

        // Listen for click on add goal button
        document
            .querySelector(DOM.addGoalSubmit)
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

        // Listen for click to toggle edit goal input display
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlToggleEditGoalInputDisplay);

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

        // Listen for click to close goal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlCloseGoal);

        /* #################################
                        SUBGOALS
         ################################### */

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

        // Listen for checkbox click on subgoal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlToggleSubgoalCheckbox);

        // Listen for click to toggle display of edit/delete subgoal options
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlToggleSubgoalOptionsDisplay);

        // Listen for click to toggle edit subgoal input display
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlToggleEditSubgoalInputDisplay);

        // Listen for click to edit subgoal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlEditSubgoal);

        // Listen for click to delete subgoal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlDeleteSubgoal);

        /* #################################
                        TARGETS
         ################################### */

        // Listen for click to toggle display of target item inputs
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlToggleTargetInputDisplay);

        // Update the target subgoal
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlAddTargetItem);

        // Listen for click to toggle target item edit input display
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlToggleEditTargetItemInputDisplay);

        // Listen for click to edit target item
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlEditTargetItem);

        // Listen for click to delete target item
        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlDeleteTargetItem);
    };

    let updatePercentages = function () {
        // Calculate percentages
        dataCtrl.calculatePercentages();

        // Read percentages from the data controller
        let percentages = dataCtrl.getPercentages();

        // Update the UI with the new percentages
        UICtrl.displayPercentages(percentages);
    };

    let updateTargetPercentages = function (subgoalID, parentID) {
        // Calculate percentages
        dataCtrl.calculateTargetPercentages(subgoalID, parentID);

        // Read percentages from the data controller
        let percentage = dataCtrl.getTargetPercentages(subgoalID, parentID);

        // Update the UI with the new percentages
        UICtrl.displayTargetPercentage(subgoalID, parentID, percentage);

        // Read is complete from the data controller
        let isComplete = dataCtrl.getisComplete(subgoalID, parentID);

        // Update the UI with is complete
        UICtrl.toggleTargetComplete(subgoalID, parentID, isComplete);

        //Update overall percentages
        updatePercentages();
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

            // Remove add goal message, edit options and add the goal to the UI
            UICtrl.hideMessage("goal");
            UICtrl.hideEditGoalInputDisplay();
            UICtrl.removeGoalOptionsDisplay();
            UICtrl.addListItem(newGoal, input.type);

            // Clear the input field
            UICtrl.clearFields();

            // Update the percentages
            updatePercentages();
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

            // Remove add goal message, edit goal options and add the goal to the UI
            UICtrl.hideMessage("goal");
            UICtrl.hideEditGoalInputDisplay();
            UICtrl.removeGoalOptionsDisplay();
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
            optionsDisplayed = !optionsDisplayed;
            if (optionsDisplayed === false) {
                UICtrl.hideEditGoalInputDisplay();
            }
        }
    };

    let ctrlToggleEditGoalInputDisplay = function (e) {
        let target, type, ID;

        if (e.target.matches(".edit-icon")) {
            target = e.target.parentElement.parentElement.parentElement.parentElement.id.split(
                "-"
            );
            type = target[0];
            ID = parseInt(target[1]);

            // To ensure that the goal doesn't open
            optionsDisplayed = true;

            // Toggle input display
            UICtrl.toggleEditGoalInputDisplay(type, ID);
        }
    };

    let ctrlEditGoal = function (e) {
        let currentGoal, splitID, type, ID, date, newDate, days, updatedGoal;

        if (e.target.matches(".edit-save")) {
            currentGoal =
                e.target.parentElement.parentElement.parentElement
                    .parentElement;
            splitID = currentGoal.id.split("-");
            type = splitID[0];
            ID = splitID[1];

            // Get input from edit field
            let input = UICtrl.getEditInput(currentGoal);
            console.log(input.goal);

            // If the type is goal and the field is not empty
            if (
                type === "goal" &&
                input.goal !== "" &&
                input.goal !== undefined
            ) {
                // Add the goal update to the data controller
                updatedGoal = dataCtrl.editGoal(input.goal, type, ID);

                // Remove input and update the edited goal in the UI
                UICtrl.hideEditGoalInputDisplay(currentGoal);
                UICtrl.updateListItem(currentGoal, updatedGoal, type);
            } else if (
                type === "quit" &&
                input.goal !== "" &&
                input.date !== "" &&
                new Date(input.date) < new Date()
            ) {
                // Convert date into timestamp
                date = input.date.split("-");
                newDate = new Date(date[0], date[1] - 1, date[2]);
                newDate = newDate.getTime();

                // Format to how many days it has been
                days = Math.floor(
                    (new Date().getTime() - newDate) / (60 * 60 * 24 * 1000)
                );

                // Add the goal to the data controller
                updatedGoal = dataCtrl.editGoal(input.goal, type, ID, newDate);

                // Remove add goal message, edit goal options and add the goal to the UI
                UICtrl.hideMessage("goal");
                UICtrl.hideEditGoalInputDisplay(currentGoal);
                UICtrl.updateListItem(currentGoal, updatedGoal, type, days);
            }
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

            // Update the percentages
            updatePercentages();
        }
    };

    let ctrlOpenGoal = function (e) {
        if (optionsDisplayed === false) {
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
        let parent, parentID, input, currentGoal, newSubgoal;

        if (e.target !== undefined && e.target.matches(".add-subgoal-button")) {
            parent = e.target.parentElement.parentElement.parentElement.parentElement.id.split(
                "-"
            );
            parentID = parent[1];
            currentGoal =
                e.target.parentElement.parentElement.parentElement
                    .parentElement;
        } else if (e.target === undefined && e.id.includes("goal")) {
            parent = e.id.split("-");
            parentID = parent[1];
            currentGoal = e;
        }

        // Get input from fields
        if (currentGoal !== undefined) {
            input = UICtrl.getSubgoalInput(currentGoal);
        }

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
                    input.currentValue,
                    input.target
                );
                // Remove no goals message, option and input display and add subgoal to the UI
                UICtrl.hideMessage("subgoal", parentID);
                UICtrl.hideEditSubgoalInputDisplay();
                UICtrl.removeSubgoalOptionsDisplay();
                UICtrl.removeTargetInputDisplay();
                UICtrl.addListItem(newSubgoal, input.type, undefined, parentID);
                // Clear the input field
                UICtrl.clearFields();

                // Update the percentages
                updatePercentages();
            } else if (input.type === "checkbox" && input.goal !== "") {
                // Add the subgoal to the data controller
                newSubgoal = dataCtrl.addSubgoal(
                    input.goal,
                    parentID,
                    input.type
                );
                // Remove message, options and input display and add subgoal to the UI
                UICtrl.hideMessage("subgoal", parentID);
                UICtrl.hideEditSubgoalInputDisplay();
                UICtrl.removeSubgoalOptionsDisplay();
                UICtrl.removeTargetInputDisplay();
                UICtrl.addListItem(newSubgoal, input.type, undefined, parentID);
                // Clear the input field
                UICtrl.clearFields();

                // Update the percentages
                updatePercentages();
            }
        }
    };

    let ctrlToggleSubgoalCheckbox = function (e) {
        if (e.target.matches(".sub-check")) {
            let currentGoal,
                currentGoalID,
                splitID,
                ID,
                parent,
                parentSplitID,
                parentID,
                updatedSubgoal,
                isComplete;
            // Get current subgoal and subgoal ID
            currentGoal = e.target.parentElement.parentElement;
            currentGoalID = currentGoal.id;
            splitID = currentGoalID.split("-");
            ID = parseInt(splitID[1]);
            // Get parent ID
            parent = currentGoal.parentElement.parentElement.parentElement.id;
            parentSplitID = parent.split("-");
            parentID = parseInt(parentSplitID[1]);

            // Update completion status in the data controller
            updatedSubgoal = dataCtrl.toggleSubgoalIsComplete(ID, parentID);
            isComplete = updatedSubgoal.isComplete;

            // Update icon on the UI
            UICtrl.toggleCheckedIcon(currentGoal, isComplete);

            // Update the percentages
            updatePercentages();
        }
    };

    let ctrlToggleTargetInputDisplay = function (e) {
        let goalID, splitID, ID, parent, parentSplit, parentID;

        if (e.target.matches(".update-target")) {
            // Get subgoal ID
            goalID = e.target.parentElement.parentElement.parentElement.id;
            splitID = goalID.split("-");
            ID = parseInt(splitID[1]);
            // Get parent ID
            parent =
                e.target.parentElement.parentElement.parentElement.parentElement
                    .parentElement.parentElement.id;
            parentSplit = parent.split("-");
            parentID = parseInt(parentSplit[1]);

            // Remove subgoal and target options display
            UICtrl.removeSubgoalOptionsDisplay();
            UICtrl.removeTargetOptionsDisplay();

            // Show options on the UI
            UICtrl.toggleTargetInputDisplay(ID, parentID);
        }
    };

    let ctrlAddTargetItem = function (e) {
        let currentGoal,
            currentGoalID,
            splitID,
            ID,
            parent,
            parentSplitID,
            parentID,
            input,
            newTargetItem,
            currentValue;

        if (e.target !== undefined && e.target.matches(".target-add-save")) {
            // Get current goal ID
            currentGoal = e.target.parentElement.parentElement.parentElement;
            // Get subgoal ID
            currentGoalID = currentGoal.id;
            splitID = currentGoalID.split("-");
            ID = parseInt(splitID[1]);
            // Get parent ID
            parent = currentGoal.parentElement.parentElement.parentElement.id;
            parentSplitID = parent.split("-");
            parentID = parseInt(parentSplitID[1]);

            // Get input from fields
            input = UICtrl.getTargetItemInput(currentGoal);

            if (
                input.note !== "" &&
                input.note !== undefined &&
                input.value !== "" &&
                input.value > 0 &&
                input.date !== "" &&
                new Date(input.date) < new Date()
            ) {
                // Add new target item to the data structure
                newTargetItem = dataCtrl.addTargetItem(
                    parentID,
                    ID,
                    input.note,
                    input.value,
                    input.date
                );

                // Add target item to the UI
                UICtrl.addTargetListItem(
                    currentGoal,
                    newTargetItem,
                    ID,
                    parentID
                );

                // Clear the input field and remove all target and subgoal options
                UICtrl.removeSubgoalOptionsDisplay();
                UICtrl.removeTargetOptionsDisplay();
                UICtrl.clearFields();

                // Update the current value
                currentValue = dataCtrl.calculateTargetCurrentValue(
                    ID,
                    parentID
                );
                UICtrl.updateCurrentValue(currentValue, currentGoalID);

                // Update the target percentages
                updateTargetPercentages(ID, parentID);
            }
        }
    };

    let ctrlToggleEditTargetItemInputDisplay = function (e) {
        let currentGoal,
            goalID,
            splitID,
            ID,
            currentSubgoal,
            subgoal,
            subgoalSplit,
            subgoalID,
            parent,
            parentSplit,
            parentID;

        if (e.target.matches(".target-edit-icon")) {
            currentGoal = e.target.parentElement.parentElement.parentElement;
            // Get target ID
            goalID = currentGoal.id;
            splitID = goalID.split("-");
            ID = parseInt(splitID[1]);

            // Get the subgoal ID
            currentSubgoal =
                currentGoal.parentElement.parentElement.parentElement;
            subgoal = currentSubgoal.id;
            subgoalSplit = subgoal.split("-");
            subgoalID = parseInt(subgoalSplit[1]);

            // Get parent ID
            parent =
                currentSubgoal.parentElement.parentElement.parentElement.id;
            parentSplit = parent.split("-");
            parentID = parseInt(parentSplit[1]);

            // Toggle input display
            UICtrl.toggleEditTargetItemInputDisplay(ID, subgoalID, parentID);
        }
    };

    let ctrlEditTargetItem = function (e) {
        let currentGoal,
            goalID,
            splitID,
            ID,
            currentSubgoal,
            subgoal,
            subgoalSplit,
            subgoalID,
            parent,
            parentSplit,
            parentID,
            updatedTargetItem,
            currentValue;

        if (e.target.matches(".target-edit-save")) {
            currentGoal = e.target.parentElement.parentElement.parentElement;
            // Get target ID
            goalID = currentGoal.id;
            splitID = goalID.split("-");
            ID = parseInt(splitID[1]);

            // Get the subgoal ID
            currentSubgoal =
                currentGoal.parentElement.parentElement.parentElement;
            subgoal = currentSubgoal.id;
            subgoalSplit = subgoal.split("-");
            subgoalID = parseInt(subgoalSplit[1]);

            // Get parent ID
            parent =
                currentSubgoal.parentElement.parentElement.parentElement.id;
            parentSplit = parent.split("-");
            parentID = parseInt(parentSplit[1]);

            let input = UICtrl.getTargetEditInput(ID, subgoalID, parentID);

            if (
                input.note !== "" &&
                input.note !== undefined &&
                input.value !== "" &&
                input.value > 0 &&
                input.date !== "" &&
                new Date(input.date) < new Date()
            ) {
                // Add the target item update to the data controller
                updatedTargetItem = dataCtrl.editTargetItem(
                    ID,
                    subgoalID,
                    parentID,
                    input.note,
                    input.value,
                    input.date
                );

                // Remove input and update the edited goal in the UI
                UICtrl.hideEditTargetItemInputDisplay(currentGoal);
                UICtrl.updateTargetListItem(currentGoal, updatedTargetItem);

                // Update the current value
                currentValue = dataCtrl.calculateTargetCurrentValue(
                    subgoalID,
                    parentID
                );
                UICtrl.updateCurrentValue(currentValue, subgoal);

                // Update the target percentages
                updateTargetPercentages(subgoalID, parentID);
            }
        }
    };

    let ctrlDeleteTargetItem = function (e) {
        let currentGoal,
            goalID,
            splitID,
            ID,
            currentSubgoal,
            subgoal,
            subgoalSplit,
            subgoalID,
            parent,
            parentSplit,
            parentID,
            currentValue;

        if (e.target.matches(".target-delete-icon")) {
            currentGoal = e.target.parentElement.parentElement.parentElement;
            // Get target ID
            goalID = currentGoal.id;
            splitID = goalID.split("-");
            ID = parseInt(splitID[1]);

            // Get the subgoal ID
            currentSubgoal =
                currentGoal.parentElement.parentElement.parentElement;
            subgoal = currentSubgoal.id;
            subgoalSplit = subgoal.split("-");
            subgoalID = parseInt(subgoalSplit[1]);

            // Get parent ID
            parent =
                currentSubgoal.parentElement.parentElement.parentElement.id;
            parentSplit = parent.split("-");
            parentID = parseInt(parentSplit[1]);

            // Delete subgoal from the data structure
            dataCtrl.deleteTargetItem(ID, subgoalID, parentID);

            // Delete goal from UI
            UICtrl.deleteGoalItem(goalID);

            // Update the current value
            currentValue = dataCtrl.calculateTargetCurrentValue(
                subgoalID,
                parentID
            );
            UICtrl.updateCurrentValue(currentValue, subgoal);

            // Update the target percentages
            updateTargetPercentages(subgoalID, parentID);
        }
    };

    let ctrlToggleSubgoalOptionsDisplay = function (e) {
        if (e.target.matches(".sub-options-icon")) {
            // Show options on UI
            UICtrl.toggleGoalOptionsDisplay("subgoal");

            subOptionDisplayed = !subOptionDisplayed;

            // Hide target input when you show options
            UICtrl.removeTargetInputDisplay();
            // Hide the input when you close the options
            if (subOptionDisplayed === false) {
                UICtrl.hideEditSubgoalInputDisplay();
            }
        }
    };

    let ctrlToggleEditSubgoalInputDisplay = function (e) {
        let goalID, splitID, ID, parent, parentSplit, parentID;

        if (e.target.matches(".sub-edit-icon")) {
            // Get subgoal ID
            goalID = e.target.parentElement.parentElement.parentElement.id;
            splitID = goalID.split("-");
            ID = parseInt(splitID[1]);
            // Get parent ID
            parent =
                e.target.parentElement.parentElement.parentElement.parentElement
                    .parentElement.parentElement.id;
            parentSplit = parent.split("-");
            parentID = parseInt(parentSplit[1]);

            // Toggle input display
            UICtrl.toggleEditSubgoalInputDisplay(ID, parentID);
        }
    };

    let ctrlEditSubgoal = function (e) {
        let target,
            currentGoal,
            splitID,
            ID,
            parent,
            parentSplit,
            parentID,
            updatedSubgoal,
            isComplete;

        if (e.target.matches(".sub-edit-save")) {
            target = e.target.parentElement.parentElement.parentElement;
            // Get current subgoal and ID
            currentGoal = target.id;
            splitID = currentGoal.split("-");
            ID = splitID[1];
            // Get parent ID
            parent = target.parentElement.parentElement.parentElement.id;
            parentSplit = parent.split("-");
            parentID = parseInt(parentSplit[1]);

            // Get input from edit field
            let input = UICtrl.getSubgoalEditInput(currentGoal, parent);

            // If the type is goal and the field is not empty
            if (
                input.target &&
                input.goal !== "" &&
                input.goal !== undefined &&
                input.target !== "" &&
                input.target > 0
            ) {
                // Add the goal update to the data controller
                updatedSubgoal = dataCtrl.editSubgoal(
                    ID,
                    parentID,
                    input.goal,
                    input.target
                );

                // Remove input and update the edited goal in the UI
                UICtrl.hideEditSubgoalInputDisplay(target);
                UICtrl.updateSubgoalListItem(target, updatedSubgoal);

                // Update the target completion percentage
                UICtrl.displayTargetPercentage(
                    ID,
                    parentID,
                    updatedSubgoal.percentage
                );

                // Update if target is complete
                isComplete = updatedSubgoal.isComplete;

                UICtrl.toggleTargetComplete(ID, parentID, isComplete);

                //Update overall percentages
                updatePercentages();
            } else if (
                !input.target &&
                input.goal !== "" &&
                input.goal !== undefined
            ) {
                // Add the goal update to the data controller
                updatedSubgoal = dataCtrl.editSubgoal(ID, parentID, input.goal);

                // Remove input and update the edited goal in the UI
                UICtrl.hideEditSubgoalInputDisplay(target);
                UICtrl.updateSubgoalListItem(target, updatedSubgoal);
            }
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
                    .parentElement.parentElement.id;
            parentSplit = parent.split("-");
            parentID = parseInt(parentSplit[1]);

            // Delete subgoal from the data structure
            dataCtrl.deleteSubgoal(ID, parentID);

            // Delete goal from UI
            UICtrl.deleteGoalItem(goalID);

            // Update the percentages
            updatePercentages();
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
                // Close subgoal options display
                UICtrl.removeSubgoalOptionsDisplay();
                // Close the target input and options display
                UICtrl.removeTargetInputDisplay();
                UICtrl.removeTargetOptionsDisplay();
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
