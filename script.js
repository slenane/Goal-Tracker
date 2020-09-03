// DATA CONTROLLER
let dataController = (function () {
    let Goal = function (id, goal) {
        this.id = id;
        this.goal = goal;
        this.percentage = -1;
    };

    let allGoals = [];

    return {
        addGoal: function (goal) {
            let newGoal, ID;

            // Create an ID for the goal
            if (allGoals.length > 0) {
                ID = allGoals[allGoals.length - 1].id + 1;
            } else {
                ID = 0;
            }
            // Create new goal
            newGoal = new Goal(ID, goal);
            // Push new goal into goals array
            allGoals.push(newGoal);
            // Return the new goal
            return newGoal;
        },
    };
})();

// UI CONTROLLER
let UIController = (function () {
    let DOMstrings = {
        goalInput: ".add_goal_input",
        goalSubmit: ".add_goal_button",
        goalsList: ".goals",
        goalItem: ".grid-item",
        currentYear: ".current-year",
        hideMessage: ".no-goals",
    };

    return {
        getinput: function () {
            return {
                goal: document.querySelector(DOMstrings.goalInput).value,
            };
        },

        addListItem: function (obj) {
            let element, html, newHtml;
            // Create HTML string with placeholder text
            element = DOMstrings.goalsList;
            html =
                '<div class="grid-item" id="goal-%id%"><h2 class="goal-title">%title%</h2></div>';

            // Replace placeholder text with actual data
            newHtml = html.replace("%id%", obj.id);
            newHtml = newHtml.replace("%title%", obj.goal);

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
    };

    let ctrlAddGoal = function () {
        let input, newGoal;
        // Get input from user
        input = UICtrl.getinput();
        // If the filed is not empty
        if (input.goal !== "") {
            // Add the goal to the data controller
            newGoal = dataCtrl.addGoal(input.goal);

            // Remove add goal message and add the goal to the UI
            UICtrl.hideMessage();
            UICtrl.addListItem(newGoal);

            // Clear the input field
            UICtrl.clearFields();
        }
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
