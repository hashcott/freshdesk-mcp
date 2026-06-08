<h1 align="center">freshdesk-mcp</h1>

<p align="center">
  <strong>Model Context Protocol server for the Freshdesk REST API</strong><br>
  TypeScript · Zod validation · stdio &amp; Streamable HTTP transports
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/freshdesk-mcp"><img src="https://img.shields.io/npm/v/freshdesk-mcp.svg" alt="npm"></a>
  <a href="https://www.npmjs.com/package/freshdesk-mcp"><img src="https://img.shields.io/npm/dw/freshdesk-mcp.svg" alt="npm downloads"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg" alt="Node"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg" alt="TypeScript"></a>
  <a href="https://github.com/modelcontextprotocol/typescript-sdk"><img src="https://img.shields.io/badge/MCP%20SDK-1.29-purple.svg" alt="MCP SDK"></a>
  <a href="docs/API.md"><img src="https://img.shields.io/badge/tools-194-orange.svg" alt="Tools"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
</p>

<p align="center">
  Exposes the full <a href="https://developers.freshdesk.com/api/">Freshdesk public API</a> as MCP tools —
  compatible with Claude Desktop, Cursor, Continue, and any MCP-capable LLM client.
</p>

---

## Table of Contents

- [Highlights](#highlights)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
  - [stdio (local)](#stdio-local)
  - [Streamable HTTP (remote / hosted)](#streamable-http-remote--hosted)
  - [Docker](#docker)
- [Client Integration](#client-integration)
- [Tool & Prompt Catalog](#tool--prompt-catalog)
- [Project Layout](#project-layout)
- [Development](#development)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Highlights

| | |
|---|---|
| **194 tools** | Tickets, Conversations, Contacts, Agents, Skills, Roles, Groups, Companies, Discussions, Solutions, Surveys, FSM, Time Entries, Email Configs, Products, Business Hours, SLA, Automations, Custom Objects, Canned Responses, Outbound Messages, and more |
| **2 prompts** | `create_ticket`, `create_reply` |
| **Strict Zod validation** | Derived from official Freshdesk docs — invalid input is rejected before hitting the API, with structured `{path, code, message}` errors |
| **Dual transport** | `stdio` for local clients (Claude Desktop, Cursor) or `Streamable HTTP` for hosted/remote agents |
| **Pagination** | Link-header parsing + `page` / `per_page` on every list endpoint |
| **Single binary** | `node dist/index.js` — zero runtime dependencies on Python or Freshdesk SDKs |
| **No deprecation warnings** | Built on `@modelcontextprotocol/sdk@^1.29.0` using `registerTool` / `registerPrompt` |

---

## Quick Start

```bash
# 1. Set credentials
export FRESHDESK_API_KEY=your_api_key
export FRESHDESK_DOMAIN=yourcompany.freshdesk.com

# 2a. Run via npx (no install needed)
npx freshdesk-mcp

# 2b. Or install globally
npm install -g freshdesk-mcp && freshdesk-mcp

# 2c. Or run as HTTP server
MCP_TRANSPORT=http PORT=3000 npx freshdesk-mcp
# → POST  http://localhost:3000/mcp
# → GET   http://localhost:3000/health
```

---

## Installation

Requires **Node.js ≥ 18** (uses the native `fetch` API).

**From npm (recommended)**

```bash
npm install -g freshdesk-mcp
freshdesk-mcp
```

**Using npx (no install needed)**

```bash
npx freshdesk-mcp
```

**From source**

```bash
git clone <this-repo>
cd freshdesk-mcp
npm install && npm run build
```

Build artifacts land in `dist/`. Runnable as `node dist/index.js` or via the `freshdesk-mcp` bin shortcut when installed globally.

---

## Configuration

| Env Var | Required | Default | Description |
|---|---|---|---|
| `FRESHDESK_API_KEY` | ✅ | — | API key from your Freshdesk profile → **Profile → API Key** |
| `FRESHDESK_DOMAIN` | ✅ | — | Account domain, e.g. `acme.freshdesk.com` (no scheme, no trailing `/`) |
| `MCP_TRANSPORT` | ❌ | `stdio` | `stdio` or `http` |
| `PORT` | ❌ | `3000` | HTTP listen port (only when `MCP_TRANSPORT=http`) |

Copy `.env.example` to `.env` and load via your runner for a file-based workflow.

> Full reference: **[docs/CONFIGURATION.md](docs/CONFIGURATION.md)**

---

## Running the Server

### stdio (local)

Default mode — reads/writes JSON-RPC on stdin/stdout. This is what Claude Desktop, Cursor, and Continue expect.

```bash
node dist/index.js
# equivalently:
MCP_TRANSPORT=stdio node dist/index.js
node dist/index.js --transport=stdio
```

### Streamable HTTP (remote / hosted)

Conforms to the MCP **Streamable HTTP** transport spec (single endpoint, session-based via `mcp-session-id` header).

```bash
MCP_TRANSPORT=http PORT=3000 node dist/index.js
```

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/mcp` | Initialize a session or send a JSON-RPC request |
| `GET` | `/mcp` | SSE stream for server-initiated messages (per-session) |
| `DELETE` | `/mcp` | Terminate a session |
| `GET` | `/health` | Liveness probe — `{ status: "ok", ... }` |

### Docker

```bash
docker build -t freshdesk-mcp .

# stdio mode
docker run --rm -i \
  -e FRESHDESK_API_KEY=xxx \
  -e FRESHDESK_DOMAIN=acme.freshdesk.com \
  freshdesk-mcp

# HTTP mode
docker run --rm -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e FRESHDESK_API_KEY=xxx \
  -e FRESHDESK_DOMAIN=acme.freshdesk.com \
  freshdesk-mcp
```

---

## Client Integration

All stdio-based MCP clients accept the same shape: a `command` + `args` + `env`. The examples below assume you've either installed globally (`npm install -g freshdesk-mcp`) or you let `npx -y freshdesk-mcp` fetch on demand. Replace credentials with your own.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) · `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "freshdesk": {
      "command": "npx",
      "args": ["-y", "freshdesk-mcp"],
      "env": {
        "FRESHDESK_API_KEY": "xxx",
        "FRESHDESK_DOMAIN": "acme.freshdesk.com"
      }
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add freshdesk \
  --env FRESHDESK_API_KEY=xxx \
  --env FRESHDESK_DOMAIN=acme.freshdesk.com \
  -- npx -y freshdesk-mcp
```

Or edit `~/.claude.json` (project-level) → `mcpServers` with the same shape as Claude Desktop above.

### Cursor

`~/.cursor/mcp.json` (global) or `<project>/.cursor/mcp.json` (per project):

```json
{
  "mcpServers": {
    "freshdesk": {
      "command": "npx",
      "args": ["-y", "freshdesk-mcp"],
      "env": {
        "FRESHDESK_API_KEY": "xxx",
        "FRESHDESK_DOMAIN": "acme.freshdesk.com"
      }
    }
  }
}
```

Enable it under **Settings → Cursor Settings → MCP**.

### OpenAI Codex CLI

`~/.codex/config.toml`:

```toml
[mcp_servers.freshdesk]
command = "npx"
args = ["-y", "freshdesk-mcp"]
env = { FRESHDESK_API_KEY = "xxx", FRESHDESK_DOMAIN = "acme.freshdesk.com" }
```

### Windsurf (Codeium)

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "freshdesk": {
      "command": "npx",
      "args": ["-y", "freshdesk-mcp"],
      "env": {
        "FRESHDESK_API_KEY": "xxx",
        "FRESHDESK_DOMAIN": "acme.freshdesk.com"
      }
    }
  }
}
```

### Continue

`~/.continue/config.json` (or `.continue/config.json` in a workspace) under the `mcpServers` array:

```json
{
  "mcpServers": [
    {
      "name": "freshdesk",
      "command": "npx",
      "args": ["-y", "freshdesk-mcp"],
      "env": {
        "FRESHDESK_API_KEY": "xxx",
        "FRESHDESK_DOMAIN": "acme.freshdesk.com"
      }
    }
  ]
}
```

### Zed

In Zed's `settings.json` under `context_servers`:

```json
{
  "context_servers": {
    "freshdesk": {
      "command": {
        "path": "npx",
        "args": ["-y", "freshdesk-mcp"],
        "env": {
          "FRESHDESK_API_KEY": "xxx",
          "FRESHDESK_DOMAIN": "acme.freshdesk.com"
        }
      }
    }
  }
}
```

### Generic stdio client

Any client that follows the [MCP stdio transport spec](https://modelcontextprotocol.io/specification#stdio-transport) can spawn:

```bash
FRESHDESK_API_KEY=xxx FRESHDESK_DOMAIN=acme.freshdesk.com npx -y freshdesk-mcp
```

### Remote / HTTP (Streamable HTTP)

For hosted setups (web agents, multi-user gateways), run the server in HTTP mode and point clients at the `/mcp` endpoint:

```bash
MCP_TRANSPORT=http PORT=3000 npx -y freshdesk-mcp
```

Sessions begin with `POST /mcp` containing an `initialize` body; the server returns an `mcp-session-id` header that the client must echo on every subsequent request. Run behind an authenticated reverse proxy — the server itself has no built-in auth.

---

## Tool & Prompt Catalog

> Full tool index with parameter signatures: **[docs/API.md](docs/API.md)**

| Group | Tools | Highlights |
|---|---|---|
| Tickets | 30 | CRUD, bulk_*, restore, archived, merge, forward, summary, satisfaction, time entries |
| Conversations | 6 | Reply, note, update, delete, reply_to_forward |
| Contacts | 17 | CRUD, merge, make_agent, restore, hard_delete, invite, contact fields CRUD |
| Companies | 13 | CRUD, search, company contacts, company fields CRUD |
| Agents + Groups | 18 | Agents CRUD + `me` + bulk; Groups CRUD; Admin-Groups CRUD |
| Solutions | 16 | Categories / folders / articles CRUD + search |
| Discussions | 19 | Forum categories / forums / topics / comments CRUD |
| Time Entries | 6 | CRUD + toggle timer |
| Threads | 9 | Collaboration threads + messages CRUD |
| Automations | 5 | Rules CRUD per type |
| FSM | 8 | Service tasks, appointments, business calendars |
| Custom Objects | 7 | Schemas + records CRUD |
| ...and more | — | Skills, Roles, Products, Business Hours, SLA, Email Configs, Mailboxes, Settings, Account, Jobs, Surveys, Satisfaction Ratings, Outbound, Availability, Omnichannel |

Zod schema reference: **[docs/SCHEMAS.md](docs/SCHEMAS.md)**

---

## Project Layout

```
freshdesk-mcp/
├── src/
│   ├── index.ts              # Entry — picks stdio | http from env/argv
│   ├── server.ts             # Builds McpServer, registers all tools + prompts
│   ├── freshdesk.ts          # Fetch-based HTTP client + Link header parser
│   ├── util.ts               # text(), validate(), tool() wrapper
│   ├── prompts.ts            # create_ticket, create_reply prompts
│   ├── schemas/
│   │   └── index.ts          # Zod schemas for every Freshdesk resource
│   └── tools/
│       ├── tickets.ts        # Tickets + conversations + ticket fields
│       ├── contacts.ts       # Contacts + contact fields
│       ├── companies.ts      # Companies + company fields
│       ├── agents.ts         # Agents + groups + admin-groups
│       ├── canned.ts         # Canned responses + folders
│       ├── solutions.ts      # Categories / folders / articles
│       ├── admin_misc.ts     # Skills, roles, products, BH, SLA, mailboxes,
│       │                     # email configs, settings, account, threads, time entries
│       └── extras.ts         # Discussions, surveys, automations, scenario,
│                             # custom objects, FSM, outbound, jobs,
│                             # availability, omnichannel
├── docs/
│   ├── API.md                # Full tool reference
│   ├── SCHEMAS.md            # Zod schema reference
│   ├── CONFIGURATION.md      # Env vars + transports
│   └── DEVELOPMENT.md        # Dev workflow + architecture
├── dist/                     # Build output (gitignored)
├── Dockerfile
├── package.json
├── tsconfig.json
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE
```

---

## Development

```bash
npm install
npm run dev:stdio    # build + run stdio mode
npm run dev:http     # build + run HTTP mode on PORT (default 3000)
npm run build        # type-check + emit dist/
npm run start        # run from dist/
```

> Architecture notes, adding tools, schema authoring: **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**

---

## Documentation

| Doc | Purpose |
|---|---|
| [docs/API.md](docs/API.md) | Complete tool index, parameter signatures, return shapes |
| [docs/SCHEMAS.md](docs/SCHEMAS.md) | Zod schema reference for every Freshdesk resource |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | Env vars, transports, runtime tuning |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Architecture, adding tools, schema authoring |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community guidelines |
| [SECURITY.md](SECURITY.md) | Reporting vulnerabilities |

**Upstream references**

- [Freshdesk API](https://developers.freshdesk.com/api/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## Contributing

Contributions are welcome. Read **[CONTRIBUTING.md](CONTRIBUTING.md)** before opening a PR and abide by the **[Code of Conduct](CODE_OF_CONDUCT.md)**.

**Quick checklist**

1. Fork and branch off `main`
2. `npm install && npm run build` — must pass cleanly
3. New tools: add Zod schema → register in `src/tools/*.ts` → document in `docs/API.md`
4. Open a PR using the provided template

---

## Security

Found a vulnerability? **Do not open a public issue.** Report via the channels in **[SECURITY.md](SECURITY.md)**.

This server transmits your Freshdesk API key to `*.freshdesk.com` over HTTPS only. The key is never logged. Run the HTTP transport behind an authenticated reverse proxy when exposing it beyond `localhost`.

---

## License

[MIT](LICENSE) © hashcott contributors

---

## Acknowledgments

- The Freshdesk team for the well-documented public API
- The Model Context Protocol authors and `@modelcontextprotocol/sdk` maintainers
