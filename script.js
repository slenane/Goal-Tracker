// DATA CONTROLLER
let dataController = (function () {
    let Goal = function (id, goal) {
        this.id = id;
        this.goal = goal;
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
                '<div class="grid-item" id="goal-%id%"><h2 class="goal-title-%id%">%title%</h2></div>';

            // Replace placeholder text with actual data
            newHtml = html.replace("%id%", obj.id);
            newHtml = newHtml.replace("%title%", obj.goal);

            // Insert into the DOM
            document
                .querySelector(element)
                .insertAdjacentHTML("beforeend", newHtml);
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

            // Add the goal to the UI
            UICtrl.addListItem(newGoal);
        }
    };

    return {
        init: function () {
            console.log("The application has started");
            setUpEventListeners();
        },
    };
})(dataController, UIController);

controller.init();
