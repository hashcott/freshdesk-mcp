import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { errorPayload, fd } from "../freshdesk.js";
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
// these tools is kept under this size, counting base64 images and text.
export const MAX_RESPONSE_BYTES = Number(process.env.FRESHDESK_MAX_RESPONSE_BYTES) || 900 * 1024;
const base64Length = (bytes: number) => Math.ceil(bytes / 3) * 4;

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

// ─── Tools ────────────────────────────────────────

export function registerAttachmentTools(server: McpServer) {
  tool(
    server,
    "get_ticket_attachment",
    "Download and read one attachment from a ticket or any of its conversations. Images come back as viewable images, " +
      "text-like files (log, txt, json, xml, csv, yaml, har…) as text, other files (PDF, zip, Office…) as an embedded base64 resource. " +
      "Video and audio are not downloaded, and files too large for one response (FRESHDESK_MAX_RESPONSE_BYTES) return their metadata. " +
      "Get attachment IDs from the 'attachments' arrays of get_ticket / get_ticket_conversation. " +
      `Max ${Math.round(MAX_FILE_BYTES / 1048576)} MB (FRESHDESK_MAX_ATTACHMENT_BYTES).`,
    {
      ticket_id: ticketId,
      attachment_id: z.number().int().describe("Attachment ID."),
      archived: archivedArg,
    },
    async ({ ticket_id, attachment_id, archived }): Promise<CallToolResult> => {
      // Re-fetch: attachment_url is a short-lived signed URL.
      const t = await loadTicket(ticket_id, archived, true);
      if (!t.ok) return t.reply;
      const all = [
        ...(t.ticket.attachments ?? []),
        ...t.conversations.flatMap((c: any) => c.attachments ?? []),
      ];
      const att = all.find((a: any) => a.id === attachment_id);
      if (!att) {
        return text({
          error: `Attachment ${attachment_id} not found on ticket ${ticket_id}`,
          available: all.map((a: any) => ({
            id: a.id,
            name: a.name,
            content_type: a.content_type,
            size: a.size,
          })),
        });
      }
      if (isMedia(att.content_type ?? "", att.name)) {
        return text({
          id: att.id,
          name: att.name,
          content_type: att.content_type,
          size: att.size,
          note: "Video and audio cannot be read by the model, so the file was not downloaded.",
        });
      }
      const dl = await download(att.attachment_url);
      if (!dl.ok) return text({ error: `Could not download '${att.name}': ${dl.reason}` });
      const contentType = att.content_type || dl.contentType;
      const meta = { id: att.id, name: att.name, content_type: contentType, size: dl.bytes.length };
      const tooLarge =
        !isTextual(contentType, att.name) &&
        base64Length(dl.bytes.length) > MAX_RESPONSE_BYTES - 2048;
      if (tooLarge) {
        return text({
          ...meta,
          note: `Too large to return in one response (MCP clients reject results over about ${Math.round(MAX_RESPONSE_BYTES / 1024)} KB, FRESHDESK_MAX_RESPONSE_BYTES).`,
        });
      }
      if (contentType.startsWith("image/") && contentType !== "image/svg+xml") {
        return {
          content: [
            { type: "text", text: JSON.stringify(meta) },
            { type: "image", data: dl.bytes.toString("base64"), mimeType: contentType },
          ],
        };
      }
      if (isTextual(contentType, att.name)) {
        let body = dl.bytes.toString("utf8");
        const room = MAX_RESPONSE_BYTES - 4096;
        if (Buffer.byteLength(body) > room) {
          const kept = Buffer.from(body)
            .subarray(0, room)
            .toString("utf8")
            .replace(/\uFFFD$/, "");
          body = `${kept}\n\n[TRUNCATED: ${kept.length} of ${body.length} characters, response size limit]`;
        }
        return { content: [{ type: "text", text: `${JSON.stringify(meta)}\n\n${body}` }] };
      }
      return {
        content: [
          { type: "text", text: JSON.stringify(meta) },
          {
            type: "resource",
            resource: {
              uri: `freshdesk://tickets/${ticket_id}/attachments/${att.id}/${encodeURIComponent(att.name ?? "file")}`,
              mimeType: contentType,
              blob: dl.bytes.toString("base64"),
            },
          },
        ],
      };
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
        .default(100)
        .describe("Skip images whose width AND height are below this many pixels (0 = keep all)."),
      archived: archivedArg,
    },
    async ({
      ticket_id,
      include_conversations,
      max_images,
      min_dimension,
      archived,
    }): Promise<CallToolResult> => {
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
      // Room for the JSON summary is kept aside.
      let responseRoom = MAX_RESPONSE_BYTES - 16 * 1024;

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
        const dim = imageSize(bytes);
        if (dim && min_dimension > 0 && dim.width < min_dimension && dim.height < min_dimension) {
          skipped.push({ origin, src: shortSrc, reason: `too small (${dim.width}x${dim.height})` });
          continue;
        }
        if (total + bytes.length > MAX_TOTAL_BYTES) {
          skipped.push({ origin, src: shortSrc, reason: "per-call size budget exhausted" });
          continue;
        }
        if (base64Length(bytes.length) > responseRoom) {
          skipped.push({
            origin,
            src: shortSrc,
            reason: `does not fit in this response (MCP clients reject results over about ${Math.round(MAX_RESPONSE_BYTES / 1024)} KB)`,
          });
          continue;
        }
        responseRoom -= base64Length(bytes.length);
        total += bytes.length;
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
      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }, ...images] };
    },
  );
}
