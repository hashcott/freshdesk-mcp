// Small fixtures built in memory, so the repository holds no binary test files.
import { randomBytes } from "node:crypto";
import { deflateSync } from "node:zlib";
import { strToU8, zipSync } from "fflate";

/* ---------- PDF ---------- */

/**
 * A valid PDF. Each page is a list of lines; a line is a string, or an array of runs
 * (strings drawn one after the other with different fonts, like Word does).
 * An empty page has no text layer, like a scanned page.
 */
export function makePdf(pages) {
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  const catalog = add(null);
  const pagesObj = add(null);
  const fontA = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const fontB = add("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>");
  const pageIds = [];
  for (const lines of pages) {
    let stream = "";
    lines.forEach((line, i) => {
      const y = 760 - i * 20;
      const runs = Array.isArray(line) ? line : [line];
      let x = 72;
      runs.forEach((run, r) => {
        const font = r % 2 === 0 ? "F1" : "F2";
        const safe = run.replace(/[\\()]/g, (c) => `\\${c}`);
        stream += `BT /${font} 12 Tf ${x} ${y} Td (${safe}) Tj ET\n`;
        x += run.length * 6; // approximate advance; runs touch, like kerned Word runs
      });
    });
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
    pageIds.push(
      add(
        `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 612 792] /Contents ${content} 0 R /Resources << /Font << /F1 ${fontA} 0 R /F2 ${fontB} 0 R >> >> >>`,
      ),
    );
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let out = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

/* ---------- Office files ---------- */

const zip = (files) =>
  Buffer.from(
    zipSync(
      Object.fromEntries(
        Object.entries(files).map(([k, v]) => [k, typeof v === "string" ? strToU8(v) : v]),
      ),
    ),
  );

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';

/** A .docx with a heading and paragraphs. */
export function makeDocx(heading, paragraphs) {
  const p = (text, style) =>
    `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
  return zip({
    "[Content_Types].xml":
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    "_rels/.rels":
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    "word/document.xml": `<?xml version="1.0"?><w:document ${W}><w:body>${p(heading, "Heading1")}${paragraphs.map((t) => p(t)).join("")}</w:body></w:document>`,
  });
}

/** A .xlsx with one sheet: shared strings, a number, a date and a formula without cached value. */
export function makeXlsx() {
  return zip({
    "xl/workbook.xml":
      '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Users" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/sharedStrings.xml":
      "<sst><si><t>Name</t></si><si><t>Joined</t></si><si><t>Score</t></si><si><t>Ana</t></si></sst>",
    "xl/styles.xml": '<styleSheet><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/></cellXfs></styleSheet>',
    "xl/worksheets/sheet1.xml":
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row><row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" s="1"><v>46027</v></c><c r="C2"><f>D2*2</f><v></v></c></row></sheetData></worksheet>',
  });
}

/** A .pptx with one slide and its speaker notes. */
export function makePptx(title, body, notes) {
  const A = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"';
  return zip({
    "ppt/slides/slide1.xml": `<p:sld ${A}><a:p><a:r><a:t>${title}</a:t></a:r></a:p><a:p><a:r><a:t>${body}</a:t></a:r></a:p></p:sld>`,
    "ppt/notesSlides/notesSlide1.xml": `<p:notes ${A}><a:p><a:r><a:t>${notes}</a:t></a:r></a:p></p:notes>`,
    "ppt/slides/_rels/slide1.xml.rels":
      '<Relationships><Relationship Id="rId2" Target="../notesSlides/notesSlide1.xml"/></Relationships>',
  });
}

/** A ZIP from { path: Buffer | string }. */
export const makeZip = zip;

/* ---------- Images ---------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** A real PNG. noise=true makes it hard to compress, so its size is about width*height*3. */
export function makePng(width, height, noise = false) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const raw = noise ? randomBytes((width * 3 + 1) * height) : Buffer.alloc((width * 3 + 1) * height, 200);
  for (let y = 0; y < height; y++) raw[y * (width * 3 + 1)] = 0; // filter byte: none
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** A GIF with one or two frames (structure only, enough for frame counting). */
export function makeGif(frames) {
  const header = Buffer.from("GIF89a\x02\x00\x02\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff", "binary");
  const frame = Buffer.from(
    "\x21\xf9\x04\x00\x0a\x00\x00\x00\x2c\x00\x00\x00\x00\x02\x00\x02\x00\x00\x02\x02\x44\x01\x00",
    "binary",
  );
  return Buffer.concat([header, ...Array(frames).fill(frame), Buffer.from([0x3b])]);
}
