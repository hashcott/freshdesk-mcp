// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeDocx, makeGif, makePdf, makePng, makePptx, makeXlsx, makeZip } from "./fixtures.mjs";

process.env.FRESHDESK_API_KEY = "k";
process.env.FRESHDESK_DOMAIN = "x.freshdesk.com";
const {
  Budget,
  extractAny,
  classifyByName,
  willAnalyse,
  joinPdfTextItems,
  prettyXml,
  enforceResponseSize,
  mergeTextBlocks,
} = await import("../dist/extract.js");

const budget = (o = {}) =>
  new Budget({ maxTextChars: 60_000, maxPages: 5, maxImages: 10, harRaw: false, ...o });
const extract = (bytes, name, contentType = "", b = budget()) =>
  extractAny(bytes, name, contentType, b);
const textOf = (r) =>
  r.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");

/* ---------- PDF ---------- */

test("PDF: text page by page, scanned pages reported", async () => {
  const r = await extract(
    makePdf([["Launchpad error on tile ODATA-500", "Second line"], []]),
    "report.pdf",
  );
  assert.equal(r.kind, "pdf");
  const t = textOf(r);
  assert.match(t, /--- Page 1 ---\nLaunchpad error on tile ODATA-500\nSecond line/);
  assert.match(t, /--- Page 2 --- \(no text layer, probably scanned/);
  assert.match(r.handling, /1 of 2 page\(s\) with text, 1 scanned/);
});

test("PDF: accented text is kept", async () => {
  const r = await extract(makePdf([["Isto é um teste com ação e coração"]]), "pt.pdf");
  assert.match(textOf(r), /Isto é um teste com ação e coração/);
});

test("PDF: words split into several runs are joined by position", () => {
  // The runs Word produced for "Isto é um teste ... Quero ver ... este PDF": no space
  // between runs of one word, a real gap or a space item between words.
  const item = (str, x, width) => ({ str, width, transform: [12, 0, 0, 12, x, 700] });
  const items = [
    item("I", 72, 3.3),
    item("s", 75.3, 4.7),
    item("to é um teste para o Claude. Q", 80, 164.1),
    item("uero ver se consegue ler", 244.1, 116),
    item(" ", 360.1, 3.3),
    item("este PDF e a sua imagem", 363.4, 121),
  ];
  assert.equal(
    joinPdfTextItems(items),
    "Isto é um teste para o Claude. Quero ver se consegue ler este PDF e a sua imagem",
  );
  // A URL split by the generator stays whole; a real gap adds one space.
  assert.equal(
    joinPdfTextItems([item("https://", 72, 40), item("docs.example.com", 112, 80)]),
    "https://docs.example.com",
  );
  assert.equal(joinPdfTextItems([item("Hello", 72, 30), item("world", 110, 30)]), "Hello world");
});

test("PDF: reading a PDF writes nothing to stdout (it carries the stdio protocol)", async () => {
  const { execFile } = await import("node:child_process");
  const { writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const file = join(tmpdir(), `stdout-check-${process.pid}.pdf`);
  writeFileSync(file, makePdf([["Some text that is long enough to be a text page"]]));
  const script = `const e = await import(${JSON.stringify(new URL("../dist/extract.js", import.meta.url).href)});
const fs = await import("node:fs");
const b = new e.Budget({ maxTextChars: 1000, maxPages: 1, maxImages: 1, harRaw: false });
await e.extractAny(fs.readFileSync(${JSON.stringify(file)}), "a.pdf", "", b);`;
  const stdout = await new Promise((resolve, reject) =>
    execFile(process.execPath, ["--input-type=module", "-e", script], (err, out) =>
      err ? reject(err) : resolve(out),
    ),
  );
  assert.equal(stdout, "");
});

test("PDF: a broken file is reported, not thrown", async () => {
  const r = await extract(Buffer.from("%PDF-1.4\nnot really a pdf"), "broken.pdf");
  assert.equal(r.content.length, 0);
  assert.match(r.notes[0], /PDF could not be opened/);
});

/* ---------- Office ---------- */

test("DOCX: Markdown with headings", async () => {
  const r = await extract(makeDocx("Error report", ["APPLID not found", "Second"]), "r.docx");
  assert.equal(r.kind, "docx");
  assert.match(textOf(r), /# Error report\n\nAPPLID not found\n\nSecond/);
});

test("XLSX: shared strings, dates and formulas without a cached value", async () => {
  const r = await extract(makeXlsx(), "users.xlsx");
  const t = textOf(r);
  assert.match(t, /## Sheet: Users \(2 row\(s\)\)/);
  assert.match(t, /\| Name \| Joined \| Score \|/);
  assert.match(t, /\| Ana \| 2026-01-05 \| =D2\*2 \|/);
});

test("PPTX: slide text and speaker notes", async () => {
  const r = await extract(makePptx("Title", "Body text", "Remember the demo"), "deck.pptx");
  const t = textOf(r);
  assert.match(t, /--- Slide 1 ---\nTitle\nBody text/);
  assert.match(t, /\[Speaker notes\] Remember the demo/);
});

test("Office files are detected by content even with a wrong name", async () => {
  const r = await extract(makeDocx("Renamed", ["still a docx"]), "attachment.bin");
  assert.equal(r.kind, "docx");
});

/* ---------- Text formats ---------- */

test("CSV: Markdown table", async () => {
  const r = await extract(Buffer.from("name,score\nAna,10\nRui,7\n"), "data.csv");
  assert.match(textOf(r), /\| name \| score \|\n\| --- \| --- \|\n\| Ana \| 10 \|/);
});

test("EML: headers and body", async () => {
  const eml =
    "From: Ana <ana@example.com>\r\nTo: support@example.com\r\nSubject: Launchpad error\r\n" +
    "Content-Type: text/plain\r\n\r\nThe app shows APPLID not found.\r\n";
  const r = await extract(Buffer.from(eml), "mail.eml");
  const t = textOf(r);
  assert.match(t, /From: Ana <ana@example.com>/);
  assert.match(t, /Subject: Launchpad error/);
  assert.match(t, /The app shows APPLID not found\./);
});

test("HAR: failed requests with their response, even saved as .txt", async () => {
  const har = {
    log: {
      version: "1.2",
      creator: { name: "test" },
      entries: [
        {
          startedDateTime: "2026-10-12T10:00:00Z",
          time: 1200,
          request: { method: "GET", url: "https://x.example.com/api/a" },
          response: {
            status: 500,
            statusText: "ERR",
            content: { mimeType: "application/json", text: '{"error":"boom"}' },
          },
        },
      ],
    },
  };
  const r = await extract(Buffer.from(JSON.stringify(har)), "network.txt");
  assert.equal(r.kind, "har");
  assert.match(textOf(r), /## Failed requests \(1\)\n- GET https:\/\/x\.example\.com\/api\/a -> 500/);
  assert.match(textOf(r), /\{"error":"boom"\}/);
});

test("JSON: pretty printed, invalid JSON returned as is", async () => {
  assert.match(textOf(await extract(Buffer.from('{"a":{"b":1}}'), "a.json")), /\{\n {2}"a": \{/);
  const bad = await extract(Buffer.from('{"a":1,}'), "bad.json");
  assert.match(textOf(bad), /\{"a":1,\}/);
});

test("XML: one-line XML is indented without changing its content", () => {
  const xml =
    '<?xml version="1.0"?><root a="x>y"><!-- c > d --><data><![CDATA[a < b]]></data><e>&lt;t&gt;</e><s/></root>';
  const pretty = prettyXml(xml);
  assert.match(pretty, /\n {2}<data>\n {4}<!\[CDATA\[a < b\]\]>\n {2}<\/data>/);
  assert.match(pretty, /<root a="x>y">/, "quoted > in an attribute is kept");
  // Only whitespace between tags changed.
  assert.equal(pretty.replace(/>\s+</g, "><"), xml);
});

/* ---------- Images and media ---------- */

test("images: PNG returned, BMP reported, animated GIF treated as video", async () => {
  const png = await extract(makePng(20, 10), "shot.png");
  assert.equal(png.content.filter((c) => c.type === "image").length, 1);

  const bmp = Buffer.alloc(64);
  bmp.write("BM", 0, "ascii");
  const b = await extract(bmp, "scan.bmp");
  assert.equal(b.content.length, 0);
  assert.match(b.notes[0], /cannot view/);

  assert.equal((await extract(makeGif(1), "still.gif")).kind, "image");
  const anim = await extract(makeGif(2), "toggle.gif");
  assert.equal(anim.kind, "video");
  assert.equal(anim.content.length, 0);
});

test("video, audio and executables are not analysed", () => {
  for (const name of ["recording.mp4", "call.m4a", "setup.exe"])
    assert.equal(willAnalyse(classifyByName(name, "")), false, name);
  assert.equal(willAnalyse(classifyByName("report.pdf", "")), true);
});

/* ---------- ZIP limits ---------- */

test("ZIP: listed, and its files processed with the same rules", async () => {
  const r = await extract(
    makeZip({ "logs/app.log": "ERROR 42 at startup", "shot.png": makePng(10, 10) }),
    "bundle.zip",
  );
  const t = textOf(r);
  assert.match(t, /\| logs\/app\.log \| 19 B \| text \|/);
  assert.match(t, /=== logs\/app\.log \(text\) ===\nERROR 42 at startup/);
  assert.equal(r.content.filter((c) => c.type === "image").length, 1);
});

test("ZIP limit: archives nested more than 2 levels are listed, not extracted", async () => {
  const level3 = makeZip({ "deep.txt": "too deep" });
  const level2 = makeZip({ "l3.zip": level3 });
  const level1 = makeZip({ "l2.zip": level2 });
  const r = await extract(makeZip({ "l1.zip": level1 }), "outer.zip");
  const t = textOf(r);
  assert.match(t, /not extracted: nested deeper than 2 archive levels/);
  assert.doesNotMatch(t, /too deep/);
});

test("ZIP limit: at most 25 files are extracted", async () => {
  const files = {};
  for (let i = 0; i < 30; i++) files[`f${String(i).padStart(2, "0")}.txt`] = `file ${i}`;
  const t = textOf(await extract(makeZip(files), "many.zip"));
  assert.match(t, /Archive many\.zip: 30 file\(s\)/);
  assert.equal((t.match(/^=== f\d+\.txt \(text\) ===$/gm) ?? []).length, 25);
  assert.match(t, /not extracted: more than 25 files/);
});

test("ZIP limit: files over 50 MB uncompressed are not inflated", async () => {
  // 51 MB of zeros compresses to a few KB: the size is checked before inflating.
  const bomb = makeZip({ "big.txt": Buffer.alloc(51 * 1024 * 1024), "small.txt": "ok" });
  assert.ok(bomb.length < 1024 * 1024, "the archive itself is small");
  const t = textOf(await extract(bomb, "bomb.zip"));
  assert.match(t, /big\.txt .*not extracted: over the 50\.0 MB uncompressed limit/);
  assert.match(t, /=== small\.txt \(text\) ===\nok/);
});

/* ---------- Response size ---------- */

test("text over max_text_chars is truncated with a marker", async () => {
  const r = await extract(Buffer.from("x".repeat(5000)), "big.log", "", budget({ maxTextChars: 1000 }));
  assert.match(textOf(r), /\[TRUNCATED: showing 1000 of 5000 characters/);
});

test("enforceResponseSize drops images, then shortens text, to fit", () => {
  const blocks = [
    { type: "text", text: "a".repeat(50_000) },
    { type: "image", data: "b".repeat(80_000), mimeType: "image/png" },
  ];
  const out = enforceResponseSize(blocks, 60_000);
  assert.equal(out.filter((b) => b.type === "image").length, 0);
  assert.ok(JSON.stringify(out).length < 70_000);
  assert.match(out.at(-1).text, /image\(s\) removed/);
});

test("mergeTextBlocks joins consecutive text blocks only", () => {
  const out = mergeTextBlocks([
    { type: "text", text: "a" },
    { type: "text", text: "b" },
    { type: "image", data: "x", mimeType: "image/png" },
    { type: "text", text: "c" },
  ]);
  assert.deepEqual(
    out.map((b) => b.type),
    ["text", "image", "text"],
  );
  assert.equal(out[0].text, "a\n\nb");
});
