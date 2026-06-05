# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release with 194 MCP tools covering the full Freshdesk API
- Support for both stdio and Streamable HTTP transports
- Strict Zod validation for all tool inputs
- Comprehensive documentation (API.md, SCHEMAS.md, CONFIGURATION.md, DEVELOPMENT.md)
- Docker support for containerized deployment
- Pagination support with Link header parsing
- Two MCP prompts: `create_ticket` and `create_reply`

### Features
- **Tickets**: Full CRUD, bulk operations, merge, forward, archive management, satisfaction ratings
- **Contacts**: CRUD, merge, agent conversion, invite system
- **Companies**: CRUD, search, company contacts management
- **Agents & Groups**: Full agent management, groups, admin groups
- **Solutions**: Knowledge base categories, folders, articles with search
- **Discussions**: Forums, topics, comments
- **Custom Objects**: Schema and record management
- **FSM**: Service tasks, appointments, business calendars
- **Threads**: Collaboration threads with messages
- **And more**: Skills, roles, products, business hours, SLA policies, email configs, mailboxes, automations, surveys, time entries, settings, account info, jobs, availability, omnichannel

### Technical
- TypeScript ESM with strict mode
- Built on `@modelcontextprotocol/sdk@^1.29.0`
- Node.js ≥ 18 required (native fetch)
- Zero runtime dependencies on Python or Freshdesk SDKs
- Single binary deployment

---

## [1.0.0] - TBD

Initial public release.

[Unreleased]: https://github.com/yourusername/freshdesk-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/freshdesk-mcp/releases/tag/v1.0.0
