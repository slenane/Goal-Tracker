//########################################################################################################################################
//################################################## NPM PACKAGES + IMPORTS ##############################################################
//########################################################################################################################################
const Quote = require("inspirational-quotes");
const uniqid = require("uniqid");

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
                incompleteTargetItems.forEach(function (current) {
                    incompletePercentage += (total / 100) * current.percentage;
                });
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
                document.querySelector(".no-goals").classList.remove("hide");
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
                currentGoal.querySelector(".no-goals").classList.remove("hide");
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
        goalOptionsDisplay: ".btn-2",
        goalOptions: ".show-goal-options",
        goalOptionsIcons: ".edit-delete-options",
        goalsList: ".goals",
        goalItem: ".grid-item",
        gridItem: ".grid-item",
        goalTitle: ".goal-title",
        goalPercentage: ".goal-percentage",
        goalDrag: ".move-icon",
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
        completedSubgoalsList: ".completed-subgoals-list",
        subgoalItem: ".subgoal-item",
        subgoalDrag: ".drag-subgoal",
        subgoalTitle: ".subgoal-title",
        subgoalCurrentValue: ".subgoal-current-value",
        subgoalProgressBar: ".progress-filled",
        subgoalUpdateIcons: ".subgoal-update",
        subgoalCheckbox: ".subgoal-check-icon",
        subgoalTarget: ".subgoal-current-target",
        subgoalOptionsDisplay: ".sub-btn-2",
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

    //#############################################################
    //              STATES AMD NODE LIST.forEach
    //#############################################################
    let isDraggable = false;

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
                    type: "target",
                };
            } else {
                return {
                    goal: currentSubgoal.querySelector(
                        DOMstrings.editSubgoalInput
                        ).value,
                        type: "checkbox",
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
                document.querySelector(DOMstrings.addGoalDate).classList.remove("incorrect-input");
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
                goal.querySelector(DOMstrings.editGoalDate).classList.remove("incorrect-input");
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
                goal.querySelector(DOMstrings.addSubgoalTarget).classList.remove("incorrect-input");
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
                subgoal.querySelector(DOMstrings.editSubgoalTarget).classList.remove("incorrect-input");
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
                let subgoal = button.querySelector(DOMstrings.addSubgoal);
                // Toggle menu display
                subgoal.classList.toggle("invisible");
                // Clear input errors
                this.correctInput("subgoal", subgoal);
                // Focus on input
                button.querySelector(DOMstrings.addSubgoalInput).focus();

                if (!subgoal.classList.contains("invisible")) {
                    target.parentElement.innerHTML = `<i class="fas fa-minus nav-icons show-add-subgoal"></i>`;
                } else {
                    target.parentElement.innerHTML = `<i class="fas fa-plus nav-icons show-add-subgoal"></i>`;
                }
            } else {
                let menu = document.querySelector(DOMstrings.addGoalMenu);
                // Toggle menu display
                menu.classList.toggle("invisible");
                // Clear input errors
                this.correctInput("goal");
                // Focus on input
                document.querySelector(DOMstrings.addGoalInput).focus();

                if (!menu.classList.contains("invisible")) {
                    target.parentElement.innerHTML = `<i class="fas fa-minus nav-icons show-add-goal"></i>`;
                } else {
                    target.parentElement.innerHTML = `<i class="fas fa-plus nav-icons show-add-goal"></i>`;
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
            ).innerHTML = `<i class="fas fa-plus nav-icons show-add-goal"></i>`;
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
            let clearErrors = function (type, goal) {
                UIController.correctInput(type, goal);
            }

            if (e.target.matches(".add-goal-type")) {
                document
                    .querySelector(DOMstrings.addGoalDate)
                    .classList.toggle("hide");

                // Clear input errors
                clearErrors("goal");

                // Focus on input field
                document.querySelector(DOMstrings.addGoalInput).focus();
            } else if (e.target.matches(".add-subgoal-type")) {
                let goals = document.querySelectorAll(DOMstrings.goalItem);
                let subgoalTargets = document.querySelectorAll(
                    DOMstrings.addSubgoalTarget
                );
                let subgoalInputs = document.querySelectorAll(
                    DOMstrings.addSubgoal
                );

                nodeListForEach(goals, function (current, index) {
                    if (goals[index]) {
                        clearErrors("subgoal", goals[index]);
                    }
                });

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
                                <div class="buttons sub-btn-1">
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
                                            CHECKBOX
                                        </option>
                                        <option value="target">TARGET</option>
                                    </select>
                                    <input
                                        type="text"
                                        class="add-subgoal-input"
                                        placeholder="ADD A SUBGOAL"
                                    />
                                    <input
                                        type="number"
                                        name="subgoal-target"
                                        placeholder="GOAL TARGET"
                                        class="add-subgoal-target hide"
                                        step="1"
                                    />
                                    <input
                                        type="button"
                                        class="add-subgoal-button"
                                        value="SUBMIT"
                                    />
                                </div>
                                <div class="buttons sub-btn-2 hide">
                                    <button class="show-options">
                                        <i
                                            class="fas fa-bars nav-icons sub-options-icon"
                                        ></i>
                                    </button>
                                </div>
                                <div class="buttons sub-btn-3">
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
                                <button class="move move-square"><i class="fas fa-bars move-icon goal-options-icon"></i></button>
                                <button class="edit edit-square"><i class="fas fa-edit edit-icon goal-options-icon"></i></button>
                                <button class="delete delete-square"><i class="fas fa-trash-alt delete-icon goal-options-icon"></i></button>
                            </div>
                            <div class="edit-goal hide">
                                <input type="text" class="edit-goal-input" value="%title%">
                                <button class="edit-goal-button"><i class="fas fa-check edit-save"></i></button>
                            </div>
                            <h2 class="goal-title">%title%</h2>
                            <div class="goal-percentage">
                            </div>
                        </div>
                        <div class="no-goals hide">
                            <i class="fas fa-plus big-plus"></i>
                            <p class="no-goals-text">Add a subgoal category</p>
                        </div>
                        <div class="subgoal-list-container hide">
                            <ul class="subgoals-list"></ul>
                            <ul class="completed-subgoals-list"></ul>
                        </div>
                    </div>
             `;
            } else if (type === "quit") {
                element = DOMstrings.goalsList;
                html = `
                    <div class="grid-item quit-item" id="quit-%id%">
                        <div class="main-goal">
                            <div class="edit-delete-options hide">
                                <button class="move move-square"><i class="fas fa-bars move-icon"></i></button>
                                <button class="edit edit-square"><i class="fas fa-edit edit-icon"></i></button>
                                <button class="delete delete-square"><i class="fas fa-trash-alt delete-icon"></i></button>
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
                let goals = document.querySelectorAll(DOMstrings.gridItem);

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
                    <div class="drag-subgoal hide">
                        <button class="drag-subgoal-button"><i class="fas fa-bars drag-icon"></i></button>
                    </div>
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
                        <span class="option-icons edit-square">
                            <i class="fas fa-edit sub-edit-icon"></i> 
                        </span>
                        <span class="option-icons delete-square">
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
                let goals = document.querySelectorAll(DOMstrings.gridItem);

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
                <div class="drag-subgoal hide">
                    <button class="drag-subgoal-button"><i class="fas fa-bars drag-icon"></i></button>
                </div>
                <div class="edit-subgoal hide">
                    <input type="text" class="edit-subgoal-input" value="%title%">
                    <button class="edit-subgoal-button"><i class="fas fa-check sub-edit-save"></i></button>
                </div>
                <p class="subgoal-title">%title%</p>
                <div class="subgoal-update subgoal-check-icon check-target-icon">
                    <p><i class="fas fa-square sub-check"></i></p>
                </div>
                <div class="subgoal-edit-delete-options hide">
                    <span class="option-icons edit-square">
                        <i class="fas fa-edit sub-edit-icon"></i> 
                    </span>
                    <span class="option-icons delete-square">
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
        },

        addTargetListItem: function (currentGoal, obj, currentIndex, type) {
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
                    <div class="target-list-item-edit-delete-options ${type === "new" ? "hide" : ""}">
                        <span class="target-list-item-options-icons edit-square">
                            <i class="fas fa-edit target-edit-icon"></i> 
                        </span>
                        <span class="target-list-item-options-icons delete-square">
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
                currentTitle,
                currentOptions,
                targetItems,
                currentTargetOptions,
                currentGoalUpdate,
                currentDragIcon;

            if (type === "goal") {
                goals = document.querySelectorAll(DOMstrings.gridItem);

                // Toggle is draggable state
                isDraggable = !isDraggable;

                // Hide the add goal menu if shown
                this.hideAddGoalMenu();

                nodeListForEach(goals, function (current, index) {
                    currentOptions = goals[index].querySelector(
                        DOMstrings.goalOptionsIcons
                    );
                    currentTitle = goals[index].querySelector(
                        DOMstrings.goalTitle
                    );
                    currentDragIcon = goals[index].querySelector(DOMstrings.goalDrag);

                    if (currentDragIcon) {
                        // Set correct attribute for draggable
                        if (isDraggable === true) {
                            currentDragIcon.setAttribute("draggable", true);
                        } else if (isDraggable === false) {
                            currentDragIcon.setAttribute("draggable", false);
                        }
                    }

                    // Hide display options
                    currentOptions.classList.toggle("hide");
                    currentTitle.classList.toggle("edit");
                });
            } else if (type === "subgoal") {
                goals = document.querySelectorAll(DOMstrings.subgoalItem);
                // Hide add subgoal menu
                this.hideAddSubgoalMenu();     
                
                // Toggle is draggable state
                isDraggable = !isDraggable;

                nodeListForEach(goals, function (current, index) {
                    // Change the grid layout
                    goals[index].classList.toggle("options-displayed");

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

                    currentDragIcon = goals[index].querySelector(DOMstrings.subgoalDrag);

                    if (currentDragIcon) {
                        currentDragIcon.classList.toggle("hide");

                        // Set correct attribute for draggable
                        if (isDraggable === true) {
                            currentDragIcon.setAttribute("draggable", true);
                        } else if (isDraggable === false) {
                            currentDragIcon.setAttribute("draggable", false);
                        }
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
            let goals, currentOptions, currentTitle, currentDragIcon;

            goals = document.querySelectorAll(DOMstrings.gridItem);

            nodeListForEach(goals, function (current, index) {
                currentOptions = goals[index].querySelector(
                    DOMstrings.goalOptionsIcons
                );
                currentTitle = goals[index].querySelector(DOMstrings.goalTitle);

                currentOptions.classList.add("hide");
                currentTitle.classList.remove("edit");

                currentDragIcon = goals[index].querySelector(DOMstrings.goalDrag);

                // Remove the draggable attribute
                currentDragIcon.setAttribute("draggable", false);

                // Set the isDraggable state to false
                isDraggable = false;
            });
        },

        removeSubgoalOptionsDisplay: function () {
            let goals, currentOptions, currentTitle, currentGoalUpdate, currentDragIcon;
            goals = document.querySelectorAll(DOMstrings.subgoalItem);

            nodeListForEach(goals, function (current, index) {
                // Change the grid layout
                goals[index].classList.remove("options-displayed");

                currentOptions = goals[index].querySelector(
                    DOMstrings.subgoalOptionsIcons
                );
                currentTitle = goals[index].querySelector(
                    DOMstrings.subgoalTitle
                );
                currentGoalUpdate = goals[index].querySelector(
                    DOMstrings.subgoalUpdateIcons
                );
                currentDragIcon = goals[index].querySelector(DOMstrings.subgoalDrag);

                currentOptions.classList.add("hide");
                currentTitle.classList.remove("edit");
                currentGoalUpdate.classList.remove("hide");
                currentDragIcon.classList.add("hide");

                // Remove the draggable attribute
                currentDragIcon.setAttribute("draggable", false);

                // Set the isDraggable state to false
                isDraggable = false;
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
                allGoals = document.querySelectorAll(DOMstrings.gridItem);

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
                goal.innerHTML = `<p><i class="fas fa-check-square sub-check"></i></p>`;
                title.classList.add("subgoal-complete");
                completedGoalContainer.appendChild(currentGoal);
            } else {
                goal.innerHTML = `<p><i class="fas fa-square sub-check"></i></p>`;
                title.classList.remove("subgoal-complete");
                incompletedGoalContainer.appendChild(currentGoal);
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
            } else {
                title.classList.remove("subgoal-complete");
                incompletedGoalContainer.appendChild(subgoal);
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
                let subgoals, subgoalItems, goalCategories;
                // Close any open goals
                let allGoals = document.querySelectorAll(DOMstrings.gridItem);

                nodeListForEach(allGoals, function (current, index) {
                    allGoals[index].classList.remove("open");

                    subgoals = allGoals[index].querySelector(
                        DOMstrings.subgoalListContainer
                    );

                    if (subgoals) {
                        // Add the hide class to the subgoals list
                        subgoals.classList.add("hide");
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
                
            }
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
                    // Close the current goal
                    openGoal.classList.remove("open");
                    // Hide the no goal message if shown
                    openGoal.querySelector(DOMstrings.hideMessage).classList.add("hide");
                }
            });

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
            let goal = document.getElementById(`goal-${id}`);
            let goalPercentage = goal.querySelector(DOMstrings.goalPercentage);
            
            if (percentage > 0) {
                goalPercentage.textContent = percentage + "%";
            } else {
                goalPercentage.textContent = "0%";
            }
        },

        updateCurrentValue: function (currentValue, currentSubgoal) {
            // Select the element to insert the update
            let element = document.getElementById(currentSubgoal);

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

        //#############################################################
        // GENERAL TAGS
        //#############################################################

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

        displayYear: function () {
            let now = new Date();
            let year = now.getFullYear();

            document.querySelector(DOMstrings.currentYear).textContent = year;
        },

        //#############################################################
        // INSPIRATIONAL QUOTES API
        //#############################################################

        /*
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
        */

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
                let allGoals = document.querySelectorAll(DOM.gridItem);

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
    //       STATES + NODE LIST.forEach
    //###########################################
    let optionsDisplayed = false;
    let subOptionsDisplayed = false;

    let nodeListForEach = function (list, callback) {
        for (let i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    //###########################################
    //          GET TYPE AND IDs
    //###########################################
    let getGoalIDs = function (target) {
        let goal, goalID, type, ID;

        goal = target.parentElement.parentElement.parentElement.parentElement;
        goalID = goal.id;
        type = (goalID.split("-"))[0];
        ID = (goalID.split("-"))[1];

        return [goal, goalID, type, ID];
    };

    let getSubgoalIDs = function (target) {
        let currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID;
        // Get current subgoal ID
        currentSubgoal = target.parentElement.parentElement.parentElement;
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
        currentTarget = target.parentElement.parentElement.parentElement;
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

    let updatePercentage = function (id) {
        // Calculate percentages
        dataCtrl.calculatePercentage(id);

        // Read percentages from the data controller
        let percentage = dataCtrl.getPercentage(id);

        // Update the UI with the new percentages
        UICtrl.displayPercentage(percentage, id);
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
        updatePercentage(parentID);
    };

    //#############################################################
    //                 INPUT ERROR HANDLING
    //#############################################################

    let handleGoalInputError = function (type, goal, date, currentGoal) {
        if (type === "goal" && (goal === "" || goal === undefined)) {
            UICtrl.incorrectInput("goal-input", currentGoal);

        } else if (type === "quit" && goal === "") {
            UICtrl.correctInput("goal-date", currentGoal);
            UICtrl.incorrectInput("goal-input", currentGoal);

        } else if (type === "quit" && goal !== "" && ((new Date(date) > new Date()) || date === "")) {
            UICtrl.correctInput("goal-input", currentGoal);
            UICtrl.incorrectInput("goal-date", currentGoal);
        } 
    };

    let handleSubgoalInputError = function (currentSubgoal, currentGoal, type, goal, target) {
        if (type === "checkbox" && goal === "") {
            UICtrl.incorrectInput("subgoal-input", currentGoal, currentSubgoal);

        } else if (type === "target" && (goal === "" || goal === undefined)){
            UICtrl.correctInput("subgoal-target", currentGoal, currentSubgoal);
            UICtrl.incorrectInput("subgoal-input", currentGoal, currentSubgoal);

        } else if (type === "target" && goal !== "" && (target === "" || target <= 0 || isNaN(target))) {
            UICtrl.correctInput("subgoal-input", currentGoal);
            UICtrl.incorrectInput("subgoal-target", currentGoal, currentSubgoal);
        } 
    };

    let handleTargetItemInputError = function (currentTarget, currentSubgoal, note, value, date) {
        if ((note === ""  || note === undefined) && (value !== "" || value > 0) && ((new Date(date) <= new Date()) || date !== "")) {
            UICtrl.incorrectInput("target-note", undefined, currentSubgoal, currentTarget);
            UICtrl.correctInput("target-value", undefined, currentSubgoal, currentTarget);
            UICtrl.correctInput("target-date", undefined, currentSubgoal, currentTarget);
            
        } else if ((note !== ""  || note !== undefined) && (value === "" || value <= 0 || isNaN(value)) && ((new Date(date) <= new Date()) || date !== "")) {
            UICtrl.correctInput("target-note", undefined, currentSubgoal, currentTarget);
            UICtrl.incorrectInput("target-value", undefined, currentSubgoal, currentTarget);
            UICtrl.correctInput("target-date", undefined, currentSubgoal, currentTarget);
            
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
            updatePercentage(newGoal.id);

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
        let goal, goalID, type, ID;

        if (e.target.matches(".edit-icon")) {
            // Get goal ID and type
            [goal, goalID, type, ID] = getGoalIDs(e.target);

            // To ensure that the goal doesn't open
            optionsDisplayed = true;

            // Toggle input display
            UICtrl.toggleEditGoalInputDisplay(type, ID);
        }
    };

    let ctrlEditGoal = function (e) {
        let goal, goalID, type, ID, date, newDate, days, updatedGoal;

        if (e.target.matches(".edit-save")) {
            // Get goal ID and type
            [goal, goalID, type, ID] = getGoalIDs(e.target);

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
                optionsDisplayed = false;
            } else if (type === "goal") {
                handleGoalInputError(type, input.goal, undefined, goal);

                // Set the state of options displayed to false
                optionsDisplayed = false;
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
        let goal, goalID, type, ID;

        if (e.target.matches(".delete-icon")) {
            // Get goal ID and type
            [goal, goalID, type, ID] = getGoalIDs(e.target);

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
            if (goal) {
                UICtrl.openGoal(goal);
            }
        }
    };

    let ctrlChangeGoal = function (e) {
        if (e.target.closest(".prev-goal")) {
            UICtrl.changeGoal("prev");
        } else if (e.target.closest(".next-goal")) {
            UICtrl.changeGoal("next");
        }
    }

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

                // Set the state of options displayed to false
                optionsDisplayed = false;
            }
        }
    };

    //#############################################################
    //                      SUBGOALS
    //#############################################################

    let ctrlToggleAddSubgoalDisplay = function (e) {
        if (e.target.matches(".show-add-subgoal")) {
            UICtrl.showAddGoalMenu(
                e.target.parentElement.parentElement.parentElement,
                e.target
            );
        }
    };

    let ctrlAddSubgoal = function (e) {
        let parentID, input, currentGoal, newSubgoal;

        if (e.target !== undefined && e.target.matches(".add-subgoal-button")) {
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
                updatePercentage(parentID);

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
                updatePercentage(parentID);

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

        if (e.target.matches(".sub-check")) {
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(e.target);

            // Update completion status in the data controller
            updatedSubgoal = dataCtrl.toggleSubgoalIsComplete(ID, parentID);
            isComplete = updatedSubgoal.isComplete;

            // Update icon and item position on the UI
            UICtrl.toggleCheckedIcon(currentSubgoal, isComplete);

            // Update the percentage
            updatePercentage(parentID);
        }
    };

    let ctrlToggleSubgoalOptionsDisplay = function (e) {
        if (e.target.matches(".sub-options-icon")) {
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
        let currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID;

        if (e.target.matches(".sub-edit-icon")) {
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(e.target);

            // Toggle input display
            UICtrl.toggleEditSubgoalInputDisplay(ID, parentID);
        }
    };

    let ctrlEditSubgoal = function (e) {
        let currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID, updatedSubgoal, isComplete;

        if (e.target.matches(".sub-edit-save")) {
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(e.target);

            // Get input from edit field
            let input = UICtrl.getSubgoalEditInput(subgoalID, parentGoalID);

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
                    parentID,
                    updatedSubgoal.percentage
                );

                // Update if target is complete
                isComplete = updatedSubgoal.isComplete;

                UICtrl.toggleTargetComplete(ID, parentID, isComplete);

                //Update overall percentage
                updatePercentage(parentID);

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
        let currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID;

        if (e.target.matches(".sub-delete-icon")) {
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(e.target);

            // Delete subgoal from the data structure
            dataCtrl.deleteSubgoal(ID, parentID);

            // Delete goal from UI and set the subopdisplay based on the returned value of the function
            subOptionsDisplayed = UICtrl.deleteGoalItem(subgoalID, parentGoal);

            // Update the percentage
            updatePercentage(parentID);
        }
    };

    //#############################################################
    //                      TARGET ITEMS
    //#############################################################

    let ctrlToggleTargetInputDisplay = function (e) {
        let currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID;

        if (e.target.matches(".update-target")) {
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(e.target);

            // Remove subgoal and target options display
            UICtrl.removeSubgoalOptionsDisplay();
            UICtrl.removeTargetOptionsDisplay();

            // Show options on the UI
            UICtrl.toggleTargetInputDisplay(ID, parentID);
        }
    };

    let ctrlAddTargetItem = function (e) {
        let currentSubgoal,
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

        if (e.target !== undefined && e.target.matches(".target-add-save")) {
            // Get subgoal IDs
            [currentSubgoal, subgoalID, ID, parentGoal, parentGoalID, parentID] = getSubgoalIDs(e.target);

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
                UICtrl.updateCurrentValue(currentValue, subgoalID);

                // Update the target percentages
                updateTargetPercentages(ID, parentID);

                // Correct input entered
                UICtrl.correctInput("target", undefined, currentSubgoal);
            } else {
                handleTargetItemInputError(undefined, currentSubgoal, input.note, input.value, input.date);
            }
        }
    };

    let ctrlToggleEditTargetItemInputDisplay = function (e) {
        let currentTarget,
            targetID,
            ID,
            currentSubgoal,
            subgoal,
            subgoalID,
            parent,
            parentID;

        if (e.target.matches(".target-edit-icon")) {
            // Get target IDs
            [currentTarget, targetID, ID, currentSubgoal, subgoal, subgoalID, parent, parentID] = getTargetIDs(e.target);

            // Toggle input display
            UICtrl.toggleEditTargetItemInputDisplay(ID, subgoalID, parentID);
        }
    };

    let ctrlEditTargetItem = function (e) {
        let currentTarget,
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

        if (e.target.matches(".target-edit-save")) {
            // Get target IDs
            [currentTarget, targetID, ID, currentSubgoal, subgoal, subgoalID, parent, parentID] = getTargetIDs(e.target);

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
                UICtrl.updateCurrentValue(currentValue, subgoal);

                // Update the target percentages
                updateTargetPercentages(subgoalID, parentID);

                // Correct input entered
                UICtrl.correctInput("target", undefined, undefined, currentTarget);
            } else {
                handleTargetItemInputError(currentTarget, undefined, input.note, input.value, input.date);
            }
        }
    };

    let ctrlDeleteTargetItem = function (e) {
        let currentTarget,
            targetID,
            ID,
            currentSubgoal,
            subgoal,
            subgoalID,
            parent,
            parentID,
            currentValue;

        if (e.target.matches(".target-delete-icon")) {
            // Get target IDs
            [currentTarget, targetID, ID, currentSubgoal, subgoal, subgoalID, parent, parentID] = getTargetIDs(e.target);
            
            // Delete subgoal from the data structure
            dataCtrl.deleteTargetItem(ID, subgoalID, parentID);

            // Delete goal from UI
            UICtrl.deleteGoalItem(targetID);

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

    //#############################################################
    //                     DRAG AND DROP
    //#############################################################

    let ctrlDragAndDrop = function (e) {
        if (e.target.matches(".drag-icon") || e.target.matches(".move-icon")) {
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

                let subgoalItems = document.querySelectorAll(".subgoal-item");

                subgoalItems.forEach(function (item) {
                    item.classList.remove("dragElem");
                });

                let goalItems = document.querySelectorAll(".goal-item");
    
                goalItems.forEach(function (item) {
                    item.classList.remove("dragElem");
                });
            }

            function addDnDHandlers(elem) {
                elem.addEventListener("dragstart", handleDragStart, false);
                elem.addEventListener("dragenter", handleDragEnter, false);
                elem.addEventListener("dragover", handleDragOver, false);
                elem.addEventListener("dragleave", handleDragLeave, false);
                elem.addEventListener("drop", handleDrop, false);
                elem.addEventListener("dragend", handleDragEnd, false);
            }

            if (e.target.matches(".drag-icon")) {
                let subgoals = document.querySelectorAll(
                    ".subgoals-list .subgoal-item"
                );
                [].forEach.call(subgoals, addDnDHandlers);
            } else if (e.target.matches(".move-icon")) {
                let goals = document.querySelectorAll(".goals .grid-item");
                [].forEach.call(goals, addDnDHandlers);
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
