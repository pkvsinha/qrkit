export function makeWasmWorker() {
  return new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
  }) as unknown as Worker;
}
