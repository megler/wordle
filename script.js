class Wordle {
  letterGuesses = [];
  gameWord = "";
  isGameOver = false;
  guessCount = 0;
  streak = 0;
  hasWon = false;

  constructor() {
    this.wordleService = new WordleService();
    this.gameboard = new GameBoard();
    this.keyboard = new Keyboard();
    this.uiService = new UIService();

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.reset = this.reset.bind(this);
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener("pushedKey", this.handleKeyPress);
    this.uiService.setupResetButtonEventListener(this.reset);
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.wordleService
        .fetchDailyWord()
        .then((word) => {
          this.gameWord = word;
          this.start();
          this.uiService.setupShowWordCheckboxEventListener(word);
        })
        .catch((error) => {
          console.error("Failed to fetch the daily word:", error);
        });
    });
  }

  reset() {
    this.letterGuesses = [];
    this.gameWord = "";
    this.isGameOver = false;
    this.guessCount = 0;
    this.gameboard.clearBoard();
    this.keyboard.clearKeyboard();

    this.uiService.updateResetButtonText("Play Again");
    this.uiService.resetShowWordCheckbox();
    this.uiService.setShowWordDiv("Show Word");

    if (!this.hasWon) {
      this.streak = 0;
      document.querySelector(".win-streak").innerHTML = this.streak;
    }
    this.hasWon = false;

    this.wordleService
      .fetchDailyWord()
      .then((word) => {
        this.gameWord = word;
        this.start();
        this.uiService.setupShowWordCheckboxEventListener(word);
      })
      .catch((error) => {
        console.error("Failed to fetch the daily word:", error);
      });
  }

  start() {
    this.gameboard.draw();
    this.keyboard.draw();
  }

  async handleKeyPress(event) {
    if (
      this.isGameOver ||
      (this.letterGuesses.length === 0 &&
        event.detail.key.toLowerCase() === "on_delete")
    ) {
      return;
    }

    const pressedKey = event.detail.key.toLowerCase();
    const actions = {
      "on_delete": () => this.handleDeleteKey(),
      "enter": () => this.handleEnterKey(),
      "default": () => this.handleLetterKey(pressedKey),
    };

    if (actions.hasOwnProperty(pressedKey)) {
      actions[pressedKey]();
    } else {
      actions["default"]();
    }
  }

  handleDeleteKey() {
    if (!this.gameboard.guessSubmitted && this.letterGuesses.length > 0) {
      this.letterGuesses.pop();
      this.gameboard.removeLetterFromSquare();
    }
  }

  async handleEnterKey() {
    if (this.letterGuesses.length !== this.gameboard.squaresPerWord) {
      alert("Your guess must be exactly 5 letters!");
      return;
    }

    const currentGuess = this.letterGuesses.join("").toLowerCase();
    try {
      const isValid = await this.wordleService.isValidWord(currentGuess);
      if (!isValid) {
        alert(
          "Not in word list. You must enter a valid word. Delete your entry and try again."
        );
        return;
      }

      this.guessCount++;
      if (!this.gameboard.guessSubmitted) {
        this.checkWord();
      }

      if (!this.gameboard.guessSubmitted || this.gameboard.isRowComplete()) {
        this.gameboard.resetCurrentSquareForNewRow();
        this.letterGuesses = [];
      }

      this.gameboard.markGuessSubmitted(false);
    } catch (error) {
      console.error("Error checking word validity:", error);
    }
  }

  handleLetterKey(pressedKey) {
    if (
      !this.gameboard.isRowComplete() &&
      !this.gameboard.guessSubmitted &&
      this.letterGuesses.length < this.gameboard.squaresPerWord
    ) {
      this.letterGuesses.push(pressedKey);
      this.gameboard.addLetterToSquare(pressedKey.toUpperCase());
    }
  }

  checkGuess(guess) {
    const result = { correct: 0, inWord: 0, notInWord: 0, colors: [] };
    let gameWordArray = this.gameWord.split("");
    let guessArray = guess.split("");

    guessArray.forEach((letter, index) => {
      if (letter === gameWordArray[index]) {
        result.correct++;
        result.colors[index] = "green";
        gameWordArray[index] = null;
      }
    });

    guessArray.forEach((letter, index) => {
      if (result.colors[index] !== "green" && gameWordArray.includes(letter)) {
        result.inWord++;
        result.colors[index] = "yellow";
        gameWordArray[gameWordArray.indexOf(letter)] = null;
      } else if (!result.colors[index]) {
        result.notInWord++;
        result.colors[index] = "gray";
      }
    });

    return result;
  }

  updateUIAfterGuess(result, startIndex) {
    result.colors.forEach((color, index) => {
      this.gameboard.updateSquareColor(startIndex + index, color);
    });

    if (result.correct === this.gameWord.length) {
      setTimeout(() => {
        this.uiService.fireConfetti();
        this.streak++;
        this.hasWon = true;
        document.querySelector(".win-streak").innerHTML = this.streak;
        alert("You win!");
        this.isGameOver = true;
      }, 30);
    } else if (this.guessCount >= 6) {
      setTimeout(() => {
        alert("Game over. The word was " + this.gameWord);
        this.streak = 0;
        this.hasWon = false;
        document.querySelector(".win-streak").innerHTML = this.streak;
        this.isGameOver = true;
      }, 10);
    } else {
      setTimeout(() => {
        alert("Try again!");
      }, 10);
    }
  }

  checkWord() {
    const currentGuess = this.letterGuesses.join("").toLowerCase();
    let startIndex = this.gameboard.currentSquare - this.letterGuesses.length;

    const result = this.checkGuess(currentGuess);
    this.updateUIAfterGuess(result, startIndex);
  }
}

class WordleService {
  constructor() {}

  async fetchDailyWord() {
    // Credit: https://random-word-api.herokuapp.com/home
    const url = "https://random-word-api.herokuapp.com/word?length=5&lang=en";
    const options = { method: "GET" };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        const potentialWord = result[0];
        const wordExists = await this.isValidWord(potentialWord);

        if (wordExists) {
          return potentialWord;
        } else {
          console.warn(
            `${potentialWord} does not exist in the dictionary, fetching a new word.`
          );
          return await this.fetchDailyWord();
        }
      } else {
        throw new Error("API did not return a valid array of words.");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async isValidWord(guess) {
    // Credit https://dictionaryapi.dev/
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      } else if (response.status === 404) {
        return false;
      }
    } catch (error) {
      console.error("Error checking word validity:", error);
      return false;
    }
  }
}

class UIService {
  constructor() {
    this.resetButton = document.querySelector(".reset-button button");
    this.showWordCheckbox = document.querySelector(
      ".showWordCheckbox input[type='checkbox']"
    );
    this.showWordDiv = document.getElementById("showWord");
  }

  fireConfetti() {
    // Credit: https://github.com/catdad/canvas-confetti?tab=readme-ov-file
    window["confetti"]({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  setupResetButtonEventListener(resetFunction) {
    if (this.resetButton) {
      this.resetButton.addEventListener("click", resetFunction);
    }
  }

  updateResetButtonText(text) {
    if (this.resetButton) {
      this.resetButton.innerHTML = text;
    }
  }

  resetShowWordCheckbox() {
    if (this.showWordCheckbox) {
      this.showWordCheckbox.checked = false;
    }
  }

  setupShowWordCheckboxEventListener(gameWord) {
    if (this.showWordCheckbox && this.showWordCheckbox) {
      this.showWordCheckbox.removeEventListener(
        "change",
        this._checkboxChangeHandler
      );
      this._checkboxChangeHandler = () => {
        if (this.showWordCheckbox.checked) {
          this.showWordDiv.innerHTML = gameWord;
        } else {
          this.showWordDiv.innerHTML = "Show Word";
        }
      };

      this.showWordCheckbox.addEventListener(
        "change",
        this._checkboxChangeHandler
      );
    } else {
      console.error("Checkbox input element not found.");
    }
  }

  setShowWordDiv(text) {
    if (this.showWordDiv) {
      this.showWordDiv.innerHTML = text;
    }
  }

  resetShowWordDiv() {
    this.setShowWordDiv("Show Word");
  }
}

class GameBoard {
  NUM_SQUARES = 30;
  currentSquare = 0;
  squaresPerWord = 5;
  guessSubmitted = false;

  constructor() {
    this.squares = [];
  }

  draw() {
    const gameBoardContainer = document.getElementById("gameboard");

    for (let i = 0; i < this.NUM_SQUARES; i++) {
      let id = "sq" + i;
      let box = document.createElement("div");
      box.id = id;
      box.className = "box";
      gameBoardContainer.appendChild(box);
      this.squares.push(box);
    }
  }

  addLetterToSquare(letter) {
    if (letter.toLowerCase() !== "on_delete" && !this.isRowComplete()) {
      let square = this.squares[this.currentSquare];
      square.textContent = letter.toUpperCase();
      this.currentSquare++;
    }
  }

  removeLetterFromSquare() {
    if (
      !this.isRowComplete() &&
      !this.guessSubmitted &&
      this.currentSquare > 0
    ) {
      this.currentSquare--;
      let square = this.squares[this.currentSquare];
      square.textContent = "";
    }
  }

  isRowComplete() {
    return this.currentSquare >= this.NUM_SQUARES;
  }

  resetCurrentSquareForNewRow() {
    this.currentSquare =
      Math.ceil(this.currentSquare / this.squaresPerWord) * this.squaresPerWord;
  }

  markGuessSubmitted(submitted = true) {
    this.guessSubmitted = submitted;
  }

  updateSquareColor(index, color) {
    let square = this.squares[index];
    square.classList.add(color);
  }

  clearBoard() {
    const gameBoardContainer = document.getElementById("gameboard");
    gameBoardContainer.innerHTML = "";
    this.squares = [];
    this.currentSquare = 0;
    this.guessSubmitted = false;
  }
}

class Keyboard {
  #keyboardRows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["enter", "z", "x", "c", "v", "b", "n", "m", "on_delete"],
  ];

  constructor() {
    this.keyboard = this.#keyboardRows;
  }

  draw() {
    const keyboardContainer = document.getElementById("keyboard");

    this.keyboard.forEach((row) => {
      let rowDiv = document.createElement("div");
      rowDiv.className = "keyboard-row";

      row.forEach((key) => {
        let keyDiv = document.createElement("div");
        keyDiv.className = "keyboard-key";

        keyDiv.addEventListener("click", () => {
          const keyPressed = new CustomEvent("pushedKey", {
            detail: { key: key },
          });
          document.dispatchEvent(keyPressed);
        });

        if (key === "on_delete") {
          let icon = document.createElement("i");
          icon.className = "fa-solid fa-delete-left";
          keyDiv.appendChild(icon);
        } else {
          keyDiv.textContent = key.toUpperCase();
        }

        rowDiv.appendChild(keyDiv);
      });
      keyboardContainer.appendChild(rowDiv);
    });
  }

  clearKeyboard() {
    const keyboardContainer = document.getElementById("keyboard");
    keyboardContainer.innerHTML = "";
  }
}

const game = new Wordle();
game.init();
