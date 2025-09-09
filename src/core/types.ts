export type ECC = "L" | "M" | "Q" | "H";
export type Mode = "numeric" | "alphanumeric" | "byte" | "kanji";
export interface EncodeOptions {
  version?: number | "auto";
  ecc?: ECC;
  mask?: number | "auto";
  mode?: Mode | "auto";
  eci?: number;
}
export interface Grid {
  size: number;
  data: Uint8Array;
}
export interface EncodeResult {
  grid: Grid;
  version: number;
  mask: number;
  ecc: ECC;
}
