import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorPayload, fd } from "../freshdesk.js";
import {
  ContactCreate,
  ContactFieldCreate,
  ContactFieldUpdate,
  ContactsMerge,
  ContactUpdate,
  MakeAgentFields,
} from "../schemas/index.js";
import { text, tool, validate } from "../util.js";

const pageArgs = {
  page: z.number().int().min(1).optional().default(1),
  per_page: z.number().int().min(1).max(100).optional().default(30),
};

export function registerContactTools(server: McpServer) {
  tool(
    server,
    "list_contacts",
    "List contacts.",
    {
      ...pageArgs,
      email: z.string().email().optional(),
      mobile: z.string().optional(),
      phone: z.string().optional(),
      company_id: z.number().int().optional(),
      state: z.enum(["blocked", "deleted", "unverified", "verified"]).optional(),
      updated_since: z.string().optional(),
    },
    async (args) => {
      const res = await fd.get("/contacts", args);
      return text(res.ok ? res.data : errorPayload("Failed to list contacts", res));
    },
  );

  tool(
    server,
    "get_contact",
    "Get a contact by ID.",
    { contact_id: z.number().int() },
    async ({ contact_id }) => {
      const res = await fd.get(`/contacts/${contact_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to fetch contact", res));
    },
  );

  tool(
    server,
    "search_contacts",
    "Autocomplete search contacts.",
    { query: z.string() },
    async ({ query }) => {
      const res = await fd.get("/contacts/autocomplete", { term: query });
      return text(res.ok ? res.data : errorPayload("Failed to search contacts", res));
    },
  );

  tool(
    server,
    "create_contact",
    "Create a contact.",
    { contact: z.record(z.any()) },
    async ({ contact }) => {
      const v = validate(ContactCreate, contact);
      if (!v.ok) return v.reply;
      const res = await fd.post("/contacts", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create contact", res));
    },
  );

  tool(
    server,
    "update_contact",
    "Update a contact.",
    { contact_id: z.number().int(), contact: z.record(z.any()) },
    async ({ contact_id, contact }) => {
      const v = validate(ContactUpdate, contact);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/contacts/${contact_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update contact", res));
    },
  );

  tool(
    server,
    "delete_contact",
    "Soft-delete a contact.",
    { contact_id: z.number().int() },
    async ({ contact_id }) => {
      const res = await fd.delete(`/contacts/${contact_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete contact", res));
    },
  );

  tool(
    server,
    "hard_delete_contact",
    "Permanently delete a contact.",
    { contact_id: z.number().int(), force: z.boolean().optional() },
    async ({ contact_id, force }) => {
      const path = force
        ? `/contacts/${contact_id}/hard_delete?force=true`
        : `/contacts/${contact_id}/hard_delete`;
      const res = await fd.delete(path);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to hard-delete contact", res));
    },
  );

  tool(
    server,
    "restore_contact",
    "Restore a soft-deleted contact.",
    { contact_id: z.number().int() },
    async ({ contact_id }) => {
      const res = await fd.put(`/contacts/${contact_id}/restore`);
      if (res.status === 204 || res.ok) return text({ success: true, data: res.data });
      return text(errorPayload("Failed to restore contact", res));
    },
  );

  tool(
    server,
    "merge_contacts",
    "Merge secondary contacts into a primary.",
    { merge: z.record(z.any()) },
    async ({ merge }) => {
      const v = validate(ContactsMerge, merge);
      if (!v.ok) return v.reply;
      const res = await fd.post("/contacts/merge", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to merge contacts", res));
    },
  );

  tool(
    server,
    "make_agent",
    "Convert a contact into an agent.",
    { contact_id: z.number().int(), agent: z.record(z.any()).optional() },
    async ({ contact_id, agent }) => {
      const payload = agent ?? {};
      const v = validate(MakeAgentFields, payload);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/contacts/${contact_id}/make_agent`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to make agent", res));
    },
  );

  tool(
    server,
    "send_contact_invite",
    "Send a portal invite to a contact.",
    { contact_id: z.number().int() },
    async ({ contact_id }) => {
      const res = await fd.put(`/contacts/${contact_id}/send_invite`);
      if (res.status === 204 || res.ok) return text({ success: true });
      return text(errorPayload("Failed to send invite", res));
    },
  );

  tool(
    server,
    "list_deleted_contacts",
    "List soft-deleted contacts.",
    pageArgs,
    async ({ page, per_page }) => {
      const res = await fd.get("/contacts", { state: "deleted", page, per_page });
      return text(res.ok ? res.data : errorPayload("Failed to list deleted contacts", res));
    },
  );

  // Contact fields
  tool(server, "list_contact_fields", "List contact field definitions.", {}, async () => {
    const res = await fd.get("/contact_fields");
    return text(res.ok ? res.data : errorPayload("Failed to list contact fields", res));
  });

  tool(
    server,
    "view_contact_field",
    "View a contact field.",
    { contact_field_id: z.number().int() },
    async ({ contact_field_id }) => {
      const res = await fd.get(`/contact_fields/${contact_field_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view contact field", res));
    },
  );

  tool(
    server,
    "create_contact_field",
    "Create a contact field.",
    { contact_field: z.record(z.any()) },
    async ({ contact_field }) => {
      const v = validate(ContactFieldCreate, contact_field);
      if (!v.ok) return v.reply;
      const res = await fd.post("/contact_fields", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create contact field", res));
    },
  );

  tool(
    server,
    "update_contact_field",
    "Update a contact field.",
    { contact_field_id: z.number().int(), contact_field: z.record(z.any()) },
    async ({ contact_field_id, contact_field }) => {
      const v = validate(ContactFieldUpdate, contact_field);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/contact_fields/${contact_field_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update contact field", res));
    },
  );

  tool(
    server,
    "delete_contact_field",
    "Delete a contact field.",
    { contact_field_id: z.number().int() },
    async ({ contact_field_id }) => {
      const res = await fd.delete(`/contact_fields/${contact_field_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete contact field", res));
    },
  );
}
