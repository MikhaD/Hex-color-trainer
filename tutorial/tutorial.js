// create tooltip html element with title attribute.
// Ensure that the tooltip cannot go off the edge of the page
// Allow tooltip to increase width again after being squished

class Tooltip {
	static get clientWidth() { return window.innerWidth; }
	static get clientHeight() { return window.innerHeight; }
	static get defaults() {
		return {
			arrowSize: 8,
			minWidth: 100,
			maxWidth: 300,
			borderRadius: 5,
			padding: 5,
			fontSize: 16,
			foregroundColor: "white",
			backgroundColor: "black",
			fade: false,
			fadeColor: "transparent",
			fadeClickDismiss: true
		}
	}

	constructor(element, tooltip, options) {
		this.tooltipNumber = Tooltip.tooltipCount++;
		if (options === undefined)
			options = Tooltip.defaults;
		else {
			for (let i of Object.keys(Tooltip.defaults)) {
				if (options[i] === undefined)
				options[i] = Tooltip.defaults[i];
			}
		}
		this.options = options;
		this.element = element;
		this.currentElementWidth = element.getBoundingClientRect().width;
		this.currentElementHeight = element.getBoundingClientRect().height;
		this.idealDimensions = this.getDimensions(tooltip);

		this.active = false;

		if (options.fade) {
			element.style.zIndex = 100;
			this.fade = (() => {
				let fade = document.createElement("div");
				fade.style["position"] = "absolute";
				fade.style["top"] = "0";
				fade.style["left"] = "0";
				fade.style["width"] = "100vw";
				fade.style["height"] = "100vh";
				fade.style["background-color"] = options.fadeColor;
				if (options.fadeClickDismiss) {
					fade.addEventListener("click", () => {
						this.delete();
					});
				}
				document.querySelector("html").appendChild(fade);
				return fade;
			})();
		}

		this.body = (() => {
			let body  = document.createElement("div");
			body.className = "tooltip-body";
			body.innerHTML = tooltip;
			body.style["position"] = "absolute";
			body.style["color"] = options.foregroundColor;
			body.style["background-color"] = options.backgroundColor;
			body.style["border-radius"] = options.borderRadius + "px";
			body.style["padding"] = options.padding + "px";
			body.style["font-size"] = options.fontSize + "px";
			body.style["box-sizing"] = "border-box";
			body.style.width = this.idealDimensions.width + "px";

			return body;
		})();

		this.arrow = (() => {
			let arrow = document.createElement("div");
			arrow.className = "tooltip-arrow";
			arrow.style["position"] = "absolute";
			arrow.style["border-style"] = "solid";
			arrow.style["border-width"] = this.options.arrowSize + "px";
			return arrow;
		})();

		this.tooltip = (() => {
			let tooltip = document.createElement("div");
			tooltip.className = "tooltip";
			tooltip.id = `${element.id}-tooltip-${Tooltip.tooltipCount}`;
			tooltip.appendChild(this.body);
			tooltip.appendChild(this.arrow);
			return tooltip;
		})();

		this.positionChanged = false;
		if (element.style["position"] === "") {
			element.style["position"] = "relative";
			this.positionChanged = true;
		}

		element.appendChild(this.tooltip);
		this.rePosition();
		this.tooltip.classList.add("visible");
		Tooltip.tooltips.push(this);
		this.active = true;
	}
	getDimensions(ttText) {
		let textTest = document.createElement("span");
		textTest.style.visibility = "hidden";
		textTest.style.position = "absolute";
		textTest.style.top = "0";
		textTest.style["font-size"] = this.options.fontSize + "px";

		textTest.innerHTML = ttText;
		document.querySelector("html").appendChild(textTest);
		let width = textTest.getBoundingClientRect().width;
		if (width > this.options.minWidth) {
			if (width > this.options.maxWidth)
				width = this.options.maxWidth;
		}
		else width = this.options.minWidth;

		textTest.style.width = this.options.maxWidth + "px";
		let height = textTest.getBoundingClientRect().height;
		textTest.remove();
		return {
			"width": width,
			"height": height
		}
	}
	rePosition() {
		let data = this.element.getBoundingClientRect();
		let ttData = this.body.getBoundingClientRect();
		let sides = [
			data.top - this.idealDimensions.height,
			Tooltip.clientWidth - (data.right + this.idealDimensions.width),
			Tooltip.clientHeight - (data.bottom + this.idealDimensions.height),
			data.left - this.idealDimensions.width
		];
		let max = (() => {
			let max = {"value": 0, "index": 0};
			for (let i in sides) {
				if (sides[i] > max.value) {
					max.value = sides[i];
					max.index = i;
				}
			}
			return max;
		})();
		if (!this.active || data.width !== this.currentElementWidth || data.height !== this.currentElementHeight || max.index !== this.previousMax) {
			this.currentElementWidth = data.width;
			this.currentElementHeight = data.height;
			if (this.previousMax === undefined || this.previousMax !== max.index) {
				for (let i = 0; i < 4; ++i)
					sides[i] = " " + ((i == max.index) ? this.options.backgroundColor : "transparent");
				this.arrow.style["border-color"] = sides.join("");
			}
			switch (max.index) {
				case "0":
					this.body.style.top = -1*(ttData.height + 2*this.options.arrowSize) + "px";
					this.body.style.left = data.width/2 - ttData.width/2 + "px";
					this.arrow.style.top = -2*this.options.arrowSize + "px";
					this.arrow.style.left = data.width/2 - this.options.arrowSize + "px";
					break;
				case "1":
					this.body.style.top = data.height/2 - ttData.height/2 + "px";
					this.body.style.left = data.width + this.options.arrowSize*2 + "px";
					this.arrow.style.top = data.height/2 - this.options.arrowSize + "px";
					this.arrow.style.left = data.width + "px";
					break;
				case "2":
					this.body.style.top = data.height + 2*this.options.arrowSize + "px";
					this.body.style.left = data.width/2 - ttData.width/2 + "px";
					this.arrow.style.top = data.height + "px";
					this.arrow.style.left = data.width/2 - this.options.arrowSize + "px";
					break;
				case "3":
					this.body.style.top = data.height/2 - ttData.height/2 + "px";
					this.body.style.left = -1*(ttData.width + this.options.arrowSize*2) + "px";
					this.arrow.style.top = data.height/2 - this.options.arrowSize + "px";
					this.arrow.style.left = -2*this.options.arrowSize + "px";
			}
			this.previousMax = max.index;
		}
		// Ensure that the edge of the tooltip does not go off the left edge of the screen
		ttData = this.body.getBoundingClientRect();
		if (ttData.left < this.options.arrowSize) {
			this.body.style.left = Number(this.body.style.left.slice(0, -2)) + (this.options.arrowSize - ttData.left) + "px";
			if (ttData.right ) {
				this.body.style.width = Number(this.body.style.width.slice(0, -2)) - (this.options.arrowSize - ttData.left) + "px";
			}
		}


	}
	delete() {
		if (this.options.fade) {
			this.element.style["z-index"] = "";
			this.fade.remove();
		}
		Tooltip.tooltips.splice(this.tooltipNumber, 1);
		--Tooltip.tooltipCount;
		this.tooltip.remove();
		if (this.positionChanged)
			this.element.style.position = "";
	}
}
Tooltip.tooltipCount = 0;
Tooltip.tooltips = [];
window.addEventListener("resize", () => {
	for (let t of Tooltip.tooltips)
		t.rePosition();
});

tooltip = new Tooltip(document.querySelector("#start"), "This is a longer string of test text in order to test max width and various other newly added features", {maxWidth: 400, fade: true, fadeColor: "#000000c0", backgroundColor: "#008cff", borderRadius: 0})