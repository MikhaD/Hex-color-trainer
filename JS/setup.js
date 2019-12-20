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
settings = document.querySelector("#settings");
document.querySelector("#logo").addEventListener("click", () => {
	settings.setAttribute("open", !document.querySelector("#logo-check").checked);
});
// ----------------------------------------- Radio buttons ----------------------------------------
// Make these into local storage values
var guess = "hex", given = "color";

function chooseGuess(event) {
	// console.log(document.forms.guesses.guess.value);
	document.querySelector(`#given-${guess}`).disabled = false;
	guess = event.target.value;
	document.querySelector(`#given-${guess}`).disabled = true;
	document.querySelector("#title").innerText = `GUESS THE ${guess.toUpperCase()}`;
}

function chooseGiven(event) {
	// console.log(document.forms.givens.given.value);
	document.querySelector(`#guess-${given}`).disabled = false;
	given = event.target.value;
	document.querySelector(`#guess-${given}`).disabled = true;
}

for (let i = 0; i < document.forms.guesses.elements.length; ++i) {
	document.forms.guesses.elements[i].addEventListener("click", chooseGuess);
	document.forms.givens.elements[i].addEventListener("click", chooseGiven);
}
// --------------------------------------------- Mode ---------------------------------------------
// Use a closure?
var time = document.querySelector("#time"), questions = document.querySelector("#questions");
function gameMode(event) {
	switch (event.target.value) {
		case "speed":
		case "timed":
			time.classList.remove("hidden");
			questions.classList.remove("hidden");
			break;
		case "endless":
			time.classList.add("hidden");
			questions.classList.add("hidden");
			break;
		case "zen":
			time.classList.add("hidden");
			questions.classList.remove("hidden");
			break;
	}
}
for (let i of document.forms.modes.elements) {
	i.addEventListener("click", gameMode);
}