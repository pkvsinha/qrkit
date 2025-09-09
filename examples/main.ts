import { encodeJS, renderCanvas } from '../src/index.js';
const t = document.getElementById('text') as HTMLTextAreaElement;
const c = document.getElementById('canvas') as HTMLCanvasElement;
function draw(){ const { grid } = encodeJS(t.value, { ecc:'M', version:'auto' }); renderCanvas(c, grid, 8, 4); }
t.addEventListener('input', draw); draw();
