// This is a placeholder Worker that echoes back to keep API stable.
// Replace with real wasm-pack module and encode call.
self.onmessage = async (e: MessageEvent) => {
  const { id, cmd, input, opts } = (e as any).data;
  if (cmd === "encode") {
    // Fallback to JS encoder inside worker (for demo)
    const mod = await import("../core/encoder.js");
    const result = mod.encode(input, opts);
    (self as any).postMessage({ id, result });
  }
};
