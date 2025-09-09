import type { EncodeOptions, EncodeResult } from "../core/types";
import { encode as encodeJS } from "../core/encoder";

export interface UpiIntentArgs {
  vpa: string;
  name?: string;
  amount?: number | string;
  note?: string;
  txnRef?: string;
  url?: string;
  merchantCode?: string;
}

export function buildIntent(a: UpiIntentArgs) {
  if (!/^[-_.a-z0-9]+@[a-z]{2,}[a-z0-9]*$/i.test(a.vpa))
    throw new Error("Invalid VPA");
  const p = new URLSearchParams();
  p.set("pa", a.vpa);
  if (a.name) p.set("pn", a.name);
  if (a.amount != null) {
    p.set("am", String(a.amount));
    p.set("cu", "INR");
  }
  if (a.note) p.set("tn", a.note);
  if (a.txnRef) p.set("tr", a.txnRef);
  if (a.url) p.set("url", a.url);
  if (a.merchantCode) p.set("mc", a.merchantCode);
  return `upi://pay?${p.toString()}`;
}

export function encode(
  intent: string | UpiIntentArgs,
  opts: EncodeOptions = {},
): EncodeResult {
  const payload = typeof intent === "string" ? intent : buildIntent(intent);
  return encodeJS(payload, {
    ecc: "M",
    version: "auto",
    mask: "auto",
    ...opts,
  });
}
