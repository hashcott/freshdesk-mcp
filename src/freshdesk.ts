const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY;
const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN;

if (!FRESHDESK_API_KEY || !FRESHDESK_DOMAIN) {
  console.error(
    "[freshdesk-mcp] FRESHDESK_API_KEY and FRESHDESK_DOMAIN env vars are required"
  );
}

const authHeader = `Basic ${Buffer.from(`${FRESHDESK_API_KEY}:X`).toString("base64")}`;

export const baseUrl = `https://${FRESHDESK_DOMAIN}/api/v2`;

export interface Pagination {
  next: number | null;
  prev: number | null;
}

export function parseLinkHeader(link: string | null): Pagination {
  const out: Pagination = { next: null, prev: null };
  if (!link) return out;
  for (const part of link.split(",")) {
    const m = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (!m) continue;
    const [, url, rel] = m;
    const p = url.match(/[?&]page=(\d+)/);
    if (p && (rel === "next" || rel === "prev")) {
      out[rel] = parseInt(p[1], 10);
    }
  }
  return out;
}

export interface FreshdeskResult<T = any> {
  status: number;
  data: T;
  headers: Headers;
  ok: boolean;
}

async function request<T = any>(
  method: string,
  path: string,
  opts: { query?: Record<string, any>; body?: any } = {}
): Promise<FreshdeskResult<T>> {
  const url = new URL(`${baseUrl}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const init: RequestInit = {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  };
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

  const res = await fetch(url, init);
  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data, headers: res.headers, ok: res.ok };
}

export const fd = {
  get: <T = any>(path: string, query?: Record<string, any>) =>
    request<T>("GET", path, { query }),
  post: <T = any>(path: string, body?: any) =>
    request<T>("POST", path, { body }),
  put: <T = any>(path: string, body?: any) =>
    request<T>("PUT", path, { body }),
  delete: <T = any>(path: string) => request<T>("DELETE", path),
};

export function errorPayload(prefix: string, res: FreshdeskResult) {
  return {
    error: `${prefix}: HTTP ${res.status}`,
    details: res.data,
  };
}
