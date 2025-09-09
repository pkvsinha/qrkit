import type { Grid } from "../core/types";
export function renderSVG(
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
  let path = "";
  const data = grid.data;
  let i = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++, i++)
      if (data[i]) path += `M${(x + q) * s},${(y + q) * s}h${s}v${s}h${-s}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<rect width="100%" height="100%" fill="${bg}"/>
<path d="${path}" fill="${fg}"/>
</svg>`;
}
