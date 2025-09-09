# @pkvsinha/qrkit (lite demo build)

TypeScript QR generator with JS core, WASM-ready API, Canvas/SVG renderers, batch API, and helpers (UPI). This archive contains a runnable minimal implementation for v1–v10.

## Dev
```bash
npm i
npm run build
npx vite examples
```

## Quick use
```ts
import { encodeJS, renderCanvas, helpers } from '@pkvsinha/qrkit';
const upi = helpers.upi.buildIntent({ vpa:'prashant@oksbi', amount:990, name:'HEYPKV', note:'Invoice INV-1042' });
const { grid } = encodeJS(upi, { ecc:'M', version:'auto' });
renderCanvas(document.querySelector('canvas')!, grid, 8, 4);
```
