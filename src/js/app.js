//########################################################################################################################################
//################################################## NPM PACKAGES + IMPORTS ##############################################################
//########################################################################################################################################
import Quote from "inspirational-quotes";
import uniqid from "uniqid";
import moment from 'moment';

import "../css/style.css";

//########################################################################################################################################
//##################################################### DATA CONTROLLER ##################################################################
//########################################################################################################################################

let dataController = (function () {
    //############################################################
    //                          GOALS
    //############################################################
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

            // Initial values
            totalItems = subgoals.length;
            totalCompletedItems = 0;
            incompletePercentage = 0;
            total = 100 / totalItems;

            // Get check/target items
            checkItems = subgoals.filter(
                current => current.type === "checkbox"
            );
            targetItems = subgoals.filter(current => current.type === "target");

            // Get number of completed check items and add to total
            if (checkItems.length > 0) {
                completeCheckItems = checkItems.filter(
                    current => current.isComplete === true
                    ).length;
                totalCompletedItems += completeCheckItems;
            }
            
            // Get number of completed target items and add to total
            if (targetItems.length > 0) {
                completeTargetItems = targetItems.filter(
                    current => current.isComplete === true
                    ).length;
                    totalCompletedItems += completeTargetItems;
                }
                
                
            // Get number of incompleted target items
            incompleteTargetItems = targetItems.filter(
                current => current.isComplete === false
            );

            // Find the percentage completion of each subgoal target based on the percentage value of each subgoal
            if (incompleteTargetItems.length > 0) {
                incompleteTargetItems.forEach(current => incompletePercentage += (total / 100) * current.percentage);
            }

            // Percentage completed before adding incomplete targets
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

    // All goals object
    let allGoals = {
            goal: [],
            quit: [],
    };

    //############################################################
    //                      SUBGOALS
    //############################################################

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

    //############################################################
    //                      TARGET ITEMS
    //############################################################

    class TargetItem {
        constructor(id, note, value, date, index) {
            this.id = id;
            this.note = note;
            this.value = value;
            this.date = date;
        }
    }

    //############################################################
    //                  FIND AND RETURN GOALS
    //############################################################

    let findGoal = function (type, parentID, subgoalID, targetID) {
        let goal, ids, index;

        if (type === "quit") {
            ids = allGoals[type].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(parentID);

            if (index !== -1) {
                goal = allGoals[type][index];
            }
            // Return the quit goal
            return goal;
        }

        if (parentID !== undefined && parentID.length > 0) {
            ids = allGoals["goal"].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(parentID);

            if (index !== -1) {
                goal = allGoals["goal"][index];
            }

            if (subgoalID !== undefined && subgoalID.length > 0) {
                ids = goal.subgoals.map(function (current) {
                    return current.id;
                });

                index = ids.indexOf(subgoalID);

                if (index !== -1) {
                    goal = goal.subgoals[index];
                }

                if (targetID !== undefined && targetID.length > 0) {
                    ids = goal.targetItems.map(function (current) {
                        return current.id;
                    });

                    index = ids.indexOf(targetID);

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
    };

    //############################################################
    //          SORT AND INSERT TARGET ITEMS BY DATE
    //############################################################

    // Format the time to get the item index below
    let formatTime = function (date) {
        return new Date(date).getTime();
    }

    // Return the index of where the new target item will be inserted
    let getTargetItemIndex = function (obj, arr) {
        let index;

        if (arr.length > 0) {
            if (formatTime(obj.date) < formatTime(arr[arr.length - 1].date)) {
                index = arr.length;
                return index;
            } else {
                for (let item in arr) {
                    if (formatTime(obj.date) >= formatTime(arr[item].date)) {
                        index = arr.map(e => formatTime(e.date)).indexOf(formatTime(arr[item].date));
                        if (index !== -1) {
                            return index;
                        }
                    } 
                }
            }
        } else if (arr.length === 0) {
            index = 0;
            return index;
        }
    };

    // Push targte item to subgoal target items array
    let pushToTargetItems = function (obj, arr, index) {
        if (arr.length > 0) {
            if (arr.length === index) {
                arr.push(obj);
            } else {
                arr.splice(index, 0, obj);
            }
        } else if (arr.length === 0) {
            arr.push(obj);
        }
    };


    return {
        //##############################################
        //                     GOALS
        //##############################################
        
        addGoal: function (type, goal, date) {
            let newGoal, ID;

            // Create an ID for the goal with uniqid
            ID = uniqid();
            // Create new goal based on type
            if (type === "goal") {
                newGoal = new Goal(ID, goal);
            } else if (type === "quit") {
                newGoal = new Quit(ID, goal, date);
            }
            // Push new goal into goals array
            allGoals[type].push(newGoal);
            // Return the new goal
            console.log(newGoal, allGoals[type]);
            return newGoal;
        },

        editGoal: function (editedGoal, type, id, editedDate) {
            let currentGoal;
            // Select goal by id and type
            currentGoal = findGoal(type, id);
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
            let ids, index;

            ids = allGoals[type].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                allGoals[type].splice(index, 1);
            }
            // Show no goals message if goal arrays are empty
            if (
                allGoals["goal"].length < 1 &&
                allGoals["quit"].length < 1
            ) {
                document.querySelector(".no-goal").classList.remove("hide");
            }
        },

        calculatePercentage: function (id) {
            let ids, index;

            ids = allGoals["goal"].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                allGoals["goal"][index].calcPercentage(allGoals["goal"][index].subgoals);
            }
    
        },

        getPercentage: function (id) {
            let ids, index, percentage;

            ids = allGoals["goal"].map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                percentage = allGoals["goal"][index].getPercentage();

                return percentage;
            }
        },

        //##############################################
        //                 SUBGOALS
        //##############################################

        addSubgoal: function (goal, parentID, type, currentValue, target) {
            let currentGoal, newSubgoal, ID;

            currentGoal = findGoal(undefined, parentID);

            // Create an ID for the goal with uniqid
            ID = uniqid();

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
            currentGoal = findGoal(undefined, parentID, id);
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

            goal = findGoal(undefined, parentID);

            ids = goal.subgoals.map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                goal.subgoals.splice(index, 1);
            }

            if (goal.subgoals.length < 1) {
                let currentGoal = document.querySelector(`#goal-${parentID}`);
                currentGoal.querySelector(".no-goal").classList.remove("hide");
            }
        },

        toggleSubgoalIsComplete: function (id, parentID) {
            let currentGoal;
            // Select subgoal by ID and parent goal ID
            currentGoal = findGoal(undefined, parentID, id);

            // Toggle isComplete value
            currentGoal.isComplete = !currentGoal.isComplete;

            // return the updated goal
            return currentGoal;
        },

        getisComplete: function (subgoalID, parentID) {
            let goal, ids, index, currentTarget;

            goal = findGoal(undefined, parentID);

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

        //##############################################
        //             TARGET ITEMS
        //##############################################

        addTargetItem: function (parentID, id, note, value, date) {
            let goal, newTargetItem, ID, currentIndex;

            // Find goal using function
            goal = findGoal(undefined, parentID, id);

            // Create an ID for the goal with uniqid
            ID = uniqid();

            // Create new target item using the TargetItem class
            newTargetItem = new TargetItem(ID, note, value, date);

            // Get the current index of where to insert the item based on the date
            currentIndex = getTargetItemIndex(newTargetItem, goal.targetItems);
            
            // Push items to the subgoal array using the above index
            pushToTargetItems(newTargetItem, goal.targetItems, currentIndex);

            // Return the newly created target item and the insertion index
            return [newTargetItem, currentIndex];
        },

        editTargetItem: function (
            ID,
            subgoalID,
            parentID,
            newNote,
            newValue,
            newDate
        ) {
            let goal, ids, index, currentTargetItem, currentIndex;

            goal = findGoal(undefined, parentID, subgoalID);

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

            // Remove the item from the array
            if (index !== -1) {
                goal.targetItems.splice(index, 1);
            }

            // Find new index of item
            currentIndex = getTargetItemIndex(currentTargetItem, goal.targetItems)

            // Push items to the subgoal array using the above index
            pushToTargetItems(currentTargetItem, goal.targetItems, currentIndex);

            console.log(currentTargetItem);

            // Return the updated  goal
            return [currentTargetItem, currentIndex];
        },

        deleteTargetItem: function (id, subgoalID, parentID) {
            let goal, ids, index;

            goal = findGoal(undefined, parentID, subgoalID);

            ids = goal.targetItems.map(function (current) {
                return current.id;
            });

            index = ids.indexOf(id);

            if (index !== -1) {
                goal.targetItems.splice(index, 1);
            }
        },

        calculateTargetCurrentValue: function (subgoalID, parentID) {
            let currentTarget = findGoal(undefined, parentID, subgoalID);

            // Calculate the current value of all targets
            return currentTarget.calcTargetCurrentValue(
                currentTarget.targetItems
            );
        },

        calculateTargetPercentages: function (subgoalID, parentID) {
            let goal, ids, index, currentTarget;

            goal = findGoal(undefined, parentID);

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

            goal = findGoal(undefined, parentID);

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
    };
})();

//########################################################################################################################################
//###################################################### UI CONTROLLER ###################################################################
//########################################################################################################################################

let UIController = (function () {
    let DOMstrings = {
        // Content
        prevGoalButton: ".prev-goal",
        nextGoalButton: ".next-goal",

        // Header
        //currentYear: ".current-year",
        currentTime: ".current-time",
        hideMessage: ".no-goal",

        // Goal strings
        navbar: ".goal-navbar",
        addGoalButton: ".goal-nav-button__show-add",
        addGoalMenu: ".goal-nav__add-goal",
        addGoalType: ".add-goal-input__type",
        addGoalInput: ".add-goal-input__goal",
        addGoalDate: ".add-goal-input__date",
        addGoalSubmit: ".add-goal-input__submit",
        goalOptionsDisplay: ".goal-nav__show-options",
        goalOptions: ".goal-nav-button__show-options",
        goalOptionsIcons: ".goal-options",
        goalsList: ".goal-container",
        goalItem: ".goal-item",
        gridItem: ".grid-item",
        goalTitle: ".goal-title",
        openGoalTitle: ".open-goal-title",
        goalWheelPercentage: ".display-wheel-percentage",
        goalTextPercentage: ".display-text-percentage",
        goalDrag: ".goal-options-icon__drag",
        days: ".goal-quit__days",
        editGoal: ".goal-edit",
        editGoalInput: ".edit-goal-input__goal",
        editGoalDate: ".edit-goal-input__date",

        // Subgoal strings
        subgoalNavbar: ".subgoals-navbar",
        addSubgoal: ".subgoal-nav__add-goal",
        addSubgoalIcon: ".subgoal-nav-button__show-add",
        addSubgoalType: ".add-subgoal-input__type",
        addSubgoalInput: ".add-subgoal-input__goal",
        addSubgoalTarget: ".add-subgoal-input__target",
        addSubgoalSubmit: ".add-subgoal-input__submit",
        subgoalListContainer: ".subgoal-container",
        subgoalsList: ".subgoal-list__incomplete",
        completedSubgoalsList: ".subgoal-list__complete",
        subgoalItem: ".subgoal-item",
        subgoalDrag: ".subgoal-options__left",
        subgoalTitle: ".subgoal-title",
        subgoalCurrentValue: ".subgoal-target__current-value",
        subgoalProgressBar: ".subgoal-target__progress-filled",
        targetPercentage: ".subgoal-target__progress-percentage",
        subgoalCheckboxContainer: ".subgoal-checkbox-container",
        subgoalUpdateIcons: ".subgoal-update-goal-button",
        subgoalCheckbox: ".subgoal-checkbox-button",
        subgoalCheckboxIcon: ".subgoal-checkbox-icon",
        subgoalTarget: ".subgoal-target__current-target",
        subgoalOptionsDisplay: ".subgoal-nav__show-options",
        subgoalOptionsIcons: ".subgoal-options__right",
        editSubgoal: ".subgoal-edit",
        editSubgoalInput: ".edit-subgoal-input__goal",
        editSubgoalTarget: ".edit-subgoal-input__target",

        // Subgoal target strings
        updateTarget: ".subgoal-target-button__show-add",
        updateTargetIcon: ".subgoal-target-icon__show-add",
        addTargetInputs: ".target-item-add",
        addTargetNote: ".target-item-add__note",
        addTargetValue: ".target-item-add__value",
        addTargetDate: ".target-item-add__date",
        addTargetSaveIcon: ".target-item-add__save-icon",
        targetItems: ".target-item-container",
        targetItemsList: ".target-item-list",
        targetListItem: ".target-list-item",
        targetInfo: ".target-info",
        targetNote: ".target-list-item__note",
        targetValue: ".target-list-item__value",
        targetDate: ".target-list-item__date",
        targetItemsOptions: ".target-options",
        editTargetInputs: ".target-edit",
        editTargetNote: ".edit-target-input__note",
        editTargetValue: ".edit-target-input__value",
        editTargetDate: ".edit-target-input__date",
        editTargetSaveIcon: ".edit-target-input__save-icon",
    };

    //#############################################################
    //                        STATES 
    //#############################################################
    let isDraggable = false;

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
                value: parseFloat(
                    currentGoal.querySelector(DOMstrings.addTargetValue).value
                ),
                date: currentGoal.querySelector(DOMstrings.addTargetDate).value,
            };
        },

        getSubgoalEditInput: function (currentSubgoal) {
            let currentTarget = currentSubgoal.querySelector(DOMstrings.editSubgoalTarget);

            if (currentTarget) {
                return {
                    goal: currentSubgoal.querySelector(DOMstrings.editSubgoalInput).value,
                    target: parseInt(currentTarget.value),
                    type: "target",
                };
            } else {
                return {
                    goal: currentSubgoal.querySelector(DOMstrings.editSubgoalInput).value,
                        type: "checkbox",
                    };
            }
        },

        getTargetEditInput: function (currentTarget) {
            return {
                note: currentTarget.querySelector(DOMstrings.editTargetNote).value,
                value: parseInt(
                    currentTarget.querySelector(DOMstrings.editTargetValue).value
                ),
                date: currentTarget.querySelector(DOMstrings.editTargetDate).value,
            };
        },

        correctInput: function (type, goal, subgoal, target) {
            //######################################
            //                GOALS
            //######################################

            // Add goal input
            if (type === "goal-input" && goal === undefined) {
                document.querySelector(DOMstrings.addGoalInput).classList.remove("incorrect-input");
            } 
            // Add goal date 
            else if (type === "goal-date" && goal === undefined) {
                document.querySelector(DOMstrings.addGoalDate).classList.remove("incorrect-input");
            } 
            // Goal complete
            else if (type === "goal" && goal === undefined) {
                document.querySelector(DOMstrings.addGoalInput).classList.remove("incorrect-input");
                if (document.querySelector(DOMstrings.addGoalDate)) {
                    document.querySelector(DOMstrings.addGoalDate).classList.remove("incorrect-input");
                }
            }
            // Edit goal input
            else if (type === "goal-input" && goal !== undefined) {
                goal.querySelector(DOMstrings.editGoalInput).classList.remove("incorrect-input");
            } 
            // Edit goal date
            else if (type === "goal-date" && goal !== undefined) {
                goal.querySelector(DOMstrings.editGoalDate).classList.remove("incorrect-input");
            } 
            // Goal complete
            else if (type === "goal" && goal !== undefined) {
                goal.querySelector(DOMstrings.editGoalInput).classList.remove("incorrect-input");
                if (goal.querySelector(DOMstrings.editGoalDate)) {
                    goal.querySelector(DOMstrings.editGoalDate).classList.remove("incorrect-input");
                }
            }

            //######################################
            //              SUBGOALS
            //######################################

            // Add subgoal input
            else if (type === "subgoal-input" && subgoal === undefined) {
                goal.querySelector(DOMstrings.addSubgoalInput).classList.remove("incorrect-input");
            } 
            // Add subgoal target
            else if (type === "subgoal-target" && subgoal === undefined) {
                goal.querySelector(DOMstrings.addSubgoalTarget).classList.remove("incorrect-input");
            }
            // Subgoal complete
            else if (type === "subgoal" && subgoal === undefined) {
                goal.querySelector(DOMstrings.addSubgoalInput).classList.remove("incorrect-input");
                if (goal.querySelector(DOMstrings.addSubgoalTarget)) {
                    goal.querySelector(DOMstrings.addSubgoalTarget).classList.remove("incorrect-input");
                }
            }
            // Edit subgoal input
            else if (type === "subgoal-input" && subgoal !== undefined) {
                subgoal.querySelector(DOMstrings.editSubgoalInput).classList.remove("incorrect-input");
            } 
            // Edit subgoal target
            else if (type === "subgoal-target" && subgoal !== undefined) {
                subgoal.querySelector(DOMstrings.editSubgoalTarget).classList.remove("incorrect-input");
            }
            // Subgoal complete
            else if (type === "subgoal" && subgoal !== undefined) {
                subgoal.querySelector(DOMstrings.editSubgoalInput).classList.remove("incorrect-input");
                if (subgoal.querySelector(DOMstrings.editSubgoalTarget)) {
                    subgoal.querySelector(DOMstrings.editSubgoalTarget).classList.remove("incorrect-input");
                }
            }

            //######################################
            //            TARGET ITEMS
            //######################################

            // Add target note
            else if (type === "target-note" &&  target === undefined) {
                subgoal.querySelector(DOMstrings.addTargetNote).classList.remove("incorrect-input");
            }
            // Add target value
            else if (type === "target-value" &&  target === undefined) {
                subgoal.querySelector(DOMstrings.addTargetValue).classList.remove("incorrect-input");
            } 
            // Add target date
            else if (type === "target-date" &&  target === undefined) {
                subgoal.querySelector(DOMstrings.addTargetDate).classList.remove("incorrect-input");
            }
            // Target Complete
            else if (type === "target" && target === undefined) {                
                subgoal.querySelector(DOMstrings.addTargetNote).classList.remove("incorrect-input");
                subgoal.querySelector(DOMstrings.addTargetValue).classList.remove("incorrect-input");
                subgoal.querySelector(DOMstrings.addTargetDate).classList.remove("incorrect-input");
            }
            // Edit target note
            else if (type === "target-note" &&  target !== undefined) {
                target.querySelector(DOMstrings.editTargetNote).classList.remove("incorrect-input");
            }
            // Edit target value
            else if (type === "target-value" &&  target !== undefined) {
                target.querySelector(DOMstrings.editTargetValue).classList.remove("incorrect-input");
            }
            // Edit target date
            else if (type === "target-date" &&  target !== undefined) {
                target.querySelector(DOMstrings.editTargetDate).classList.remove("incorrect-input");
            }
            // Target Complete
            else if (type === "target" && target !== undefined) {                
                target.querySelector(DOMstrings.editTargetNote).classList.remove("incorrect-input");
                target.querySelector(DOMstrings.editTargetValue).classList.remove("incorrect-input");
                target.querySelector(DOMstrings.editTargetDate).classList.remove("incorrect-input");
            }
        },

        incorrectInput: function (type, goal, subgoal, target) {
            //######################################
            //              GOALS
            //######################################
            
            // Add goal input
            if (type === "goal-input" && goal === undefined) {
                document.querySelector(DOMstrings.addGoalInput).classList.add("incorrect-input");
                document.querySelector(DOMstrings.addGoalInput).focus();
            }
            // Add goal date 
            else if (type === "goal-date" && goal === undefined) {
                document.querySelector(DOMstrings.addGoalDate).classList.add("incorrect-input");
                document.querySelector(DOMstrings.addGoalDate).focus();
            } 
            // Edit goal input
            else if (type === "goal-input" && goal !== undefined) {
                goal.querySelector(DOMstrings.editGoalInput).classList.add("incorrect-input");
                goal.querySelector(DOMstrings.editGoalInput).focus();
            } 
            // Edit goal date
            else if (type === "goal-date" && goal !== undefined) {
                goal.querySelector(DOMstrings.editGoalDate).classList.add("incorrect-input");
                goal.querySelector(DOMstrings.editGoalDate).focus();
            } 

            //######################################
            //            SUBGOALS
            //######################################

            // Add subgoal input
            else if (type === "subgoal-input" && subgoal === undefined) {
                goal.querySelector(DOMstrings.addSubgoalInput).classList.add("incorrect-input");
                goal.querySelector(DOMstrings.addSubgoalInput).focus();
            } 
            // Add subgoal target
            else if (type === "subgoal-target" && subgoal === undefined) {
                goal.querySelector(DOMstrings.addSubgoalTarget).classList.add("incorrect-input");
                goal.querySelector(DOMstrings.addSubgoalTarget).focus();
            } 
            // Edit subgoal input
            else if (type === "subgoal-input" && subgoal !== undefined) {
                subgoal.querySelector(DOMstrings.editSubgoalInput).classList.add("incorrect-input");
                subgoal.querySelector(DOMstrings.editSubgoalInput).focus();
            } 
            // Edit subgoal target
            else if (type === "subgoal-target" && subgoal !== undefined) {
                subgoal.querySelector(DOMstrings.editSubgoalTarget).classList.add("incorrect-input");
                subgoal.querySelector(DOMstrings.editSubgoalTarget).focus();
            }

            //######################################
            //            TARGET ITEMS
            //######################################

            // Add target note
            else if (type === "target-note" &&  target === undefined) {
                subgoal.querySelector(DOMstrings.addTargetNote).classList.add("incorrect-input");
                subgoal.querySelector(DOMstrings.addTargetNote).focus();
            }
            // Add target value
            else if (type === "target-value" &&  target === undefined) {
                subgoal.querySelector(DOMstrings.addTargetValue).classList.add("incorrect-input");
                subgoal.querySelector(DOMstrings.addTargetValue).focus();
            } 
            // Add target date
            else if (type === "target-date" &&  target === undefined) {
                subgoal.querySelector(DOMstrings.addTargetDate).classList.add("incorrect-input");
                subgoal.querySelector(DOMstrings.addTargetDate).focus();
            }
            // Edit target note
            else if (type === "target-note" &&  target !== undefined) {
                target.querySelector(DOMstrings.editTargetNote).classList.add("incorrect-input");
                target.querySelector(DOMstrings.editTargetNote).focus();
            }
            // Edit target value
            else if (type === "target-value" &&  target !== undefined) {
                target.querySelector(DOMstrings.editTargetValue).classList.add("incorrect-input");
                target.querySelector(DOMstrings.editTargetValue).focus();
            }
            // Edit target date
            else if (type === "target-date" &&  target !== undefined) {
                target.querySelector(DOMstrings.editTargetDate).classList.add("incorrect-input");
                target.querySelector(DOMstrings.editTargetDate).focus();
            }
        },


        /*##############################################
                        ADD GOAL OPTIONS
        ################################################*/

        showAddGoalMenu: function (button, target) {
            if (button) {
                let subgoalMenu = button.querySelector(DOMstrings.addSubgoal);
                // Toggle menu display
                subgoalMenu.classList.toggle("invisible");
                // Clear input errors
                this.correctInput("subgoal", subgoalMenu);

                if (!subgoalMenu.classList.contains("invisible")) {
                    target.innerHTML = 
                    `<i class="fas fa-minus subgoal-nav-icon subgoal-nav-icon__show-add spin-right white"></i>`;
                    subgoalMenu.classList.add("slide-in-left");
                    subgoalMenu.classList.remove("slide-out-left");
                    subgoalMenu.querySelector(DOMstrings.addSubgoalTarget).classList.add("hide");
                    subgoalMenu.querySelector(DOMstrings.addSubgoalType).selectedIndex = "0";
                    // Focus on input
                    button.querySelector(DOMstrings.addSubgoalInput).focus();
                } else {
                    target.innerHTML = 
                    `<i class="fas fa-plus subgoal-nav-icon subgoal-nav-icon__show-add spin-left white"></i>`;
                    subgoalMenu.classList.remove("slide-in-left");
                    subgoalMenu.classList.add("slide-out-left");
                }
            } else {
                let menu = document.querySelector(DOMstrings.addGoalMenu);
                // Toggle menu display
                menu.classList.toggle("invisible");
                // Clear input errors
                this.correctInput("goal");

                if (!menu.classList.contains("invisible")) {
                    target.innerHTML = 
                    `<i class="fas fa-minus goal-nav-icon goal-nav-icon__show-add spin-right white"></i>`;
                    menu.classList.add("slide-in-left");
                    menu.classList.remove("slide-out-left");
                    // Focus on input
                    document.querySelector(DOMstrings.addGoalInput).focus();
                } else {
                    target.innerHTML = 
                    `<i class="fas fa-plus goal-nav-icon goal-nav-icon__show-add spin-left white"></i>`;
                    menu.classList.remove("slide-in-left");
                    menu.classList.add("slide-out-left");
                }
            }
        },

        hideAddGoalMenu: function () {
            // Reset navbar menu if open
            document
            .querySelector(DOMstrings.addGoalMenu)
            .classList.add("invisible");

            // Clear input errors
            this.correctInput("goal");

            document.querySelector(
                DOMstrings.addGoalButton
            ).innerHTML = 
            `<i class="fas fa-plus goal-nav-icon goal-nav-icon__show-add white"></i>`;
        },


        hideAddSubgoalMenu: function () {
            let goals = [...document.querySelectorAll(DOMstrings.subgoalNavbar)];

            goals.forEach(current => {
                current
                    .querySelector(DOMstrings.addSubgoal)
                    .classList.add("invisible");

                current.querySelector(
                    DOMstrings.addSubgoalIcon
                ).innerHTML = 
                `<i class="fas fa-plus subgoal-nav-icon subgoal-nav-icon__show-add spin-left white"></i>`;
            });
        },

        changeType: function (e) {
            let clearErrors = function (type, goal) {
                UIController.correctInput(type, goal);
            }

            if (e.target.matches(".add-goal-input__type")) {
                document
                    .querySelector(DOMstrings.addGoalDate)
                    .classList.toggle("hide");

                // Clear input errors
                clearErrors("goal");

                // Focus on input field
                document.querySelector(DOMstrings.addGoalInput).focus();
            } else if (e.target.matches(".add-subgoal-input__type")) {
                let goals = [...document.querySelectorAll(DOMstrings.goalItem)];
                let subgoalTargets = [...document.querySelectorAll(DOMstrings.addSubgoalTarget)];
                let subgoalInputs = [...document.querySelectorAll(DOMstrings.addSubgoal)];

                goals.forEach(curr => clearErrors("subgoal", curr));
                subgoalTargets.forEach(curr => curr.classList.toggle("hide"));
                subgoalInputs.forEach(curr => curr.querySelector(DOMstrings.addSubgoalInput).focus());
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
                        <nav class="subgoals-navbar">
                            <div class="subgoal-nav-div subgoal-nav__show-add">
                                <button class="subgoal-nav-button subgoal-nav-button__show-add">
                                    <i
                                        class="fas fa-plus subgoal-nav-icon subgoal-nav-icon__show-add white"
                                    ></i>
                                </button>
                            </div>

                            <div class="subgoal-nav-div subgoal-nav__add-goal invisible">
                                <select
                                    name="type"
                                    class="add-subgoal-input__type"
                                >
                                    <option value="checkbox" selected>
                                        CHECKBOX
                                    </option>
                                    <option value="target">TARGET</option>
                                </select>
                                <input
                                    type="text"
                                    class="add-subgoal-input__goal"
                                    placeholder="ADD A SUBGOAL"
                                />
                                <input
                                    type="number"
                                    name="subgoal-target"
                                    placeholder="GOAL TARGET"
                                    class="add-subgoal-input__target hide"
                                    step="1"
                                />
                                <input
                                    type="button"
                                    class="add-goal-input__submit"
                                    value="SUBMIT"
                                />
                            </div>

                            <div class="subgoal-nav-div subgoal-nav__show-options hide">
                                <button class="subgoal-nav-button subgoal-nav-button__show-options">
                                    <i
                                        class="fas fa-bars subgoal-nav-icon subgoal-nav-icon__show-options white"
                                    ></i>
                                </button>
                            </div>

                            <div class="subgoal-nav-div subgoal-nav__close-goal">
                                <button class="subgoal-nav-button subgoal-nav-button__close-goal">
                                    <i
                                        class="fas fa-times subgoal-nav-icon subgoal-nav-icon__close-goal white"
                                    ></i>
                                </button>
                            </div>
                        </nav>
                    </div>

                    <div class="main-goal">
                        <div class="goal-div goal-options hide">
                            <button class="goal-options-button goal-options-button__drag">
                                <i class="fas fa-bars goal-options-icon goal-options-icon__drag grey"></i></button>
                            <button class="goal-options-button goal-options-button__edit">
                                <i class="fas fa-edit goal-options-icon goal-options-icon__edit white"></i></button>
                            <button class="goal-options-button goal-options-button__delete">
                                <i class="fas fa-trash-alt goal-options-icon goal-options-icon__delete white"></i></button>
                        </div>
                        <div class="goal-div goal-edit hide">
                            <input type="text" class="edit-goal-input__goal" value="%title%">
                            <button class="edit-goal-input__submit">
                                <i class="fas fa-check edit-goal-input__save-icon white"></i>
                            </button>
                        </div>
                        <div class="goal-div goal-header">
                            <h2 class="goal-title">%short-title%</h2>
                            <h2 class="open-goal-title hide">%title%</h2>
                            <p class="display-text-percentage"></p>
                            <div class="goal-percentage">
                                <div class="percentage-wheel-container">
                                    <svg viewBox="0 0 36 36" class="circular-chart">
                                        <path class="circle-bg"
                                        d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path class="circle"
                                        stroke-dasharray="0, 100"
                                        d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <text x="18" y="20.35" class="display-wheel-percentage">0%</text>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="goal-div no-goal hide">
                        <i class="fas fa-plus no-goal__icon"></i>
                        <p class="no-goal__text">ADD A SUBGOAL CATEGORY</p>
                    </div>
                    <div class="goal-div subgoal-container hide">
                        <ul class="subgoal-list subgoal-list__incomplete"></ul>
                        <ul class="subgoal-list subgoal-list__complete"></ul>
                    </div>
                </div>
             `;
            } else if (type === "quit") {
                element = DOMstrings.goalsList;
                html = `
                <div class="grid-item quit-item" id="quit-%id%">
                    <div class="main-goal">
                        <div class="goal-div goal-options hide">
                            <button class="goal-options-button goal-options-button__drag">
                                <i class="fas fa-bars goal-options-icon goal-options-icon__drag grey"></i></button>
                            <button class="goal-options-button goal-options-button__edit">
                                <i class="fas fa-edit goal-options-icon goal-options-icon__edit white"></i></button>
                            <button class="goal-options-button goal-options-button__delete">
                                <i class="fas fa-trash-alt goal-options-icon goal-options-icon__delete white"></i></button>
                        </div>
                        <div class="goal-div goal-edit hide">
                            <input type="text" class="edit-goal-input__goal" value="%title%">
                            <button class="edit-goal-input__submit"> 
                                <i class="fas fa-check edit-goal-input__save-icon white"></i>
                            </button>
                            <input type="date" class="edit-goal-input__date" value="%fulldate%"/>
                        </div>
                        <div class="goal-div goal-header">
                            <h2 class="goal-title">%short-title%</h2>
                            <img
                                class="goal-quit__symbol"
                                src='assets/no-symbol.png'
                                alt="quit-symbol"
                            />
                            <div class="goal-quit__days">
                                <p>
                                <span class="goal-quit__days-text">%date%</span>
                                <span class="goal-quit__days-days">DAYS</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                     `;
            } else if (type === "target") {
                let goals = [...document.querySelectorAll(DOMstrings.gridItem)];

                goals.forEach(curr => {
                    if (curr.id === `goal-${parentID}`) {
                        currentGoal = curr;
                    }
                });

                html = `
                <li
                    class="subgoal-item subgoal-target"
                    id="subgoal-%id%"
                >
                    <div class="subgoal-div subgoal-options subgoal-options__left hide">
                        <button class="subgoal-options-button subgoal-options-button__drag">
                            <i class="fas fa-bars subgoal-options-icon subgoal-options-icon__drag grey"></i>
                        </button>
                    </div>

                    <div class="subgoal-div subgoal-edit subgoal-target-edit hide">
                        <input type="text" class="edit-subgoal-input__goal" value="%title%">
                        <input type="number" class="edit-subgoal-input__target" value="%target%" step="1"/>
                        <button class="edit-subgoal-input__submit">
                            <i class="fas fa-check edit-subgoal-input__save-icon white"></i>
                        </button>
                    </div>

                    
                    <p class="subgoal-div subgoal-title">%title%</p>

                    <div class="subgoal-div subgoal-target-container">
                        <p class="subgoal-target__current-value">%currentValue%</p>
                        <div class="subgoal-target__progress">
                            <div class="subgoal-target__progress-filled"></div>
                        </div>
                        <p class="subgoal-target__current-target">%target%</p>
                        <p class="subgoal-target__progress-percentage">0%</p>
                        <button class="subgoal-target-button__show-add">
                            <i class="fas fa-plus subgoal-target-icon__show-add grey"></i>
                        </button>
                    </div>

                    <div class="subgoal-div subgoal-options subgoal-options__right hide">
                        <button class="subgoal-options-button subgoal-options-button__edit">
                            <i class="fas fa-edit subgoal-options-icon subgoal-options-icon__edit white"></i> 
                        </button>
                        <button class="subgoal-options-button subgoal-options-button__delete">
                            <i class="fas fa-trash-alt subgoal-options-icon subgoal-options-icon__delete white"></i>
                        </button>
                    </div>

                    <div class="subgoal-div target-item-add hide">
                        <input type="text" class="target-item-add__note" placeholder="Add a note">
                        <input type="number" class="target-item-add__value" placeholder="Value">
                        <input type="date" class="target-item-add__date">
                        <button class="target-item-add__submit">
                            <i class='fas fa-check target-item-add__save-icon white'></i>
                        </button>
                    </div>

                    <div class="subgoal-div target-item-container">
                        <ul class="target-item-list"></ul>
                    </div>
                </li>
                `;
            } else if (type === "checkbox") {
                let goals = [...document.querySelectorAll(DOMstrings.gridItem)];

                goals.forEach(curr => {
                    if (curr.id === `goal-${parentID}`) {
                        currentGoal = curr;
                    }
                });

                html = `
                <li
                    class="subgoal-item subgoal-checkbox"
                    id="subgoal-%id%"
                >
                    <div class="subgoal-div subgoal-options subgoal-options__left hide">
                        <button class="subgoal-options-button subgoal-options-button__drag">
                            <i class="fas fa-bars subgoal-options-icon subgoal-options-icon__drag grey"></i>
                        </button>
                    </div>

                    <div class="subgoal-div subgoal-edit subgoal-checkbox-edit hide">
                        <input type="text" class="edit-subgoal-input__goal" value="%title%">
                        <button class="edit-subgoal-input__submit">
                            <i class="fas fa-check edit-subgoal-input__save-icon white"></i>
                        </button>
                    </div>
                    
                    <p class="subgoal-div subgoal-title">%title%</p>

                    <div class="subgoal-div subgoal-checkbox-container">
                        <button class="subgoal-checkbox-button subgoal-update-goal-button">
                            <i class="fas fa-square subgoal-checkbox-icon grey"></i>
                        </button>
                    </div>

                    <div class="subgoal-div subgoal-options subgoal-options__right hide">
                        <button class="subgoal-options-button subgoal-options-button__edit">
                            <i class="fas fa-edit subgoal-options-icon subgoal-options-icon__edit white"></i> 
                        </button>
                        <button class="subgoal-options-button subgoal-options-button__delete">
                            <i class="fas fa-trash-alt subgoal-options-icon subgoal-options-icon__delete white"></i>
                        </button>
                    </div>
                </li>
                `;
            }
            let goalStartDate, startYear, startMonth, startDay;

            let formatDate = (goalDate) => {
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

            let formatTitle = (title) => {
                if (title.length > 25) {
                     return `${title.slice(0, 25)}...`;
                } else {
                    return title;
                }
            }

            // Replace placeholder text with actual data
            newHtml = html.replace(/%id%/g, obj.id);
            newHtml = newHtml.replace(/%short-title%/g, formatTitle(obj.goal));
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

                // Show options icon if there are goals
                this.toggleOptionsIconDisplay(type, currentGoal);

                currentGoal.querySelector(DOMstrings.addSubgoalInput).focus();
            } else {
                document
                    .querySelector(element)
                    .insertAdjacentHTML("beforeend", newHtml);

                document.querySelector(element).classList.add("has-items");

                // Show options icon if there are goals
                this.toggleOptionsIconDisplay(type);

                document.querySelector(DOMstrings.addGoalInput).focus();
            }

            // Reset the CSS variables to 0
            document.documentElement.style.setProperty("--flex-basis-variable", "0%");
            document.documentElement.style.setProperty("--stroke-dash-variable", "0");
        },

        addTargetListItem: function (currentGoal, obj, currentIndex, type) {
            let html, newHtml;

            html = `
                <li class="target-list-item" id="target-%id%">
                    <div class="target-div target-edit hide">
                        <input type="text" class="edit-target-input__note" value="%note%">
                        <input type="number" class="edit-target-input__value" value="%value%" step="1"/>
                        <input type="date" class="edit-target-input__date" value="%originaldate%"/>
                        <button class="edit-target-input__submit">
                            <i class="fas fa-check edit-target-input__save-icon white"></i>
                        </button>
                    </div>
                
                    <p class="target-info target-list-item__note">%note%</p>
                    <p class="target-info target-list-item__value">%value%</p>
                    <p class="target-info target-list-item__date">%date%</p>
                
                    <div class="target-div target-options ${type === "new" ? "hide" : ""}">
                        <button class="target-options-button target-options-button__edit">
                            <i class="fas fa-edit target-options-icon target-options-icon__edit white"></i> 
                        </button>
                        <button class="target-options-button target-options-button__delete">
                            <i class="fas fa-trash-alt target-options-icon target-options-icon__edit white"></i>
                        </button>
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
                let startDay = goalStartDate.getDate();

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

            let targetList = currentGoal.querySelector(DOMstrings.targetItemsList);
            let targetListItems = targetList.querySelectorAll(DOMstrings.targetListItem);
            
            if (targetListItems.length === 0 || currentIndex === targetListItems.length) {
                targetList.insertAdjacentHTML("beforeend", newHtml);
            } else {
                targetListItems[currentIndex].insertAdjacentHTML("beforebegin", newHtml);
            }

            // Reset the CSS variables to 0
            document.documentElement.style.setProperty("--flex-basis-variable", "0%");
            document.documentElement.style.setProperty("--stroke-dash-variable", "0");

            currentGoal.querySelector(DOMstrings.addTargetNote).focus();
        },

        /*##################################################
                           OPTIONS DISPLAY 
        ####################################################*/

        toggleOptionsIconDisplay: function (type, currentGoal) {
            if (type === "goal" || type === "quit") {
                let goals = document.querySelectorAll(DOMstrings.gridItem);

                if (goals.length > 0) {
                    document.querySelector(DOMstrings.goalOptionsDisplay).classList.remove("hide");
                } else {
                    document.querySelector(DOMstrings.goalOptionsDisplay).classList.add("hide");
                }
            } else if (type === "checkbox" || type === "target") {
                let goals = currentGoal.querySelectorAll(DOMstrings.subgoalItem);

                if (goals.length > 0) {
                    currentGoal.querySelector(DOMstrings.subgoalOptionsDisplay).classList.remove("hide");
                } else {
                    currentGoal.querySelector(DOMstrings.subgoalOptionsDisplay).classList.add("hide");
                }
            }
        },


        toggleGoalOptionsDisplay: function (type) {
            let goals,
                goalOptionsIcons,
                targetItems,
                currentDragIcon;

            if (type === "goal") {
                goals = [...document.querySelectorAll(DOMstrings.gridItem)];

                // Toggle is draggable state
                isDraggable = !isDraggable;

                // Hide the add goal menu if shown
                this.hideAddGoalMenu();

                goals.forEach(curr => {
                    
                    if (curr.querySelector(DOMstrings.goalOptionsIcons).classList.contains("hide")) {
                        setTimeout(() => {curr.querySelector(DOMstrings.goalOptionsIcons).classList.remove("slide-down")}, 500);
                         // Add edit class from title and options displayed class
                        curr.querySelector(DOMstrings.goalTitle).classList.add("edit");
                        curr.classList.add("options-displayed");
                        // Remove slide-down class after completion
                        // Remove hide class and add slide-down class
                        curr.querySelector(DOMstrings.goalOptionsIcons).classList.remove("hide");
                        curr.querySelector(DOMstrings.goalOptionsIcons).classList.add("slide-down");
                        // Remove the slide-up class as a fallback
                        curr.querySelector(DOMstrings.goalOptionsIcons).classList.remove("slide-up");
                    } else {
                        // Remove slide-up class after completion and add the hide class
                        setTimeout(() => {
                            curr.querySelector(DOMstrings.goalOptionsIcons).classList.remove("slide-up");
                            // Remove edit class from title and options displayed class
                            curr.querySelector(DOMstrings.goalTitle).classList.remove("edit");
                            curr.classList.remove("options-displayed");
                            curr.querySelector(DOMstrings.goalOptionsIcons).classList.add("hide");
                        }, 400);
                        
                        // Add slide-up class
                        curr.querySelector(DOMstrings.goalOptionsIcons).classList.add("slide-up");
                        
                        // remove slide-down class as a fallback
                        curr.querySelector(DOMstrings.goalOptionsIcons).classList.remove("slide-down");
                    }

                    // Set correct attribute for draggable
                    currentDragIcon = curr.querySelector(DOMstrings.goalDrag);

                    if (currentDragIcon) {
                        // Set correct attribute for draggable
                        if (isDraggable === true) {
                            currentDragIcon.setAttribute("draggable", true);
                        } else if (isDraggable === false) {
                            currentDragIcon.setAttribute("draggable", false);
                        }
                    }
                });
            } else if (type === "subgoal") {
                goals = [...document.querySelectorAll(DOMstrings.subgoalItem)];
                // Hide add subgoal menu
                this.hideAddSubgoalMenu();     
                
                // Toggle is draggable state
                isDraggable = !isDraggable;

                goals.forEach(curr => {
                    // If the options are already displayed
                    if (curr.classList.contains("options-displayed")) {
                        // Set timeout to allow for item to slide out before the grid columns change
                        setTimeout(() => {
                            curr.querySelector(DOMstrings.subgoalOptionsIcons).classList.add("hide");
                            // Remove options displayed class
                            curr.classList.remove("options-displayed");
                            // Hide drag option
                            curr.querySelector(DOMstrings.subgoalDrag).classList.add("hide");
                            // Remove slide out right class after completion
                            curr.querySelector(DOMstrings.subgoalOptionsIcons).classList.remove("slide-out-right");
                        }, 500);

                        // Add slide out right class
                        curr.querySelector(DOMstrings.subgoalOptionsIcons).classList.add("slide-out-right");
                    }   else {
                        // Add options displayed class
                        curr.classList.add("options-displayed");
                        // Add slide in class and remove slide out
                        curr.querySelector(DOMstrings.subgoalOptionsIcons).classList.add("slide-in-right");
                        // Toggle icon display
                        curr.querySelector(DOMstrings.subgoalOptionsIcons).classList.remove("hide");
                        // Remove slide in right class after completion
                        setTimeout(() => {
                            curr.querySelector(DOMstrings.subgoalOptionsIcons).classList.remove("slide-in-right");
                        }, 500);
                    } 
                    
                    // Toggle add target item display
                    if (curr.querySelector(DOMstrings.updateTarget)) {
                        let target = curr.querySelector(DOMstrings.updateTarget);
                        // If the icons are hidden
                        if (target.classList.contains("hide")) {
                            setTimeout(() => {target.classList.remove("hide");}, 500);
                        } else {
                            target.classList.add("hide");
                        }
                    }

                    if (curr.querySelector(DOMstrings.subgoalCheckboxContainer)) {
                        let checkbox = curr.querySelector(DOMstrings.subgoalCheckboxContainer);
                        if (checkbox.classList.contains("hide")) {
                            setTimeout(() => {checkbox.classList.remove("hide")}, 500);
                        } else {
                            checkbox.classList.add("hide");
                        }
                    }
                    
                    // Set correct attribute for draggable
                    currentDragIcon = curr.querySelector(DOMstrings.subgoalDrag);

                    if (currentDragIcon) {
                        if (currentDragIcon.classList.contains("hide")) {
                            // Remove slide in left class afetr completion
                            setTimeout(() => {
                                currentDragIcon.classList.remove("slide-in-left");
                            }, 500);

                            // Remove hide class
                            currentDragIcon.classList.remove("hide");
                            // Add slide in left class
                            currentDragIcon.classList.add("slide-in-left"); 
                            // Remove other slide class as a fallback
                            currentDragIcon.classList.remove("slide-out-left");
                        } else {
                            // Remove slide out left class afetr completion and add hide
                            setTimeout(() => {
                                currentDragIcon.classList.add("hide");
                                currentDragIcon.classList.remove("slide-out-left");
                            }, 500);
                            // Add slide out left class
                            currentDragIcon.classList.add("slide-out-left");
                            // Remove other slide class as a fallback
                            currentDragIcon.classList.remove("slide-in-left");
                            
                        }

                        if (isDraggable === true) {
                            currentDragIcon.setAttribute("draggable", true);
                        } else if (isDraggable === false) {
                            currentDragIcon.setAttribute("draggable", false);
                        }
                    }

                    // Toggle target item display
                    targetItems = [...curr.querySelectorAll(DOMstrings.targetListItem)];
                    if (targetItems.length > 0) {
                        targetItems.forEach(curr => {
                            if (curr.querySelector(DOMstrings.targetItemsOptions).classList.contains("hide")) {
                                curr.querySelector(DOMstrings.targetItemsOptions).classList.remove("hide");
                                // Add slide in right class
                                curr.querySelector(DOMstrings.targetItemsOptions).classList.add("slide-in-right");
                                // Remove slide in right class after completion
                                setTimeout(() => {
                                    curr.querySelector(DOMstrings.targetItemsOptions).classList.remove("slide-in-right");
                                }, 500);

                            } else {
                                setTimeout(() => {
                                    curr.querySelector(DOMstrings.targetItemsOptions).classList.add("hide");
                                    // Remove slide out right class after completion
                                    curr.querySelector(DOMstrings.targetItemsOptions).classList.remove("slide-out-right");
                                }, 500);
                                // Add slide out right class
                                curr.querySelector(DOMstrings.targetItemsOptions).classList.add("slide-out-right");
                            }  
                        });
                    }
                });
            }
        },

        removeGoalOptionsDisplay: function (e) {
            let goals = [...document.querySelectorAll(DOMstrings.gridItem)];

            goals.forEach(curr => {
                // Remove options display
                curr.querySelector(DOMstrings.goalOptionsIcons).classList.add("hide");
                curr.querySelector(DOMstrings.goalTitle).classList.remove("edit");
                // Remove the draggable attribute
                curr.querySelector(DOMstrings.goalDrag).setAttribute("draggable", false);
            });

            // Set the isDraggable state to false
            isDraggable = false;
        },

        removeSubgoalOptionsDisplay: function () {;
            let goals = [...document.querySelectorAll(DOMstrings.subgoalItem)];

            goals.forEach(curr => {
                // Change the grid layout
                curr.classList.remove("options-displayed");

                curr.querySelector(DOMstrings.subgoalOptionsIcons).classList.add("hide");
                curr.querySelector(DOMstrings.subgoalTitle).classList.remove("edit");
                if (curr.querySelector(DOMstrings.updateTarget)) {
                    curr.querySelector(DOMstrings.updateTarget).classList.remove("hide");
                }
                if (curr.querySelector(DOMstrings.subgoalCheckboxContainer)) {
                    curr.querySelector(DOMstrings.subgoalCheckboxContainer).classList.remove("hide");
                }
                curr.querySelector(DOMstrings.subgoalDrag).classList.add("hide");
                // Remove the draggable attribute
                curr.querySelector(DOMstrings.subgoalDrag).setAttribute("draggable", false);

                // Set the isDraggable state to false
                isDraggable = false;
            });
        },

        removeTargetOptionsDisplay: function () {
            let goals, targetItems;
            goals = [...document.querySelectorAll(DOMstrings.subgoalItem)];

            goals.forEach(curr => {
                targetItems = curr.querySelectorAll(DOMstrings.targetListItem);
                // Hide target item options
                targetItems.forEach(curr => curr.querySelector(DOMstrings.targetItemsOptions).classList.add("hide"));
            });
        },

        /*##################################################
                            INPUT DISPLAY 
        ####################################################*/

        toggleEditGoalInputDisplay: function (currentGoal) {
            currentGoal.querySelector(DOMstrings.editGoal).classList.toggle("hide");
            currentGoal.querySelector(DOMstrings.goalTitle).classList.toggle("hide");
            currentGoal.querySelector(DOMstrings.editGoalInput).focus();
        },

        toggleEditSubgoalInputDisplay: function (currentSubgoal) {
            currentSubgoal.querySelector(DOMstrings.editSubgoal).classList.toggle("hide");
            currentSubgoal.querySelector(DOMstrings.subgoalTitle).classList.toggle("hide");
            currentSubgoal.querySelector(DOMstrings.editSubgoalInput).focus();

            // Hide add subgoal menu
            this.hideAddSubgoalMenu();
        },

        hideEditGoalInputDisplay: function (currentGoal) {
            if (currentGoal) {
                currentGoal.querySelector(DOMstrings.editGoal).classList.add("hide");
                currentGoal.querySelector(DOMstrings.goalTitle).classList.remove("hide");
            } else {
                let allGoals = [...document.querySelectorAll(DOMstrings.gridItem)];

                allGoals.forEach(curr => {
                    curr.querySelector(DOMstrings.editGoal).classList.add("hide");
                    curr.querySelector(DOMstrings.goalTitle).classList.remove("hide");
                });
            }
        },

        hideEditSubgoalInputDisplay: function (currentGoal) {
            if (currentGoal) {
                currentGoal.querySelector(DOMstrings.editSubgoal).classList.add("hide");
                currentGoal.querySelector(DOMstrings.subgoalTitle).classList.remove("hide");
            } else {
                let allGoals = [...document.querySelectorAll(DOMstrings.subgoalItem)];

                allGoals.forEach(curr => {
                    curr.querySelector(DOMstrings.editSubgoal).classList.add("hide");
                    curr.querySelector(DOMstrings.subgoalTitle).classList.remove("hide");
                });
            }
        },

        toggleTargetInputDisplay: function (currentSubgoal) {
            if (currentSubgoal.querySelector(DOMstrings.addTargetInputs).classList.contains("hide")
            ) {
                // Change icon to minus symbol
                currentSubgoal.querySelector(
                    DOMstrings.updateTarget
                ).innerHTML = `<i class="fas fa-minus subgoal-target-icon__show-add spin-right grey"></i>`;

                // Show input fields
                currentSubgoal.querySelector(DOMstrings.addTargetInputs).classList.remove("hide");
                // Add slide down animation
                currentSubgoal.querySelector(DOMstrings.addTargetInputs).classList.add("slide-down");

                // Remove the slide down class after it is complete
                setTimeout(() => {
                    currentSubgoal.querySelector(DOMstrings.addTargetInputs).classList.remove("slide-down");
                }, 500);

                // Hide add subgoal menu
                this.hideAddSubgoalMenu();
            } else {
                // Chnage icon to add symbol
                currentSubgoal.querySelector(
                    DOMstrings.updateTarget
                ).innerHTML = `<i class="fas fa-plus subgoal-target-icon__show-add spin-left grey"></i>`;

                // remove input fields
                setTimeout(() => {
                    currentSubgoal.querySelector(DOMstrings.addTargetInputs).classList.add("hide");
                    // Remove the slide up class after it is complete
                    currentSubgoal.querySelector(DOMstrings.addTargetInputs).classList.remove("slide-up");
                }, 500);

                // Add slide up animation 
                currentSubgoal.querySelector(DOMstrings.addTargetInputs).classList.add("slide-up");
            }
            // Add focus to the input
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

            currentSubgoal.querySelector(DOMstrings.addTargetDate).value = getCurrentDate();
        },

        removeTargetInputDisplay: function () {
            let goals, icon, target;
            goals = [...document.querySelectorAll(DOMstrings.subgoalItem)];

            goals.forEach(curr => {
                target = curr.querySelector(DOMstrings.addTargetInputs);
                icon = curr.querySelector(DOMstrings.updateTarget);
                // Hide inout display
                if (target) {
                    target.classList.add("hide");
                }

                if (icon) {
                    // Chnage icon to add symbol
                    icon.innerHTML = 
                    `<i class="fas fa-plus subgoal-target-icon__show-add grey"></i>`;
                }
            });
        },

        toggleEditTargetItemInputDisplay: function (target) {
            let info = [...target.querySelectorAll(DOMstrings.targetInfo)];

            info.forEach(curr => curr.classList.toggle("hide"));

            target
                .querySelector(DOMstrings.editTargetInputs)
                .classList.toggle("hide");

            target.querySelector(DOMstrings.editTargetNote).focus();
        },

        hideEditTargetItemInputDisplay: function (currentTarget) {
            let info = [...currentTarget.querySelectorAll(DOMstrings.targetInfo)];

            info.forEach(curr => curr.classList.remove("hide"));

            currentTarget
                .querySelector(DOMstrings.editTargetInputs)
                .classList.add("hide");
        },

        /*##################################################
                           UPDATE LIST ITEMS
        ####################################################*/

        updateListItem: function (currentGoal, updatedGoal, type, updatedDate) {
            // Set the innerHTML to to the updated goal
            currentGoal.querySelector(DOMstrings.goalTitle).innerHTML = `${updatedGoal.goal}`;

            if (type === "quit") {
                // Set the innerHTML to to the updated date
                currentGoal.querySelector(DOMstrings.days).innerHTML = `${updatedDate} days`;
            }
        },

        updateSubgoalListItem: function (currentGoal, updatedSubgoal) {
            // Set the innerHTML to to the updated goal
            currentGoal.querySelector(DOMstrings.subgoalTitle).innerHTML = `${updatedSubgoal.goal}`;

            if (updatedSubgoal.target) {
                // Set the innerHTML to to the updated target
                currentGoal.querySelector(DOMstrings.subgoalTarget).innerHTML = `${updatedSubgoal.target}`;
            }
        },

        updateTargetListItem: function (currentGoal, updatedTargetItem) {
            let formatDate = function (date) {
                let day = date.split("-")[2];
                let month = date.split("-")[1];
                
                return `${day}/${month}`;
            };
            
            // Update the current list
            currentGoal.querySelector(DOMstrings.targetNote).innerHTML = `${updatedTargetItem.note}`;
            currentGoal.querySelector(DOMstrings.targetValue).innerHTML = `${updatedTargetItem.value}`;
            currentGoal.querySelector(DOMstrings.targetDate).innerHTML = `${formatDate(updatedTargetItem.date)}`;
        },

        /*##################################################
                        DELETE LIST ITEM
        ####################################################*/

        deleteGoalItem: function (ID, parentGoal) {
            let element, goals, subgoals;
            // Select the element to be removed
            element = document.getElementById(ID);
            // Move up then select child to delete
            element.parentElement.removeChild(element);

            goals = document.querySelectorAll(DOMstrings.gridItem);

            if (parentGoal) {
                subgoals = parentGoal.querySelectorAll(DOMstrings.subgoalItem);
            }

            if (parentGoal === undefined && goals.length === 0) {
                // Remove the has items class
                document.querySelector(DOMstrings.goalsList).classList.remove("has-items");
                // Remove goal options icon display
                document.querySelector(DOMstrings.goalOptionsDisplay).classList.add("hide");

                // This value is used to set optionsdisplayed to false
                return false;
            } else if (parentGoal && subgoals.length === 0) {
                // Hide the subgoal options icon
                parentGoal.querySelector(DOMstrings.subgoalOptionsDisplay).classList.add("hide");

                // This value is used to set suboptionsdisplayed to false
                return false;
            }
            // This value is used to set optionsdisplayed/suboptsionsdeisplayed to true
            return true;
        },

        /*##################################################
                          CHECKED ITEMS
        ####################################################*/

        toggleCheckedIcon: function (currentGoal, isComplete) {
            let goal,
                title,
                goalContainer,
                incompletedGoalContainer,
                completedGoalContainer,
                completedGoalItems;

            // Arrange the goals into the correct list
            goalContainer = currentGoal.parentElement.parentElement;
            completedGoalContainer = goalContainer.querySelector(DOMstrings.completedSubgoalsList);
            incompletedGoalContainer = goalContainer.querySelector(DOMstrings.subgoalsList);

            // Update the appearance of the list items
            goal = currentGoal.querySelector(DOMstrings.subgoalCheckbox);
            title = currentGoal.querySelector(DOMstrings.subgoalTitle);

            if (isComplete) {
                goal.innerHTML = 
                `<i class="fas fa-check-square subgoal-checkbox-icon spin-right grey"></i>`;
                title.classList.add("subgoal-complete");
                completedGoalContainer.appendChild(currentGoal);
                // Remove the spin class so the checkbox only spins once
                setTimeout(() => {
                    goal.querySelector(DOMstrings.subgoalCheckboxIcon).classList.remove("spin-right");
                }, 500);
            } else {
                goal.innerHTML = 
                `<i class="fas fa-square subgoal-checkbox-icon spin-left grey"></i>`;
                title.classList.remove("subgoal-complete");
                incompletedGoalContainer.appendChild(currentGoal);
                // Remove the spin class so the checkbox only spins once
                setTimeout(() => {
                    goal.querySelector(DOMstrings.subgoalCheckboxIcon).classList.remove("spin-left");
                }, 500);
            }

            // Check if there are completed items in the container and if so add has-items class to the element
            completedGoalItems = completedGoalContainer.querySelectorAll(DOMstrings.subgoalItem);

            if (completedGoalItems.length > 0) {
                completedGoalContainer.classList.add("has-items");
            } else {
                completedGoalContainer.classList.remove("has-items");
            }
        },

        toggleTargetComplete: function (subgoalID, parentID, isComplete) {
            let goal,
                title,
                subgoal,
                incompletedGoalContainer,
                completedGoalContainer,
                completedGoalItems;

            goal = document.querySelector(`#goal-${parentID}`);
            subgoal = goal.querySelector(`#subgoal-${subgoalID}`);

            title = subgoal.querySelector(DOMstrings.subgoalTitle);

            // Select the lists for the goals to go into
            completedGoalContainer = goal.querySelector(DOMstrings.completedSubgoalsList);
            incompletedGoalContainer = goal.querySelector(DOMstrings.subgoalsList);

            if (isComplete) {
                title.classList.add("subgoal-complete");
                completedGoalContainer.appendChild(subgoal);
                this.removeTargetInputDisplay()
            } else if (!isComplete && completedGoalContainer.contains(subgoal)) {
                title.classList.remove("subgoal-complete");
                incompletedGoalContainer.appendChild(subgoal);
            } else if (!isComplete && incompletedGoalContainer.contains(subgoal)) {
                title.classList.remove("subgoal-complete");
            }

            // Check if there are completed items in the container and if so add has-items class to the element
            completedGoalItems = completedGoalContainer.querySelectorAll(DOMstrings.subgoalItem);

            if (completedGoalItems.length > 0) {
                completedGoalContainer.classList.add("has-items");
            } else {
                completedGoalContainer.classList.remove("has-items");
            }
        },

        //#############################################################
        // OPEN/CLOSE GOALS
        //#############################################################

        openGoal: function (goal) {
            if (!goal.classList.contains("open")) {
                // Close the add subgoal options
                goal.querySelector(DOMstrings.addSubgoalIcon).innerHTML = ` 
                <i class="fas fa-plus subgoal-nav-icon subgoal-nav-icon__show-add white"></i> 
                `;
                goal.querySelector(DOMstrings.addSubgoal).classList.add("invisible");
            }

            if (goal.classList.contains("goal-item")) {
                let subgoals, subgoalItems, goalCategories;
                // Close any open goals
                let allGoals = [...document.querySelectorAll(DOMstrings.gridItem)];

                allGoals.forEach(curr => {
                    curr.classList.remove("open");

                    subgoals = curr.querySelector(DOMstrings.subgoalListContainer);

                    if (subgoals) {
                        // Add the hide class to the subgoals list
                        subgoals.classList.add("hide");
                    }
                    // Show short goal title
                    curr.querySelector(DOMstrings.goalTitle).classList.remove("hide");
                    // Hide long goal title if it exists
                    if (curr.querySelector(DOMstrings.openGoalTitle)) {
                        curr.querySelector(DOMstrings.openGoalTitle).classList.add("hide");
                    }
                });

                // IF there are goals, then hide the main navbar when goal is opened
                if (allGoals.length > 0) {
                    document.querySelector(DOMstrings.navbar).classList.add("hide");
                }

                // Hide all goal options
                this.removeGoalOptionsDisplay();

                // Remove the hide class from subgoals list
                subgoals = goal.querySelector(DOMstrings.subgoalListContainer);

                if (subgoals) {
                    subgoals.classList.remove("hide");
                }

                // Display the add subgoal message if there are no subgoals
                subgoalItems = subgoals.querySelectorAll(DOMstrings.subgoalItem);

                if (subgoalItems.length === 0) {
                   goal.querySelector(DOMstrings.hideMessage).classList.remove("hide");
                }

                // If there is more than one goal, show prev/next goal buttons
                goalCategories = document.querySelectorAll(DOMstrings.goalItem);

                if (goalCategories.length > 1) {
                    document.querySelector(DOMstrings.prevGoalButton).classList.remove("invisible");
                    document.querySelector(DOMstrings.nextGoalButton).classList.remove("invisible");
                }

                // Hide the short title and show the long title
                goal.querySelector(DOMstrings.goalTitle).classList.add("hide");
                goal.querySelector(DOMstrings.openGoalTitle).classList.remove("hide");

                // Open target gaol
                goal.classList.add("open");
            }
        },

        closeGoal: function (button, currentGoal) {
            let goal;
            if (button && currentGoal === undefined) {
                goal = button.parentElement.parentElement.parentElement.parentElement;
            } else if (button === undefined && currentGoal) {
                goal = currentGoal;
            }

            // Hide the long title and hide the long title
            goal.querySelector(DOMstrings.goalTitle).classList.remove("hide");
            goal.querySelector(DOMstrings.openGoalTitle).classList.add("hide");

            goal.classList.remove("open");
            // Show main navbar
            document
                .querySelector(DOMstrings.navbar)
                .classList.remove("hide");

            // Hide the add goal menu if open
            this.hideAddGoalMenu()

            // Add the hide class to the subgoals list
            goal.querySelector(
                DOMstrings.subgoalListContainer
            ).classList.add("hide");

            // Remove prev/next button display
            document.querySelector(DOMstrings.prevGoalButton).classList.add("invisible");
            document.querySelector(DOMstrings.nextGoalButton).classList.add("invisible");
    
            // Hide the add subgoal message
            goal.querySelector(DOMstrings.hideMessage).classList.add("hide");
        },

        //#############################################################
        //                   PREVIOUS/NEXT GOAL
        //#############################################################
        changeGoal: function (direction) {
            let openGoal, index, newGoal;
            let goals = [...document.querySelectorAll(DOMstrings.goalItem)];

            // Find the goal that is currently open and close it
            goals.forEach(function (current) {
                if (current.classList.contains("open")) {
                    openGoal = current;
                }
            });

            // Close the current goal
            this.closeGoal(undefined, openGoal);

            // Get the current index
            index = goals.indexOf(openGoal);
            
            if (direction === "prev") {
                // Set the new goal to the current goal minus 1
                if (index > 0) {
                    newGoal = goals[index - 1];
                } else if (index === 0) {
                    newGoal = goals[goals.length - 1];
                }
            } else if (direction === "next") {
                // Set the new goal to the current goal minus 1
                if (index === (goals.length - 1)) {
                    newGoal = goals[0];
                } else if (index < (goals.length - 1)) {
                    newGoal = goals[index + 1];
                }
            }

            // Open the new goal
            this.openGoal(newGoal);  
        },

        //#############################################################
        //                      PERCENTAGES
        //#############################################################

        displayPercentage: function (percentage, id) {
            let goal, currentPercentage, circle;

            goal = document.getElementById(`goal-${id}`);
            currentPercentage = parseInt(goal.querySelector(DOMstrings.goalTextPercentage).textContent.split("%")[0]);
            let circleChart = goal.querySelector(".circular-chart");
            circle = goal.querySelector(".circle");

            // Set initial percentage for the stroke-dash variable
            if (isNaN(currentPercentage)) {
                currentPercentage = 0;
            } 
            // Set the stroke dash variable to the current percentage
            document.documentElement.style.setProperty("--stroke-dash-variable", `${currentPercentage}`);

            // Display percentage wheel info
            circle.setAttribute("stroke-dasharray", `${percentage}, 100`);
                
            // Display text percentage increments
            this.displayPercentageIncrement("text", goal, currentPercentage, percentage);
        },

        updateCurrentValue: function (currentValue, currentSubgoal) {
            currentSubgoal.querySelector(DOMstrings.subgoalCurrentValue).textContent = `${currentValue}`;
        },

        displayTargetPercentage: function (subgoalID, percentage) {
            let subgoal = document.querySelector(`#subgoal-${subgoalID}`);
            let currentPercentage = parseInt(subgoal.querySelector(DOMstrings.targetPercentage).textContent.split("%")[0]);

            // Set the intial value of the percentage as a staring point to increase from
            if (isNaN(currentPercentage)) {
                currentPercentage = 0
            } 
            // Set the flex variable to the current percentage
            document.documentElement.style.setProperty("--flex-basis-variable", `${currentPercentage}%`);

            // Display text percentage increments
            this.displayPercentageIncrement("target", subgoal, currentPercentage, percentage);

            // Remove the filling class after completion
            setTimeout(() => {
                subgoal.querySelector(DOMstrings.subgoalProgressBar).classList.remove("filling");
            }, 2000);
            // Add filling animation class
            subgoal.querySelector(DOMstrings.subgoalProgressBar).classList.add("filling");

            // Update the flex basis of the progress filled bar
            subgoal.querySelector(
                DOMstrings.subgoalProgressBar
            ).style.flexBasis = `${percentage}%`;

            if (percentage >= 100) {
               setTimeout(() => {subgoal.querySelector(
                    DOMstrings.subgoalProgressBar
                ).classList.add("complete")}, 1500);
            } else {
                subgoal.querySelector(
                    DOMstrings.subgoalProgressBar
                ).classList.remove("complete");
            }
        },

        incrementPercentageArray: function(currPercentage, newPercentage) {
            let value = currPercentage;
            let arr = [];

            if (currPercentage === newPercentage) {
                arr.push(newPercentage);
                return arr;
            } else if (currPercentage < newPercentage) {
                for (value; value <= newPercentage; value++) {
                    arr.push(value);
                }
            } else if (currPercentage > newPercentage) {
                for (value; value >= newPercentage; value--) {
                    arr.push(value);
                }
            }
            // Return the array
            return arr;
        },

        displayPercentageIncrement: function(type, goal, currPercentage, newPercentage) {
            let percentageArray, increment, incrementInterval, i, goalWheelPercentage, goalTextPercentage, targetPercentage;
            // Get percentage array and increment count
            percentageArray = this.incrementPercentageArray(currPercentage, newPercentage);
            increment = Math.abs(Math.round(1700 / (newPercentage - currPercentage)));
            i = 0;

            // Run interval to display percentage increment
            incrementInterval = setInterval(() => {
                if (type === "text") {
                    // Select text percentagee
                    goalTextPercentage = goal.querySelector(DOMstrings.goalTextPercentage);

                    if (percentageArray[i] === newPercentage) {
                        clearInterval(incrementInterval);
                        goalTextPercentage.textContent = `${newPercentage}%`;
                    }
                    goalTextPercentage.textContent = `${percentageArray[i]}%`;

                } else if (type === "wheel") {
                    // Select wheel percentage
                    goalWheelPercentage = goal.querySelector(DOMstrings.goalWheelPercentage);

                    if (percentageArray[i] === newPercentage) {
                        clearInterval(incrementInterval);
                        goalWheelPercentage.textContent = `${newPercentage}%`;
                    }
                    goalWheelPercentage.textContent = `${percentageArray[i]}%`;

                } else if (type === "target") {
                    // Select target percentage
                    targetPercentage = goal.querySelector(DOMstrings.targetPercentage);
                    if (percentageArray[i] === newPercentage) {
                        clearInterval(incrementInterval);
                        targetPercentage.textContent = `${newPercentage}%`;
                    }
                    targetPercentage.textContent = `${percentageArray[i]}%`;
                }
                // Increment i for next loop
                i++;
            }, increment);
        },

        fillPercentageCircle: function (goal, percentage) {
            let circleChart = goal.querySelector(".circular-chart");

            // Remove circle classes
            circleChart.classList.remove("circle-incomplete");
            circleChart.classList.remove("circle-complete");

            if (percentage === 100) {
                goal.querySelector(".circular-chart").classList.remove("circle-zero");

                setTimeout(() => {
                    setTimeout(() => {
                        goal.querySelector(".circular-chart").classList.remove("filling-complete-circle");
                        goal.querySelector(".circular-chart").classList.add("circle-complete");
                    }, 2000);

                    goal.querySelector(".circular-chart").classList.remove("filling-incomplete-circle");
                    goal.querySelector(".circular-chart").classList.add("filling-complete-circle");
                }, 1700);

                // Add class to fill circle
                circleChart.classList.add("filling-incomplete-circle");

            } else if (percentage > 0 && percentage < 100) {
                goal.querySelector(".circular-chart").classList.remove("circle-zero");

                setTimeout(() => {
                    goal.querySelector(".circular-chart").classList.remove("filling-incomplete-circle");
                    goal.querySelector(".circular-chart").classList.add("circle-incomplete");
                }, 2000);

                // Add class to fill circle
                circleChart.classList.add("filling-incomplete-circle");

            } else if (percentage === 0) {

                setTimeout(() => {
                    goal.querySelector(".circular-chart").classList.remove("filling-incomplete-circle");
                    goal.querySelector(".circular-chart").classList.add("circle-zero");
                }, 2000);

                // Add class to fill circle
                circleChart.classList.add("filling-incomplete-circle");
            }
        },

        //#############################################################
        // GENERAL TAGS
        //#############################################################

        clearFields: function () {
            // Clear goal input and date fields
            document.querySelector(DOMstrings.addGoalInput).value = "";
            document.querySelector(DOMstrings.addGoalDate).value = "";

            // Clear all subgoal input fields
            let subgoalFields = [...document.querySelectorAll(DOMstrings.addSubgoalInput)];
            let subgoalTargets = [...document.querySelectorAll(DOMstrings.addSubgoalTarget)];
            
            subgoalFields.forEach(curr => curr.value = "");
            subgoalTargets.forEach(curr => curr.value = "");

            // Clear all target input fields
            let targetNoteFields = [...document.querySelectorAll(DOMstrings.addTargetNote)];
            let targetValueFields = [...document.querySelectorAll(DOMstrings.addTargetValue)];

            targetNoteFields.forEach(curr => curr.value = "");
            targetValueFields.forEach(curr => curr.value = ""); 
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

        // displayYear: function () {
        //     document.querySelector(DOMstrings.currentYear).textContent = (new Date()).getFullYear();
        // },

        displayTime: function () {
            document.querySelector(DOMstrings.currentTime).innerHTML = `
            <p class="current-hour">${moment().format('LTS')}</p>
            <p class="current-date">${moment().format('LLL')}</p>
            `;
        },

        //#############################################################
        // INSPIRATIONAL QUOTES API
        //#############################################################

        
        displayQuote: function () {
            let dailyQuote, html, newHtml;

            dailyQuote = Quote.getQuote();

            html = `
                <p class="quote-text">
                    "%quote%" 
                    <span class="quote-author">%quote-author%</span>
                </p>
            `;

            newHtml = html.replace(/%quote%/g, dailyQuote.text);
            newHtml = newHtml.replace(/%quote-author%/g, dailyQuote.author);

            document
                .querySelector(".quote")
                .insertAdjacentHTML("beforeend", newHtml);
        },
        

        // displayRandomQuote: function () {
        //     let dailyQuote, html, newHtml;

        //     dailyQuote = Quote.getRandomQuote();

        //     html = `
        //         <p class="quote-text">
        //             "%quote%"
        //         </p>
        //     `;

        //     newHtml = html.replace(/%quote%/g, dailyQuote);

        //     document
        //         .querySelector(".quote")
        //         .insertAdjacentHTML("beforeend", newHtml);
        // },

        getDOMstrings: function () {
            return DOMstrings;
        },
    };
})();

//########################################################################################################################################
//################################################## GLOBAL APP CONTROLLER ###############################################################
//########################################################################################################################################

let controller = (function (dataCtrl, UICtrl) {
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
                let allGoals = [...document.querySelectorAll(DOM.gridItem)];

                // If a goal is open - add a subgoal
                allGoals.forEach((current) => {
                    if (current.classList.contains("open")) {
                        return ctrlAddSubgoal(current);
                    }
                });
                // If no goals are open -  add a goal
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

        // Listen for click for previous goal
        document
            .querySelector(DOM.prevGoalButton)
            .addEventListener("click", ctrlChangeGoal);

        // Listen for click for next goal
        document
            .querySelector(DOM.nextGoalButton)
            .addEventListener("click", ctrlChangeGoal);

        // Listen for click to drap and drop subgoals
        document
            .querySelector(DOM.goalsList)
            .addEventListener("mousedown", ctrlDragAndDrop);

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

    //###########################################
    //                  STATES 
    //###########################################
    let initialPercentage;
    let optionsDisplayed = false;
    let subOptionsDisplayed = false;

    //###########################################
    //          GET TYPE AND IDs
    //###########################################
    let getGoalIDs = function (target) {
        let goal, goalID, type, ID;

        goal = target.parentElement.parentElement.parentElement;
        goalID = goal.id;
        type = (goalID.split("-"))[0];
        ID = (goalID.split("-"))[1];

        return [goal, goalID, type, ID];
    };

    let getSubgoalIDs = function (target) {
        let currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID;
        // Get current subgoal ID
        currentSubgoal = target.parentElement.parentElement;
        subgoalID = currentSubgoal.id;
        ID = (subgoalID.split("-"))[1];
        // Get parent ID
        parentGoal = currentSubgoal.parentElement.parentElement.parentElement;
        parentGoalID = parentGoal.id;
        parentID = (parentGoalID.split("-"))[1];

        return [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID];
    };

    let getTargetIDs = function (target) {
        let currentTarget, targetID, ID, currentSubgoal, subgoal, subgoalID, parent, parentID;
        // Get target ID
        currentTarget = target.parentElement.parentElement;
        targetID = currentTarget.id;
        ID = (targetID.split("-"))[1];
        // Get the subgoal ID
        currentSubgoal = currentTarget.parentElement.parentElement.parentElement;
        subgoal = currentSubgoal.id;
        subgoalID = (subgoal.split("-"))[1];
        // Get parent ID
        parent = currentSubgoal.parentElement.parentElement.parentElement.id;
        parentID = (parent.split("-"))[1];

        return [currentTarget, targetID, ID, currentSubgoal, subgoal, subgoalID, parent, parentID];
    };

    //#############################################################
    //                     PERCENTAGES
    //#############################################################

    let ctrlGetPercentage = function (id) {
        // Calculate percentages
        dataCtrl.calculatePercentage(id);

        // Return percentage from the data controller
        return dataCtrl.getPercentage(id);
    };

    let ctrlUpdatePercentage = function (id) {
        // Read percentages from the data controller
        let percentage = ctrlGetPercentage(id);

        // Update the UI with the new percentages
        UICtrl.displayPercentage(percentage, id);
    };

    let ctrlFillPercentageWheel = function (id) {
        let goal = document.getElementById(`goal-${id}`);
        // Read percentages from the data controller
        let percentage = ctrlGetPercentage(id);

        console.log("close", initialPercentage);

        // if the percentage is unchanged - return
        if (initialPercentage === percentage) return;

        // Get the old percentage to set as the basis for both
        document.documentElement.style.setProperty("--flex-basis-variable", `${initialPercentage}%`);

        // Then run the wheel increment
        UICtrl.displayPercentageIncrement("wheel", goal, initialPercentage, percentage);
        // Run the wheel progress
        UICtrl.fillPercentageCircle(goal, percentage);
    };

    let ctrlUpdateTargetPercentages = function (subgoalID, parentID) {
        // Calculate percentages
        dataCtrl.calculateTargetPercentages(subgoalID, parentID);

        // Read percentages from the data controller
        let percentage = dataCtrl.getTargetPercentages(subgoalID, parentID);

        // Update the UI with the new percentages
        UICtrl.displayTargetPercentage(subgoalID, percentage);

        // Read is complete from the data controller
        let isComplete = dataCtrl.getisComplete(subgoalID, parentID);

        // Update the UI with is complete
        UICtrl.toggleTargetComplete(subgoalID, parentID, isComplete);

        //Update overall percentages
        ctrlUpdatePercentage(parentID);
    };

    //#############################################################
    //                 INPUT ERROR HANDLING
    //#############################################################

    let handleGoalInputError = function (type, goal, date, currentGoal) {
        // Goal title input
        if (type === "goal" && (goal === "" || goal === undefined)) {
            UICtrl.incorrectInput("goal-input", currentGoal);
        // Quit title input
        } else if (type === "quit" && goal === "") {
            UICtrl.correctInput("goal-date", currentGoal);
            UICtrl.incorrectInput("goal-input", currentGoal);

        // Quit date input
        } else if (type === "quit" && goal !== "" && ((new Date(date) > new Date()) || date === "")) {
            UICtrl.correctInput("goal-input", currentGoal);
            UICtrl.incorrectInput("goal-date", currentGoal);
        } 
    };

    let handleSubgoalInputError = function (currentSubgoal, currentGoal, type, goal, target) {
        // Checkbox title input
        if (type === "checkbox" && goal === "") {
            UICtrl.incorrectInput("subgoal-input", currentGoal, currentSubgoal);

        // Target title input
        } else if (type === "target" && (goal === "" || goal === undefined)){
            UICtrl.correctInput("subgoal-target", currentGoal, currentSubgoal);
            UICtrl.incorrectInput("subgoal-input", currentGoal, currentSubgoal);

        // Target value input
        } else if (type === "target" && goal !== "" && (target === "" || target <= 0 || isNaN(target))) {
            UICtrl.correctInput("subgoal-input", currentGoal);
            UICtrl.incorrectInput("subgoal-target", currentGoal, currentSubgoal);
        } 
    };

    let handleTargetItemInputError = function (currentTarget, currentSubgoal, note, value, date) {
        // Target note input
        if ((note === ""  || note === undefined) && (value !== "" || value > 0) && ((new Date(date) <= new Date()) || date !== "")) {
            UICtrl.incorrectInput("target-note", undefined, currentSubgoal, currentTarget);
            UICtrl.correctInput("target-value", undefined, currentSubgoal, currentTarget);
            UICtrl.correctInput("target-date", undefined, currentSubgoal, currentTarget);
            
        // Target value input
        } else if ((note !== ""  || note !== undefined) && (value === "" || value <= 0 || isNaN(value)) && ((new Date(date) <= new Date()) || date !== "")) {
            UICtrl.correctInput("target-note", undefined, currentSubgoal, currentTarget);
            UICtrl.incorrectInput("target-value", undefined, currentSubgoal, currentTarget);
            UICtrl.correctInput("target-date", undefined, currentSubgoal, currentTarget);
            
        // Target date input
        } else if ((note !== ""  || note !== undefined) && (value !== "" || value > 0) && ((new Date(date) > new Date()) || date === "")) {
            UICtrl.correctInput("target-note", undefined, currentSubgoal, currentTarget);
            UICtrl.correctInput("target-value", undefined, currentSubgoal, currentTarget);
            UICtrl.incorrectInput("target-date", undefined, currentSubgoal, currentTarget);
        } 
    };

    //#############################################################
    //                       GOALS
    //#############################################################

    let ctrlToggleAddGoalDisplay = function (e) {
        // Display add goal menu
        if (e.target.closest(".goal-nav-button__show-add")) {
            let target = e.target.closest(".goal-nav-button__show-add");
            UICtrl.showAddGoalMenu(undefined, target);
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
            ctrlUpdatePercentage(newGoal.id);

            // Correct input entered
            UICtrl.correctInput("goal");

            // Set the state of options displayed to false
            optionsDisplayed = false;

        } else if (input.type === "goal") {
            handleGoalInputError(input.type, input.goal);

            // Set the state of options displayed to false
            optionsDisplayed = false;
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

            // Correct input entered
            UICtrl.correctInput("goal");

            // Set the state of options displayed to false
            optionsDisplayed = false;

        } else if (input.type === "quit") {
            handleGoalInputError(input.type, input.goal, input.date);

            // Set the state of options displayed to false
            optionsDisplayed = false;
        } 
    };

    let ctrlToggleGoalOptionsDisplay = function (e) {
        if (e.target.closest(".goal-nav-button__show-options")) {
            // Show options on UI
            UICtrl.toggleGoalOptionsDisplay("goal");
            optionsDisplayed = !optionsDisplayed;
            if (optionsDisplayed === false) {
                UICtrl.hideEditGoalInputDisplay();
            }
        }
    };

    let ctrlToggleEditGoalInputDisplay = function (e) {
        let target, goal;

        if (e.target.closest(".goal-options-button__edit")) {
            target = e.target.closest(".goal-options-button__edit");
            // Get goal ID and type
            [goal] = getGoalIDs(target);

            // To ensure that the goal doesn't open
            optionsDisplayed = true;

            // Toggle input display
            UICtrl.toggleEditGoalInputDisplay(goal);
        }
    };

    let ctrlEditGoal = function (e) {
        let target, goal, goalID, type, ID, date, newDate, days, updatedGoal;

        if (e.target.closest(".edit-goal-input__submit")) {
            target = e.target.closest(".edit-goal-input__submit");
            // Get goal ID and type
            [goal, goalID, type, ID] = getGoalIDs(target);

            // Get input from edit field
            let input = UICtrl.getEditInput(goal);

            // Goal
            if (
                type === "goal" &&
                input.goal !== "" &&
                input.goal !== undefined
            ) {
                // Add the goal update to the data controller
                updatedGoal = dataCtrl.editGoal(input.goal, type, ID);

                // Remove input and update the edited goal in the UI
                UICtrl.hideEditGoalInputDisplay(goal);
                UICtrl.updateListItem(goal, updatedGoal, type);

                // Correct input entered
                UICtrl.correctInput("goal", goal);

                // Set the state of options displayed to false
                optionsDisplayed = true;
            } else if (type === "goal") {
                handleGoalInputError(type, input.goal, undefined, goal);

                // Set the state of options displayed to false
                optionsDisplayed = true;
            }
            
            // Quit
            if (
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
                UICtrl.hideEditGoalInputDisplay(goal);
                UICtrl.updateListItem(goal, updatedGoal, type, days);

                // Correct input entered
                UICtrl.correctInput("goal", goal);

                // Set the state of options displayed to false
                optionsDisplayed = false;

            } else if (type === "quit") {
                handleGoalInputError(type, input.goal, input.date, goal);

                // Set the state of options displayed to false
                optionsDisplayed = false;   
            } 
        }
    };

    let ctrlDeleteGoal = function (e) {
        let target, goal, goalID, type, ID;

        if (e.target.closest(".goal-options-button__delete")) {
            target = e.target.closest(".goal-options-button__delete");
            // Get goal ID and type
            [goal, goalID, type, ID] = getGoalIDs(target);

            // Delete goal from the data structure
            dataCtrl.deleteGoal(type, ID);

            // Delete goal from UI and set options displayed value based on returned value
            optionsDisplayed = UICtrl.deleteGoalItem(goalID);
        }
    };

    let ctrlOpenGoal = function (e) {
        if (optionsDisplayed === false) {
            // Add open class to element
            let goal = e.target.closest(".goal-item");
            if (goal && !goal.classList.contains("open")) {
                initialPercentage = ctrlGetPercentage(goal.id.split("-")[1]);
                console.log("open", initialPercentage);
                UICtrl.openGoal(goal);
            }
        }
    };

    let ctrlChangeGoal = function (e) {
        let prevGoalID, currentGoalID;
        // Get the closed goal ID
        prevGoalID = (document.querySelector(".open").id.split("-"))[1];
        // Display percentage wheel updates
        ctrlFillPercentageWheel(prevGoalID);

        if (e.target.closest(".prev-goal")) {
            UICtrl.changeGoal("prev");
            // Get and set initial percentage
            currentGoalID = (document.querySelector(".open").id.split("-"))[1];
            initialPercentage = ctrlGetPercentage(currentGoalID);
        } else if (e.target.closest(".next-goal")) {
            UICtrl.changeGoal("next");
             // Get and set initial percentage
            currentGoalID = (document.querySelector(".open").id.split("-"))[1];
            initialPercentage = ctrlGetPercentage(currentGoalID);
        }
    }

    let ctrlCloseGoal = function (e) {
        if (e.target.closest(".subgoal-nav-button__close-goal")) {
            let target = e.target.closest(".subgoal-nav-button__close-goal");
            let goal = target.parentElement.parentElement.parentElement.parentElement;
            let goalID = (goal.id.split("-"))[1];
            // Remove open class from element
            if (
                goal.classList.contains("open")
            ) {
                UICtrl.closeGoal(target);
                // Close subgoal options display
                UICtrl.removeSubgoalOptionsDisplay();
                // Close the target input and options display
                UICtrl.removeTargetInputDisplay();
                UICtrl.removeTargetOptionsDisplay();

                // Display percentage wheel updates
                ctrlFillPercentageWheel(goalID);

                // Set the state of options displayed to false
                optionsDisplayed = false;
            }
        }
    };

    //#############################################################
    //                      SUBGOALS
    //#############################################################

    let ctrlToggleAddSubgoalDisplay = function (e) {
        if (e.target.closest(".subgoal-nav-button__show-add")) {
            let target = e.target.closest(".subgoal-nav-button__show-add")
            UICtrl.showAddGoalMenu(
                target.parentElement.parentElement,
                target
            );
        }
    };

    let ctrlAddSubgoal = function (e) {
        let parentID, input, currentGoal, newSubgoal;

        if (e.target !== undefined && e.target.matches(".add-goal-input__submit")) {
            currentGoal = e.target.parentElement.parentElement.parentElement.parentElement;
            parentID = (currentGoal.id.split("-"))[1];
        } else if (e.target === undefined && e.id.includes("goal")) {
            currentGoal = e;
            parentID = (e.id.split("-"))[1];
        }

        // Get input from fields
        if (currentGoal !== undefined) {
            input = UICtrl.getSubgoalInput(currentGoal);
        }

        if (input) {
            // TARGET
            if (
                input.type === "target" &&
                input.goal !== "" &&
                input.goal !== undefined &&
                input.target !== undefined &&
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

                // Update the percentage
                ctrlUpdatePercentage(parentID);

                // Correct input entered
                UICtrl.correctInput("subgoal", currentGoal);

                // Set the state of subggoals options displayed to false
                subOptionsDisplayed = false;

            } else if (input.type === "target"){
                handleSubgoalInputError(undefined, currentGoal, input.type, input.goal, input.target);

                // Set the state of subggoals options displayed to false
                subOptionsDisplayed = false;
            }

        
        // CHECKBOX
            if (input.type === "checkbox" && input.goal !== "") {
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

                // Update the percentage
                ctrlUpdatePercentage(parentID);

                // Correct input entered
                UICtrl.correctInput("subgoal", currentGoal);

                // Set the state of subggoals options displayed to false
                subOptionsDisplayed = false;

            } else if (input.type === "checkbox") {
                handleSubgoalInputError(undefined, currentGoal, input.type, input.goal);

                // Set the state of subggoals options displayed to false
                subOptionsDisplayed = false;
            }
        }
    };

    let ctrlToggleSubgoalCheckbox = function (e) {
        let currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID, updatedSubgoal, isComplete;

        if (e.target.closest(".subgoal-checkbox-button")) {
            let target = e.target.closest(".subgoal-checkbox-button");
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(target);

            // Update completion status in the data controller
            updatedSubgoal = dataCtrl.toggleSubgoalIsComplete(ID, parentID);
            isComplete = updatedSubgoal.isComplete;

            // Update icon and item position on the UI
            UICtrl.toggleCheckedIcon(currentSubgoal, isComplete);

            // Update the percentage
            ctrlUpdatePercentage(parentID);
        }
    };

    let ctrlToggleSubgoalOptionsDisplay = function (e) {
        if (e.target.closest(".subgoal-nav-button__show-options")) {
            // Show options on UI
            UICtrl.toggleGoalOptionsDisplay("subgoal");

            subOptionsDisplayed = !subOptionsDisplayed;

            // Hide target input when you show options
            UICtrl.removeTargetInputDisplay();
            // Hide the input when you close the options
            if (subOptionsDisplayed === false) {
                UICtrl.hideEditSubgoalInputDisplay();
            }
        }
    };

    let ctrlToggleEditSubgoalInputDisplay = function (e) {
        let target, currentSubgoal;

        if (e.target.closest(".subgoal-options-button__edit")) {
            target = e.target.closest(".subgoal-options-button__edit");
            // Get subgoal IDs
            [currentSubgoal] = getSubgoalIDs(target);
            // Toggle input display
            UICtrl.toggleEditSubgoalInputDisplay(currentSubgoal);
        }
    };

    let ctrlEditSubgoal = function (e) {
        let target, currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID, updatedSubgoal, isComplete;

        if (e.target.closest(".edit-subgoal-input__submit")) {
            target = e.target.closest(".edit-subgoal-input__submit");
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(target);

            // Get input from edit field
            let input = UICtrl.getSubgoalEditInput(currentSubgoal);

            // If the type is goal and the field is not empty
            if (
                input.type === "target" &&
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
                UICtrl.hideEditSubgoalInputDisplay(currentSubgoal);
                UICtrl.updateSubgoalListItem(currentSubgoal, updatedSubgoal);

                // Update the target completion percentage
                UICtrl.displayTargetPercentage(
                    ID,
                    updatedSubgoal.percentage
                );

                // Update if target is complete
                isComplete = updatedSubgoal.isComplete;

                UICtrl.toggleTargetComplete(ID, parentID, isComplete);

                //Update overall percentage
                ctrlUpdatePercentage(parentID);

                // Correct input entered
                UICtrl.correctInput("subgoal", undefined, currentSubgoal);

                // Set the state of subggoals options displayed to false
                subOptionsDisplayed = false;

            } else if (input.type === "target") {
                handleSubgoalInputError(currentSubgoal, undefined, input.type, input.goal, input.target);

                // Set the state of subggoals options displayed to false
                subOptionsDisplayed = false;
            }
            
            if (
                input.type === "checkbox" &&
                input.goal !== "" &&
                input.goal !== undefined
            ) {
                // Add the goal update to the data controller
                updatedSubgoal = dataCtrl.editSubgoal(ID, parentID, input.goal);

                // Remove input and update the edited goal in the UI
                UICtrl.hideEditSubgoalInputDisplay(currentSubgoal);
                UICtrl.updateSubgoalListItem(currentSubgoal, updatedSubgoal);

                // Correct input entered
                UICtrl.correctInput("subgoal", undefined, currentSubgoal);

                // Set the state of subggoals options displayed to false
                subOptionsDisplayed = false;

            } else if (input.type === "checkbox") {
                handleSubgoalInputError(currentSubgoal, undefined, input.type, input.goal);

                // Set the state of subggoals options displayed to false
                subOptionsDisplayed = false;
            }
        }
    };

    let ctrlDeleteSubgoal = function (e) {
        let target, currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID;

        if (e.target.closest(".subgoal-options-button__delete")) {
            target = e.target.closest(".subgoal-options-button__delete");
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(target);

            // Delete subgoal from the data structure
            dataCtrl.deleteSubgoal(ID, parentID);

            // Delete goal from UI and set the subopdisplay based on the returned value of the function
            subOptionsDisplayed = UICtrl.deleteGoalItem(subgoalID, parentGoal);

            // Update the percentage
            ctrlUpdatePercentage(parentID);
        }
    };

    //#############################################################
    //                      TARGET ITEMS
    //#############################################################

    let ctrlToggleTargetInputDisplay = function (e) {
        let target, currentSubgoal;

        if (e.target.closest(".subgoal-target-button__show-add")) {
            target = e.target.closest(".subgoal-target-button__show-add");
            // Get subgoal IDs
            [currentSubgoal] = getSubgoalIDs(target);

            // Remove subgoal and target options display
            UICtrl.removeSubgoalOptionsDisplay();
            UICtrl.removeTargetOptionsDisplay();

            // Show options on the UI
            UICtrl.toggleTargetInputDisplay(currentSubgoal);
        }
    };

    let ctrlAddTargetItem = function (e) {
        let target,
            currentSubgoal,
            subgoalID,
            ID,
            parentGoal,
            parentGoalID,
            parentID,
            input,
            newTargetItem,
            currentIndex,
            currentValue;
        // Set the type to new so that options are not displayed on creation
        let type = "new";

        if (e.target !== undefined && e.target.closest(".target-item-add__submit")) {
            target = e.target.closest(".target-item-add__submit");
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(target);
            // Get input from fields
            input = UICtrl.getTargetItemInput(currentSubgoal);

            if (
                input.note !== "" &&
                input.note !== undefined &&
                input.value !== "" &&
                input.value > 0 &&
                input.date !== "" &&
                new Date(input.date) < new Date()
            ) {
                // Add new target item to the data structure and return the item and current index
                [newTargetItem, currentIndex] = dataCtrl.addTargetItem(
                    parentID,
                    ID,
                    input.note,
                    input.value,
                    input.date
                );

                // Add target item to the UI
                UICtrl.addTargetListItem(
                    currentSubgoal,
                    newTargetItem,
                    currentIndex,
                    type
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
                UICtrl.updateCurrentValue(currentValue, currentSubgoal);

                // Update the target percentages
                ctrlUpdateTargetPercentages(ID, parentID);

                // Correct input entered
                UICtrl.correctInput("target", undefined, currentSubgoal);
            } else {
                handleTargetItemInputError(undefined, currentSubgoal, input.note, input.value, input.date);
            }
        }
    };

    let ctrlToggleEditTargetItemInputDisplay = function (e) {
        let target, currentTarget;

        if (e.target.closest(".target-options-button__edit")) {
            target = e.target.closest(".target-options-button__edit");
            // Get target IDs
            [currentTarget] = getTargetIDs(target);

            // Toggle input display
            UICtrl.toggleEditTargetItemInputDisplay(currentTarget);
        }
    };

    let ctrlEditTargetItem = function (e) {
        let target,
            currentTarget,
            targetID,
            ID,
            currentSubgoal,
            subgoal,
            subgoalID,
            parent,
            parentID,
            updatedTargetItem,
            currentIndex,
            currentValue;
        // Set the type to update so that options are displayed on creation
        let type = "update";

        if (e.target.closest(".edit-target-input__submit")) {
            target = e.target.closest(".edit-target-input__submit");
            // Get target IDs
            [currentTarget, targetID, ID, currentSubgoal, subgoal, subgoalID, parent, parentID] = getTargetIDs(target);

            let input = UICtrl.getTargetEditInput(currentTarget);

            if (
                input.note !== "" &&
                input.note !== undefined &&
                input.value !== "" &&
                input.value > 0 &&
                input.date !== "" &&
                new Date(input.date) < new Date()
            ) {
                // Add the target item update to the data controller
                [updatedTargetItem, currentIndex] = dataCtrl.editTargetItem(
                    ID,
                    subgoalID,
                    parentID,
                    input.note,
                    input.value,
                    input.date
                );

                // Remove input display
                UICtrl.hideEditTargetItemInputDisplay(currentTarget);

                // Delete goal from UI and add the updated item at the new index
                UICtrl.deleteGoalItem(targetID);
                UICtrl.addTargetListItem(currentSubgoal, updatedTargetItem, currentIndex, type);

                // Update the current value
                currentValue = dataCtrl.calculateTargetCurrentValue(
                    subgoalID,
                    parentID
                );
                UICtrl.updateCurrentValue(currentValue, currentSubgoal);

                // Update the target percentages
                ctrlUpdateTargetPercentages(subgoalID, parentID);

                // Correct input entered
                UICtrl.correctInput("target", undefined, undefined, currentTarget);
            } else {
                handleTargetItemInputError(currentTarget, undefined, input.note, input.value, input.date);
            }
        }
    };

    let ctrlDeleteTargetItem = function (e) {
        let target,
            currentTarget,
            targetID,
            ID,
            currentSubgoal,
            subgoal,
            subgoalID,
            parent,
            parentID,
            currentValue;

        if (e.target.closest(".target-options-button__delete")) {
            target = e.target.closest(".target-options-button__delete");
            // Get target IDs
            [currentTarget, targetID, ID, currentSubgoal, subgoal, subgoalID, parent, parentID] = getTargetIDs(target);
            
            // Delete subgoal from the data structure
            dataCtrl.deleteTargetItem(ID, subgoalID, parentID);

            // Delete goal from UI
            UICtrl.deleteGoalItem(targetID);

            // Update the current value
            currentValue = dataCtrl.calculateTargetCurrentValue(
                subgoalID,
                parentID
            );
            UICtrl.updateCurrentValue(currentValue, currentSubgoal);

            // Update the target percentages
            ctrlUpdateTargetPercentages(subgoalID, parentID);
        }
    };

    //#############################################################
    //                     DRAG AND DROP
    //#############################################################

    let ctrlDragAndDrop = function (e) {
        if (e.target.closest(".subgoal-options-button__drag") || e.target.closest(".goal-options-button__drag")) {
            let dragSrcEl = null;

            function handleDragStart(e) {
                // Target (this) element is the source node
                dragSrcEl = this;

                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/html", this.outerHTML);
                this.classList.add("dragElem");
            }

            function handleDragOver(e) {
                if (e.preventDefault) {
                    // This allows you to drop the item
                    e.preventDefault();
                }
                this.classList.add("over");
                e.dataTransfer.dropEffect = "move";
                return false;
            }

            function handleDragEnter(e) {}

            function handleDragLeave(e) {
                this.classList.remove("over");
            }

            function handleDrop(e) {
                if (e.stopPropagation) {
                    // Stops browser from redirecting
                    e.stopPropagation();
                }

                // Don't do anything if dropping the same element we are dragging
                if (dragSrcEl != this) {
                    // Set the source column's HTML to the HTML of the column we dropped on.
                    if (
                        this.parentNode !== null &&
                        this.parentNode === dragSrcEl.parentNode
                    ) {
                        this.parentNode.removeChild(dragSrcEl);
                        let dropHTML = e.dataTransfer.getData("text/html");
                        this.insertAdjacentHTML("beforebegin", dropHTML);
                        let dropElem = this.previousSibling;
                        addDnDHandlers(dropElem);
                    } else {
                        this.classList.remove("dragElem");
                    }
                }

                this.classList.remove("over");
                return false;
            }

            function handleDragEnd(e) {
                this.classList.remove("dragElem");

                let subgoalItems = [...document.querySelectorAll(".subgoal-item")];

                subgoalItems.forEach(item => item.classList.remove("dragElem"));

                let goalItems = document.querySelectorAll(".goal-item");
    
                goalItems.forEach(item => item.classList.remove("dragElem"));
            }

            function addDnDHandlers(elem) {
                elem.addEventListener("dragstart", handleDragStart, false);
                elem.addEventListener("dragenter", handleDragEnter, false);
                elem.addEventListener("dragover", handleDragOver, false);
                elem.addEventListener("dragleave", handleDragLeave, false);
                elem.addEventListener("drop", handleDrop, false);
                elem.addEventListener("dragend", handleDragEnd, false);
            }

            if (e.target.closest(".subgoal-options-button__drag")) {
                let list, subgoals;
                list = e.target.closest(".subgoal-options-button__drag").parentElement.parentElement.parentElement;
                
                if (list.classList.contains("subgoal-list__incomplete")) {
                    subgoals = document.querySelectorAll(
                        ".subgoal-list__incomplete .subgoal-item"
                    );
                } else if (list.classList.contains("subgoal-list__complete")) {
                    subgoals = document.querySelectorAll(
                        ".subgoal-list__complete .subgoal-item"
                    );
                }
                [].forEach.call(subgoals, addDnDHandlers);
            } else if (e.target.closest(".goal-options-button__drag")) {
                let goals = document.querySelectorAll(".goal-container .grid-item");
                [].forEach.call(goals, addDnDHandlers);
            }   
        }  
    };

    return {
        init: function () {
            //UICtrl.displayYear();
            //UICtrl.displayTime();
            UICtrl.displayQuote();
            setUpEventListeners();
        },
    };
})(dataController, UIController);

controller.init();
