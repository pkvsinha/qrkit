# @pkvsinha/symbol-codec

A modern **symbol encoding toolkit** for the web.  
Currently supports **QR Code** (v1–v40 planned; v1–v10 implemented), with extensible design for adding other optical codes (Barcodes, EAN, DataMatrix, …).

- ✅ Written in TypeScript
- ✅ Zero runtime dependencies
- ✅ ESM, CJS, and UMD/IIFE builds
- ✅ Works in Node.js and browsers (via CDN or bundlers)
- ✅ Modular & tree-shakable
- ✅ Correct Reed–Solomon, masking, format/version info, placement order
- ✅ Supports ECC levels L/M/Q/H, version auto-selection, mask scoring
- ✅ Helpers for common use-cases (e.g. UPI payments, text, URLs)
- 🚧 Roadmap: add barcodes (EAN-13, Code128, UPC-A), DataMatrix, PDF417

---

## Installation

```bash
npm install @pkvsinha/symbol-codec
```

## Usage

### Node.js (CJS)

```js
const { encodeJS, renderCanvas } = require("@pkvsinha/symbol-codec");

const { grid } = encodeJS("HELLO WORLD", { ecc: "M", version: "auto" });
// renderCanvas is browser-only; in Node you can write PNG/SVG manually
```

### ES Modules

```ts
import { encodeJS } from "@pkvsinha/symbol-codec";
import { renderSVG } from "@pkvsinha/symbol-codec/render";

const { grid } = encodeJS("https://heypkv.com", { ecc: "Q" });
const svg = renderSVG(grid, 8, 4); // scale=8, margin=4
document.body.innerHTML = svg;
```

### Browser via CDN (UMD/IIFE)

```html
<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@pkvsinha/symbol-codec/dist/umd/symbol-codec.min.js"></script>

<!-- or unpkg -->
<!-- <script src="https://unpkg.com/@pkvsinha/symbol-codec/dist/umd/symbol-codec.min.js"></script> -->

<canvas id="qr" width="256" height="256"></canvas>
<script>
  const { encodeJS, renderCanvas } = window.SymbolCodec;
  const { grid } = encodeJS(
    "upi://pay?pa=prashant@oksbi&pn=HEYPKV&am=990&cu=INR&tn=Invoice%20INV-1042",
    {
      ecc: "M",
      version: "auto",
    }
  );
  renderCanvas(document.getElementById("qr"), grid, 8, 4);
</script>
```

## API

encodeJS(input: string, options?: EncodeOptions): EncodeResult

Encodes a string into a QR Code matrix.

### Options

ecc: Error correction level 'L'|'M'|'Q'|'H' (default 'M')

version: Version number 1..40 or 'auto' (default 'auto')

mask: Force mask 0..7 or 'auto' (default 'auto')

### Result

```ts
{
  grid: { size: number; data: Uint8Array }, // size x size, row-major
  version: number,
  mask: number,
  ecc: 'L'|'M'|'Q'|'H'
}
```

### Renderers

- `renderCanvas(canvas: HTMLCanvasElement, grid, scale, margin)`
- `renderSVG(grid, scale, margin): string`

Both accept a grid (from encodeJS), a module scale, and margin modules.

### Helpers

`helpers.makeUPIPayload(address, name, amount, currency, note)`

More to be added for common patterns (URLs, WiFi, contact vCards).

## Builds

- ESM: `dist/esm` → modern bundlers
- CJS: `dist/cjs` → Node.js require
- Types: `dist/types` → .d.ts
- UMD/IIFE: `dist/umd/symbol-codec.min.js` → global window.SymbolCodec

#### CDN fields in package.json:

- unpkg: `dist/umd/symbol-codec.min.js`
- jsdelivr: `dist/umd/symbol-codec.min.js`

## Example: Generate a UPI QR Code

```ts
import { encodeJS } from "@pkvsinha/symbol-codec";
import { renderSVG } from "@pkvsinha/symbol-codec/render";

const payload =
  "upi://pay?pa=prashant@oksbi&pn=HEYPKV&am=990&cu=INR&tn=Invoice%20INV-1042";
const { grid } = encodeJS(payload, { ecc: "M", version: "auto" });
const svg = renderSVG(grid, 8, 4);
console.log(svg);
```

## Development

```bash
git clone <repo>
cd symbol-codec
npm install
npm run build      # builds esm/cjs/types/umd
npm run dev        # runs vite dev server with examples
npm run size-check # prints bundle sizes
```

## Roadmap

- ✅ QR Code v1–v10 basic support (text, URLs, UPI)
- ✅ Correct RS error correction and mask selection
- ✅ ESM/CJS/UMD builds
- 🚧 Expand QR to full v1–v40
- 🚧 Add barcodes: EAN-13, UPC-A, Code128
- 🚧 Add DataMatrix, PDF417
- 🚧 Add optimal DP segmentation for mode mixes

## License

MIT © Prashant Sinha
