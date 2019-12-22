// ---------------------------------------- Adjusting Title ---------------------------------------
(() => {
	var root = document.documentElement;
	var headerHeight;
	var minWidth = 500, maxWidth = 900;
	
	function resizeHeader() {
		if (window.innerWidth <= minWidth)
		headerHeight = minWidth;
		else if (window.innerWidth >= maxWidth)
		headerHeight = maxWidth
		else
		headerHeight = window.innerWidth;
		root.style.setProperty("--header-height", Math.floor(headerHeight/10) + "px");
	}
	
	window.addEventListener("resize", resizeHeader);
	
	resizeHeader();
})();
// ----------------------------------------- Settings menu ----------------------------------------
document.querySelector("#logo").addEventListener("click", () => {
	document.querySelector("#settings").setAttribute("open", !document.querySelector("#logo-check").checked);
	document.querySelector("#start").disabled = !document.querySelector("#logo-check").checked;
});
// ----------------------------------------- Radio buttons ----------------------------------------
// Make these into local storage values
var guess = "hex", given = "color";

function chooseGuess(event) {
	// console.log(document.forms.guesses.guess.value);
	if (event.target.value == given) {
		document.forms.givens.given.value = guess;
		given = guess;
	}
	guess = event.target.value;
	document.querySelector("#title").innerText = `GUESS THE ${guess.toUpperCase()}`;
	document.querySelector("title").innerText = `GUESS THE ${guess.toUpperCase()}`;
}

function chooseGiven(event) {
	// console.log(document.forms.givens.given.value);
	if (event.target.value == guess) {
		document.forms.guesses.guess.value = given;
		guess = given;
	}
	given = event.target.value;
}

for (let i = 0; i < document.forms.guesses.elements.length; ++i) {
	document.forms.guesses.elements[i].addEventListener("click", chooseGuess);
	document.forms.givens.elements[i].addEventListener("click", chooseGiven);
}
// --------------------------------------------- Mode ---------------------------------------------
// Use a closure?
var timeEl = document.querySelector("#time"), questionsEl = document.querySelector("#questions");
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
}
for (let i of document.forms.modes.elements) {
	i.addEventListener("click", gameMode);
}