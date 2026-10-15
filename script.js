const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");
const keypad = document.getElementById("keypad");
const errorMessage = document.getElementById("error-message");

let expression = "";
let justCalculated = false;

function updateDisplay() {
  display.textContent = expression || "0";
  expressionDisplay.textContent = justCalculated
    ? "Calculation complete"
    : expression ? "Your calculation" : "Ready to calculate";
}

function showError(message) {
  errorMessage.textContent = message;
}

function clearCalculator() {
  expression = "";
  justCalculated = false;
  showError("");
  updateDisplay();
}

function formatNumber(number) {
  if (!Number.isFinite(number)) {
    throw new Error("Result is outside the supported range.");
  }

  const cleanNumber = Math.abs(number) < 1e-12 ? 0 : number;

  return Number(cleanNumber.toPrecision(12)).toString();
}

// Safely calculates an arithmetic expression without eval().
function calculate(input) {
  const tokens = input.match(
    /(?:\d+\.?\d*|\.\d+)|[+\-*/()%]/g
  );

  if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
    throw new Error("Invalid calculation.");
  }

  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (tokens[position] === "+" || tokens[position] === "-") {
      const operator = tokens[position++];
      const right = parseTerm();

      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parseUnary();

    while (
      tokens[position] === "*" ||
      tokens[position] === "/"
    ) {
      const operator = tokens[position++];
      const right = parseUnary();

      if (operator === "/" && right === 0) {
        throw new Error("Cannot divide by zero.");
      }

      value = operator === "*" ? value * right : value / right;
    }

    return value;
  }

  function parseUnary() {
    if (tokens[position] === "+") {
      position++;
      return parseUnary();
    }

    if (tokens[position] === "-") {
      position++;
      return -parseUnary();
    }

    return parsePrimary();
  }

  function parsePrimary() {
    let value;

    if (tokens[position] === "(") {
      position++;
      value = parseExpression();

      if (tokens[position] !== ")") {
        throw new Error("Check your brackets.");
      }

      position++;
    } else {
      const token = tokens[position++];

      if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
        throw new Error("Enter a valid calculation.");
      }

      value = Number(token);
    }

    while (tokens[position] === "%") {
      position++;
      value = value / 100;
    }

    return value;
  }

  const result = parseExpression();

  if (position !== tokens.length) {
    throw new Error("Check your calculation.");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Result is too large.");
  }

  return result;
}

function addValue(value) {
  showError("");

  if (justCalculated) {
    if (/^[0-9.]$/.test(value)) {
      expression = "";
    }
    justCalculated = false;
  }

  if (/^[0-9]$/.test(value)) {
    if (expression === "0") expression = "";
    expression += value;
  } else if (value === ".") {
    const currentNumber = expression.split(/[+\-*/()%]/).pop();

    if (currentNumber.includes(".")) return;

    if (!currentNumber) expression += "0";
    expression += ".";
  } else if ("+-*/".includes(value)) {
    if (!expression && value !== "-") return;

    if (/[+\-*/]$/.test(expression)) {
      if (value === "-" && !expression.endsWith("-")) {
        expression += value;
      } else {
        expression = expression.slice(0, -1) + value;
      }
    } else {
      expression += value;
    }
  } else if (value === "%") {
    if (/\d|\)$/.test(expression)) expression += "%";
  }

  updateDisplay();
}

function performCalculation() {
  if (!expression) return;

  try {
    const result = calculate(expression);
    const formatted = formatNumber(result);

    expressionDisplay.textContent = expression + " =";
    expression = formatted;
    display.textContent = formatted;
    justCalculated = true;
    showError("");
  } catch (error) {
    showError(error.message || "Unable to calculate.");
  }
}

function deleteLast() {
  showError("");
  justCalculated = false;
  expression = expression.slice(0, -1);
  updateDisplay();
}

keypad.addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "clear") {
    clearCalculator();
  } else if (button.dataset.action === "backspace") {
    deleteLast();
  } else if (button.dataset.action === "equals") {
    performCalculation();
  } else if (button.dataset.value) {
    addValue(button.dataset.value);
  }
});

// Keyboard support
document.addEventListener("keydown", function (event) {
  const key = event.key;

  if (/^[0-9.]$/.test(key)) {
    addValue(key);
  } else if (["+", "-", "*", "/", "%"].includes(key)) {
    addValue(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    performCalculation();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape" || key === "Delete") {
    clearCalculator();
  }
});

updateDisplay();