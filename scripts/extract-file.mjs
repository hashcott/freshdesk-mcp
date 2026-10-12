#!/usr/bin/env node
/**
 * Runs the attachment extractor on a local file and shows exactly what the
 * model would receive. Run `npm run build` first.
 *
 *   node scripts/extract-file.mjs <file> [--expect "text"]... [--images N] [--out dir]
 *
 * --expect "text"  fail unless the extracted text contains this (repeatable)
 * --images N       fail unless exactly N images are returned
 * --out dir        save returned images there (default: ./extract-out)
 *
 * Exit code 0 when every check passes, 1 otherwise.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { Budget, extractAny } from "../dist/extract.js";

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!file) {
  console.error('Usage: node scripts/extract-file.mjs <file> [--expect "text"]... [--images N] [--out dir]');
  process.exit(2);
}
const expects = [];
let expectImages;
let outDir = "extract-out";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--expect") expects.push(args[++i]);
  else if (args[i] === "--images") expectImages = Number(args[++i]);
  else if (args[i] === "--out") outDir = args[++i];
}

const budget = new Budget({ maxTextChars: 60_000, maxPages: 5, maxImages: 10, harRaw: false });
const started = Date.now();
const result = await extractAny(readFileSync(file), basename(file), "", budget);
const ms = Date.now() - started;

const text = result.content
  .filter((c) => c.type === "text")
  .map((c) => c.text)
  .join("\n");
const images = result.content.filter((c) => c.type === "image");

console.log(`File:      ${file}`);
console.log(`Kind:      ${result.kind}${result.handling ? ` (${result.handling})` : ""}`);
console.log(`Time:      ${ms} ms`);
console.log(`Images:    ${images.length}`);
console.log(`Truncated: ${budget.truncated}`);
console.log(`Notes:     ${result.notes.length ? result.notes.join("; ") : "(none)"}`);
console.log(`\n----- text -----\n${text}\n----------------`);

if (images.length) {
  mkdirSync(outDir, { recursive: true });
  images.forEach((img, i) => {
    const ext = img.mimeType.split("/")[1].replace("jpeg", "jpg");
    const path = join(outDir, `${basename(file)}.${i + 1}.${ext}`);
    writeFileSync(path, Buffer.from(img.data, "base64"));
    console.log(`Saved image ${i + 1}: ${path}`);
  });
}

let failed = 0;
for (const e of expects) {
  const ok = text.includes(e);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  text contains ${JSON.stringify(e)}`);
}
if (expectImages !== undefined) {
  const ok = images.length === expectImages;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${images.length} image(s) returned, expected ${expectImages}`);
}
const unsupported = result.content.filter(
  (c) => c.type !== "text" && !(c.type === "image" && /^image\/(png|jpeg|gif|webp)$/.test(c.mimeType)),
);
if (unsupported.length) {
  failed++;
  console.log(`FAIL  ${unsupported.length} content block(s) of a type MCP clients reject`);
}
process.exit(failed ? 1 : 0);
