import type { EncodeOptions, EncodeResult } from "../core/types";
export interface EncoderStrategy {
  encode(
    input: string,
    opts?: EncodeOptions,
  ): Promise<EncodeResult> | EncodeResult;
}
export class JsStrategy implements EncoderStrategy {
  async encode(s: string, o?: EncodeOptions) {
    const { encode } = await import("../core/encoder");
    return encode(s, o);
  }
}
// Placeholder WASM strategy (API shape only)
export class WasmStrategy implements EncoderStrategy {
  constructor(private worker: Worker) {}
  encode(s: string, o?: EncodeOptions): Promise<EncodeResult> {
    return new Promise<EncodeResult>((res, rej) => {
      const id = Math.random().toString(36).slice(2);
      const onmsg = (e: MessageEvent) => {
        const d: any = e.data;
        if (d && d.id === id) {
          (this.worker as any).removeEventListener("message", onmsg);
          if (d.error) rej(d.error);
          else res(d.result as EncodeResult);
        }
      };
      (this.worker as any).addEventListener("message", onmsg);
      (this.worker as any).postMessage({
        id,
        cmd: "encode",
        input: s,
        opts: o,
      });
    });
  }
}
export function chooseStrategy(
  kind: "js" | "wasm" | "auto",
  workerFactory?: () => Worker,
) {
  if (kind !== "js" && typeof WebAssembly !== "undefined" && workerFactory)
    return new WasmStrategy(workerFactory());
  return new JsStrategy();
}
