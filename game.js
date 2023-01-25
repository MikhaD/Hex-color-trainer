// ------------------------------------------- Variables ------------------------------------------
const LOCAL_STORAGE_PREFIX = "cg";
const root = document.documentElement;
const options = document.querySelector("#options").children;
const guessBoxEl = document.querySelector("#guess-box");
const timerEl = document.querySelector("#timer");
const timeEl = document.querySelector("#time");
const questionsEl = document.querySelector("#questions");
const counterEl = document.querySelector("#counter");
const rightEl = document.querySelector("#right");
const wrongEl = document.querySelector("#wrong");
const startEl = document.querySelector("#start");
let settings, autoPlayer;

const localStorageAccessible = (() => {
	try {
		localStorage.setItem("localStorage-test", true);
		localStorage.removeItem("localStorage-test");
		return true;
	} catch (error) {
		console.warn("Unable to access localStorage");
		return false;
	}
})();

// ------------------------------------ Number input validation -----------------------------------

function validateInput(e) {
	if (this.value > Number(this.max)) {
		this.value = this.max;
		return;
	}
	if (this.value < Number(this.min)) {
		this.value = this.min;
		return;
	}
	if (isNaN(this.value)) {
		this.value = this.min;
		return;
	}
}

function validateKeystroke(e) {
	if (isNaN(Number(e.key))) {
		e.preventDefault();
	}
}

for (let el of document.querySelectorAll(".input.text")) {
	el.addEventListener("input", validateInput);
	el.addEventListener("keypress", validateKeystroke);
}

// ----------------------------------------- Flipping tile ----------------------------------------
let flipper = document.querySelector(".flipper");
let flipped = false;
let hover = false;
let TimeoutOver = true;
let flipBack;
function flip() {
	flipper.classList.add("flipped");
	flipper.classList.remove("hover");
	clearTimeout(flipBack);
	flipBack = setTimeout(unFlip, settings.values.infoDisplay * 1000);
	TimeoutOver = false;
	flipped = true;
}

function unFlip() {
	if (!hover) {
		flipper.classList.remove("flipped");
		flipper.classList.add("hover");
		flipped = false;
	}
	clearTimeout(flipBack);
	TimeoutOver = true;
}

flipper.addEventListener("click", () => {
	if (flipped) {
		hover = false;
		unFlip();
	} else {
		flip();
	}
});
flipper.addEventListener("mouseover", () => { hover = true; });
flipper.addEventListener("mouseout", () => {
	hover = false;
	if (TimeoutOver)
		unFlip();
});
// -------------------------------------------- Classes -------------------------------------------
class Utils {
	/**
	 * Generate a random integer between lower and upper, inclusive.
	 * @param {number} lower The lower bound of the random integer.
	 * @param {number} upper The upper bound of the random integer.
	 */
	static randInt(lower, upper) {
		lower = Math.round(lower);
		upper = Math.round(upper);
		return Math.round((upper - lower) * Math.random() + lower);
	}
	/**Generate a random rgb value array */
	static genRgb() {
		let arr = [];
		for (let i = 0; i < 3; ++i) arr.push(Utils.randInt(0, 255));
		return arr;
	}
	/**
	 * Modify the state of all the option buttons.
	 * @param {boolean} reset - true if you wish to reset the contents and style of the buttons.
	 * @param {boolean} disabled - whether to disable the buttons. If left out the buttons will be unchanged.
	 */
	static setOptions(reset, disabled) {
		reset = (reset == undefined || typeof reset != "boolean") ? true : reset;
		for (let i of options) {
			if (disabled != undefined && typeof disabled == "boolean")
				i.disabled = disabled;
			if (reset) {
				i.removeAttribute("style");
				i.textContent = "";
			}
		}
	}
	/**
	 * Update the title of the page and tab.
	 * @param {string} title - the value being guessed.
	 */
	static updateTitle(title) {
		document.querySelector(".guess").textContent = title;
		document.querySelector("title").textContent = `GUESS THE ${title.toUpperCase()}`;
	}
	/**
	 * Create a modal with a title, text and a close button. call with no parameters to call the welcome modal.
	 * @param {string} title - The title of the modal.
	 * @param {*} value - The modal text or a DOM node containing elements to display on the modal.
	 */
	static modal(title, value) {
		if (title != undefined && value != undefined) {
			document.querySelector("#modal-title").textContent = title;
			if (typeof value == "object") {
				document.querySelector("#modal-content").innerHTML = "";
				document.querySelector("#modal-content").append(value);
			}
			else
				document.querySelector("#modal-content").innerHTML = value;
		}
		document.querySelector("#modal").classList.remove("hidden");
		document.querySelector("#modal-button").focus();
	}
	/**
	 * Create a modal with a title of WELL DONE or GAME OVER and displays the players score. The title depends on the players score.
	 * @param {string} message - The end message.
	 * @param {number} right - the number of questions answered correctly.
	 * @param {number} wrong - the number of questions answered incorrectly.
	 */
	static endModal(message, right, wrong) {
		let element, container = document.createElement("div");
		element = document.createElement("p");
		element.append(document.createTextNode(message));
		container.append(element);
		element = document.createElement("div");
		element.append(document.createTextNode(right + " right"));
		element.className = "right-box";
		container.append(element);
		element = document.createElement("div");
		element.append(document.createTextNode(wrong + " wrong"));
		element.className = "wrong-box";
		container.append(element);
		let title = (right >= Settings.defaults.questions && wrong == 0) ? "WELL DONE" : "GAME OVER";
		Utils.modal(title, container);
	}
	/**
	 * Return the element with the specified value from an array of elements.
	 * @param {Array} array - The array of elements.
	 * @param {string} value - The value to search by.
	 */
	static getElementByValue(array, value) {
		for (let i of array) {
			if (i.value == value) {
				return i;
			}
		}
	}
}

class Difficulty {
	/** The highest difficulty level present in the html */
	static max = (() => {
		let max, temp = document.forms.difficulties.difficulty.values();
		for (let i of temp) max = i.value;
		return Number(max);
	})();
	constructor(difficulty) {
		this.difficulty = Number(difficulty);
		this.range = Math.round((1 + Difficulty.max - this.difficulty) * (255 / Difficulty.max) / 2);
	}
	/**Generate an rgb array based on another rgb array in a range determined by the difficulty */
	option(val) {
		let option = [];
		for (let i of val.rgbArray) {
			let lowerBound = i - this.range;
			let upperBound = i + this.range;
			let midStop = Math.round(i - (this.range * 0.1));
			let midStart = Math.round(i + (this.range * 0.1));
			if (lowerBound < 0) {
				upperBound += Math.abs(lowerBound) - 1;
				lowerBound = 0;
			} else if (upperBound > 255) {
				lowerBound -= (upperBound - 254);
				upperBound = 255;
			}
			let result = Utils.randInt(lowerBound, upperBound - (1 + 0.2 * this.range));
			if (result > midStop && result < midStart)
				result = (result - midStop) + midStart;
			if (result > 255)
				result = (result - 256) + lowerBound;
			option.push(result);
		}
		return option;
	}
}

class Settings {
	static defaults = Object.freeze({
		guess: "color",
		given: "hex",
		mode: "timed",
		difficulty: "1",
		questions: "10",
		mins: "1",
		secs: "30",
		theme: "light",
		hexCase: "lower",
		ansDisplay: "0.4",
		infoDisplay: "4",
		autoPlay: "off",
		newPlayer: "true"
	});
	values = { ...Settings.defaults };
	constructor() {
		this.read();
		Utils.getElementByValue(document.forms.guesses.guess, this.values.guess).click();
		Utils.getElementByValue(document.forms.givens.given, this.values.given).click();
		Utils.getElementByValue(document.forms.modes.gameMode, this.values.mode).click();
		Utils.getElementByValue(document.forms.difficulties.difficulty, this.values.difficulty).click();
		document.forms.numQuestions.questions.value = this.values.questions;
		document.forms.time.minutes.value = this.values.mins;
		document.forms.time.seconds.value = this.values.secs;
		Utils.getElementByValue(document.forms.themes.theme, this.values.theme).click();
		Utils.getElementByValue(document.forms.cases.case, this.values.hexCase).click();
		document.forms.ansDisplay.seconds.value = this.values.ansDisplay;
		document.forms.infoDisplay.seconds.value = this.values.infoDisplay;
		Utils.getElementByValue(document.forms.autoPlay.on, this.values.autoPlay).click();
	}
	/** Store settings in localStorage if localStorage is accessible. */
	store() {
		if (localStorageAccessible) {
			for (let i in this.values) {
				localStorage.setItem(`${LOCAL_STORAGE_PREFIX}-${i}`, this.values[i]);
			}
		}
	}
	/** Read settings from localStorage if localStorage is accessible. */
	read() {
		if (localStorageAccessible) {
			for (let i in this.values) {
				let temp = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}-${i}`);
				if (temp != null)
					this.values[i] = temp;
			}
		}
	}
	/** Remove all settings from localStorage if localStorage is accessible and reset game settings  */
	reset() {
		if (localStorageAccessible) {
			for (let i in Settings.values) {
				localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}-${i}`);
			}
		}
		this.values = { ...Settings.defaults };
	}
}

class Game {
	/**
	 * @param {Settings} settings - A settings object.
	 */
	constructor(settings) {
		/** @type {Settings} */
		this.settings = settings;
		this.difficulty;
		this.timer;
		this.color;
		this.ansPos;
		this.reset();
		this.disabledModal = false;
	}
	updateTime(direction) {
		if (direction == "-") {
			--this.time[2];
			if (this.time[2] == -1) {
				this.time[2] = 99;
				--this.time[1];
			}
			if (this.time[1] == -1) {
				this.time[1] = 59;
				--this.time[0];
			}
			if (this.time[0] == 0 && this.time[1] <= 10 && this.time[2] == 0)
				timerEl.classList.toggle("red");
		}
		else {
			++this.time[2];
			if (this.time[2] == 100) {
				this.time[2] = 0;
				++this.time[1];
			}
			if (this.time[1] == 60) {
				this.time[1] = 0;
				++this.time[0];
			}
		}
		timerEl.textContent = this.time.map((el) => String(el).padStart(2, 0)).join(":");
	}
	updateCounter() {
		counterEl.textContent = this.counter.map((el) => String(el).padStart(2, 0)).join(" / ");
	}
	updateScore() {
		rightEl.textContent = this.right;
		wrongEl.textContent = this.wrong;
	}
	/**Call the next question and set all the relevant html elements to their required values */
	nextQuestion() {
		this.color = new Color(Utils.genRgb());
		if (this.settings.values.hexCase == "lower")
			this.color.hex = this.color.hex.toLowerCase();
		this.ansPos = Utils.randInt(1, 9);
		if (this.settings.values.given != "color")
			guessBoxEl.textContent = this.color[this.settings.values.given];
		else {
			guessBoxEl.textContent = "";
			guessBoxEl.style["background"] = this.color.rgb;
		}
		for (let i = 0; i < options.length; ++i) {
			options[i].removeAttribute("style");
			options[i].textContent = "";
			if (this.settings.values.guess != "color") {
				let btnColor;
				if (i + 1 != this.ansPos) {
					btnColor = new Color(this.difficulty.option(this.color));
					if (this.settings.values.hexCase == "lower")
						btnColor.hex = btnColor.hex.toLowerCase();
				}
				else
					btnColor = this.color;
				options[i].textContent = btnColor[this.settings.values.guess];
			} else {
				options[i].style["background"] = i + 1 != this.ansPos ? new Color(this.difficulty.option(this.color)).rgb : this.color.rgb;
			}
		}
	}
	reset() {
		this.end();
		this.right = 0;
		this.wrong = 0;
		this.updateScore();
		this.settings.values.mode = document.forms.modes.gameMode.value;
		document.querySelector("#info-mode").textContent = "Mode: " + this.settings.values.mode;
		this.settings.values.difficulty = document.forms.difficulties.difficulty.value;
		document.querySelector("#info-difficulty").textContent = "Difficulty: " + ((this.settings.values.difficulty < Difficulty.max) ? this.settings.values.difficulty : "max");
		if (this.difficulty == undefined || this.settings.values.difficulty != this.difficulty.difficulty)
			this.difficulty = new Difficulty(this.settings.values.difficulty);
		this.settings.values.questions = document.forms.numQuestions.questions.value;

		this.settings.values.mins = document.forms.time.minutes.value;
		this.settings.values.secs = document.forms.time.seconds.value;
		if (this.settings.values.mins === 0 && this.settings.secs === 0) this.settings.values.mins = this.settings.defaults.mins;
		if (this.settings.values.mins == "") this.settings.values.mins = "0";
		if (this.settings.values.secs == "") this.settings.values.secs = "0";

		this.counter = [0, 0];
		this.time = [0, 0, 0];
		this.initialTime = [this.settings.values.mins, this.settings.values.secs];
		if (this.settings.values.mode == "speed") {
			this.time = [this.settings.values.mins, this.settings.values.secs, 0];
			this.counter[1] = " ∞";
		}
		else if (this.settings.values.mode == "timed") {
			this.counter[1] = this.settings.values.questions;
		}
		else if (this.settings.values.mode == "zen") {
			this.counter[1] = this.settings.values.questions;
		}
		else {
			this.counter[1] = " ∞";
		}

		guessBoxEl.removeAttribute("style");
		guessBoxEl.textContent = "";
		timerEl.textContent = "";
		timerEl.classList.remove("red");
		document.querySelector("#timer-start").classList.remove("flipped");
		this.updateCounter();
		Utils.setOptions(true);
		for (let i of document.querySelectorAll(".info-btn"))
			i.classList.add("hidden");
		this.gameReset = true;
	}
	start() {
		if (!this.gameReset)
			this.reset();
		document.querySelector("#timer-start").classList.add("flipped");
		switch (this.settings.values.mode) {
			case "speed":
				this.timer = setInterval(() => {
					this.updateTime("-");
					if (this.time.every((val) => val == 0))
						this.finish();
				}, 10);
				break;
			case "timed":
				this.timer = setInterval(() => {
					this.updateTime("+");
				}, 10);
				break;
		}
		Utils.setOptions(false, false);
		this.nextQuestion();
		this.gameReset = false;
		for (let i of document.querySelectorAll(".info-btn"))
			i.classList.remove("hidden");
	}
	end() {
		clearInterval(this.timer);
		Utils.setOptions(false, true);
	}
	finish() {
		this.end();
		switch (this.settings.values.mode) {
			case "speed":
				Utils.endModal(`In ${Number(this.initialTime[0])}m ${Number(this.initialTime[1])}.${this.time[2]}s you answered ${this.counter[0]} questions, out of which you got:`, this.right, this.wrong);
				break;

			case "timed":
				Utils.endModal(`It took you ${this.time[0]}m ${this.time[1]}.${this.time[2]}s to answer ${this.settings.values.questions} questions, out of which you got:`, this.right, this.wrong);
				break;

			case "zen":
				Utils.endModal(`You answered ${this.settings.values.questions} questions, out of which you got:`, this.right, this.wrong);
				break;
		}
		this.disabledModal = true;
		setTimeout(() => { this.disabledModal = false; }, 500);
	}
}

/**
 * A class that represents a color value with attributes for the hsl, rgb and hexadecimal representation of the color.
 * @param {array} rgb - An rgb array
 */
class Color {
	/** @param {array} rgb */
	constructor(rgb) {
		this.rgbArray = rgb.map(Number);
		this.rgb = `rgb(${rgb.join(", ")})`;
		this.hslArray = Color.rgbToHsl(rgb, false);
		this.hsl = `hsl(${this.hslArray.join(", ")})`;
		this.hex = Color.rgbToHex(rgb);
	}
	/**Return the hexadecimal color equivalent for the rgb value or array.
	 * @param rgb - The rgb value or array to convert to hexadecimal.
	 * @param {boolean} str - An optional boolean value, true by default. If it is false, an array of hex values will be returned instead of a hex string.
	 */
	static rgbToHex(rgb, str) {
		if (typeof rgb !== "object")
			rgb = rgb.substring(4, rgb.length - 1).split(", ");
		rgb = rgb.map((str) => Number(str).toString(16).padStart(2, 0).toUpperCase());
		return (str !== false) ? "#" + rgb.join("") : rgb;
	}
	/**Return the rgb equivalent for the hexadecimal color value or array.
	 * @param hex - The hexadecimal color value or array to convert to rgb.
	 * @param {boolean} str - An optional boolean value, true by default. If it is false, an array of rgb values will be returned instead of an rgb string.
	 */
	static hexToRgb(hex, str) {
		if (typeof hex !== "object") {
			if (hex.substr(0, 1) == "#") hex = hex.substr(1);
			if (hex.length == 1) hex = (() => {
				let result = hex;
				for (let i = 0; i < 5; ++i)
					result += hex;
				return result;
			})();
			if (hex.length == 3) hex = (() => {
				let result = "";
				for (let i = 0; i < 3; ++i)
					result += hex.charAt(i) + hex.charAt(i);
				return result;
			})();
			hex = [hex.substr(0, 2), hex.substr(2, 2), hex.substr(4)];
		}
		hex = hex.map((x) => {
			let rgb = 0;
			for (let i = 0; i < 2; ++i) {
				let v = String(x).charAt(i).toLowerCase();
				rgb += (isNaN(v) ? 10 + "abcdef".indexOf(v) : Number(v)) * 16 ** (1 - i);
			}
			return rgb;
		});
		return (str !== false) ? `rgb(${hex.join(", ")})` : hex;
	}
	/**Return the rgb equivalent for the hsl value or array.
	 * @param hsl - The hsl value or array to convert to rgb.
	 * @param {boolean} str - An optional boolean value, true by default. If it is false, an array of rgb values will be returned instead of an rgb string.
	 */
	static hslToRgb(hsl, str) {
		if (typeof hsl !== "object") {
			hsl = hsl.substring(4, hsl.length - 1).split(", ");
		}
		hsl = hsl.map((val) => Number(isNaN(val) && val.substr(val.length - 1, 1) == "%" ? val.substr(0, val.length - 1) : val) / 100);
		let rgb = [0, 0, 0];
		if (hsl[1] == 0) {
			rgb[0] = Math.round(hsl[2] * 255); rgb[1] = rgb[0]; rgb[2] = rgb[0];
		} else {
			let temp1 = (hsl[2] < 0.5) ? hsl[2] * (1 + hsl[1]) : (hsl[2] + hsl[1]) - (hsl[2] * hsl[1]);
			let temp2 = (2 * hsl[2]) - temp1;
			hsl[0] = (hsl[0] * 100) / 360;
			rgb[0] = hsl[0] + (1 / 3); rgb[1] = hsl[0]; rgb[2] = hsl[0] - (1 / 3);

			rgb = rgb.map((val) => {
				val = ((val < 0) ? val + 1 : val) % 1;
				if (6 * val < 1) val = temp2 + (temp1 - temp2) * 6 * val;
				else if (2 * val < 1) val = temp1;
				else if (3 * val < 2) val = temp2 + (temp1 - temp2) * 6 * ((2 / 3) - val);
				else val = temp2;
				return Math.round(val * 255);
			});
		}
		return (str !== false) ? `rgb(${rgb.join(", ")})` : rgb;
	}
	/**Return the hsl equivalent for the rgb value or array.
	 * @param rgb - The rgb value or array to convert to hsl.
	 * @param {boolean} str - An optional boolean value, true by default. If it is false, an array of hsl values will be returned instead of an hsl string.
	 */
	static rgbToHsl(rgb, str) {
		if (typeof rgb !== "object") {
			rgb = rgb.substring(4, rgb.length - 1).split(", ");
		}
		rgb = rgb.map((val) => val / 255);
		let h, s, l;
		let min = Math.min(rgb[0], rgb[1], rgb[2]), max = Math.max(rgb[0], rgb[1], rgb[2]);
		let luminace = (min + max) / 2;
		l = Math.round(luminace * 100);
		if (min == max) {
			s = 0; h = 0;
		} else {
			s = Math.round(((luminace < 0.5) ? (max - min) / (max + min) : (max - min) / (2 - (max + min))) * 100);
			if (rgb[0] == max) h = (rgb[1] - rgb[2]) / (max - min);
			else if (rgb[1] == max) h = 2 + (rgb[2] - rgb[0]) / (max - min);
			else h = 4 + (rgb[0] - rgb[1]) / (max - min);
		}
		h = Math.round((h < 0) ? (h * 60) + 360 : (h * 60));
		return (str !== false) ? `hsl(${h}, ${s}%, ${l}%)` : [h, s, l];
	}
	/**Return the hexadecimal equivalent for the hsl value or array.
	 * @param hex - The hexadecimal value or array to convert to hsl.
	 * @param {boolean} str - An optional boolean value, true by default. If it is false, an array of hex values will be returned instead of hex string.
	 */
	hexToHsl(hex, str) {
		return Color.rgbToHsl(Color.hexToRgb(hex), str);
	}
	/**Return the hsl equivalent for the hexadecimal color value or array.
	 * @param hsl - The hsl value or array to convert to hexadecimal.
	 * @param {boolean} str - An optional boolean value, true by default. If it is false, an array of hsl values will be returned instead of an hsl string.
	 */
	hslToHex(hsl, str) {
		return Color.rgbToHex(Color.hslToRgb(hsl), str);
	}
}

(() => {
	// -------------------------------------- Event Listeners -------------------------------------
	// Add event listener to modal
	document.querySelector("#modal").addEventListener("click", () => {
		if (!game.disabledModal) {
			document.querySelector("#modal").classList.add("hidden");
			game.reset();
		}
	});
	// Add escape listener to modal
	document.querySelector("#modal").addEventListener("keyup", (e) => {
		if (e.key == "Escape") {
			document.querySelector("#modal").classList.add("hidden");
			game.reset();
		}
	});

	// Add event listener to settings cog
	document.querySelector("#settings-cog").addEventListener("click", () => {
		document.querySelector("#settings-drawer").setAttribute("open", true);
		game.end();
	});

	// Add event listener to close settings ×
	document.querySelector("#close-settings").addEventListener("click", () => {
		document.querySelector("#settings-drawer").setAttribute("open", false);
		document.querySelector("#settings-check").checked = false;
		game.reset();
		game.settings.store();
		setTimeout(flip, 500);
		setTimeout(unFlip, 2500);
	});

	// Add event listener to reset button
	document.querySelector("#info-reset").addEventListener("click", () => { game.reset(); });

	// add event listener to restart button
	document.querySelector("#info-restart").addEventListener("click", () => { game.start(); });

	/** The function triggered when one of the guess options is selected */
	function chooseGuess(event) {
		if (game != undefined) {
			if (event.target.value == game.settings.values.given) {
				document.forms.givens.given.value = game.settings.values.guess;
				game.settings.values.given = game.settings.values.guess;
				document.querySelector("#info-given").textContent = game.settings.values.guess;
			}
			game.settings.values.guess = event.target.value;
		}
		Utils.updateTitle(event.target.value);
		document.querySelector("#info-guess").textContent = event.target.value;
	}
	// Add event listeners to guess radio buttons
	for (let i of document.forms.guesses.elements) {
		i.addEventListener("click", chooseGuess);
	}

	/** The function triggered when one of the given options is selected */
	function chooseGiven(event) {
		if (game != undefined) {
			if (event.target.value == game.settings.values.guess) {
				document.forms.guesses.guess.value = game.settings.values.given;
				game.settings.values.guess = game.settings.values.given;
				document.querySelector("#info-guess").textContent = game.settings.values.given;
				Utils.updateTitle(game.settings.values.given);
			}
			game.settings.values.given = event.target.value;
		}
		document.querySelector("#info-given").textContent = event.target.value;
	}
	// Add event listeners to given radio buttons
	for (let i of document.forms.givens.elements) {
		i.addEventListener("click", chooseGiven);
	}

	/** The function that runs when one of the gamemode options is selected */
	function gameMode(event) {
		switch (event.target.value) {
			case "speed":
				timeEl.classList.remove("hidden");
				questionsEl.classList.add("hidden");
				break;
			case "timed":
				timeEl.classList.add("hidden");
				questionsEl.classList.remove("hidden");
				break;
			case "zen":
				timeEl.classList.add("hidden");
				questionsEl.classList.remove("hidden");
				break;
			case "endless":
				timeEl.classList.add("hidden");
				questionsEl.classList.add("hidden");
				break;
		}
		document.querySelector("#info-mode").textContent = event.target.value;
	}
	// Add event listeners to gamemode radio buttons
	for (let i of document.forms.modes.elements) {
		i.addEventListener("click", gameMode);
	}

	/** The function that runs when one of the theme options is selected */
	function setTheme(event) {
		if (game != undefined && game.settings.values.theme != event.target.value) {
			root.classList.add("trans-all");
			setTimeout(() => { root.classList.remove("trans-all"); }, 500);
		}
		root.setAttribute("theme", event.target.value);
		if (game != undefined)
			game.settings.values.theme = event.target.value;
	}
	// Add event listeners to theme radio buttons
	for (let i of document.forms.themes.elements) {
		i.addEventListener("click", setTheme);
	}

	// Add event listener to advanced settings button
	document.querySelector("#advanced-settings-button").addEventListener("click", () => {
		let as = document.querySelector("#advanced-settings-drawer");
		if (as.getAttribute("open") === "true") {
			as.setAttribute("open", false);
		} else {
			as.setAttribute("open", true);
		}
	});

	/** The function that runs when one of the Hexadecimal case options is selected */
	function setHexCase(event) {
		if (game != undefined)
			settings.values.hexCase = event.target.value;
	}
	// Add event listeners to hexCase radio buttons
	for (let i of document.forms.cases.elements) {
		i.addEventListener("click", setHexCase);
	}

	document.querySelector("#off").addEventListener("click", () => {
		clearInterval(autoPlayer);
	});

	document.querySelector("#on").addEventListener("click", () => {
		autoPlayer = setInterval((() => {
			function newColor(value) {
				if (value.substr(0, 4) === "rgb(") {
					return new Color(value.substring(4, value.length - 1).split(","));
				}
				if (value.substr(0, 4) === "hsl(") {
					return new Color(Color.hslToRgb(value, false));
				}
				if (value.substr(0, 1) === "#") {
					return new Color(Color.hexToRgb(value, false));
				}
			}
			let modalClasses = document.querySelector("#modal").classList;
			let answer, value;
			return () => {
				value = (guessBoxEl.textContent != "") ? guessBoxEl.textContent : guessBoxEl.style.background;
				if (value != "" && modalClasses.contains("hidden")) {
					value = newColor(value);
					for (let i of document.querySelectorAll("#options button")) {
						answer = newColor(i.textContent == "" ? i.style.background : i.textContent);
						if (answer.hex == value.hex) {
							i.click();
							break;
						}
					}
				}
			};
		})(), game.settings.values.ansDisplay * 1000);
	});

	// Add event listener to start button
	startEl.addEventListener("click", () => {
		game.start();
	});

	/** The function that runs when one of the answer buttons is pressed */
	function onAnswer(event) {
		if (event.target.getAttribute("position") == game.ansPos) {
			++game.right;
			guessBoxEl.classList.add("right");
		} else {
			++game.wrong;
			event.target.classList.add("wrong");
			guessBoxEl.classList.add("wrong");
		}
		document.querySelector(`[position="${game.ansPos}"]`).classList.add("right");
		game.updateScore();
		++game.counter[0];
		game.updateCounter();
		for (let i of options) {
			i.disabled = true;
			if (game.settings.values.guess != "color")
				i.style["background"] = i.textContent;
			else guessBoxEl.style["background"] = guessBoxEl.textContent;
		}
		setTimeout(() => {
			for (let i of options) {
				if (game.settings.values.guess != "color")
					i.removeAttribute("style");
				else guessBoxEl.removeAttribute("style");
				i.classList.remove("wrong");
				i.classList.remove("right");
				guessBoxEl.classList.remove("right");
				guessBoxEl.classList.remove("wrong");
				i.disabled = false;
			}
			if (game.counter[0] != game.counter[1])
				game.nextQuestion();
			else {
				game.finish();
			}
		}, game.settings.values.ansDisplay * 1000);
	}
	// Add event listeners to option buttons
	for (let i of options) {
		i.addEventListener("click", onAnswer);
	}

	// -------------------------------------- Initialize Game -------------------------------------
	settings = new Settings();
	var game = new Game(settings);

	// --------------------------------------- Welcome Modal --------------------------------------
	if (localStorageAccessible) {
		if (settings.values.newPlayer != "false") {
			console.log(settings.values.newPlayer);
			settings.values.newPlayer = "false";
			settings.store();
			document.querySelector("#modal").classList.remove("hidden");
		}
	} else {
		let temp = document.createElement("div");
		temp.innerHTML = "Unable to access localStorage to store settings.<br>If you want your settings to be remembered between sessions, go to<br>Settings > Additional Settings > Privacy and Security > Site Settings > Cookies<br>in your browser and add this site to the allowed list.";
		temp.classList.add("warning");
		document.querySelector("#modal-content").append(temp);
		Utils.modal();
	}
})();