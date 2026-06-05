# freshdesk-mcp

> Model Context Protocol (MCP) server for the **Freshdesk** REST API — written in TypeScript, with full Zod validation, supporting both stdio and Streamable HTTP transports.

[![npm](https://img.shields.io/npm/v/freshdesk-mcp.svg)](https://www.npmjs.com/package/freshdesk-mcp)
[![npm downloads](https://img.shields.io/npm/dw/freshdesk-mcp.svg)](https://www.npmjs.com/package/freshdesk-mcp)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-1.29-purple.svg)](https://github.com/modelcontextprotocol/typescript-sdk)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Tools](https://img.shields.io/badge/tools-194-orange.svg)](docs/API.md)

This server exposes the full Freshdesk public API (https://developers.freshdesk.com/api/) as MCP tools that any compatible LLM client (Claude Desktop, Cursor, Continue, custom agents, etc.) can call.

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

- **194 tools** spanning every resource in the Freshdesk public API:
  Tickets, Conversations, Contacts, Agents, Skills, Roles, Groups, Admin-Groups, Companies, Discussions, Solutions, Customer Satisfaction, Surveys, Field Service Management, Time Entries, Email Configs, Email Mailboxes, Products, Business Hours, Scenario Automations, SLA Policies, Omnichannel Activities, Automations, Settings, Threads, Ticket/Contact/Company Fields, Custom Objects, Canned Responses, Availability, Account, Jobs, Outbound Messages.
- **2 prompts**: `create_ticket`, `create_reply`.
- **Strict Zod schemas** derived from the official Freshdesk dev docs — invalid input is rejected *before* hitting the API, with structured `{path, code, message}` errors.
- **Dual transport**: stdio (Claude Desktop, Cursor, local tools) **or** Streamable HTTP (hosted, remote agents) — selectable via env var.
- **No deprecation warnings** — built on `@modelcontextprotocol/sdk@^1.29.0` using `registerTool` / `registerPrompt`.
- **Pagination**: Link-header parsing + `page` / `per_page` on every list endpoint.
- **Single binary**: one `node dist/index.js`, zero runtime dependencies on Python or Freshdesk SDKs.

---

## Quick Start

```bash
# 1. Configure
export FRESHDESK_API_KEY=your_api_key
export FRESHDESK_DOMAIN=yourcompany.freshdesk.com

# 2. Run via npx (no install needed)
npx freshdesk-mcp

# OR install globally and run
npm install -g freshdesk-mcp
freshdesk-mcp

# OR run as HTTP server
MCP_TRANSPORT=http PORT=3000 npx freshdesk-mcp
# → POST  http://localhost:3000/mcp
# → GET   http://localhost:3000/health
```

---

## Installation

Requires **Node.js ≥ 18** (uses the native `fetch` API).

### From npm (recommended)

```bash
# Install globally
npm install -g freshdesk-mcp

# Run directly
freshdesk-mcp
```

### Using npx (no install needed)

```bash
npx freshdesk-mcp
```

### From source

```bash
git clone <this-repo>
cd freshdesk-mcp
npm install
npm run build
```

Build artifacts land in `dist/`. The package is executable as `node dist/index.js` or via the `bin` shortcut `freshdesk-mcp` when installed globally.

---

## Configuration

| Env Var               | Required | Default | Description                                                            |
| --------------------- | -------- | ------- | ---------------------------------------------------------------------- |
| `FRESHDESK_API_KEY`   | ✅       | —       | API key from your Freshdesk profile (Profile → API Key)                |
| `FRESHDESK_DOMAIN`    | ✅       | —       | Account domain, e.g. `acme.freshdesk.com` (no scheme, no trailing `/`) |
| `MCP_TRANSPORT`       | ❌       | `stdio` | `stdio` or `http`                                                      |
| `PORT`                | ❌       | `3000`  | HTTP listen port (only when `MCP_TRANSPORT=http`)                      |

Copy `.env.example` to `.env` and load via your runner if you prefer a file-based workflow.

Full configuration reference: **[docs/CONFIGURATION.md](docs/CONFIGURATION.md)**.

---

## Running the Server

### stdio (local)

Default mode — the server reads/writes JSON-RPC on stdin/stdout. This is the form Claude Desktop / Cursor / Continue expect.

```bash
node dist/index.js
# or
MCP_TRANSPORT=stdio node dist/index.js
# or
node dist/index.js --transport=stdio
```

### Streamable HTTP (remote / hosted)

Conforms to the MCP **Streamable HTTP** transport spec (single endpoint, session-based via `mcp-session-id` header).

```bash
MCP_TRANSPORT=http PORT=3000 node dist/index.js
```

Endpoints:

| Method   | Path     | Purpose                                                  |
| -------- | -------- | -------------------------------------------------------- |
| `POST`   | `/mcp`   | Initialize a session or send a JSON-RPC request          |
| `GET`    | `/mcp`   | SSE stream for server-initiated messages (per-session)   |
| `DELETE` | `/mcp`   | Terminate a session                                      |
| `GET`    | `/health`| Liveness probe (`{status: "ok", ...}`)                   |

### Docker

```bash
docker build -t freshdesk-mcp .

# stdio
docker run --rm -i \
  -e FRESHDESK_API_KEY=xxx \
  -e FRESHDESK_DOMAIN=acme.freshdesk.com \
  freshdesk-mcp

# HTTP
docker run --rm -p 3000:3000 \
  -e MCP_TRANSPORT=http \
  -e FRESHDESK_API_KEY=xxx \
  -e FRESHDESK_DOMAIN=acme.freshdesk.com \
  freshdesk-mcp
```

---

## Client Integration

### Claude Desktop / Claude Code

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

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

If installed globally via `npm install -g freshdesk-mcp`:

```json
{
  "mcpServers": {
    "freshdesk": {
      "command": "freshdesk-mcp",
      "env": {
        "FRESHDESK_API_KEY": "xxx",
        "FRESHDESK_DOMAIN": "acme.freshdesk.com"
      }
    }
  }
}
```

### Cursor / Continue / other stdio-based clients

Same command + env shape — see your client's MCP server config docs.

### Remote / HTTP

Point your client at `http://your-host:3000/mcp` (or behind a reverse proxy). Sessions are created on the first `POST /mcp` with an `initialize` body; the server returns an `mcp-session-id` header that the client must echo on every subsequent request.

---

## Tool & Prompt Catalog

**[See docs/API.md](docs/API.md)** for the full tool index — 194 tools grouped by Freshdesk resource, with parameter signatures.

Headline groups:

| Group              | Tools | Highlights                                                                                                |
| ------------------ | ----- | --------------------------------------------------------------------------------------------------------- |
| Tickets            | 30    | CRUD, bulk_*, restore, archived, merge, forward, summary, satisfaction, time entries                      |
| Conversations      | 6     | Reply, note, update, delete, reply_to_forward                                                             |
| Contacts           | 17    | CRUD, merge, make_agent, restore, hard_delete, invite, contact fields CRUD                                |
| Companies          | 13    | CRUD, search, company contacts, company fields CRUD                                                       |
| Agents + Groups    | 18    | Agents CRUD + `me` + bulk; Groups CRUD; Admin-Groups CRUD                                                 |
| Solutions          | 16    | Categories / folders / articles CRUD + search                                                             |
| Discussions        | 19    | Forum categories / forums / topics / comments CRUD                                                        |
| Time Entries       | 6     | CRUD + toggle timer                                                                                       |
| Threads            | 9     | Collaboration threads + messages CRUD                                                                     |
| Automations        | 5     | Rules CRUD per type                                                                                       |
| FSM                | 8     | Service tasks, appointments, business calendars                                                           |
| Custom Objects     | 7     | Schemas + records CRUD                                                                                    |
| ...and more        |       | Skills, Roles, Products, Business Hours, SLA, Email Configs, Mailboxes, Settings, Account, Jobs, Surveys, Satisfaction Ratings, Outbound, Availability, Omnichannel |

Schemas (Zod): **[docs/SCHEMAS.md](docs/SCHEMAS.md)**.

---

## Project Layout

```
freshdesk-mcp/
├── src/
│   ├── index.ts          # entry — picks stdio | http from env/argv
│   ├── server.ts         # builds McpServer, registers all tools + prompts
│   ├── freshdesk.ts      # fetch-based HTTP client + Link header parser
│   ├── util.ts           # text(), validate(), tool() wrapper around registerTool
│   ├── prompts.ts        # create_ticket, create_reply prompts
│   ├── schemas/
│   │   └── index.ts      # Strict Zod schemas for every Freshdesk resource
│   └── tools/
│       ├── tickets.ts        # tickets + conversations + ticket fields
│       ├── contacts.ts       # contacts + contact fields
│       ├── companies.ts      # companies + company fields
│       ├── agents.ts         # agents + groups + admin-groups
│       ├── canned.ts         # canned responses + folders
│       ├── solutions.ts      # categories / folders / articles
│       ├── admin_misc.ts     # skills, roles, products, BH, SLA, mailboxes,
│       │                     # email configs, settings, account, threads, time entries
│       └── extras.ts         # discussions, surveys, automations, scenario,
│                             # custom objects, FSM, outbound, jobs,
│                             # availability, omnichannel
├── docs/
│   ├── API.md            # Full tool reference
│   ├── SCHEMAS.md        # Zod schema reference
│   ├── CONFIGURATION.md  # Env vars + transports
│   └── DEVELOPMENT.md    # Dev workflow + architecture
├── dist/                 # build output (gitignored)
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
npm run dev:stdio        # build + run stdio mode
npm run dev:http         # build + run HTTP mode on PORT (default 3000)
npm run build            # type-check + emit dist/
npm run start            # run from dist/
```

See **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** for architecture notes, how to add a new tool, and the schema authoring guide.

---

## Documentation

| Doc                                            | Purpose                                                  |
| ---------------------------------------------- | -------------------------------------------------------- |
| [docs/API.md](docs/API.md)                     | Complete tool index, parameter signatures, return shapes |
| [docs/SCHEMAS.md](docs/SCHEMAS.md)             | Zod schema reference for every Freshdesk resource        |
| [docs/CONFIGURATION.md](docs/CONFIGURATION.md) | Env vars, transports, runtime tuning                     |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)     | Architecture, adding tools, schema authoring             |
| [CHANGELOG.md](CHANGELOG.md)                   | Version history                                          |
| [CONTRIBUTING.md](CONTRIBUTING.md)             | How to contribute                                        |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)       | Community guidelines                                     |
| [SECURITY.md](SECURITY.md)                     | Reporting vulnerabilities                                |

Upstream references:

- Freshdesk API: https://developers.freshdesk.com/api/
- Model Context Protocol: https://modelcontextprotocol.io/
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk

---

## Contributing

Contributions are welcome. Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** before opening a PR and abide by the **[Code of Conduct](CODE_OF_CONDUCT.md)**.

Quick checklist:

1. Fork, branch off `main`.
2. `npm install && npm run build` — must pass cleanly.
3. New tools: add Zod schema → register in the matching `src/tools/*.ts` → document in `docs/API.md`.
4. Open a PR using the provided template.

---

## Security

Found a security issue? **Do not open a public issue.** Report it via the channels in **[SECURITY.md](SECURITY.md)**.

This server transmits your Freshdesk API key to `*.freshdesk.com` over HTTPS only. The key is never logged. Run the HTTP transport behind an authenticated reverse proxy if you expose it beyond `localhost`.

---

## License

[MIT](LICENSE) © freshdesk-mcp contributors.

The original Python `freshdesk_mcp` server (separate project, kept side-by-side in this repo) is © its respective authors.

---

## Acknowledgments

- The Freshdesk team for the well-documented public API.
- The Model Context Protocol authors and the `@modelcontextprotocol/sdk` maintainers.
- The original Python [`freshdesk-mcp`](./freshdesk_mcp/) (Gopi Krishnan, Maanaesh Swamy) which inspired the tool coverage of this TypeScript port.
