#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express, { type Request, type Response } from "express";
import { buildServer } from "./server.js";

type TransportMode = "stdio" | "http";

function detectMode(): TransportMode {
  const argMode = process.argv.find((a) => a.startsWith("--transport="));
  if (argMode) {
    const v = argMode.split("=")[1];
    if (v === "stdio" || v === "http") return v;
  }
  const env = (process.env.MCP_TRANSPORT || "").toLowerCase();
  if (env === "http") return "http";
  return "stdio";
}

async function runStdio() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[freshdesk-mcp] stdio transport ready");
}

async function runHttp() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  const transports: Record<string, StreamableHTTPServerTransport> = {};

  app.post("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport | undefined;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport!;
        },
      });
      transport.onclose = () => {
        if (transport?.sessionId) delete transports[transport?.sessionId];
      };
      const server = buildServer();
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: missing or invalid session" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  const sessionHandler = async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }
    await transports[sessionId].handleRequest(req, res);
  };

  app.get("/mcp", sessionHandler);
  app.delete("/mcp", sessionHandler);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "freshdesk-mcp", transport: "http" });
  });

  const port = parseInt(process.env.PORT || "3000", 10);
  app.listen(port, () => {
    console.error(
      `[freshdesk-mcp] Streamable HTTP transport ready on http://localhost:${port}/mcp`,
    );
  });
}

async function main() {
  const mode = detectMode();
  if (mode === "http") {
    await runHttp();
  } else {
    await runStdio();
  }
}

main().catch((err) => {
  console.error("[freshdesk-mcp] fatal:", err);
  process.exit(1);
});
