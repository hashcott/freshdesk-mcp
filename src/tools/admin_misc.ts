import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fd, errorPayload } from "../freshdesk.js";
import { text, validate, tool } from "../util.js";
import {
  SkillCreate,
  SkillUpdate,
  MailboxCreate,
  MailboxUpdate,
  ThreadCreate,
  ThreadUpdate,
  ThreadMessageCreate,
  ThreadMessageUpdate,
  TimeEntryCreate,
  TimeEntryUpdate,
} from "../schemas/index.js";

const pageArgs = {
  page: z.number().int().min(1).optional().default(1),
  per_page: z.number().int().min(1).max(100).optional().default(30),
};

// ─── Skills ───────────────────────────────────────
export function registerSkillTools(server: McpServer) {
  tool(server, "list_skills", "List skills.", pageArgs, async ({ page, per_page }) => {
    const res = await fd.get("/skills", { page, per_page });
    return text(res.ok ? res.data : errorPayload("Failed to list skills", res));
  });
  tool(server, "view_skill", "View a skill.", { skill_id: z.number().int() }, async ({ skill_id }) => {
    const res = await fd.get(`/skills/${skill_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view skill", res));
  });
  tool(server, "create_skill", "Create a skill.", { skill: z.record(z.any()) }, async ({ skill }) => {
    const v = validate(SkillCreate, skill);
    if (!v.ok) return v.reply;
    const res = await fd.post("/skills", v.data);
    return text(res.ok ? res.data : errorPayload("Failed to create skill", res));
  });
  tool(server, "update_skill", "Update a skill.", { skill_id: z.number().int(), skill: z.record(z.any()) }, async ({ skill_id, skill }) => {
    const v = validate(SkillUpdate, skill);
    if (!v.ok) return v.reply;
    const res = await fd.put(`/skills/${skill_id}`, v.data);
    return text(res.ok ? res.data : errorPayload("Failed to update skill", res));
  });
  tool(server, "delete_skill", "Delete a skill.", { skill_id: z.number().int() }, async ({ skill_id }) => {
    const res = await fd.delete(`/skills/${skill_id}`);
    if (res.status === 204) return text({ success: true });
    return text(errorPayload("Failed to delete skill", res));
  });
}

// ─── Roles ───────────────────────────────────────
export function registerRoleTools(server: McpServer) {
  tool(server, "list_roles", "List roles.", pageArgs, async ({ page, per_page }) => {
    const res = await fd.get("/roles", { page, per_page });
    return text(res.ok ? res.data : errorPayload("Failed to list roles", res));
  });
  tool(server, "view_role", "View a role.", { role_id: z.number().int() }, async ({ role_id }) => {
    const res = await fd.get(`/roles/${role_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view role", res));
  });
}

// ─── Products ────────────────────────────────────
export function registerProductTools(server: McpServer) {
  tool(server, "list_products", "List products.", pageArgs, async ({ page, per_page }) => {
    const res = await fd.get("/products", { page, per_page });
    return text(res.ok ? res.data : errorPayload("Failed to list products", res));
  });
  tool(server, "view_product", "View a product.", { product_id: z.number().int() }, async ({ product_id }) => {
    const res = await fd.get(`/products/${product_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view product", res));
  });
}

// ─── Business Hours ──────────────────────────────
export function registerBusinessHoursTools(server: McpServer) {
  tool(server, "list_business_hours", "List business hours configs.", {}, async () => {
    const res = await fd.get("/business_hours");
    return text(res.ok ? res.data : errorPayload("Failed to list business hours", res));
  });
  tool(server, "view_business_hours", "View a business hours config.", { business_hours_id: z.number().int() }, async ({ business_hours_id }) => {
    const res = await fd.get(`/business_hours/${business_hours_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view business hours", res));
  });
}

// ─── SLA Policies ────────────────────────────────
export function registerSlaTools(server: McpServer) {
  tool(server, "list_sla_policies", "List SLA policies.", {}, async () => {
    const res = await fd.get("/sla_policies");
    return text(res.ok ? res.data : errorPayload("Failed to list SLA policies", res));
  });
  tool(server, "view_sla_policy", "View an SLA policy.", { sla_policy_id: z.number().int() }, async ({ sla_policy_id }) => {
    const res = await fd.get(`/sla_policies/${sla_policy_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view SLA policy", res));
  });
}

// ─── Email Configs ───────────────────────────────
export function registerEmailConfigTools(server: McpServer) {
  tool(server, "list_email_configs", "List email configs.", {}, async () => {
    const res = await fd.get("/email_configs");
    return text(res.ok ? res.data : errorPayload("Failed to list email configs", res));
  });
  tool(server, "view_email_config", "View an email config.", { email_config_id: z.number().int() }, async ({ email_config_id }) => {
    const res = await fd.get(`/email_configs/${email_config_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view email config", res));
  });
}

// ─── Email Mailboxes ─────────────────────────────
export function registerMailboxTools(server: McpServer) {
  tool(server, "list_email_mailboxes", "List email mailboxes.", {}, async () => {
    const res = await fd.get("/email/mailboxes");
    return text(res.ok ? res.data : errorPayload("Failed to list mailboxes", res));
  });
  tool(server, "view_email_mailbox", "View an email mailbox.", { mailbox_id: z.number().int() }, async ({ mailbox_id }) => {
    const res = await fd.get(`/email/mailboxes/${mailbox_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view mailbox", res));
  });
  tool(server, "create_email_mailbox", "Create an email mailbox.", { mailbox: z.record(z.any()) }, async ({ mailbox }) => {
    const v = validate(MailboxCreate, mailbox);
    if (!v.ok) return v.reply;
    const res = await fd.post("/email/mailboxes", v.data);
    return text(res.ok ? res.data : errorPayload("Failed to create mailbox", res));
  });
  tool(server, "update_email_mailbox", "Update an email mailbox.", { mailbox_id: z.number().int(), mailbox: z.record(z.any()) }, async ({ mailbox_id, mailbox }) => {
    const v = validate(MailboxUpdate, mailbox);
    if (!v.ok) return v.reply;
    const res = await fd.put(`/email/mailboxes/${mailbox_id}`, v.data);
    return text(res.ok ? res.data : errorPayload("Failed to update mailbox", res));
  });
  tool(server, "delete_email_mailbox", "Delete an email mailbox.", { mailbox_id: z.number().int() }, async ({ mailbox_id }) => {
    const res = await fd.delete(`/email/mailboxes/${mailbox_id}`);
    if (res.status === 204) return text({ success: true });
    return text(errorPayload("Failed to delete mailbox", res));
  });
}

// ─── Settings / Account ──────────────────────────
export function registerSettingsTools(server: McpServer) {
  tool(server, "view_helpdesk_settings", "View helpdesk settings.", {}, async () => {
    const res = await fd.get("/settings/helpdesk");
    return text(res.ok ? res.data : errorPayload("Failed to view settings", res));
  });
}

export function registerAccountTools(server: McpServer) {
  tool(server, "view_account", "View account information.", {}, async () => {
    const res = await fd.get("/account");
    return text(res.ok ? res.data : errorPayload("Failed to view account", res));
  });
}

// ─── Threads ─────────────────────────────────────
export function registerThreadTools(server: McpServer) {
  tool(server, "create_thread", "Create a collaboration thread.", { thread: z.record(z.any()) }, async ({ thread }) => {
    const v = validate(ThreadCreate, thread);
    if (!v.ok) return v.reply;
    const res = await fd.post("/collaboration/threads", v.data);
    return text(res.ok ? res.data : errorPayload("Failed to create thread", res));
  });
  tool(server, "view_thread", "View a thread.", { thread_id: z.number().int() }, async ({ thread_id }) => {
    const res = await fd.get(`/collaboration/threads/${thread_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view thread", res));
  });
  tool(server, "update_thread", "Update a thread.", { thread_id: z.number().int(), thread: z.record(z.any()) }, async ({ thread_id, thread }) => {
    const v = validate(ThreadUpdate, thread);
    if (!v.ok) return v.reply;
    const res = await fd.put(`/collaboration/threads/${thread_id}`, v.data);
    return text(res.ok ? res.data : errorPayload("Failed to update thread", res));
  });
  tool(server, "delete_thread", "Delete a thread.", { thread_id: z.number().int() }, async ({ thread_id }) => {
    const res = await fd.delete(`/collaboration/threads/${thread_id}`);
    if (res.status === 204) return text({ success: true });
    return text(errorPayload("Failed to delete thread", res));
  });
  tool(server, "list_thread_messages", "List messages within a thread.", { thread_id: z.number().int() }, async ({ thread_id }) => {
    const res = await fd.get(`/collaboration/threads/${thread_id}/messages`);
    return text(res.ok ? res.data : errorPayload("Failed to list thread messages", res));
  });
  tool(server, "create_thread_message", "Post a new message to a thread.", { thread_id: z.number().int(), message: z.record(z.any()) }, async ({ thread_id, message }) => {
    const v = validate(ThreadMessageCreate, message);
    if (!v.ok) return v.reply;
    const res = await fd.post(`/collaboration/threads/${thread_id}/messages`, v.data);
    return text(res.ok ? res.data : errorPayload("Failed to create thread message", res));
  });
  tool(server, "view_thread_message", "View a thread message.", { message_id: z.number().int() }, async ({ message_id }) => {
    const res = await fd.get(`/collaboration/messages/${message_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view thread message", res));
  });
  tool(server, "update_thread_message", "Update a thread message.", { message_id: z.number().int(), message: z.record(z.any()) }, async ({ message_id, message }) => {
    const v = validate(ThreadMessageUpdate, message);
    if (!v.ok) return v.reply;
    const res = await fd.put(`/collaboration/messages/${message_id}`, v.data);
    return text(res.ok ? res.data : errorPayload("Failed to update thread message", res));
  });
  tool(server, "delete_thread_message", "Delete a thread message.", { message_id: z.number().int() }, async ({ message_id }) => {
    const res = await fd.delete(`/collaboration/messages/${message_id}`);
    if (res.status === 204) return text({ success: true });
    return text(errorPayload("Failed to delete thread message", res));
  });
}

// ─── Time Entries ────────────────────────────────
export function registerTimeEntryTools(server: McpServer) {
  tool(server, 
    "list_time_entries",
    "List all time entries across the account.",
    {
      ...pageArgs,
      agent_id: z.number().int().optional(),
      company_id: z.number().int().optional(),
      executed_after: z.string().optional(),
      executed_before: z.string().optional(),
      billable: z.boolean().optional(),
    },
    async (args) => {
      const res = await fd.get("/time_entries", args);
      return text(res.ok ? res.data : errorPayload("Failed to list time entries", res));
    },
  );
  tool(server, 
    "create_time_entry",
    "Create a time entry on a ticket.",
    { ticket_id: z.number().int(), time_entry: z.record(z.any()) },
    async ({ ticket_id, time_entry }) => {
      const v = validate(TimeEntryCreate, time_entry);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/tickets/${ticket_id}/time_entries`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create time entry", res));
    },
  );
  tool(server, 
    "update_time_entry",
    "Update a time entry.",
    { time_entry_id: z.number().int(), time_entry: z.record(z.any()) },
    async ({ time_entry_id, time_entry }) => {
      const v = validate(TimeEntryUpdate, time_entry);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/time_entries/${time_entry_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update time entry", res));
    },
  );
  tool(server, "delete_time_entry", "Delete a time entry.", { time_entry_id: z.number().int() }, async ({ time_entry_id }) => {
    const res = await fd.delete(`/time_entries/${time_entry_id}`);
    if (res.status === 204) return text({ success: true });
    return text(errorPayload("Failed to delete time entry", res));
  });
  tool(server, "toggle_time_entry_timer", "Start/stop a time entry timer.", { time_entry_id: z.number().int() }, async ({ time_entry_id }) => {
    const res = await fd.put(`/time_entries/${time_entry_id}/toggle_timer`);
    return text(res.ok ? res.data : errorPayload("Failed to toggle timer", res));
  });
}
