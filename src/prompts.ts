import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "create_ticket",
    {
      description: "Guide for creating a Freshdesk ticket.",
      argsSchema: {
        subject: z.string(),
        description: z.string(),
        source: z.string(),
        priority: z.string(),
        status: z.string(),
        email: z.string(),
      },
    },
    ({ subject, description, source, priority, status, email }) => {
      const payload = { subject, description, source, priority, status, email };
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Kindly create a ticket in Freshdesk using the following payload:\n\n` +
                `${JSON.stringify(payload, null, 2)}\n\n` +
                `If you need to retrieve information about any fields (such as allowed values or internal keys), ` +
                `please use the \`get_field_properties()\` function.\n\n` +
                `Notes:\n` +
                `- The "type" field is **not** a custom field; it is a standard system field.\n` +
                `- The "type" field is required but should be passed as a top-level parameter, not within custom_fields.\n` +
                `Make sure to reference the correct keys from \`get_field_properties()\` when constructing the payload.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "create_reply",
    {
      description: "Guide for creating a Freshdesk ticket reply.",
      argsSchema: {
        ticket_id: z.string(),
        reply_message: z.string(),
      },
    },
    ({ ticket_id, reply_message }) => {
      const payload = { body: reply_message };
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Kindly create a ticket reply in Freshdesk for ticket ID ${ticket_id} using the following payload:\n\n` +
                `${JSON.stringify(payload, null, 2)}\n\n` +
                `Notes:\n` +
                `- The "body" field must be in **HTML format** and should be **brief yet contextually complete**.\n` +
                `- When composing the "body", please **review the previous conversation** in the ticket.\n` +
                `- Ensure the tone and style **match the prior replies**, and that the message provides **full context** ` +
                `so the recipient can understand the issue without needing to re-read earlier messages.`,
            },
          },
        ],
      };
    },
  );
}
