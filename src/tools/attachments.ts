import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
  ANIMATED_GIF_HANDLING,
  Budget,
  classifyByName,
  DISABLED_HANDLING,
  enforceResponseSize,
  extractAny,
  HANDLING,
  isAnimatedGif,
  kindEnabled,
  MAX_RESPONSE_BYTES,
  MIN_IMAGE_DIMENSION,
  mergeTextBlocks,
  sniffSupportedImage,
  UNSUPPORTED_IMAGE,
  UNTRUSTED_NOTICE,
  willAnalyse,
} from "../extract.js";
import { errorPayload, fd } from "../freshdesk.js";
import { REDACT_ENABLED, scanSensitive } from "../redact.js";
import { text, tool } from "../util.js";
import { fetchConversations } from "./tickets.js";

// ─── Download safety ──────────────────────────────
// Inline <img src> values are customer-controlled, so every download is restricted to HTTPS
// on an allowlisted host suffix, redirects are re-checked hop by hop, the Freshdesk API key is
// never sent (signed URLs carry their own auth), and bodies are capped while streaming.

const DEFAULT_HOSTS = "freshdesk.com,freshworks.com,freshdeskusercontent.com,amazonaws.com";
export const allowedHosts = (process.env.FRESHDESK_ATTACHMENT_HOSTS ?? DEFAULT_HOSTS)
  .split(",")
  .map((h) => h.trim().toLowerCase().replace(/^\./, ""))
  .filter(Boolean);
const MAX_FILE_BYTES = Number(process.env.FRESHDESK_MAX_ATTACHMENT_BYTES) || 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = MAX_FILE_BYTES * 4; // ponytail: fixed per-call budget, add an env var if anyone needs it
const MAX_REDIRECTS = 3;

// MCP clients reject large tool results (Claude Desktop at about 1 MB), so every response of
// these tools is kept under MAX_RESPONSE_BYTES (FRESHDESK_MAX_RESPONSE_BYTES), see extract.ts.
export { MAX_RESPONSE_BYTES };

export function isAllowedUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.username || u.password) return false;
  if (u.port && u.port !== "443") return false;
  const host = u.hostname.toLowerCase();
  return allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
}

export async function download(
  url: string,
  maxBytes = MAX_FILE_BYTES,
): Promise<{ ok: true; bytes: Buffer; contentType: string } | { ok: false; reason: string }> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedUrl(current))
      return { ok: false, reason: `host not allowed: ${hostOf(current)}` };
    let res: Response | undefined;
    // One retry on network errors: servers close idle keep-alive connections, and reusing one
    // fails at once. Timeouts are not retried.
    for (let attempt = 1; !res; attempt++) {
      try {
        res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(30_000) });
      } catch (e) {
        if (attempt >= 2 || (e as Error).name === "TimeoutError")
          return { ok: false, reason: `network error: ${(e as Error).message}` };
      }
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return { ok: false, reason: `redirect without location (${res.status})` };
      current = new URL(loc, current).toString();
      continue;
    }
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    const declared = Number(res.headers.get("content-length"));
    if (declared > maxBytes) {
      await res.body?.cancel();
      return { ok: false, reason: `too large (${declared} > ${maxBytes} bytes)` };
    }
    const chunks: Buffer[] = [];
    let size = 0;
    const reader = res.body?.getReader();
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: `too large (> ${maxBytes} bytes)` };
      }
      chunks.push(Buffer.from(value));
    }
    const contentType = (res.headers.get("content-type") ?? "application/octet-stream")
      .split(";")[0]
      .trim()
      .toLowerCase();
    return { ok: true, bytes: Buffer.concat(chunks), contentType };
  }
  return { ok: false, reason: "too many redirects" };
}

const hostOf = (raw: string) => {
  try {
    return new URL(raw).hostname;
  } catch {
    return "invalid url";
  }
};

// ─── Content helpers ──────────────────────────────

const TEXT_EXT = /\.(txt|log|json|xml|csv|tsv|ya?ml|md|ini|conf|cfg|html?|js|ts|py|sql|sh|har)$/i;
// Matched on the subtype (application/json, application/x-yaml) or the +json / +xml suffix:
// Office Open XML types contain "xml" inside their name (wordprocessingml) but are zip files.
const TEXT_TYPE =
  /^application\/(?:x-)?(?:json|xml|yaml|csv|javascript|sh|sql|ndjson)$|\+(?:json|xml)$/;
export const isTextual = (contentType: string, name = "") =>
  contentType.startsWith("text/") || TEXT_TYPE.test(contentType) || TEXT_EXT.test(name);

const MEDIA_EXT =
  /\.(mp4|m4v|mov|avi|mkv|webm|wmv|flv|mpe?g|3gp|mp3|wav|m4a|aac|ogg|oga|flac|wma)$/i;
/** Video and audio cannot be read by the model: they are not downloaded. */
export const isMedia = (contentType: string, name = "") =>
  /^(video|audio)\//.test(contentType) || MEDIA_EXT.test(name);

/** Read width/height from PNG, GIF or JPEG headers; null when unknown (e.g. WebP/SVG). */
export function imageSize(b: Buffer): { width: number; height: number } | null {
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47) {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.length >= 10 && b.toString("ascii", 0, 3) === "GIF") {
    return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  "#39": "'",
};
const decodeEntities = (s: string) =>
  s.replace(/&(amp|quot|apos|lt|gt|#39);/g, (_, e) => ENTITIES[e]);

/** Extract <img src> values from HTML, entity-decoded. */
export function extractImgSrcs(html: string | null | undefined): string[] {
  if (!html) return [];
  const out: string[] = [];
  for (const m of html.matchAll(/<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
    const src = decodeEntities((m[1] ?? m[2] ?? m[3] ?? "").trim());
    if (src) out.push(src);
  }
  return out;
}

function decodeDataUri(src: string): { bytes: Buffer; contentType: string } | null {
  const m = src.match(/^data:([^;,]+)?((?:;[^;,]+)*?)(;base64)?,(.*)$/s);
  if (!m) return null;
  const contentType = (m[1] ?? "text/plain").toLowerCase();
  const bytes = m[3] ? Buffer.from(m[4], "base64") : Buffer.from(decodeURIComponent(m[4]));
  return { bytes, contentType };
}

function conversationLabel(c: any): string {
  if (c.private) return "private note";
  if (c.incoming) return "customer reply";
  return c.source === 2 ? "public note" : "agent reply";
}

const ticketId = z.number().int().describe("Ticket ID.");
const archivedArg = z
  .boolean()
  .optional()
  .default(false)
  .describe("true if the ticket is archived.");

async function loadTicket(ticket_id: number, archived: boolean, withConversations: boolean) {
  const base = archived ? `/tickets/archived/${ticket_id}` : `/tickets/${ticket_id}`;
  const t = await fd.get(base);
  if (!t.ok) return { ok: false as const, reply: text(errorPayload("Failed to fetch ticket", t)) };
  if (!withConversations) return { ok: true as const, ticket: t.data, conversations: [] as any[] };
  const c = await fetchConversations(`${base}/conversations`, {
    page: 1,
    per_page: 100,
    fetch_all: true,
    max_pages: 20,
  });
  if (!c.ok)
    return {
      ok: false as const,
      reply: text(errorPayload("Failed to fetch conversations", c.res)),
    };
  return { ok: true as const, ticket: t.data, conversations: c.conversations };
}

// ─── Reading attachments ──────────────────────────
// Every attachment goes through download() above (allowlist, redirects, size caps), then
// extractAny() turns it into content the model can use. Each response stays under
// MAX_RESPONSE_BYTES; what does not fit is reported, with how to continue.

type Content = CallToolResult["content"][number];
type AttachmentHit = { att: any; origin: string; conversation_id?: number };

/** All attachments of a ticket and its conversations, in ticket order, plus inline image count. */
async function collectAttachments(ticket_id: number, archived: boolean) {
  const t = await loadTicket(ticket_id, archived, true);
  if (!t.ok) return t;
  const items: AttachmentHit[] = (t.ticket.attachments ?? []).map((att: any) => ({
    att,
    origin: "ticket description",
  }));
  let inlineImages = extractImgSrcs(t.ticket.description).length;
  for (const c of t.conversations) {
    inlineImages += extractImgSrcs(c.body).length;
    for (const att of c.attachments ?? [])
      items.push({ att, origin: conversationLabel(c), conversation_id: c.id });
  }
  return { ok: true as const, items, inlineImages };
}

/** Whether a GIF is animated is only known after download, so the listing says so. */
const GIF_LIST_HANDLING = "image if static; if animated, treated as video and not analysed";
const isGifName = (name: string, contentType: string) =>
  /\.gif$/i.test(name) || contentType.toLowerCase() === "image/gif";

/** The server cannot read text inside images, but the model can: it is asked to look. */
const IMAGES_CHECK =
  "The server does not read text inside images: check the screenshots and scans yourself for passwords, tokens, Authorization headers, personal or bank data, and mention what you find.";

type FileStatus = "read" | "partial" | "not_analysed" | "disabled" | "error";

const LIMIT_PARAMS = {
  max_text_chars: z
    .number()
    .int()
    .min(1000)
    .max(500_000)
    .optional()
    .default(60_000)
    .describe("Maximum characters of extracted text returned in total (default 60000)."),
  max_pages: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .default(50)
    .describe(
      "Maximum PDF pages rendered as images in this call (default 50). The response size usually applies first.",
    ),
  max_images: z
    .number()
    .int()
    .min(0)
    .max(200)
    .optional()
    .default(50)
    .describe(
      "Maximum images returned in this call, including PDF pages and images inside documents or archives (default 50). The response size usually applies first.",
    ),
  har_raw: z
    .boolean()
    .optional()
    .default(false)
    .describe("For HAR files, return the raw JSON instead of the request summary."),
  xml_full: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "For XML with a format-specific summary (for example application exports), also return the full formatted XML.",
    ),
};

function budgetFrom(l: {
  max_text_chars: number;
  max_pages: number;
  max_images: number;
  har_raw: boolean;
  xml_full: boolean;
}): Budget {
  return new Budget({
    maxTextChars: l.max_text_chars,
    maxPages: l.max_pages,
    maxImages: l.max_images,
    harRaw: l.har_raw,
    xmlFull: l.xml_full,
  });
}

/**
 * Downloads and extracts one attachment within the given budget. Never throws:
 * skipped and failed files return a header explaining why and no content.
 */
async function readAttachment(
  ticketId: number,
  hit: AttachmentHit,
  budget: Budget,
  /** Downloaded files kept for this call, so a file is never downloaded twice. */
  cache?: Map<number, Buffer>,
): Promise<{ header: Record<string, unknown>; content: Content[] }> {
  const { att } = hit;
  const name: string = att.name ?? `attachment-${att.id}`;
  const kindByName = classifyByName(name, att.content_type ?? "");
  const meta = {
    ticket_id: ticketId,
    attachment_id: att.id,
    name,
    content_type: att.content_type ?? null,
    size: att.size ?? null,
    origin: hit.origin,
    conversation_id: hit.conversation_id ?? null,
  };
  const none = (extra: Record<string, unknown>) => ({
    header: { ...meta, ...extra },
    content: [] as Content[],
  });

  if (!kindEnabled(kindByName)) {
    return none({
      handling: DISABLED_HANDLING,
      analysed: false,
      reason: "type disabled by FRESHDESK_ATTACHMENT_TYPES (not downloaded)",
    });
  }
  if (!willAnalyse(kindByName)) {
    return none({
      handling: HANDLING[kindByName],
      analysed: false,
      reason: `${HANDLING[kindByName]} (not downloaded)`,
    });
  }
  if (!att.attachment_url) return none({ error: "Attachment has no download URL" });

  const cached = cache?.get(att.id);
  const dl = cached
    ? ({ ok: true, bytes: cached } as const)
    : await download(att.attachment_url, MAX_FILE_BYTES);
  if (!dl.ok) return none({ error: `Could not download '${name}': ${dl.reason}` });
  cache?.set(att.id, dl.bytes);

  const out = await extractAny(dl.bytes, name, att.content_type ?? "", budget);

  // Sensitive data: always detected and reported, masked with FRESHDESK_REDACT=1.
  const found = new Set<string>();
  const where: string[] = [];
  const content = out.content.map((b) => {
    if (b.type !== "text") return b;
    const scan = scanSensitive(b.text);
    for (const f of scan.found) found.add(f);
    where.push(...scan.where);
    return { ...b, text: scan.text };
  });
  const hasImages = content.some((b) => b.type === "image");
  const sensitive = found.size
    ? {
        sensitive_data: {
          found: [...found],
          where: where.slice(0, 10),
          masked: REDACT_ENABLED,
          note: `${REDACT_ENABLED ? "Masked in the text." : "Found in the text, returned as is."}${hasImages ? ` ${IMAGES_CHECK}` : ""}`,
        },
      }
    : hasImages
      ? { images_note: IMAGES_CHECK }
      : {};

  // With no content, the first note is the reason: keep it once, as reason.
  const reason = out.content.length ? undefined : out.notes[0];
  const notes = reason ? out.notes.slice(1) : out.notes;
  const header = {
    ...meta,
    downloaded_bytes: dl.bytes.length,
    detected_kind: out.kind,
    handling: out.handling ?? HANDLING[out.kind],
    truncated: budget.truncated,
    ...(notes.length ? { notes } : {}),
    ...(reason ? { analysed: false, reason } : {}),
    ...sensitive,
  };
  return { header, content };
}

// ─── Tools ────────────────────────────────────────

export function registerAttachmentTools(server: McpServer) {
  tool(
    server,
    "get_ticket_attachment",
    "Read one file attached to a ticket or any of its conversations and return what the model can use: text (PDF page by page, " +
      "Word as Markdown, Excel/CSV as tables, PowerPoint slide text, emails with headers and attachment list, JSON, XML, logs), " +
      "a request summary for HAR files, and images (PNG/JPEG/static GIF/WebP, other formats converted, PDF pages with images or " +
      "without text rendered). ZIP archives are listed and their files processed with the same rules. Videos and animated GIFs " +
      "are not analysed. When the file does not fit in one response, the result has next_from_image: call again with from_image " +
      "set to it to get the following pages or images (the text is not repeated). Attachment IDs come from list_ticket_attachments " +
      "or the 'attachments' arrays of get_ticket / get_ticket_conversation. To read several attachments, use get_ticket_attachments. " +
      `Max ${Math.round(MAX_FILE_BYTES / 1048576)} MB per file (FRESHDESK_MAX_ATTACHMENT_BYTES).`,
    {
      ticket_id: ticketId,
      attachment_id: z.number().int().describe("Attachment ID."),
      archived: archivedArg,
      from_image: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe(
          "Continue a file that did not fit in one response: skip the images (pages, embedded images) already returned. Use the next_from_image of the previous result.",
        ),
      ...LIMIT_PARAMS,
    },
    async ({
      ticket_id,
      attachment_id,
      archived,
      from_image,
      ...limits
    }): Promise<CallToolResult> => {
      // Re-fetch: attachment_url is a short-lived signed URL.
      const found = await collectAttachments(ticket_id, archived);
      if (!found.ok) return found.reply;
      const hit = found.items.find((c) => c.att.id === attachment_id);
      if (!hit) {
        return text({
          error: `Attachment ${attachment_id} not found on ticket ${ticket_id}`,
          available: found.items.map((c) => ({
            id: c.att.id,
            name: c.att.name,
            content_type: c.att.content_type,
            size: c.att.size,
            origin: c.origin,
          })),
        });
      }
      const budget = budgetFrom(limits);
      budget.skipImages = from_image;
      const read = await readAttachment(ticket_id, hit, budget);
      const header: Record<string, unknown> = { ...read.header };
      let content = read.content;
      if (from_image > 0) {
        // Continuation: only the images and their labels, the text came with the first part.
        content = content.filter(
          (b) => b.type === "image" || (b.type === "text" && b.text.length <= 300),
        );
        header.part = `continuation from image ${from_image + 1}`;
      }
      if (budget.imagesStopped) {
        const next = from_image + budget.imagesReturned;
        header.next_from_image = next;
        header.continue = `More pages or images remain: call get_ticket_attachment again with from_image: ${next}.`;
      }
      if (content.length === 0) return text(header);
      return {
        content: enforceResponseSize(
          mergeTextBlocks([
            { type: "text", text: JSON.stringify(header, null, 2) },
            { type: "text", text: UNTRUSTED_NOTICE },
            ...content,
          ]),
        ),
      };
    },
  );

  tool(
    server,
    "get_ticket_attachments",
    "Read the attachments of a ticket (all of them, or attachment_ids) in ticket order, in as few calls as needed. Each call " +
      "returns as many complete files as fit in one response (about 900 KB, the MCP client limit). When more remain, the summary " +
      "has next_cursor: call again with cursor set to it to continue, until the summary says all attachments have been returned. " +
      "A file too large for a response on its own is returned in part, with how to continue it with get_ticket_attachment " +
      "(from_image). Starts with a JSON summary (counters, files in this call with status and reason, sensitive data warning), " +
      "then each file under a '===== Attachment N of M =====' marker. Videos and animated GIFs are listed as not analysed and " +
      "never downloaded.",
    {
      ticket_id: ticketId,
      attachment_ids: z
        .array(z.number().int())
        .min(1)
        .max(100)
        .optional()
        .describe("Attachments to read. Omit to read every attachment of the ticket."),
      cursor: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(0)
        .describe(
          "Where to continue: the next_cursor of the previous call (0 for the first call).",
        ),
      archived: archivedArg,
      ...LIMIT_PARAMS,
      max_text_chars: LIMIT_PARAMS.max_text_chars
        .default(100_000)
        .describe("Maximum characters of extracted text returned in this call (default 100000)."),
    },
    async ({ ticket_id, attachment_ids, cursor, archived, ...limits }): Promise<CallToolResult> => {
      const found = await collectAttachments(ticket_id, archived);
      if (!found.ok) return found.reply;
      const missing = (attachment_ids ?? []).filter(
        (id) => !found.items.some((c) => c.att.id === id),
      );
      const selected = attachment_ids
        ? found.items.filter((c) => attachment_ids.includes(c.att.id))
        : found.items;

      const budget = budgetFrom(limits);
      const cache = new Map<number, Buffer>();
      const entries: Record<string, unknown>[] = [];
      const sections: Content[] = [];
      let nextCursor: number | undefined;

      for (let i = cursor; i < selected.length; i++) {
        const hit = selected[i];
        const before = {
          chars: budget.chars,
          images: budget.images,
          imageBytes: budget.imageBytes,
          sizeLimited: budget.sizeLimited,
        };
        budget.truncated = false;
        budget.imagesStopped = false;
        budget.imagesReturned = 0;
        const { header, content } = await readAttachment(ticket_id, hit, budget, cache);
        const cut = budget.truncated;

        if (cut && i > cursor) {
          // Does not fit completely after other files: leave it whole for the next call.
          budget.chars = before.chars;
          budget.images = before.images;
          budget.imageBytes = before.imageBytes;
          budget.sizeLimited = before.sizeLimited;
          nextCursor = i;
          break;
        }

        let status: FileStatus;
        let reason: string | undefined;
        if (header.error) {
          status = "error";
          reason = String(header.error);
        } else if (content.length) {
          status = cut ? "partial" : "read";
        } else if (String(header.reason ?? "").includes("FRESHDESK_ATTACHMENT_TYPES")) {
          status = "disabled";
          reason = String(header.reason);
        } else {
          status = "not_analysed";
          reason = String(header.reason ?? "not analysed");
        }
        const continueWith =
          status === "partial"
            ? budget.imagesStopped
              ? `Too large for one response: call get_ticket_attachment with attachment_id ${hit.att.id} and from_image ${budget.imagesReturned} for the rest.`
              : "Text truncated: call get_ticket_attachment with a larger max_text_chars for the rest."
            : undefined;
        entries.push({
          number: i + 1,
          id: hit.att.id,
          name: header.name,
          origin: header.origin,
          ...(header.conversation_id ? { conversation_id: header.conversation_id } : {}),
          status,
          ...(reason ? { reason } : {}),
          ...(continueWith ? { continue: continueWith } : {}),
          ...(header.handling && status !== "not_analysed" && status !== "disabled"
            ? { handling: header.handling }
            : {}),
          ...(header.notes ? { notes: header.notes } : {}),
          ...(header.sensitive_data ? { sensitive_data: header.sensitive_data } : {}),
        });
        if (content.length) {
          sections.push(
            {
              type: "text",
              text: `===== Attachment ${i + 1} of ${selected.length}: ${header.name} (id ${hit.att.id}, ${header.origin}${hit.conversation_id ? `, conversation ${hit.conversation_id}` : ""}) =====\nStatus: ${status}${continueWith ? ` (${continueWith})` : ""}\nHandling: ${header.handling}${header.sensitive_data ? `\nSensitive data: ${(header.sensitive_data as { found: string[] }).found.join(", ")}` : ""}`,
            },
            ...content,
          );
        }
        if (cut) {
          // A file larger than a whole response: what fits was returned, continue after it.
          if (i + 1 < selected.length) nextCursor = i + 1;
          break;
        }
      }

      const count = (st: FileStatus) => entries.filter((e) => e.status === st).length;
      const sensitiveFiles = entries.filter((e) => e.sensitive_data).map((e) => e.name);
      const overview = {
        ticket_id,
        attachments: selected.length,
        this_call: entries.length
          ? `attachments ${cursor + 1} to ${cursor + entries.length} of ${selected.length}`
          : "none",
        read: count("read"),
        partial: count("partial"),
        not_analysed: count("not_analysed"),
        ...(count("disabled") ? { disabled: count("disabled") } : {}),
        errors: count("error"),
        ...(nextCursor !== undefined
          ? {
              next_cursor: nextCursor,
              continue: `${selected.length - nextCursor} attachment(s) left: call get_ticket_attachments again with cursor: ${nextCursor}.`,
            }
          : { complete: "All attachments have been returned." }),
        ...(sensitiveFiles.length
          ? {
              sensitive_data_warning: `Sensitive data found in the text of ${sensitiveFiles.length} file(s): ${sensitiveFiles.join(", ")}. See sensitive_data.where in each file.`,
            }
          : {}),
        ...(sections.some((b) => b.type === "image") ? { images_check: IMAGES_CHECK } : {}),
        ...(missing.length ? { not_found: missing } : {}),
        files: entries,
      };
      return {
        content: enforceResponseSize(
          mergeTextBlocks([
            { type: "text", text: JSON.stringify(overview, null, 2) },
            ...(sections.length
              ? [{ type: "text" as const, text: UNTRUSTED_NOTICE }, ...sections]
              : []),
          ]),
        ),
      };
    },
  );

  tool(
    server,
    "list_ticket_attachments",
    "List every file attached to one or more tickets (description and all conversations) without downloading them: id, name, " +
      "type, size, origin and how get_ticket_attachment will handle it. Videos, audio and executables are flagged as not " +
      "analysed. Also counts inline images pasted in message bodies (read them with get_ticket_inline_images). Use " +
      "name_contains to find a file across several tickets.",
    {
      ticket_ids: z.array(z.number().int()).min(1).max(25).describe("Ticket IDs (up to 25)."),
      name_contains: z
        .string()
        .optional()
        .describe("Only return attachments whose file name contains this text (case-insensitive)."),
      archived: archivedArg,
    },
    async ({ ticket_ids, name_contains, archived }): Promise<CallToolResult> => {
      const filter = name_contains?.toLowerCase();
      const results = [];
      for (const ticket_id of ticket_ids) {
        const found = await collectAttachments(ticket_id, archived);
        if (!found.ok) {
          results.push({ ticket_id, error: JSON.parse(found.reply.content[0].text) });
          continue;
        }
        const attachments = found.items
          .filter(
            (c) =>
              !filter ||
              String(c.att.name ?? "")
                .toLowerCase()
                .includes(filter),
          )
          .map((c) => {
            const kind = classifyByName(c.att.name ?? "", c.att.content_type ?? "");
            return {
              id: c.att.id,
              name: c.att.name,
              content_type: c.att.content_type,
              size: c.att.size,
              created_at: c.att.created_at,
              origin: c.origin,
              conversation_id: c.conversation_id ?? null,
              handling: !kindEnabled(kind)
                ? DISABLED_HANDLING
                : isGifName(c.att.name ?? "", c.att.content_type ?? "")
                  ? GIF_LIST_HANDLING
                  : HANDLING[kind],
              analysed: willAnalyse(kind),
            };
          });
        const counts: Record<string, number> = {};
        for (const a of attachments) counts[a.handling] = (counts[a.handling] ?? 0) + 1;
        results.push({
          ticket_id,
          attachment_count: attachments.length,
          by_handling: counts,
          inline_image_count: filter ? undefined : found.inlineImages,
          attachments,
        });
      }
      return text(ticket_ids.length === 1 ? results[0] : { tickets: results });
    },
  );

  tool(
    server,
    "get_ticket_inline_images",
    "Return screenshots/images pasted inline in the ticket description and (optionally) conversation bodies — these are NOT in the " +
      "'attachments' arrays. Each image is labelled with where it came from (description, customer reply, agent reply, private note). " +
      "Duplicates (e.g. from quoted replies) and tiny images (signatures, logos, tracking pixels) are skipped. " +
      "The first content item is a JSON summary of found / returned / skipped images with reasons.",
    {
      ticket_id: ticketId,
      include_conversations: z
        .boolean()
        .optional()
        .default(true)
        .describe("Also scan reply/note bodies (default true)."),
      max_images: z
        .number()
        .int()
        .min(1)
        .max(30)
        .optional()
        .default(10)
        .describe("Max images returned."),
      min_dimension: z
        .number()
        .int()
        .min(0)
        .optional()
        .default(MIN_IMAGE_DIMENSION)
        .describe(
          `Skip images whose width AND height are below this many pixels (0 = keep all). Default ${MIN_IMAGE_DIMENSION} (FRESHDESK_MIN_IMAGE_DIMENSION).`,
        ),
      archived: archivedArg,
    },
    async ({
      ticket_id,
      include_conversations,
      max_images,
      min_dimension,
      archived,
    }): Promise<CallToolResult> => {
      if (!kindEnabled("image"))
        return text({ ticket_id, error: "Images are disabled by FRESHDESK_ATTACHMENT_TYPES" });
      const t = await loadTicket(ticket_id, archived, include_conversations);
      if (!t.ok) return t.reply;

      const sources: { src: string; origin: string }[] = [];
      for (const src of extractImgSrcs(t.ticket.description))
        sources.push({ src, origin: "description" });
      for (const c of t.conversations) {
        const label = `${conversationLabel(c)} #${c.id} (${c.created_at ?? "?"})`;
        for (const src of extractImgSrcs(c.body)) sources.push({ src, origin: label });
      }

      const seen = new Set<string>();
      const returned: {
        index: number;
        origin: string;
        content_type: string;
        bytes: number;
        width?: number;
        height?: number;
      }[] = [];
      const skipped: { origin: string; src: string; reason: string }[] = [];
      const images: CallToolResult["content"] = [];
      let total = 0;
      // Keeps the response under the client size limit (images recompressed when possible).
      const sizeBudget = new Budget({
        maxTextChars: 10_000,
        maxPages: 0,
        maxImages: max_images,
        harRaw: false,
      });

      for (const { src, origin } of sources) {
        const shortSrc = src.startsWith("data:") ? `${src.slice(0, 40)}…` : src.split("?")[0];
        const key = src.startsWith("data:") ? src : src.split("?")[0];
        if (seen.has(key)) {
          skipped.push({ origin, src: shortSrc, reason: "duplicate" });
          continue;
        }
        seen.add(key);
        if (returned.length >= max_images) {
          skipped.push({ origin, src: shortSrc, reason: "max_images reached" });
          continue;
        }
        if (total >= MAX_TOTAL_BYTES) {
          skipped.push({ origin, src: shortSrc, reason: "per-call size budget exhausted" });
          continue;
        }
        if (src.startsWith("cid:")) {
          skipped.push({
            origin,
            src: shortSrc,
            reason: "cid: reference (email image not stored by Freshdesk)",
          });
          continue;
        }

        let bytes: Buffer;
        let contentType: string;
        if (src.startsWith("data:")) {
          const d = decodeDataUri(src);
          if (!d) {
            skipped.push({ origin, src: shortSrc, reason: "invalid data: URI" });
            continue;
          }
          if (d.bytes.length > MAX_FILE_BYTES) {
            skipped.push({ origin, src: shortSrc, reason: "too large" });
            continue;
          }
          ({ bytes, contentType } = d);
        } else {
          const dl = await download(src, Math.min(MAX_FILE_BYTES, MAX_TOTAL_BYTES - total));
          if (!dl.ok) {
            skipped.push({ origin, src: shortSrc, reason: dl.reason });
            continue;
          }
          ({ bytes, contentType } = dl);
        }

        if (!contentType.startsWith("image/") || contentType === "image/svg+xml") {
          skipped.push({ origin, src: shortSrc, reason: `not a raster image (${contentType})` });
          continue;
        }
        if (isAnimatedGif(bytes)) {
          skipped.push({ origin, src: shortSrc, reason: ANIMATED_GIF_HANDLING });
          continue;
        }
        const dim = imageSize(bytes);
        if (dim && min_dimension > 0 && dim.width < min_dimension && dim.height < min_dimension) {
          skipped.push({ origin, src: shortSrc, reason: `too small (${dim.width}x${dim.height})` });
          continue;
        }
        if (total + bytes.length > MAX_TOTAL_BYTES) {
          skipped.push({ origin, src: shortSrc, reason: "per-call size budget exhausted" });
          continue;
        }
        total += bytes.length;
        // BMP, TIFF and HEIC cannot be viewed by the model and are not converted.
        const mime = sniffSupportedImage(bytes);
        if (!mime) {
          skipped.push({ origin, src: shortSrc, reason: `${contentType}: ${UNSUPPORTED_IMAGE}` });
          continue;
        }
        const fit = await sizeBudget.fitImage(bytes, mime);
        if (!fit) {
          skipped.push({
            origin,
            src: shortSrc,
            reason: `does not fit in this response (MCP clients reject results over about ${Math.round(MAX_RESPONSE_BYTES / 1024)} KB)`,
          });
          continue;
        }
        bytes = fit.data;
        contentType = fit.mimeType;
        const index = returned.length + 1;
        returned.push({ index, origin, content_type: contentType, bytes: bytes.length, ...dim });
        images.push({ type: "text", text: `Image ${index} — ${origin}` });
        images.push({ type: "image", data: bytes.toString("base64"), mimeType: contentType });
      }

      const summary = {
        ticket_id,
        found: sources.length,
        returned: returned.length,
        skipped: skipped.length,
        images: returned,
        skipped_details: skipped,
      };
      return {
        content: enforceResponseSize(
          mergeTextBlocks([{ type: "text", text: JSON.stringify(summary, null, 2) }, ...images]),
        ),
      };
    },
  );
}
