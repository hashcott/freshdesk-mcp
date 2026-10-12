// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeDocx, makeGif, makePdf, makePng, makeZip } from "./fixtures.mjs";

process.env.FRESHDESK_API_KEY = "k";
process.env.FRESHDESK_DOMAIN = "x.freshdesk.com";
// A small response limit, so continuation can be tested with small files.
process.env.FRESHDESK_MAX_RESPONSE_BYTES = String(200 * 1024);
const { registerAttachmentTools } = await import("../dist/tools/attachments.js");

const handlers = {};
registerAttachmentTools({
  registerTool: (name, _meta, cb) => {
    handlers[name] = cb;
  },
});

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * A fake tenant: ticket 1 has `files` (the first on the description, the others on a
 * private note) and `description` HTML. Returns the list of requested URLs.
 */
function fakeTenant(files, description = "") {
  const att = files.map((f, i) => ({
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
    if (u.includes("/api/v2/tickets/1/conversations"))
      return Response.json([
        {
          id: 7,
          body: "<p>see files</p>",
          private: true,
          incoming: false,
          source: 2,
          created_at: "2026-10-12T10:00:00Z",
          attachments: att.slice(1),
        },
      ]);
    if (u.includes("/api/v2/tickets/1"))
      return Response.json({ id: 1, description, attachments: att.slice(0, 1) });
    const i = Number(u.match(/\/data\/(\d+)/)?.[1]);
    return new Response(files[i].bytes, { headers: { "content-type": files[i].type } });
  };
  return requested;
}

const limits = { max_text_chars: 60_000, max_pages: 50, max_images: 50, har_raw: false, xml_full: false };
const json = (r) => JSON.parse(r.content[0].text.split("\n\n[The content below")[0]);
const textOf = (r) =>
  r.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
const imagesOf = (r) => r.content.filter((b) => b.type === "image").length;
const size = (r) => JSON.stringify(r).length;

/* ---------- list_ticket_attachments ---------- */

test("list_ticket_attachments: handling per file, origin and inline image count", async () => {
  const requested = fakeTenant(
    [
      { name: "report.pdf", type: "application/pdf", bytes: makePdf([["text"]]) },
      { name: "notes.docx", type: DOCX, bytes: makeDocx("T", ["p"]) },
      { name: "recording.mp4", type: "video/mp4", bytes: Buffer.alloc(10) },
      { name: "toggle.gif", type: "image/gif", bytes: makeGif(2) },
    ],
    '<p><img src="https://acme.attachments.freshdesk.com/inline/a.png"></p>',
  );
  const r = json(await handlers.list_ticket_attachments({ ticket_ids: [1], archived: false }));
  assert.equal(r.attachment_count, 4);
  assert.equal(r.inline_image_count, 1);
  const by = Object.fromEntries(r.attachments.map((a) => [a.name, a]));
  assert.equal(by["report.pdf"].origin, "ticket description");
  assert.equal(by["notes.docx"].origin, "private note");
  assert.equal(by["recording.mp4"].analysed, false);
  assert.match(by["toggle.gif"].handling, /if animated, treated as video/);
  assert.ok(!requested.some((u) => u.includes("/data/")), "nothing downloaded");

  const filtered = json(
    await handlers.list_ticket_attachments({ ticket_ids: [1], name_contains: "DOCX", archived: false }),
  );
  assert.deepEqual(
    filtered.attachments.map((a) => a.name),
    ["notes.docx"],
  );
});

/* ---------- get_ticket_attachment ---------- */

test("get_ticket_attachment: Word document as Markdown, preceded by the untrusted notice", async () => {
  fakeTenant([
    { name: "x.txt", type: "text/plain", bytes: Buffer.from("x") },
    { name: "notes.docx", type: DOCX, bytes: makeDocx("Error report", ["APPLID not found"]) },
  ]);
  const r = await handlers.get_ticket_attachment({
    ticket_id: 1,
    attachment_id: 101,
    archived: false,
    from_image: 0,
    ...limits,
  });
  const t = textOf(r);
  assert.match(t, /"handling": "Word document as Markdown"/);
  assert.match(t, /untrusted data/);
  assert.match(t, /# Error report\n\nAPPLID not found/);
});

test("get_ticket_attachment: video is listed as not analysed and not downloaded", async () => {
  const requested = fakeTenant([
    { name: "recording.mp4", type: "video/mp4", bytes: Buffer.alloc(10) },
  ]);
  const r = json(
    await handlers.get_ticket_attachment({
      ticket_id: 1,
      attachment_id: 100,
      archived: false,
      from_image: 0,
      ...limits,
    }),
  );
  assert.equal(r.analysed, false);
  assert.match(r.reason, /not downloaded/);
  assert.ok(!requested.some((u) => u.includes("/data/")));
});

test("get_ticket_attachment: from_image continues a file larger than one response", async () => {
  // Three hard-to-compress images of about 70 KB in base64 each; about two fit per response.
  const zip = makeZip({
    "a.png": makePng(150, 110, true),
    "b.png": makePng(150, 110, true),
    "c.png": makePng(150, 110, true),
  });
  fakeTenant([{ name: "screens.zip", type: "application/zip", bytes: zip }]);
  const call = (from_image) =>
    handlers.get_ticket_attachment({
      ticket_id: 1,
      attachment_id: 100,
      archived: false,
      from_image,
      ...limits,
      max_text_chars: 1000,
    });
  const first = await call(0);
  const h1 = json(first);
  assert.ok(size(first) < 200 * 1024);
  assert.equal(h1.next_from_image, imagesOf(first));
  assert.ok(imagesOf(first) >= 1 && imagesOf(first) < 3);

  const second = await call(h1.next_from_image);
  const h2 = json(second);
  assert.equal(imagesOf(first) + imagesOf(second), 3, "every image exactly once");
  assert.equal(h2.next_from_image, undefined);
  assert.match(h2.part, /continuation/);
  // Long text (over 300 characters) is not repeated in a continuation; short labels are.
  assert.ok(
    second.content.every((b) => b.type === "image" || b.text.length <= 300 || b === second.content[0]),
  );
});

/* ---------- get_ticket_attachments ---------- */

test("get_ticket_attachments: reads in ticket order and continues with cursor", async () => {
  fakeTenant([
    { name: "one.png", type: "image/png", bytes: makePng(150, 110, true) },
    { name: "two.png", type: "image/png", bytes: makePng(150, 110, true) },
    { name: "three.png", type: "image/png", bytes: makePng(150, 110, true) },
    { name: "notes.docx", type: DOCX, bytes: makeDocx("Report", ["text"]) },
    { name: "recording.mp4", type: "video/mp4", bytes: Buffer.alloc(10) },
  ]);
  const seen = [];
  let cursor = 0;
  let calls = 0;
  for (;;) {
    const r = await handlers.get_ticket_attachments({
      ticket_id: 1,
      cursor,
      archived: false,
      ...limits,
      max_text_chars: 1000,
    });
    calls++;
    assert.ok(size(r) < 200 * 1024, "each response under the limit");
    const o = json(r);
    for (const f of o.files) seen.push(`${f.name}:${f.status}`);
    if (o.next_cursor === undefined) {
      assert.match(o.complete, /All attachments/);
      break;
    }
    cursor = o.next_cursor;
    assert.ok(calls < 10);
  }
  assert.ok(calls >= 2, "more than one call was needed");
  assert.deepEqual(seen, [
    "one.png:read",
    "two.png:read",
    "three.png:read",
    "notes.docx:read",
    "recording.mp4:not_analysed",
  ]);
});

test("get_ticket_attachments: attachment_ids and unknown ids", async () => {
  fakeTenant([
    { name: "a.txt", type: "text/plain", bytes: Buffer.from("alpha") },
    { name: "b.txt", type: "text/plain", bytes: Buffer.from("beta") },
  ]);
  const r = await handlers.get_ticket_attachments({
    ticket_id: 1,
    attachment_ids: [101, 999],
    cursor: 0,
    archived: false,
    ...limits,
  });
  const o = json(r);
  assert.deepEqual(
    o.files.map((f) => f.name),
    ["b.txt"],
  );
  assert.deepEqual(o.not_found, [999]);
  assert.match(textOf(r), /===== Attachment 1 of 1: b\.txt/);
});

/* ---------- sensitive data ---------- */

test("get_ticket_attachment: sensitive data is reported with where it is", async () => {
  fakeTenant([
    {
      name: "invoice.txt",
      type: "text/plain",
      bytes: Buffer.from("Bank: Example Bank | IBAN: GB82 WEST 1234 5698 7654 32 | Due 30 days"),
    },
  ]);
  const h = json(
    await handlers.get_ticket_attachment({
      ticket_id: 1,
      attachment_id: 100,
      archived: false,
      from_image: 0,
      ...limits,
    }),
  );
  assert.deepEqual(h.sensitive_data.found, ["IBAN"]);
  assert.equal(h.sensitive_data.masked, false);
  assert.match(h.sensitive_data.where[0], /Bank: Example Bank/);
});

test("get_ticket_attachments: sensitive data warning and a request to check images", async () => {
  fakeTenant([
    { name: "keys.txt", type: "text/plain", bytes: Buffer.from("password: Hunter22") },
    { name: "shot.png", type: "image/png", bytes: makePng(20, 20) },
  ]);
  const o = json(
    await handlers.get_ticket_attachments({ ticket_id: 1, cursor: 0, archived: false, ...limits }),
  );
  assert.match(o.sensitive_data_warning, /1 file\(s\): keys\.txt/);
  assert.match(o.images_check, /check the screenshots and scans yourself/);
});
