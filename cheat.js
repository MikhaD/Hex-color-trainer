let a = setInterval((() => {
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
	})(), 100);