# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.2](https://github.com/hashcott/freshdesk-mcp/compare/freshdesk-mcp-v1.1.1...freshdesk-mcp-v1.1.2) (2026-06-08)


### Documentation

* update README and API documentation for enhanced clarity and structure ([f074b9b](https://github.com/hashcott/freshdesk-mcp/commit/f074b9bdf2841e2341730628485d85b0956fd2f8))

## [1.1.1](https://github.com/hashcott/freshdesk-mcp/compare/freshdesk-mcp-v1.1.0...freshdesk-mcp-v1.1.1) (2026-06-05)


### Continuous Integration

* fix retry loop for bash -e ([cdf658a](https://github.com/hashcott/freshdesk-mcp/commit/cdf658a372a3f6d95a4d4cf460b3a9d0c9481716))
* retry npm install in build job ([ba57bd5](https://github.com/hashcott/freshdesk-mcp/commit/ba57bd5dc8cc3f38e3b38d2be75c8f51b3e0da91))

## [1.1.0](https://github.com/hashcott/freshdesk-mcp/compare/freshdesk-mcp-v1.0.0...freshdesk-mcp-v1.1.0) (2026-06-05)


### Features

* implement Freshdesk MCP server with 194 tools ([178269d](https://github.com/hashcott/freshdesk-mcp/commit/178269d2d6fe2c1bc19fc6ab0b47201637cfedc7))


### Documentation

* add comprehensive project documentation ([3fa8135](https://github.com/hashcott/freshdesk-mcp/commit/3fa81355502cfb9c264f56dcb6d7025d6205d497))
* add npm version and downloads badges to README ([ce41532](https://github.com/hashcott/freshdesk-mcp/commit/ce415326b10a94df5f347a0bce436fe4eeac42b9))
* add npm/npx installation and usage instructions ([4a83d8a](https://github.com/hashcott/freshdesk-mcp/commit/4a83d8ab8f6fe24cccd1cac93a3ffc2f7eec812f))
* add OSS standard files ([a0f12d5](https://github.com/hashcott/freshdesk-mcp/commit/a0f12d52d27a2fa0bb14c0f2b5bcd857c5eb88dd))
* enhance README layout and content for better clarity ([93ba1eb](https://github.com/hashcott/freshdesk-mcp/commit/93ba1ebb8b7e9a675e5fd782b392f7852b28f8ae))


### Continuous Integration

* add release-please for automated versioning ([d7775a7](https://github.com/hashcott/freshdesk-mcp/commit/d7775a7755a8cce05d18e2d91d5436a1179d59b9))

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

[Unreleased]: https://github.com/hashcott/freshdesk-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/hashcott/freshdesk-mcp/releases/tag/v1.0.0
