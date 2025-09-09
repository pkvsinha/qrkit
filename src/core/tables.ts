export type ECC = "L" | "M" | "Q" | "H";
export interface VersionInfo {
  size: number;
  totalCW: number;
  ecPerBlock: number;
  groups: Array<[blocks: number, cwPerBlock: number]>;
}
export const MODE_INDICATOR = {
  numeric: 0b0001,
  alphanumeric: 0b0010,
  byte: 0b0100,
  kanji: 0b1000,
} as const;
export const ALNUM_TABLE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
export const CHAR_COUNT_BITS = (
  version: number,
  mode: keyof typeof MODE_INDICATOR,
): number => {
  const small = version <= 9,
    medium = version <= 26;
  switch (mode) {
    case "numeric":
      return small ? 10 : medium ? 12 : 14;
    case "alphanumeric":
      return small ? 9 : medium ? 11 : 13;
    case "byte":
      return small ? 8 : 16;
    case "kanji":
      return small ? 8 : medium ? 10 : 12;
  }
};

export const V: Record<number, Record<ECC, VersionInfo>> = {
  1: {
    L: { size: 21, totalCW: 26, ecPerBlock: 7, groups: [[1, 19]] },
    M: { size: 21, totalCW: 26, ecPerBlock: 10, groups: [[1, 16]] },
    Q: { size: 21, totalCW: 26, ecPerBlock: 13, groups: [[1, 13]] },
    H: { size: 21, totalCW: 26, ecPerBlock: 17, groups: [[1, 9]] },
  },
  2: {
    L: { size: 25, totalCW: 44, ecPerBlock: 10, groups: [[1, 34]] },
    M: { size: 25, totalCW: 44, ecPerBlock: 16, groups: [[1, 28]] },
    Q: { size: 25, totalCW: 44, ecPerBlock: 22, groups: [[1, 22]] },
    H: { size: 25, totalCW: 44, ecPerBlock: 28, groups: [[1, 16]] },
  },
  3: {
    L: { size: 29, totalCW: 70, ecPerBlock: 15, groups: [[1, 55]] },
    M: { size: 29, totalCW: 70, ecPerBlock: 26, groups: [[1, 44]] },
    Q: { size: 29, totalCW: 70, ecPerBlock: 18, groups: [[2, 17]] },
    H: { size: 29, totalCW: 70, ecPerBlock: 22, groups: [[2, 13]] },
  },
  4: {
    L: { size: 33, totalCW: 100, ecPerBlock: 20, groups: [[1, 80]] },
    M: { size: 33, totalCW: 100, ecPerBlock: 18, groups: [[2, 32]] },
    Q: { size: 33, totalCW: 100, ecPerBlock: 26, groups: [[2, 24]] },
    H: { size: 33, totalCW: 100, ecPerBlock: 16, groups: [[4, 9]] },
  },
  5: {
    L: { size: 37, totalCW: 134, ecPerBlock: 26, groups: [[1, 108]] },
    M: { size: 37, totalCW: 134, ecPerBlock: 24, groups: [[2, 43]] },
    Q: {
      size: 37,
      totalCW: 134,
      ecPerBlock: 18,
      groups: [
        [2, 15],
        [2, 16],
      ],
    },
    H: {
      size: 37,
      totalCW: 134,
      ecPerBlock: 22,
      groups: [
        [2, 11],
        [2, 12],
      ],
    },
  },
  6: {
    L: { size: 41, totalCW: 172, ecPerBlock: 18, groups: [[2, 68]] },
    M: { size: 41, totalCW: 172, ecPerBlock: 16, groups: [[4, 27]] },
    Q: { size: 41, totalCW: 172, ecPerBlock: 24, groups: [[4, 19]] },
    H: { size: 41, totalCW: 172, ecPerBlock: 28, groups: [[4, 15]] },
  },
  7: {
    L: { size: 45, totalCW: 196, ecPerBlock: 20, groups: [[2, 78]] },
    M: { size: 45, totalCW: 196, ecPerBlock: 18, groups: [[4, 31]] },
    Q: {
      size: 45,
      totalCW: 196,
      ecPerBlock: 18,
      groups: [
        [2, 14],
        [4, 15],
      ],
    },
    H: { size: 45, totalCW: 196, ecPerBlock: 26, groups: [[4, 13]] },
  },
  8: {
    L: { size: 49, totalCW: 242, ecPerBlock: 24, groups: [[2, 97]] },
    M: {
      size: 49,
      totalCW: 242,
      ecPerBlock: 22,
      groups: [
        [2, 38],
        [2, 39],
      ],
    },
    Q: {
      size: 49,
      totalCW: 242,
      ecPerBlock: 22,
      groups: [
        [4, 18],
        [2, 19],
      ],
    },
    H: {
      size: 49,
      totalCW: 242,
      ecPerBlock: 26,
      groups: [
        [4, 14],
        [2, 15],
      ],
    },
  },
  9: {
    L: { size: 53, totalCW: 292, ecPerBlock: 30, groups: [[2, 116]] },
    M: {
      size: 53,
      totalCW: 292,
      ecPerBlock: 22,
      groups: [
        [3, 36],
        [2, 37],
      ],
    },
    Q: {
      size: 53,
      totalCW: 292,
      ecPerBlock: 20,
      groups: [
        [4, 16],
        [4, 17],
      ],
    },
    H: {
      size: 53,
      totalCW: 292,
      ecPerBlock: 24,
      groups: [
        [4, 12],
        [4, 13],
      ],
    },
  },
  10: {
    L: {
      size: 57,
      totalCW: 346,
      ecPerBlock: 18,
      groups: [
        [2, 68],
        [2, 69],
      ],
    },
    M: {
      size: 57,
      totalCW: 346,
      ecPerBlock: 26,
      groups: [
        [4, 43],
        [1, 44],
      ],
    },
    Q: {
      size: 57,
      totalCW: 346,
      ecPerBlock: 24,
      groups: [
        [6, 19],
        [2, 20],
      ],
    },
    H: {
      size: 57,
      totalCW: 346,
      ecPerBlock: 28,
      groups: [
        [6, 15],
        [2, 16],
      ],
    },
  },
};
