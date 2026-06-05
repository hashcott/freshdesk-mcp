# Contributing to freshdesk-mcp

Thank you for your interest in contributing to freshdesk-mcp! This document provides guidelines and information for contributors.

## Code of Conduct

This project adheres to the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- Clear descriptive title
- Detailed description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, Freshdesk plan)
- Relevant logs or error messages

### Suggesting Enhancements

Enhancement suggestions are welcome. Please provide:

- Clear use case description
- Expected behavior
- Any alternative solutions considered
- Potential implementation approach (optional)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add or update tests as needed
5. Ensure all tests pass (`npm test` if available)
6. Ensure code builds cleanly (`npm run build`)
7. Update documentation if needed
8. Commit your changes with a clear message
9. Push to your fork
10. Open a Pull Request

### Pull Request Guidelines

- **One feature per PR**: Keep changes focused and atomic
- **Follow code style**: Match existing patterns (2-space indent, double quotes, semicolons)
- **Update docs**: If you add features or change behavior, update relevant documentation
- **Test your changes**: Verify builds pass and manually test when possible
- **Keep it simple**: Avoid over-engineering; solve the immediate problem

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/freshdesk-mcp.git
cd freshdesk-mcp
npm install
npm run build
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development workflow.

## Code Style

- TypeScript ESM (`"type": "module"`)
- 2-space indentation
- Double quotes for strings
- Semicolons required
- Strict TypeScript (`strict: true`)
- Prefer Zod schemas over `z.record(z.any())` for validation
- Use `console.error` for logging (never `console.log` to stdout in stdio mode)

## Adding New Tools

When adding new Freshdesk API endpoints:

1. **Schema**: Add Zod schema to `src/schemas/index.ts`
2. **Tool**: Register in appropriate `src/tools/*.ts` file
3. **Wire**: Import and register in `src/server.ts`
4. **Document**: Update [docs/API.md](docs/API.md) and [docs/SCHEMAS.md](docs/SCHEMAS.md)
5. **Changelog**: Add entry to "Unreleased" section in [CHANGELOG.md](CHANGELOG.md)

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#adding-a-new-tool) for detailed guide.

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for custom object records
fix: correct pagination parsing in list_tickets
docs: update API.md with new time entry parameters
refactor: extract common validation logic
test: add integration tests for contact merge
```

## Testing

While this project doesn't have automated tests yet, please:

- Manually test your changes against a Freshdesk sandbox account when possible
- Verify TypeScript builds cleanly (`npm run build`)
- Test both stdio and HTTP transports if applicable
- Validate with intentionally malformed input to ensure Zod validation works

## Documentation

- Keep README.md, docs/*.md up to date
- Document all new tools in docs/API.md
- Document all new schemas in docs/SCHEMAS.md
- Use clear, concise language
- Include examples where helpful

## Questions?

If you have questions about contributing, please open an issue or reach out to the maintainers.

Thank you for contributing! 🎉
