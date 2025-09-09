import type { EncoderStrategy } from "../ab/strategy";
export async function encodeMany(
  strat: EncoderStrategy,
  inputs: string[],
  opts: any,
  limit: { take: (n?: number) => boolean },
) {
  const out = new Array(inputs.length);
  await Promise.all(
    inputs.map(async (s, i) => {
      if (!limit.take(1)) throw new Error("Quota exceeded");
      out[i] = await strat.encode(s, opts);
    }),
  );
  return out;
}
