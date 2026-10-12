// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.FRESHDESK_API_KEY = "k";
process.env.FRESHDESK_DOMAIN = "x.freshdesk.com";
process.env.FRESHDESK_MAX_RESPONSE_BYTES = String(200 * 1024);
const { isTextual, isMedia, download, registerAttachmentTools } = await import(
  "../dist/tools/attachments.js"
);
const { makePng } = await import("./fixtures.mjs");

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

test("isTextual: Office Open XML types are not text", () => {
  for (const t of [DOCX, XLSX, PPTX]) assert.equal(isTextual(t, "file.bin"), false, t);
  assert.equal(isTextual(DOCX, "report.docx"), false);
});

test("isTextual: text types, +json/+xml suffixes and text extensions", () => {
  for (const t of [
    "text/plain",
    "text/csv",
    "application/json",
    "application/xml",
    "application/x-yaml",
    "application/javascript",
    "application/ld+json",
    "application/atom+xml",
  ])
    assert.equal(isTextual(t), true, t);
  assert.equal(isTextual("application/octet-stream", "network.har"), true, "HAR is JSON");
  assert.equal(isTextual("application/octet-stream", "server.log"), true);
  assert.equal(isTextual("application/pdf", "a.pdf"), false);
  assert.equal(isTextual("application/zip", "a.zip"), false);
});

test("isMedia: video and audio by type or extension", () => {
  assert.equal(isMedia("video/mp4", "x"), true);
  assert.equal(isMedia("audio/mpeg", "x"), true);
  assert.equal(isMedia("application/octet-stream", "Recording 2026-09-17.MP4"), true);
  assert.equal(isMedia("application/octet-stream", "call.m4a"), true);
  assert.equal(isMedia("image/gif", "toggle.gif"), false);
  assert.equal(isMedia("application/pdf", "a.pdf"), false);
});

test("download retries once on a network error", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) throw new TypeError("fetch failed");
    return new Response(new Uint8Array([1, 2, 3]));
  };
  const r = await download("https://acme.freshdesk.com/a.bin");
  assert.equal(r.ok, true);
  assert.equal(calls, 2);
});

test("download gives up after a second network error", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new TypeError("fetch failed");
  };
  const r = await download("https://acme.freshdesk.com/a.bin");
  assert.equal(r.ok, false);
  assert.match(r.reason, /network error/);
  assert.equal(calls, 2);
});

/* ---- tool level: a fake server collects handlers, fetch serves a fake tenant ---- */

const handlers = {};
registerAttachmentTools({
  registerTool: (name, _meta, cb) => {
    handlers[name] = cb;
  },
});

function fakeTenant(files) {
  const attachments = files.map((f, i) => ({
    id: 100 + i,
    name: f.name,
    content_type: f.type,
    size: f.bytes.length,
    attachment_url: `https://acme.attachments.freshdesk.com/data/${i}?Signature=s`,
  }));
  const requested = [];
  globalThis.fetch = async (url) => {
    const u = String(url);
    requested.push(u);
    if (u.includes("/api/v2/tickets/1/conversations")) return Response.json([]);
    if (u.includes("/api/v2/tickets/1")) return Response.json({ id: 1, attachments });
    const i = Number(u.match(/\/data\/(\d+)/)?.[1]);
    return new Response(files[i].bytes, { headers: { "content-type": files[i].type } });
  };
  return requested;
}

const call = (args) =>
  handlers.get_ticket_attachment({
    archived: false,
    from_image: 0,
    max_text_chars: 60_000,
    max_pages: 50,
    max_images: 50,
    har_raw: false,
    xml_full: false,
    ...args,
  });
const size = (r) => JSON.stringify(r).length;

test("get_ticket_attachment: a .docx is not returned as text", async () => {
  // A docx is a zip: PK header followed by binary data.
  const docx = Buffer.concat([Buffer.from("PK\x03\x04", "binary"), Buffer.alloc(5000, 0xa5)]);
  fakeTenant([{ name: "report.docx", type: DOCX, bytes: docx }]);
  const r = await call({ ticket_id: 1, attachment_id: 100 });
  assert.ok(!r.content.some((b) => b.type === "text" && b.text.includes("PK\x03\x04")));
  assert.ok(!r.content.some((b) => b.type === "resource"), "no base64 blob");
});

test("get_ticket_attachment: video is not downloaded", async () => {
  const requested = fakeTenant([
    { name: "screen recording.mp4", type: "video/mp4", bytes: Buffer.alloc(100) },
  ]);
  const r = await call({ ticket_id: 1, attachment_id: 100 });
  assert.match(r.content[0].text, /not downloaded/);
  assert.ok(!requested.some((u) => u.includes("/data/")), "no download request");
});

test("get_ticket_attachment: an image too large for one response is reported", async () => {
  // About 260 KB in base64, over the 200 KB limit set above.
  fakeTenant([{ name: "photo.png", type: "image/png", bytes: makePng(220, 220, true) }]);
  const r = await call({ ticket_id: 1, attachment_id: 100 });
  assert.equal(r.content.filter((b) => b.type === "image").length, 0);
  assert.match(r.content[0].text, /response size limit reached/);
  assert.ok(size(r) < 200 * 1024);
});

test("get_ticket_attachment: large text is truncated under the limit", async () => {
  fakeTenant([
    { name: "server.log", type: "text/plain", bytes: Buffer.from("x".repeat(500 * 1024)) },
  ]);
  const r = await call({ ticket_id: 1, attachment_id: 100 });
  assert.match(r.content[0].text, /TRUNCATED/);
  assert.ok(size(r) < 200 * 1024);
});

test("get_ticket_inline_images: stays under the response limit", async () => {
  // Six images of about 66 KB in base64 each: about 400 KB together.
  const png = makePng(150, 110, true);
  const body = [0, 1, 2, 3, 4, 5]
    .map((i) => `<img src="https://acme.attachments.freshdesk.com/inline/${i}.png?Signature=s">`)
    .join("");
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes("/conversations")) return Response.json([]);
    if (u.includes("/api/v2/tickets/1")) return Response.json({ id: 1, description: body });
    return new Response(png, { headers: { "content-type": "image/png" } });
  };
  const r = await handlers.get_ticket_inline_images({
    ticket_id: 1,
    include_conversations: true,
    max_images: 10,
    min_dimension: 100,
    archived: false,
  });
  const summary = JSON.parse(r.content[0].text.split("\n\nImage ")[0]);
  assert.ok(summary.returned >= 1 && summary.returned < 6);
  assert.ok(summary.skipped_details.some((s) => /does not fit in this response/.test(s.reason)));
  assert.ok(size(r) < 200 * 1024);
});
