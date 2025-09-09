import { JsStrategy, chooseStrategy, makeWasmWorker } from '../src/index.js';

const SAMPLES = [
  'hello',
  'https://heypkv.in/',
  'UPI: upi://pay?pa=prashant@oksbi&pn=HEYPKV&am=990&cu=INR&tn=Invoice%20INV-1042',
  'A'.repeat(300)
];

const now = () => (typeof globalThis.performance !== 'undefined' && typeof globalThis.performance.now === 'function' ? globalThis.performance.now() : Date.now());

async function run() {
  const js = new JsStrategy();
  const wasm = chooseStrategy('wasm', makeWasmWorker);

  for (const s of SAMPLES) {
    const t0 = now(); await js.encode(s, { ecc: 'H', version: 'auto' }); const t1 = now();
    const t2 = now(); await (wasm as any).encode(s, { ecc: 'H', version: 'auto' }); const t3 = now();
    console.log(`${String(s.length).padStart(4)} chars  | JS: ${(t1 - t0).toFixed(2)} ms | WASM: ${(t3 - t2).toFixed(2)} ms`);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
