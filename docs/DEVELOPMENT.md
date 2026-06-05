# Development Guide

This document describes the runtime architecture and the workflow for adding a new tool, schema, or transport.

---

## Prerequisites

- Node.js ≥ 18 (native `fetch`).
- npm ≥ 9.
- (Optional) a Freshdesk sandbox account for end-to-end testing.

```bash
git clone <repo>
cd freshdesk-mcp
npm install
npm run build
```

---

## Runtime Architecture

```
                   ┌──────────────────────────────┐
   stdin/stdout ──▶│  StdioServerTransport         │
                   │      or                       │
   POST /mcp    ──▶│  StreamableHTTPServerTransport│──┐
                   └──────────────────────────────┘  │
                                                     ▼
                                ┌──────────────────────────────┐
                                │  McpServer  (per session)    │
                                │  (built by `buildServer()`)  │
                                └──────────────────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                ▼                      ▼                      ▼
           registerTool(...)      registerPrompt(...)     handlers
                │                      │                      │
                │   (via util.tool)    │                      │
                ▼                      ▼                      ▼
          src/tools/*.ts         src/prompts.ts        src/freshdesk.ts
                │                                            │
                ▼                                            ▼
          src/schemas/index.ts                         Freshdesk REST API
          (Zod validation)                            (basic-auth + JSON)
```

### Entry point: `src/index.ts`

- Picks transport based on `--transport=` CLI flag → `MCP_TRANSPORT` env → default `stdio`.
- `runStdio()` — single `McpServer` over `StdioServerTransport`.
- `runHttp()` — Express app exposing `/mcp` + `/health`. Each `initialize` creates a fresh `McpServer` + `StreamableHTTPServerTransport`, indexed by `mcp-session-id`.

### Server builder: `src/server.ts`

`buildServer()` constructs the `McpServer` and registers every group of tools + the two prompts. Adding a new tool group means adding one `register*Tools(server)` call here.

### Tool registration helper: `src/util.ts`

```ts
export function tool<S extends Record<string, any>>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: S,
  cb: ToolCallback<S>,
) {
  return server.registerTool(name, { description, inputSchema }, cb);
}
```

Plus `text(obj)` (wraps any value into MCP `content[]`) and `validate(schema, data)` (runs `safeParse` and returns either `{ ok: true, data }` or `{ ok: false, reply: text({error, issues}) }`).

### Freshdesk client: `src/freshdesk.ts`

- Thin `fd.get/post/put/delete(path, body|query)` wrapper around `fetch`.
- Adds `Basic ${base64(API_KEY:X)}` and `Content-Type: application/json`.
- Returns `{ status, data, headers, ok }`.
- `parseLinkHeader()` extracts `next`/`prev` page integers from the `Link` response header.
- `errorPayload(prefix, res)` produces a uniform `{error, details}` shape for non-2xx responses.

### Schemas: `src/schemas/index.ts`

Zod schemas grouped by Freshdesk resource. Conventions:

- `*Create` — required fields enforced via `.refine()` or required field types.
- `*Update` — same base shape with **all fields optional**.
- `.passthrough()` everywhere so unknown keys (custom fields, vendor extensions) survive.
- Numeric Freshdesk enums modeled as literal unions.

See [SCHEMAS.md](SCHEMAS.md) for the full reference.

---

## Adding a New Tool

Suppose Freshdesk releases a new endpoint `POST /api/v2/widgets`.

### 1. Add the schema

In `src/schemas/index.ts`:

```ts
const WidgetBase = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  size: z.number().int().optional(),
  custom_fields: CustomFields.optional(),
}).passthrough();

export const WidgetCreate = WidgetBase.refine(
  v => !!v.name,
  { message: "name is required" },
);

export const WidgetUpdate = WidgetBase;
```

### 2. Add the tool

Pick the most-related module (`src/tools/admin_misc.ts` is the catch-all). Or create a new file `src/tools/widgets.ts`:

```ts
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fd, errorPayload } from "../freshdesk.js";
import { text, validate, tool } from "../util.js";
import { WidgetCreate, WidgetUpdate } from "../schemas/index.js";

export function registerWidgetTools(server: McpServer) {
  tool(server, "list_widgets", "List widgets.", {
    page: z.number().int().min(1).optional().default(1),
    per_page: z.number().int().min(1).max(100).optional().default(30),
  }, async ({ page, per_page }) => {
    const res = await fd.get("/widgets", { page, per_page });
    return text(res.ok ? res.data : errorPayload("Failed to list widgets", res));
  });

  tool(server, "create_widget", "Create a widget.",
    { widget: z.record(z.any()) },
    async ({ widget }) => {
      const v = validate(WidgetCreate, widget);
      if (!v.ok) return v.reply;
      const res = await fd.post("/widgets", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create widget", res));
    },
  );
}
```

### 3. Wire it up

In `src/server.ts`:

```ts
import { registerWidgetTools } from "./tools/widgets.js";
// ...
registerWidgetTools(server);
```

### 4. Build + smoke test

```bash
npm run build
FRESHDESK_API_KEY=test FRESHDESK_DOMAIN=example.freshdesk.com node dist/index.js
# Send a tools/list JSON-RPC and confirm your new tool appears.
```

### 5. Document

- Add the entries to [docs/API.md](API.md) under the appropriate section.
- Document the schema in [docs/SCHEMAS.md](SCHEMAS.md).
- Add a line to [CHANGELOG.md](../CHANGELOG.md) under "Unreleased".

---

## Adding a New Transport

`runHttp()` in `src/index.ts` is the reference implementation for non-stdio transports. To add (say) WebSocket:

1. Add a new branch in `detectMode()`.
2. Implement `runWebSocket()` that constructs an `McpServer`, attaches the new `Transport` (from `@modelcontextprotocol/sdk/server/`), and calls `server.connect(transport)`.
3. Update [CONFIGURATION.md](CONFIGURATION.md).

---

## Smoke-Testing Locally

Spin up the stdio server and drive it with raw JSON-RPC:

```bash
FRESHDESK_API_KEY=test FRESHDESK_DOMAIN=example.freshdesk.com node -e '
const { spawn } = require("child_process");
const p = spawn("node", ["dist/index.js"]);
let buf = "";
p.stdout.on("data", d => buf += d);
const send = o => p.stdin.write(JSON.stringify(o) + "\n");
send({jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"smoke",version:"0"}}});
setTimeout(() => {
  send({jsonrpc:"2.0",method:"notifications/initialized"});
  send({jsonrpc:"2.0",id:2,method:"tools/list",params:{}});
}, 200);
setTimeout(() => {
  for (const l of buf.split("\n").filter(Boolean)) {
    try { const m = JSON.parse(l); if (m.id === 2) console.log("tools:", m.result.tools.length); } catch {}
  }
  p.kill(); process.exit(0);
}, 1500);
'
```

Or hit the HTTP variant with `curl`:

```bash
MCP_TRANSPORT=http PORT=3000 node dist/index.js &
curl -s http://localhost:3000/health
# {"status":"ok","server":"freshdesk-mcp","transport":"http"}
```

---

## Validation Test Recipes

Pass intentionally bad input and confirm Zod rejects it before any HTTP call:

```jsonc
// create_ticket with invalid status enum
{"name":"create_ticket","arguments":{"ticket":{"status":99,"priority":1}}}
// → {"error":"Validation error","issues":[{"path":"status","code":"invalid_union",...}]}

// create_ticket missing requester
{"name":"create_ticket","arguments":{"ticket":{"subject":"hi","description":"t"}}}
// → "Provide one of: email, requester_id, facebook_id, phone, twitter_id, unique_external_id"
```

---

## Build & Type-Check

- `npm run build` — single `tsc` pass. Output to `dist/`.
- The codebase ships with `strict: true`, `forceConsistentCasingInFileNames: true`, and source maps enabled.
- There should be **zero** `error` and **zero** `deprecation hint` diagnostics on a clean build. If you see deprecation hints, you're using an older SDK method — switch to `registerTool` / `registerPrompt`.

---

## Coding Style

- TypeScript ESM (`"type": "module"`, `Node16` module resolution).
- 2-space indent, double quotes, semicolons.
- Prefer narrow Zod schemas in `src/schemas/` over inline `z.record(z.any())` so input gets validated, not just typed.
- Keep tool descriptions short (one sentence, imperative). Clients display them in tool pickers.
- Error responses follow the convention:
  ```ts
  return text({ error: "Failed to do X", details: res.data });
  ```
- Don't log to stdout in stdio mode — it corrupts the JSON-RPC channel. Use `console.error`.

---

## Releasing

Releases are fully automated via [release-please](https://github.com/googleapis/release-please) — **do not** manually bump versions, edit `CHANGELOG.md`, or push tags.

### How it works

1. Every commit to `main` triggers the **Release** workflow (`.github/workflows/release-please.yml`).
2. `release-please` scans commit messages since the last release and, if there are releasable changes (`feat:`, `fix:`, `perf:`, breaking), opens or updates a **Release PR** that:
   - Bumps `version` in `package.json`
   - Generates / updates `CHANGELOG.md`
3. When a maintainer **merges the Release PR**, the workflow automatically:
   - Creates the GitHub release and git tag (`vX.Y.Z`)
   - Publishes the package to npm with provenance attestation

### Commit message conventions

release-please derives the next version from [Conventional Commits](https://www.conventionalcommits.org/):

| Commit prefix | Version bump |
|---|---|
| `fix:` | patch (1.0.**1**) |
| `feat:` | minor (1.**1**.0) |
| `feat!:` or `BREAKING CHANGE:` footer | major (**2**.0.0) |
| `docs:`, `chore:`, `refactor:`, `test:`, `ci:` | no release |

### Manual publish (emergency / beta)

Use the **Publish (manual)** workflow in GitHub Actions (`workflow_dispatch`) and set the desired `dist-tag` (e.g. `beta`, `next`). This should only be needed for out-of-band releases.
