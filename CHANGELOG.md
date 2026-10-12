# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1](https://github.com/hashcott/freshdesk-mcp/compare/freshdesk-mcp-v2.0.0...freshdesk-mcp-v2.0.1) (2026-10-12)


### Continuous Integration

* drop setup-node registry-url so npm uses OIDC ([efd9376](https://github.com/hashcott/freshdesk-mcp/commit/efd93761b028a15d8ea24dc548c7760b2620694f))
* fix npm trusted publishing (drop setup-node registry-url) ([5aa2867](https://github.com/hashcott/freshdesk-mcp/commit/5aa2867f87aec627812b998d544672d0537b0df3))
* publish to npm via trusted publishing (OIDC) ([cec6aaa](https://github.com/hashcott/freshdesk-mcp/commit/cec6aaaefd5b749ef9db4c6f2c2a0a140f6a4fff))
* publish to npm via trusted publishing (OIDC) ([db0c214](https://github.com/hashcott/freshdesk-mcp/commit/db0c2142527ffe817d4691d403776a4d017a7103))
* wait up to 15 min for npm to expose a new version ([1c96229](https://github.com/hashcott/freshdesk-mcp/commit/1c9622951ca82210d80dc7d74e63adeec5bef3e4))

## [2.0.0](https://github.com/hashcott/freshdesk-mcp/compare/freshdesk-mcp-v1.1.1...freshdesk-mcp-v2.0.0) (2026-10-12)


### ⚠ BREAKING CHANGES

* get_ticket_conversation and list_archived_ticket_conversations return an object ({ conversations, total_returned, pages_fetched, truncated, next_page }) instead of a bare array. Removed tools without a documented endpoint: find_company_by_name (use search_companies), list_thread_messages, list_omnichannel_activities (replaced by publish_contact_activity), list_appointments, view_appointment, list_business_calendars.

### Features

* add discussion follow tools, surface rate-limit retry hints ([b4aa550](https://github.com/hashcott/freshdesk-mcp/commit/b4aa550f52f084a061fcf03b5893191d5749a6fd))
* align tools with current Freshdesk API, add attachments and conversation pagination ([aa3659a](https://github.com/hashcott/freshdesk-mcp/commit/aa3659aa8fbf9fc634e98b70da8292b81ee0a6da))
* align tools with current Freshdesk API, add attachments and conversation pagination ([41ec48c](https://github.com/hashcott/freshdesk-mcp/commit/41ec48c3efd50d6ff34d71fd0ffef1608352390e)), closes [#6](https://github.com/hashcott/freshdesk-mcp/issues/6) [#7](https://github.com/hashcott/freshdesk-mcp/issues/7)


### Bug Fixes

* align request fields with the Freshdesk API parameter tables ([fbfbf78](https://github.com/hashcott/freshdesk-mcp/commit/fbfbf784dadf67025a19cec475d4077d2285996c))


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
