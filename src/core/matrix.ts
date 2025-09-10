export function buildMatrix(size: number) {
  return Array.from(
    { length: size },
    () => Array(size).fill(null) as (0 | 1 | null)[]
  );
}

export function placeFunctionPatterns(mx: (0 | 1 | null)[][], version: number) {
  const n = mx.length;
  const finder = (x: number, y: number) => {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const on =
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        mx[y + r][x + c] = on ? 1 : 0;
      }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);

  // Separators around finders
  for (let i = 0; i < 8; i++) {
    if (mx[7][i] === null) mx[7][i] = 0;
    if (mx[i][7] === null) mx[i][7] = 0;
    if (mx[7][n - 1 - i] === null) mx[7][n - 1 - i] = 0;
    if (mx[i][n - 8] === null) mx[i][n - 8] = 0;
    if (mx[n - 8][i] === null) mx[n - 8][i] = 0;
    if (mx[n - 1 - i][7] === null) mx[n - 1 - i][7] = 0;
  }

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    mx[6][i] = i % 2 ? 0 : 1;
    mx[i][6] = i % 2 ? 0 : 1;
  }

  // Alignment patterns
  const centers = alignmentPatternCenters(version, n);
  for (let i = 0; i < centers.length; i++)
    for (let j = 0; j < centers.length; j++) {
      const cx = centers[i],
        cy = centers[j];
      if (
        (cx <= 7 && cy <= 7) ||
        (cx >= n - 8 && cy <= 7) ||
        (cx <= 7 && cy >= n - 8)
      )
        continue;
      placeAlignment(mx, cx, cy);
    }

  // Reserve format-info areas (leave as 0; will be overwritten by writeFormatInfo)
  reserveFormat(mx);

  // Fixed dark module (required by spec)
  placeDarkModule(mx, version);

  if (version >= 7) reserveVersion(mx);
}

function alignmentPatternCenters(version: number, n: number): number[] {
  if (version === 1) return [];
  const tables: Record<number, number[]> = {
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50],
  };
  return tables[version] || [];
}

function placeAlignment(mx: (0 | 1 | null)[][], cx: number, cy: number) {
  for (let r = -2; r <= 2; r++)
    for (let c = -2; c <= 2; c++) {
      const on = Math.max(Math.abs(r), Math.abs(c)) !== 1 ? 1 : 0;
      mx[cy + r][cx + c] = on as 0 | 1;
    }
}

function reserveFormat(mx: (0 | 1 | null)[][]) {
  const n = mx.length;

  const A: Array<[number, number]> = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];

  const B: Array<[number, number]> = [
    [n - 1, 8],
    [n - 2, 8],
    [n - 3, 8],
    [n - 4, 8],
    [n - 5, 8],
    [n - 6, 8],
    [n - 7, 8],
    [8, n - 8],
    [8, n - 7],
    [8, n - 6],
    [8, n - 5],
    [8, n - 4],
    [8, n - 3],
    [8, n - 2],
    [8, n - 1],
  ];

  for (const [r, c] of [...A, ...B]) if (mx[r][c] === null) mx[r][c] = 0;
}

function reserveVersion(mx: (0 | 1 | null)[][]) {
  /* version info (v>=7) */
}

function placeDarkModule(mx: (0 | 1 | null)[][], version: number) {
  // ISO/IEC 18004 uses (row, col). Dark module at (4*V + 9, 8)
  const n = mx.length;
  const row = 4 * version + 9,
    col = 8;
  if (row < n) mx[row][col] = 1;
}

export function placeData(mx: (0 | 1 | null)[][], dataBits: number[]) {
  const n = mx.length;
  const maskable: boolean[] = [];
  let bitIndex = 0;
  let dir = -1; // -1 = up, +1 = down
  let col = n - 1;

  const set = (r: number, c: number, val: 0 | 1) => {
    mx[r][c] = val;
    maskable[r * n + c] = true;
  };

  while (col > 0) {
    if (col === 6) col--; // skip timing col

    for (let i = 0; i < n; i++) {
      const row = dir === -1 ? n - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (mx[row][cc] === null) {
          const bit = (dataBits[bitIndex++] || 0) as 0 | 1;
          set(row, cc, bit);
        }
      }
    }

    col -= 2;
    dir = -dir; // flip direction each 2-column block
  }

  const flat = new Uint8Array(n * n);
  let t = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++, t++) flat[t] = (mx[y][x] ?? 0) as 0 | 1;

  return { grid: flat, maskable };
}
