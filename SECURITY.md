# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of freshdesk-mcp seriously. If you discover a security vulnerability, please follow the responsible disclosure process below.

### How to Report

**DO NOT open a public GitHub issue for security vulnerabilities.**

Please report security issues by:

1. **Email**: Send details to the maintainers (check package.json or repository for contact information)
2. **Private disclosure**: Use GitHub's private vulnerability reporting feature if available

### What to Include

When reporting a vulnerability, please include:

- Description of the vulnerability
- Steps to reproduce or proof of concept
- Potential impact assessment
- Suggested fix (if you have one)
- Your contact information for follow-up

### Response Timeline

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial assessment**: We will provide an initial assessment within 7 days
- **Updates**: We will keep you informed of progress and any questions

### Disclosure Policy

- We will work with you to understand and validate the issue
- We will develop and release a fix as quickly as possible
- We will publicly disclose the vulnerability after a fix is released
- We will credit reporters (unless you prefer to remain anonymous)

## Security Best Practices

When using freshdesk-mcp, please follow these security guidelines:

### API Key Management

- **Never commit API keys** to version control
- Use environment variables or `.env` files (excluded via `.gitignore`)
- Rotate API keys periodically
- Use separate API keys for development, staging, and production
- Revoke compromised keys immediately

### Network Security

- **HTTP transport**: Run behind an authenticated reverse proxy (nginx, Caddy, Cloudflare Access, Tailscale Funnel)
- **HTTPS only**: Freshdesk API communication uses HTTPS exclusively
- **Localhost only**: For development, bind to `localhost` only, not `0.0.0.0`
- **Firewall rules**: Restrict access to the HTTP transport port

### Access Control

- **Principle of least privilege**: Use Freshdesk API keys with minimal required permissions
- **Separate accounts**: Use dedicated Freshdesk accounts for integration (not personal accounts)
- **Agent permissions**: Review which Freshdesk features the API key can access

### Input Validation

- All inputs are validated using Zod schemas before reaching the Freshdesk API
- Custom fields (`cf_*`) are passed through but should be validated by your application
- Never trust user input that will be used in tool calls

### Production Deployment

- Run in containers or isolated environments
- Use secrets management (Vault, AWS Secrets Manager, etc.)
- Monitor for unusual API usage patterns
- Keep dependencies up to date (`npm audit`)
- Run security scanners on your deployment

## Security Features

freshdesk-mcp includes the following security features:

- **Input validation**: Strict Zod schemas prevent malformed requests
- **No logging of secrets**: API keys are never logged to stdout or stderr
- **HTTPS enforcement**: All Freshdesk API calls use HTTPS
- **Basic auth**: API key transmitted via HTTP Basic Auth (over HTTPS only)
- **Request size limits**: HTTP transport enforces 10MB request body limit

## Known Limitations

- **No built-in authentication**: The HTTP transport has no authentication. Use a reverse proxy.
- **No rate limiting**: Client-side rate limiting is recommended to avoid hitting Freshdesk limits
- **API key scope**: The server has full access to whatever the API key can access

## Dependencies

This project uses the following dependencies:

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `express`: HTTP server (for HTTP transport)
- `zod`: Input validation

We monitor dependencies for security vulnerabilities and update them regularly. Run `npm audit` to check for known vulnerabilities.

## Contact

For security-related questions or to report a vulnerability, please contact the maintainers. Do not use public channels (issues, discussions) for security discussions.

Thank you for helping keep freshdesk-mcp secure!
