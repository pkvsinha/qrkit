import { encodeJS, renderCanvas } from "../dist/index.js";
const t = document.getElementById("text");
const c = document.getElementById("canvas");
function draw() {
  const { grid } = encodeJS(t.value, { ecc: "M", version: "auto" });
  renderCanvas(c, grid, 8, 4);
}
t.addEventListener("input", draw);
draw();
