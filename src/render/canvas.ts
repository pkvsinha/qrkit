import type { Grid } from "../core/types";
export function renderCanvas(
  target: HTMLCanvasElement,
  grid: Grid,
  scale = 8,
  margin = 4,
  fg = "#000",
  bg = "#fff",
) {
  const n = grid.size,
    s = scale,
    q = margin,
    size = (n + 2 * q) * s;
  const ctx = target.getContext("2d")!;
  target.width = size;
  target.height = size;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  const data = grid.data;
  let i = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++, i++) {
      if (data[i]) ctx.fillRect((x + q) * s, (y + q) * s, s, s);
    }
}
