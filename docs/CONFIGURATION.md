# Configuration Reference

All configuration is via environment variables (read at process start) plus an optional `--transport` CLI flag.

---

## Environment Variables

| Var                  | Required | Default | Accepted Values                  | Description                                                                                              |
| -------------------- | -------- | ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `FRESHDESK_API_KEY`  | yes      | —       | string                           | API key from your Freshdesk profile (Profile → API Key). Used as basic-auth username; password = `X`.    |
| `FRESHDESK_DOMAIN`   | yes      | —       | `*.freshdesk.com`                | Account host, no scheme, no trailing `/`. Example: `acme.freshdesk.com`.                                 |
| `MCP_TRANSPORT`      | no       | `stdio` | `stdio`, `http`                  | Which MCP transport to expose.                                                                           |
| `PORT`               | no       | `3000`  | int 1–65535                      | HTTP listen port. Only used when `MCP_TRANSPORT=http`.                                                   |
| `NODE_ENV`           | no       | unset   | `production`, `development`, ... | Standard Node convention. Only affects defaults in some downstream libs.                                 |

A boot warning is emitted to `stderr` if `FRESHDESK_API_KEY` or `FRESHDESK_DOMAIN` is missing. The server still starts so MCP tool discovery works, but every Freshdesk call will fail.

---

## CLI Flags

`--transport=stdio|http` — overrides `MCP_TRANSPORT`.

```bash
node dist/index.js --transport=http
```

Order of precedence: **CLI flag > env var > default**.

---

## `.env` File

If you want a file-based workflow, copy `.env.example`:

```bash
cp .env.example .env
# edit .env
set -a; source .env; set +a   # bash/zsh
npm start
```

Or use any loader (`dotenv-cli`, `direnv`, your runner). This package does not auto-load `.env`.

---

## Transport: stdio

- JSON-RPC over stdin/stdout (length-prefixed lines).
- Boot announcement on stderr: `[freshdesk-mcp] stdio transport ready`.
- Best for local desktop clients (Claude Desktop, Cursor, Continue, custom CLI agents).

No additional config beyond the env vars above.

---

## Transport: Streamable HTTP

Conforms to the [MCP Streamable HTTP transport](https://modelcontextprotocol.io/specification#streamable-http) spec.

### Endpoints

| Method   | Path      | Purpose                                                                                       |
| -------- | --------- | --------------------------------------------------------------------------------------------- |
| `POST`   | `/mcp`    | Initialize a new session (when body is an `initialize` request) **or** send a JSON-RPC call to an existing session. |
| `GET`    | `/mcp`    | Server-Sent-Events stream for server→client messages, scoped to a session.                    |
| `DELETE` | `/mcp`    | Close a session.                                                                              |
| `GET`    | `/health` | Liveness probe — returns `{"status":"ok","server":"freshdesk-mcp","transport":"http"}`.       |

### Session Lifecycle

1. Client sends `POST /mcp` with `initialize` body. **No** `mcp-session-id` header.
2. Server creates a fresh session, returns `mcp-session-id: <uuid>` in response headers.
3. Client echoes that header on every subsequent `POST`, `GET`, `DELETE`.
4. Calling `DELETE /mcp` (or letting the underlying stream close) terminates the session.

### Behaviour Notes

- Request body size cap: `10mb` (Express JSON limit).
- One `McpServer` instance is built per session, so per-session state is isolated.
- The Freshdesk HTTP client is shared (process-wide singleton).

### Hosting Tips

- Run behind an authenticated reverse proxy (Caddy, nginx, Cloudflare Access, Tailscale Funnel, ...). The server itself has **no built-in auth**.
- Issue a separate Freshdesk API key per deployment so you can revoke independently.
- For container orchestration, the `/health` endpoint is suitable for readiness/liveness probes.

---

## Logging

- `console.error` is used for boot, transport-ready, and fatal messages — stays out of stdout so it does not corrupt the stdio JSON-RPC channel.
- Successful tool calls are not logged. Validation failures are returned to the caller, not logged.
- Verbose logging is not configurable (yet). Wrap with a `pino`/`winston` middleware if you need structured logs.

---

## Rate Limiting

Freshdesk enforces per-account rate limits (typically 50–200 requests/minute depending on plan). This server does **not** add a local rate limiter — if you build automation that fans out heavily, queue calls on the client side, or wrap with a token-bucket proxy.

---

## Pagination Defaults

List endpoints share:

| Param      | Default | Range  |
| ---------- | ------- | ------ |
| `page`     | `1`     | ≥ 1    |
| `per_page` | `30`    | 1–100  |

Where the Freshdesk response carries a `Link` header, the parsed `next_page` / `prev_page` integers are included in the tool result under `pagination`.
