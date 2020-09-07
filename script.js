// DATA CONTROLLER
let dataController = (function () {
    class Goal {
        constructor(id, goal) {
            this.id = id;
            this.goal = goal;
            this.percentage = -1;
        }
    }

    class Category extends Goal {
        constructor(id, goal, subgoal) {
            super(id, goal);
            this.subgoal = subgoal;
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
            if (allGoals.length > 0) {
                ID = allGoals[allGoals.length - 1].id + 1;
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
            return newGoal;
        },
    };
})();

// UI CONTROLLER
let UIController = (function () {
    let DOMstrings = {
        goalType: ".add_goal_type",
        goalInput: ".add_goal_input",
        goalDate: ".add_goal_date",
        goalSubmit: ".add_goal_button",
        goalsList: ".goals",
        goalItem: ".grid-item",
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

        addListItem: function (obj, type, date) {
            let element, html, newHtml;
            let goalDate = date;
            // Create HTML string with placeholder text
            if (type === "goal") {
                element = DOMstrings.goalsList;
                html =
                    '<div class="grid-item goal-item" id="goal-%id%"><h2 class="goal-title">%title%</h2><img class="percentage-wheel" src="./percentage-sample.jpg"alt="percentage wheel"/></div>';
            } else if (type === "quit") {
                element = DOMstrings.goalsList;
                html =
                    '<div class="grid-item quit-item" id="goal-%id%"><h2 class="goal-title">%title%</h2><p>%date% days</p></div>';
            }

            // Replace placeholder text with actual data
            newHtml = html.replace("%id%", obj.id);
            newHtml = newHtml.replace("%title%", obj.goal);
            newHtml = newHtml.replace(
                "%date%",
                Math.floor(
                    (new Date().getTime() - goalDate) / (60 * 60 * 24 * 1000)
                )
            );
            // Insert into the DOM
            document
                .querySelector(element)
                .insertAdjacentHTML("beforeend", newHtml);
        },

        hideMessage: function () {
            document
                .querySelector(DOMstrings.hideMessage)
                .classList.add("hide");
        },

        openGoal: function (goal) {
            // Close any open goals
            let allGoals = document.querySelectorAll(DOMstrings.goalItem);

            nodeListForEach(allGoals, function (current, index) {
                allGoals[index].classList.remove("active");
            });

            // Open target gaol
            goal.classList.add("active");
        },

        clearFields: function () {
            let field = document.querySelector(DOMstrings.goalInput);

            field.value = "";
        },

        displayYear: function () {
            let now = new Date();
            let year = now.getFullYear();

            document.querySelector(DOMstrings.currentYear).textContent = year;
        },

        getDOMstrings: function () {
            return DOMstrings;
        },
    };
})();

// GLOBAL APP CONTROLLER
let controller = (function (dataCtrl, UICtrl) {
    let setUpEventListeners = function () {
        let DOM = UICtrl.getDOMstrings();

        // Listen for click on add goal button
        document
            .querySelector(DOM.goalSubmit)
            .addEventListener("click", ctrlAddGoal);
        // Listen for enter keypress
        document.addEventListener("keypress", function (e) {
            // .which is used for compatability with older browsers that don't have the keyCode property
            if (e.keyCode === 13 || e.which === 13) {
                ctrlAddGoal();
            }
        });

        document
            .querySelector(DOM.goalsList)
            .addEventListener("click", ctrlOpenGoal);
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
        if (input.type === "quit" && input.goal !== "" && input.date !== "") {
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
        }
    };

    let ctrlOpenGoal = function (e) {
        // Select the clicked element
        let clicked = e.target;
        // Add active class to element
        UICtrl.openGoal(clicked);
    };

    return {
        init: function () {
            console.log("The application has started");
            UICtrl.displayYear();
            setUpEventListeners();
        },
    };
})(dataController, UIController);

controller.init();
