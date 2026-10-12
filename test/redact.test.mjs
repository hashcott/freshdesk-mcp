// Run: npm test
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.FRESHDESK_API_KEY = "k";
process.env.FRESHDESK_DOMAIN = "x.freshdesk.com";
const { scanSensitive } = await import("../dist/redact.js");

const found = (text) => scanSensitive(text, false).found;

test("detects IBANs with a valid checksum only", () => {
  assert.deepEqual(found("Pay to GB82 WEST 1234 5698 7654 32 please"), ["IBAN"]);
  assert.deepEqual(found("IBAN: DE89370400440532013000"), ["IBAN"]);
  assert.deepEqual(found("Order GB12 ABCD 1234 5678 9012 34 is not an IBAN"), []);
});

test("detects payment cards written like cards, not dates or ids", () => {
  assert.deepEqual(found("Card 4111 1111 1111 1111 exp 12/29"), ["payment card"]);
  assert.deepEqual(found("pan=4111111111111111;"), ["payment card"]);
  assert.deepEqual(found("Amex 3782 822463 10005"), ["payment card"]);
  // Two dates and times in a row once passed the Luhn check.
  assert.deepEqual(found("Created USER-01 2026-07-08 09:28:09 | Changed 2026-09-15 12:24:19"), []);
  assert.deepEqual(found("order 1234567812345670 shipped"), [], "no issuer prefix");
});

test("detects SWIFT/BIC codes only after a label", () => {
  assert.deepEqual(found("SWIFT/BIC: DEUTDEFF500"), ["SWIFT/BIC"]);
  assert.deepEqual(found("ACME SOFTWARE ARCHITECTURE"), []);
});

test("detects credentials, Authorization headers, JWTs and private keys", () => {
  assert.deepEqual(found('password: Hunter22 and "client_secret":"abcd1234"'), ["credential"]);
  assert.deepEqual(found("Authorization: Basic dXNlcjpzdXBlcnNlY3JldA=="), ["authorization header"]);
  assert.deepEqual(
    found(
      "token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    ),
    ["JWT"],
  );
  assert.deepEqual(
    found("-----BEGIN RSA PRIVATE KEY-----\nMIIEow\n-----END RSA PRIVATE KEY-----"),
    ["private key"],
  );
});

test("detects licence keys and tokens, not identifiers in URL paths", () => {
  const key = `MIIF${"Ab3/xY9+Qw7/".repeat(20)}Zz9=`;
  assert.deepEqual(found(key), ["secret token or licence key"], "slashes inside a key");
  const id = "a1B2c3D4e5".repeat(8);
  assert.deepEqual(found(`GET https://lh3.googleusercontent.com/${id}=s64 200`), []);
  assert.deepEqual(found(`GET https://x.example.com/f?token=${id} 200`), [
    "secret token or licence key",
  ]);
  assert.deepEqual(
    found(`https://s3.amazonaws.com/bucket/file.pdf?Expires=1&Signature=${id}`),
    ["secret token or licence key"],
  );
});

test("plain text, emails and URLs are not reported", () => {
  assert.deepEqual(
    found(
      "Isto é um teste para o Claude. Contact ana@example.com or see https://docs.example.com/en/guide/intro.html",
    ),
    [],
  );
});

test("reports where each finding is, without hiding short values", () => {
  const r = scanSensitive("Bank: Example Bank | IBAN: GB82 WEST 1234 5698 7654 32 | thanks", false);
  assert.equal(r.where.length, 1);
  assert.match(r.where[0], /^IBAN: "…Bank: Example Bank \| IBAN: GB82 WEST 1234 5698 7654 32 \| thanks…"$/);
  assert.equal(r.text, "Bank: Example Bank | IBAN: GB82 WEST 1234 5698 7654 32 | thanks", "not masked");
});

test("masks values when redaction is on", () => {
  const r = scanSensitive("password: Hunter22 Card 4111 1111 1111 1111", true);
  assert.doesNotMatch(r.text, /Hunter22/);
  assert.doesNotMatch(r.text, /4111 1111 1111 1111/);
  assert.match(r.text, /password: \[REDACTED\]/);
  assert.match(r.text, /4111…\[REDACTED 8 chars\]…1111/);
});
