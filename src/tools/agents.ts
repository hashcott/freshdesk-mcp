import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorPayload, fd } from "../freshdesk.js";
import { AgentCreate, AgentUpdate, GroupCreate, GroupUpdate } from "../schemas/index.js";
import { text, tool, validate } from "../util.js";

const pageArgs = {
  page: z.number().int().min(1).optional().default(1),
  per_page: z.number().int().min(1).max(100).optional().default(30),
};

export function registerAgentTools(server: McpServer) {
  tool(server, "get_agents", "List agents.", pageArgs, async ({ page, per_page }) => {
    const res = await fd.get("/agents", { page, per_page });
    return text(res.ok ? res.data : errorPayload("Failed to list agents", res));
  });

  tool(
    server,
    "view_agent",
    "View an agent.",
    { agent_id: z.number().int() },
    async ({ agent_id }) => {
      const res = await fd.get(`/agents/${agent_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to fetch agent", res));
    },
  );

  tool(
    server,
    "create_agent",
    "Create an agent.",
    { agent: z.record(z.any()) },
    async ({ agent }) => {
      const v = validate(AgentCreate, agent);
      if (!v.ok) return v.reply;
      const res = await fd.post("/agents", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create agent", res));
    },
  );

  tool(
    server,
    "update_agent",
    "Update an agent.",
    { agent_id: z.number().int(), agent: z.record(z.any()) },
    async ({ agent_id, agent }) => {
      const v = validate(AgentUpdate, agent);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/agents/${agent_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update agent", res));
    },
  );

  tool(
    server,
    "search_agents",
    "Autocomplete agents.",
    { query: z.string() },
    async ({ query }) => {
      const res = await fd.get("/agents/autocomplete", { term: query });
      return text(res.ok ? res.data : errorPayload("Failed to search agents", res));
    },
  );

  tool(server, "view_current_agent", "View the currently authenticated agent.", {}, async () => {
    const res = await fd.get("/agents/me");
    return text(res.ok ? res.data : errorPayload("Failed to view current agent", res));
  });

  tool(
    server,
    "delete_agent",
    "Deactivate / delete an agent.",
    { agent_id: z.number().int() },
    async ({ agent_id }) => {
      const res = await fd.delete(`/agents/${agent_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete agent", res));
    },
  );

  tool(
    server,
    "bulk_create_agents",
    "Bulk create agents.",
    { agents: z.array(z.record(z.any())).min(1) },
    async ({ agents }) => {
      const validated: any[] = [];
      for (let i = 0; i < agents.length; i++) {
        const v = validate(AgentCreate, agents[i]);
        if (!v.ok)
          return text({
            error: `Agent at index ${i} failed validation`,
            issues: (v.reply.content[0] as any).text,
          });
        validated.push(v.data);
      }
      const res = await fd.post("/agents/bulk", { agents: validated });
      return text(res.ok ? res.data : errorPayload("Failed to bulk create agents", res));
    },
  );
}

export function registerGroupTools(server: McpServer) {
  tool(server, "list_groups", "List groups.", pageArgs, async ({ page, per_page }) => {
    const res = await fd.get("/groups", { page, per_page });
    return text(res.ok ? res.data : errorPayload("Failed to list groups", res));
  });

  tool(
    server,
    "create_group",
    "Create a group.",
    { group: z.record(z.any()) },
    async ({ group }) => {
      const v = validate(GroupCreate, group);
      if (!v.ok) return v.reply;
      const res = await fd.post("/groups", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create group", res));
    },
  );

  tool(
    server,
    "view_group",
    "View a group.",
    { group_id: z.number().int() },
    async ({ group_id }) => {
      const res = await fd.get(`/groups/${group_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view group", res));
    },
  );

  tool(
    server,
    "update_group",
    "Update a group.",
    { group_id: z.number().int(), group: z.record(z.any()) },
    async ({ group_id, group }) => {
      const v = validate(GroupUpdate, group);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/groups/${group_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update group", res));
    },
  );

  tool(
    server,
    "delete_group",
    "Delete a group.",
    { group_id: z.number().int() },
    async ({ group_id }) => {
      const res = await fd.delete(`/groups/${group_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete group", res));
    },
  );

  // Admin groups (SLA-aware)
  tool(server, "list_admin_groups", "List admin groups.", pageArgs, async ({ page, per_page }) => {
    const res = await fd.get("/admin/groups", { page, per_page });
    return text(res.ok ? res.data : errorPayload("Failed to list admin groups", res));
  });

  tool(
    server,
    "view_admin_group",
    "View an admin group.",
    { group_id: z.number().int() },
    async ({ group_id }) => {
      const res = await fd.get(`/admin/groups/${group_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view admin group", res));
    },
  );

  tool(
    server,
    "create_admin_group",
    "Create an admin group.",
    { group: z.record(z.any()) },
    async ({ group }) => {
      const v = validate(GroupCreate, group);
      if (!v.ok) return v.reply;
      const res = await fd.post("/admin/groups", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create admin group", res));
    },
  );

  tool(
    server,
    "update_admin_group",
    "Update an admin group.",
    { group_id: z.number().int(), group: z.record(z.any()) },
    async ({ group_id, group }) => {
      const v = validate(GroupUpdate, group);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/admin/groups/${group_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update admin group", res));
    },
  );

  tool(
    server,
    "delete_admin_group",
    "Delete an admin group.",
    { group_id: z.number().int() },
    async ({ group_id }) => {
      const res = await fd.delete(`/admin/groups/${group_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete admin group", res));
    },
  );
}
