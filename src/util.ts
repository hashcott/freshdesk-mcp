import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodType, ZodTypeDef } from "zod";

export const text = (obj: any) => ({
  content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
});

export function validate<T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  data: unknown,
): { ok: true; data: T } | { ok: false; reply: ReturnType<typeof text> } {
  const parsed = schema.safeParse(data);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    reply: text({
      error: "Validation error",
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        code: i.code,
        message: i.message,
      })),
    }),
  };
}

/**
 * Forward-compatible wrapper around the new `registerTool` API.
 * Keeps the same call shape we had with the deprecated `server.tool(...)` overload,
 * while preserving full type inference on the handler's `args` parameter via `ToolCallback`.
 */
export function tool<S extends Record<string, any>>(
  server: McpServer,
  name: string,
  description: string,
  inputSchema: S,
  cb: ToolCallback<S>,
) {
  return server.registerTool(name, { description, inputSchema }, cb);
}
