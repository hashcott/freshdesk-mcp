import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorPayload, fd } from "../freshdesk.js";
import {
  CannedResponseCreate,
  CannedResponseFolderCreate,
  CannedResponseUpdate,
} from "../schemas/index.js";
import { text, tool, validate } from "../util.js";

export function registerCannedTools(server: McpServer) {
  tool(
    server,
    "list_canned_responses",
    "List canned responses in a folder.",
    { folder_id: z.number().int() },
    async ({ folder_id }) => {
      const res = await fd.get(`/canned_response_folders/${folder_id}/responses`);
      return text(res.ok ? res.data : errorPayload("Failed to list canned responses", res));
    },
  );

  tool(server, "list_canned_response_folders", "List canned response folders.", {}, async () => {
    const res = await fd.get("/canned_response_folders");
    return text(res.ok ? res.data : errorPayload("Failed to list folders", res));
  });

  tool(
    server,
    "view_canned_response",
    "View a canned response.",
    { canned_response_id: z.number().int() },
    async ({ canned_response_id }) => {
      const res = await fd.get(`/canned_responses/${canned_response_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view canned response", res));
    },
  );

  tool(
    server,
    "create_canned_response",
    "Create a canned response.",
    { canned_response: z.record(z.any()) },
    async ({ canned_response }) => {
      const v = validate(CannedResponseCreate, canned_response);
      if (!v.ok) return v.reply;
      const res = await fd.post("/canned_responses", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create canned response", res));
    },
  );

  tool(
    server,
    "update_canned_response",
    "Update a canned response.",
    { canned_response_id: z.number().int(), canned_response: z.record(z.any()) },
    async ({ canned_response_id, canned_response }) => {
      const v = validate(CannedResponseUpdate, canned_response);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/canned_responses/${canned_response_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update canned response", res));
    },
  );

  tool(
    server,
    "delete_canned_response",
    "Delete a canned response.",
    { canned_response_id: z.number().int() },
    async ({ canned_response_id }) => {
      const res = await fd.delete(`/canned_responses/${canned_response_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete canned response", res));
    },
  );

  tool(
    server,
    "create_canned_response_folder",
    "Create a canned response folder.",
    { folder: z.record(z.any()) },
    async ({ folder }) => {
      const v = validate(CannedResponseFolderCreate, folder);
      if (!v.ok) return v.reply;
      const res = await fd.post("/canned_response_folders", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create folder", res));
    },
  );

  tool(
    server,
    "update_canned_response_folder",
    "Update a canned response folder.",
    { folder_id: z.number().int(), folder: z.record(z.any()) },
    async ({ folder_id, folder }) => {
      const v = validate(CannedResponseFolderCreate, folder);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/canned_response_folders/${folder_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update folder", res));
    },
  );

  tool(
    server,
    "delete_canned_response_folder",
    "Delete a canned response folder.",
    { folder_id: z.number().int() },
    async ({ folder_id }) => {
      const res = await fd.delete(`/canned_response_folders/${folder_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete folder", res));
    },
  );
}
