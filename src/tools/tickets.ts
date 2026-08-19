import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorPayload, fd, parseLinkHeader } from "../freshdesk.js";
import {
  ConversationUpdate,
  NoteCreate,
  ReplyCreate,
  TicketBulkDeleteAction,
  TicketBulkUpdateAction,
  TicketCreate,
  TicketFieldCreate,
  TicketFieldUpdate,
  TicketForward,
  TicketMerge,
  TicketUpdate,
} from "../schemas/index.js";
import { text, tool, validate } from "../util.js";

export function registerTicketTools(server: McpServer) {
  tool(server, "get_ticket_fields", "Get all ticket field definitions.", {}, async () => {
    const res = await fd.get("/ticket_fields");
    return text(res.ok ? res.data : errorPayload("Failed to fetch ticket fields", res));
  });

  tool(
    server,
    "get_tickets",
    "List tickets with pagination + filter support.",
    {
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(30),
      filter: z.enum(["new_and_my_open", "watching", "spam", "deleted"]).optional(),
      requester_id: z.number().int().optional(),
      email: z.string().email().optional(),
      company_id: z.number().int().optional(),
      updated_since: z.string().optional(),
      order_by: z.enum(["created_at", "due_by", "updated_at", "status"]).optional(),
      order_type: z.enum(["asc", "desc"]).optional(),
      include: z.string().optional(),
    },
    async (args) => {
      const { page, per_page, ...rest } = args;
      const res = await fd.get("/tickets", { page, per_page, ...rest });
      if (!res.ok) return text(errorPayload("Failed to fetch tickets", res));
      const pagination = parseLinkHeader(res.headers.get("link"));
      return text({
        tickets: res.data,
        pagination: {
          current_page: page,
          next_page: pagination.next,
          prev_page: pagination.prev,
          per_page,
        },
      });
    },
  );

  tool(
    server,
    "create_ticket",
    "Create a ticket. Validates against Freshdesk ticket schema; unknown keys are passed through.",
    { ticket: z.record(z.any()) },
    async ({ ticket }) => {
      const v = validate(TicketCreate, ticket);
      if (!v.ok) return v.reply;
      const res = await fd.post("/tickets", v.data);
      if (res.status === 201) return text({ success: true, ticket: res.data });
      return text(errorPayload("Failed to create ticket", res));
    },
  );

  tool(
    server,
    "update_ticket",
    "Update a ticket (partial update; only provided fields are sent).",
    {
      ticket_id: z.number().int(),
      ticket: z.record(z.any()),
    },
    async ({ ticket_id, ticket }) => {
      if (!ticket || Object.keys(ticket).length === 0) return text({ error: "No fields provided" });
      const v = validate(TicketUpdate, ticket);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/tickets/${ticket_id}`, v.data);
      return text(
        res.ok ? { success: true, ticket: res.data } : errorPayload("Failed to update ticket", res),
      );
    },
  );

  tool(
    server,
    "delete_ticket",
    "Soft-delete a ticket.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.delete(`/tickets/${ticket_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete ticket", res));
    },
  );

  tool(
    server,
    "get_ticket",
    "Get a single ticket.",
    { ticket_id: z.number().int(), include: z.string().optional() },
    async ({ ticket_id, include }) => {
      const res = await fd.get(`/tickets/${ticket_id}`, { include });
      return text(res.ok ? res.data : errorPayload("Failed to fetch ticket", res));
    },
  );

  tool(
    server,
    "search_tickets",
    "Search tickets using Freshdesk filter syntax.",
    { query: z.string() },
    async ({ query }) => {
      const res = await fd.get("/search/tickets", { query });
      return text(res.ok ? res.data : errorPayload("Failed to search tickets", res));
    },
  );

  tool(
    server,
    "get_ticket_conversation",
    "Get conversations for a ticket.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.get(`/tickets/${ticket_id}/conversations`);
      return text(res.ok ? res.data : errorPayload("Failed to fetch conversation", res));
    },
  );

  tool(
    server,
    "create_ticket_reply",
    "Reply to a ticket.",
    { ticket_id: z.number().int(), reply: z.record(z.any()) },
    async ({ ticket_id, reply }) => {
      const v = validate(ReplyCreate, reply);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/tickets/${ticket_id}/reply`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create reply", res));
    },
  );

  tool(
    server,
    "create_ticket_note",
    "Add a note to a ticket.",
    { ticket_id: z.number().int(), note: z.record(z.any()) },
    async ({ ticket_id, note }) => {
      const v = validate(NoteCreate, note);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/tickets/${ticket_id}/notes`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create note", res));
    },
  );

  tool(
    server,
    "update_ticket_conversation",
    "Update a conversation (reply or note).",
    { conversation_id: z.number().int(), conversation: z.record(z.any()) },
    async ({ conversation_id, conversation }) => {
      const v = validate(ConversationUpdate, conversation);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/conversations/${conversation_id}`, v.data);
      if (res.status === 200) return text(res.data);
      return text(errorPayload("Cannot update conversation", res));
    },
  );

  tool(
    server,
    "view_ticket_summary",
    "Get a ticket's summary.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.get(`/tickets/${ticket_id}/summary`);
      return text(res.ok ? res.data : errorPayload("Failed to fetch summary", res));
    },
  );

  tool(
    server,
    "update_ticket_summary",
    "Update a ticket's summary.",
    { ticket_id: z.number().int(), body: z.string() },
    async ({ ticket_id, body }) => {
      const res = await fd.put(`/tickets/${ticket_id}/summary`, { body });
      return text(res.ok ? res.data : errorPayload("Failed to update summary", res));
    },
  );

  tool(
    server,
    "delete_ticket_summary",
    "Delete a ticket's summary.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.delete(`/tickets/${ticket_id}/summary`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete summary", res));
    },
  );

  tool(
    server,
    "create_ticket_field",
    "Create a ticket field (admin).",
    { ticket_field: z.record(z.any()) },
    async ({ ticket_field }) => {
      const v = validate(TicketFieldCreate, ticket_field);
      if (!v.ok) return v.reply;
      const res = await fd.post("/admin/ticket_fields", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create ticket field", res));
    },
  );

  tool(
    server,
    "view_ticket_field",
    "View a ticket field.",
    { ticket_field_id: z.number().int() },
    async ({ ticket_field_id }) => {
      const res = await fd.get(`/admin/ticket_fields/${ticket_field_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to fetch ticket field", res));
    },
  );

  tool(
    server,
    "update_ticket_field",
    "Update a ticket field (admin).",
    { ticket_field_id: z.number().int(), ticket_field: z.record(z.any()) },
    async ({ ticket_field_id, ticket_field }) => {
      const v = validate(TicketFieldUpdate, ticket_field);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/admin/ticket_fields/${ticket_field_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update ticket field", res));
    },
  );

  tool(
    server,
    "delete_ticket_field",
    "Delete a ticket field.",
    { ticket_field_id: z.number().int() },
    async ({ ticket_field_id }) => {
      const res = await fd.delete(`/admin/ticket_fields/${ticket_field_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete ticket field", res));
    },
  );

  tool(
    server,
    "get_field_properties",
    "Get the definition of a single ticket field by name.",
    { field_name: z.string() },
    async ({ field_name }) => {
      const actual = field_name === "type" ? "ticket_type" : field_name;
      const res = await fd.get("/ticket_fields");
      if (!res.ok) return text(errorPayload("Failed to fetch ticket fields", res));
      const match = Array.isArray(res.data) ? res.data.find((f: any) => f.name === actual) : null;
      return text(match ?? { error: `Field '${field_name}' not found` });
    },
  );

  tool(
    server,
    "bulk_create_tickets",
    "Bulk create up to 100 tickets.",
    { tickets: z.array(z.record(z.any())).min(1).max(100) },
    async ({ tickets }) => {
      const validated: any[] = [];
      for (let i = 0; i < tickets.length; i++) {
        const v = validate(TicketCreate, tickets[i]);
        if (!v.ok)
          return text({
            error: `Ticket at index ${i} failed validation`,
            issues: (v.reply.content[0] as any).text,
          });
        validated.push(v.data);
      }
      const res = await fd.post("/tickets/bulk_create", { tickets: validated });
      return text(res.ok ? res.data : errorPayload("Failed to bulk create tickets", res));
    },
  );

  tool(
    server,
    "bulk_update_tickets",
    "Bulk update tickets (ids + properties or reply).",
    { bulk_action: z.record(z.any()) },
    async ({ bulk_action }) => {
      const v = validate(TicketBulkUpdateAction, bulk_action);
      if (!v.ok) return v.reply;
      const res = await fd.post("/tickets/bulk_update", { bulk_action: v.data });
      return text(res.ok ? res.data : errorPayload("Failed to bulk update tickets", res));
    },
  );

  tool(
    server,
    "bulk_delete_tickets",
    "Bulk delete tickets.",
    { bulk_action: z.record(z.any()) },
    async ({ bulk_action }) => {
      const v = validate(TicketBulkDeleteAction, bulk_action);
      if (!v.ok) return v.reply;
      const res = await fd.post("/tickets/bulk_delete", { bulk_action: v.data });
      return text(res.ok ? res.data : errorPayload("Failed to bulk delete tickets", res));
    },
  );

  tool(
    server,
    "restore_ticket",
    "Restore a deleted ticket.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.put(`/tickets/${ticket_id}/restore`);
      if (res.status === 204) return text({ success: true });
      return text(res.ok ? res.data : errorPayload("Failed to restore ticket", res));
    },
  );

  tool(
    server,
    "list_archived_tickets",
    "List archived tickets.",
    {
      page: z.number().int().min(1).optional().default(1),
      per_page: z.number().int().min(1).max(100).optional().default(30),
    },
    async ({ page, per_page }) => {
      const res = await fd.get("/tickets/archived", { page, per_page });
      return text(res.ok ? res.data : errorPayload("Failed to list archived tickets", res));
    },
  );

  tool(
    server,
    "view_archived_ticket",
    "View an archived ticket.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.get(`/tickets/archived/${ticket_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view archived ticket", res));
    },
  );

  tool(
    server,
    "delete_archived_ticket",
    "Permanently delete an archived ticket.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.delete(`/tickets/archived/${ticket_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete archived ticket", res));
    },
  );

  tool(
    server,
    "list_archived_ticket_conversations",
    "List conversations on an archived ticket.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.get(`/tickets/archived/${ticket_id}/conversations`);
      return text(res.ok ? res.data : errorPayload("Failed to list archived conversations", res));
    },
  );

  tool(
    server,
    "merge_tickets",
    "Merge tickets into a primary.",
    { merge: z.record(z.any()) },
    async ({ merge }) => {
      const v = validate(TicketMerge, merge);
      if (!v.ok) return v.reply;
      const res = await fd.put("/tickets/merge", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to merge tickets", res));
    },
  );

  tool(
    server,
    "forward_ticket",
    "Forward a ticket.",
    { ticket_id: z.number().int(), forward: z.record(z.any()) },
    async ({ ticket_id, forward }) => {
      const v = validate(TicketForward, forward);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/tickets/${ticket_id}/forward`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to forward ticket", res));
    },
  );

  tool(
    server,
    "list_ticket_time_entries",
    "List time entries on a ticket.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.get(`/tickets/${ticket_id}/time_entries`);
      return text(res.ok ? res.data : errorPayload("Failed to list time entries", res));
    },
  );

  tool(
    server,
    "list_ticket_satisfaction_ratings",
    "List satisfaction ratings on a ticket.",
    { ticket_id: z.number().int() },
    async ({ ticket_id }) => {
      const res = await fd.get(`/tickets/${ticket_id}/satisfaction_ratings`);
      return text(res.ok ? res.data : errorPayload("Failed to list satisfaction ratings", res));
    },
  );

  tool(
    server,
    "delete_conversation",
    "Delete a conversation (reply/note).",
    { conversation_id: z.number().int() },
    async ({ conversation_id }) => {
      const res = await fd.delete(`/conversations/${conversation_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete conversation", res));
    },
  );

  tool(
    server,
    "reply_to_forward",
    "Reply to a forwarded conversation.",
    { ticket_id: z.number().int(), reply: z.record(z.any()) },
    async ({ ticket_id, reply }) => {
      const v = validate(ReplyCreate, reply);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/tickets/${ticket_id}/reply_to_forward`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to reply to forward", res));
    },
  );

  // Re-export of enum source/status/priority for client introspection
  tool(
    server,
    "list_ticket_enums",
    "Return numeric ranges for ticket source/status/priority.",
    {},
    async () =>
      text({
        source: { Email: 1, Portal: 2, Phone: 3, Chat: 7, FeedbackWidget: 9, OutboundEmail: 10 },
        status: { Open: 2, Pending: 3, Resolved: 4, Closed: 5 },
        priority: { Low: 1, Medium: 2, High: 3, Urgent: 4 },
      }),
  );
}
