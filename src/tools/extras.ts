import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorPayload, fd } from "../freshdesk.js";
import {
  AutomationRuleCreate,
  AutomationRuleUpdate,
  AutomationTypeIdEnum,
  CommentCreate,
  CommentUpdate,
  CustomObjectRecordCreate,
  CustomObjectRecordUpdate,
  ForumCategoryCreate,
  ForumCategoryUpdate,
  ForumCreate,
  ForumUpdate,
  OutboundEmailCreate,
  SatisfactionRatingCreate,
  ServiceTaskCreate,
  ServiceTaskUpdate,
  TopicCreate,
  TopicUpdate,
} from "../schemas/index.js";
import { text, tool, validate } from "../util.js";

const pageArgs = {
  page: z.number().int().min(1).optional().default(1),
  per_page: z.number().int().min(1).max(100).optional().default(30),
};

// ─── Discussions / Forums ────────────────────────
export function registerDiscussionTools(server: McpServer) {
  tool(server, "list_forum_categories", "List forum categories.", {}, async () => {
    const res = await fd.get("/discussions/categories");
    return text(res.ok ? res.data : errorPayload("Failed to list forum categories", res));
  });
  tool(
    server,
    "view_forum_category",
    "View a forum category.",
    { category_id: z.number().int() },
    async ({ category_id }) => {
      const res = await fd.get(`/discussions/categories/${category_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view forum category", res));
    },
  );
  tool(
    server,
    "create_forum_category",
    "Create a forum category.",
    { category: z.record(z.any()) },
    async ({ category }) => {
      const v = validate(ForumCategoryCreate, category);
      if (!v.ok) return v.reply;
      const res = await fd.post("/discussions/categories", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create forum category", res));
    },
  );
  tool(
    server,
    "update_forum_category",
    "Update a forum category.",
    { category_id: z.number().int(), category: z.record(z.any()) },
    async ({ category_id, category }) => {
      const v = validate(ForumCategoryUpdate, category);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/discussions/categories/${category_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update forum category", res));
    },
  );
  tool(
    server,
    "delete_forum_category",
    "Delete a forum category.",
    { category_id: z.number().int() },
    async ({ category_id }) => {
      const res = await fd.delete(`/discussions/categories/${category_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete forum category", res));
    },
  );

  tool(
    server,
    "list_forums",
    "List forums under a category.",
    { category_id: z.number().int() },
    async ({ category_id }) => {
      const res = await fd.get(`/discussions/categories/${category_id}/forums`);
      return text(res.ok ? res.data : errorPayload("Failed to list forums", res));
    },
  );
  tool(
    server,
    "view_forum",
    "View a forum.",
    { forum_id: z.number().int() },
    async ({ forum_id }) => {
      const res = await fd.get(`/discussions/forums/${forum_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view forum", res));
    },
  );
  tool(
    server,
    "create_forum",
    "Create a forum.",
    { category_id: z.number().int(), forum: z.record(z.any()) },
    async ({ category_id, forum }) => {
      const v = validate(ForumCreate, forum);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/discussions/categories/${category_id}/forums`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create forum", res));
    },
  );
  tool(
    server,
    "update_forum",
    "Update a forum.",
    { forum_id: z.number().int(), forum: z.record(z.any()) },
    async ({ forum_id, forum }) => {
      const v = validate(ForumUpdate, forum);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/discussions/forums/${forum_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update forum", res));
    },
  );
  tool(
    server,
    "delete_forum",
    "Delete a forum.",
    { forum_id: z.number().int() },
    async ({ forum_id }) => {
      const res = await fd.delete(`/discussions/forums/${forum_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete forum", res));
    },
  );

  tool(
    server,
    "list_topics",
    "List topics under a forum.",
    { forum_id: z.number().int() },
    async ({ forum_id }) => {
      const res = await fd.get(`/discussions/forums/${forum_id}/topics`);
      return text(res.ok ? res.data : errorPayload("Failed to list topics", res));
    },
  );
  tool(
    server,
    "view_topic",
    "View a topic.",
    { topic_id: z.number().int() },
    async ({ topic_id }) => {
      const res = await fd.get(`/discussions/topics/${topic_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view topic", res));
    },
  );
  tool(
    server,
    "create_topic",
    "Create a topic.",
    { forum_id: z.number().int(), topic: z.record(z.any()) },
    async ({ forum_id, topic }) => {
      const v = validate(TopicCreate, topic);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/discussions/forums/${forum_id}/topics`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create topic", res));
    },
  );
  tool(
    server,
    "update_topic",
    "Update a topic.",
    { topic_id: z.number().int(), topic: z.record(z.any()) },
    async ({ topic_id, topic }) => {
      const v = validate(TopicUpdate, topic);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/discussions/topics/${topic_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update topic", res));
    },
  );
  tool(
    server,
    "delete_topic",
    "Delete a topic.",
    { topic_id: z.number().int() },
    async ({ topic_id }) => {
      const res = await fd.delete(`/discussions/topics/${topic_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete topic", res));
    },
  );

  tool(
    server,
    "list_topic_comments",
    "List comments under a topic.",
    { topic_id: z.number().int() },
    async ({ topic_id }) => {
      const res = await fd.get(`/discussions/topics/${topic_id}/comments`);
      return text(res.ok ? res.data : errorPayload("Failed to list comments", res));
    },
  );
  tool(
    server,
    "create_topic_comment",
    "Create a topic comment.",
    { topic_id: z.number().int(), comment: z.record(z.any()) },
    async ({ topic_id, comment }) => {
      const v = validate(CommentCreate, comment);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/discussions/topics/${topic_id}/comments`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create comment", res));
    },
  );
  tool(
    server,
    "update_topic_comment",
    "Update a topic comment.",
    { comment_id: z.number().int(), comment: z.record(z.any()) },
    async ({ comment_id, comment }) => {
      const v = validate(CommentUpdate, comment);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/discussions/comments/${comment_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update comment", res));
    },
  );
  tool(
    server,
    "delete_topic_comment",
    "Delete a topic comment.",
    { comment_id: z.number().int() },
    async ({ comment_id }) => {
      const res = await fd.delete(`/discussions/comments/${comment_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete comment", res));
    },
  );
}

// ─── Surveys / Satisfaction ──────────────────────
export function registerSurveyTools(server: McpServer) {
  tool(server, "list_surveys", "List surveys.", {}, async () => {
    const res = await fd.get("/surveys");
    return text(res.ok ? res.data : errorPayload("Failed to list surveys", res));
  });
  tool(
    server,
    "view_survey",
    "View a survey.",
    { survey_id: z.number().int() },
    async ({ survey_id }) => {
      const res = await fd.get(`/surveys/${survey_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view survey", res));
    },
  );
  tool(
    server,
    "list_satisfaction_ratings",
    "List all satisfaction ratings.",
    {
      ...pageArgs,
      created_since: z.string().optional(),
      user_id: z.number().int().optional(),
    },
    async (args) => {
      const res = await fd.get("/surveys/satisfaction_ratings", args);
      return text(res.ok ? res.data : errorPayload("Failed to list satisfaction ratings", res));
    },
  );
  tool(
    server,
    "create_satisfaction_rating",
    "Create a satisfaction rating for a ticket.",
    { ticket_id: z.number().int(), rating: z.record(z.any()) },
    async ({ ticket_id, rating }) => {
      const v = validate(SatisfactionRatingCreate, rating);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/tickets/${ticket_id}/satisfaction_ratings`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create satisfaction rating", res));
    },
  );
}

// ─── Automations ─────────────────────────────────
export function registerAutomationTools(server: McpServer) {
  tool(
    server,
    "list_automation_rules",
    "List automation rules of a type (1=ticket-creation, 3=time-triggered, 4=on-update).",
    { automation_type_id: AutomationTypeIdEnum },
    async ({ automation_type_id }) => {
      const res = await fd.get(`/automations/${automation_type_id}/rules`);
      return text(res.ok ? res.data : errorPayload("Failed to list automation rules", res));
    },
  );
  tool(
    server,
    "view_automation_rule",
    "View an automation rule.",
    {
      automation_type_id: AutomationTypeIdEnum,
      rule_id: z.number().int(),
    },
    async ({ automation_type_id, rule_id }) => {
      const res = await fd.get(`/automations/${automation_type_id}/rules/${rule_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view automation rule", res));
    },
  );
  tool(
    server,
    "create_automation_rule",
    "Create an automation rule.",
    { automation_type_id: AutomationTypeIdEnum, rule: z.record(z.any()) },
    async ({ automation_type_id, rule }) => {
      const v = validate(AutomationRuleCreate, rule);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/automations/${automation_type_id}/rules`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create automation rule", res));
    },
  );
  tool(
    server,
    "update_automation_rule",
    "Update an automation rule.",
    {
      automation_type_id: AutomationTypeIdEnum,
      rule_id: z.number().int(),
      rule: z.record(z.any()),
    },
    async ({ automation_type_id, rule_id, rule }) => {
      const v = validate(AutomationRuleUpdate, rule);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/automations/${automation_type_id}/rules/${rule_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update automation rule", res));
    },
  );
  tool(
    server,
    "delete_automation_rule",
    "Delete an automation rule.",
    {
      automation_type_id: AutomationTypeIdEnum,
      rule_id: z.number().int(),
    },
    async ({ automation_type_id, rule_id }) => {
      const res = await fd.delete(`/automations/${automation_type_id}/rules/${rule_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete automation rule", res));
    },
  );
}

// ─── Scenario Automations ────────────────────────
export function registerScenarioTools(server: McpServer) {
  tool(server, "list_scenario_automations", "List scenario automations.", {}, async () => {
    const res = await fd.get("/scenario_automations");
    return text(res.ok ? res.data : errorPayload("Failed to list scenarios", res));
  });
  tool(
    server,
    "view_scenario_automation",
    "View a scenario automation.",
    { scenario_id: z.number().int() },
    async ({ scenario_id }) => {
      const res = await fd.get(`/scenario_automations/${scenario_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view scenario", res));
    },
  );
  tool(
    server,
    "execute_scenario",
    "Execute a scenario on a ticket.",
    { ticket_id: z.number().int(), scenario_id: z.number().int() },
    async ({ ticket_id, scenario_id }) => {
      const res = await fd.put(`/tickets/${ticket_id}/execute_scenario`, { scenario_id });
      return text(res.ok ? res.data : errorPayload("Failed to execute scenario", res));
    },
  );
}

// ─── Custom Objects ──────────────────────────────
export function registerCustomObjectTools(server: McpServer) {
  tool(server, "list_custom_object_schemas", "List custom object schemas.", {}, async () => {
    const res = await fd.get("/custom_objects/schemas");
    return text(res.ok ? res.data : errorPayload("Failed to list schemas", res));
  });
  tool(
    server,
    "view_custom_object_schema",
    "View a custom object schema.",
    { schema_id: z.string() },
    async ({ schema_id }) => {
      const res = await fd.get(`/custom_objects/schemas/${schema_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view schema", res));
    },
  );
  tool(
    server,
    "list_custom_object_records",
    "List records for a custom object schema.",
    { schema_id: z.string(), ...pageArgs },
    async ({ schema_id, page, per_page }) => {
      const res = await fd.get(`/custom_objects/schemas/${schema_id}/records`, { page, per_page });
      return text(res.ok ? res.data : errorPayload("Failed to list records", res));
    },
  );
  tool(
    server,
    "view_custom_object_record",
    "View a custom object record.",
    { schema_id: z.string(), record_id: z.string() },
    async ({ schema_id, record_id }) => {
      const res = await fd.get(`/custom_objects/schemas/${schema_id}/records/${record_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view record", res));
    },
  );
  tool(
    server,
    "create_custom_object_record",
    "Create a custom object record.",
    { schema_id: z.string(), record: z.record(z.any()) },
    async ({ schema_id, record }) => {
      const v = validate(CustomObjectRecordCreate, record);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/custom_objects/schemas/${schema_id}/records`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create record", res));
    },
  );
  tool(
    server,
    "update_custom_object_record",
    "Update a custom object record.",
    { schema_id: z.string(), record_id: z.string(), record: z.record(z.any()) },
    async ({ schema_id, record_id, record }) => {
      const v = validate(CustomObjectRecordUpdate, record);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/custom_objects/schemas/${schema_id}/records/${record_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update record", res));
    },
  );
  tool(
    server,
    "delete_custom_object_record",
    "Delete a custom object record.",
    { schema_id: z.string(), record_id: z.string() },
    async ({ schema_id, record_id }) => {
      const res = await fd.delete(`/custom_objects/schemas/${schema_id}/records/${record_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete record", res));
    },
  );
}

// ─── FSM ─────────────────────────────────────────
export function registerFsmTools(server: McpServer) {
  tool(
    server,
    "list_service_tasks",
    "List FSM service tasks.",
    pageArgs,
    async ({ page, per_page }) => {
      const res = await fd.get("/fsm/service_tasks", { page, per_page });
      return text(res.ok ? res.data : errorPayload("Failed to list service tasks", res));
    },
  );
  tool(
    server,
    "view_service_task",
    "View an FSM service task.",
    { task_id: z.number().int() },
    async ({ task_id }) => {
      const res = await fd.get(`/fsm/service_tasks/${task_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view service task", res));
    },
  );
  tool(
    server,
    "create_service_task",
    "Create an FSM service task on a ticket.",
    { ticket_id: z.number().int(), task: z.record(z.any()) },
    async ({ ticket_id, task }) => {
      const v = validate(ServiceTaskCreate, task);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/tickets/${ticket_id}/fsm/service_tasks`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create service task", res));
    },
  );
  tool(
    server,
    "update_service_task",
    "Update an FSM service task.",
    { task_id: z.number().int(), task: z.record(z.any()) },
    async ({ task_id, task }) => {
      const v = validate(ServiceTaskUpdate, task);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/fsm/service_tasks/${task_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update service task", res));
    },
  );
  tool(
    server,
    "delete_service_task",
    "Delete an FSM service task.",
    { task_id: z.number().int() },
    async ({ task_id }) => {
      const res = await fd.delete(`/fsm/service_tasks/${task_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete service task", res));
    },
  );
  tool(
    server,
    "list_appointments",
    "List FSM appointments.",
    pageArgs,
    async ({ page, per_page }) => {
      const res = await fd.get("/fsm/appointments", { page, per_page });
      return text(res.ok ? res.data : errorPayload("Failed to list appointments", res));
    },
  );
  tool(
    server,
    "view_appointment",
    "View an FSM appointment.",
    { appointment_id: z.number().int() },
    async ({ appointment_id }) => {
      const res = await fd.get(`/fsm/appointments/${appointment_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view appointment", res));
    },
  );
  tool(server, "list_business_calendars", "List FSM business calendars.", {}, async () => {
    const res = await fd.get("/fsm/business_calendars");
    return text(res.ok ? res.data : errorPayload("Failed to list business calendars", res));
  });
}

// ─── Outbound ────────────────────────────────────
export function registerOutboundTools(server: McpServer) {
  tool(
    server,
    "create_outbound_email",
    "Create an outbound email ticket.",
    { email: z.record(z.any()) },
    async ({ email }) => {
      const v = validate(OutboundEmailCreate, email);
      if (!v.ok) return v.reply;
      const res = await fd.post("/tickets/outbound_email", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create outbound email", res));
    },
  );
}

// ─── Jobs / Availability / Omnichannel ───────────
export function registerJobTools(server: McpServer) {
  tool(
    server,
    "view_job_status",
    "View bulk job status.",
    { job_id: z.string() },
    async ({ job_id }) => {
      const res = await fd.get(`/jobs/${job_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view job status", res));
    },
  );
}

export function registerAvailabilityTools(server: McpServer) {
  tool(server, "list_agent_availabilities", "List agent availabilities.", {}, async () => {
    const res = await fd.get("/availabilities");
    return text(res.ok ? res.data : errorPayload("Failed to list availabilities", res));
  });
  tool(
    server,
    "view_agent_availability",
    "View an agent's availability.",
    { agent_id: z.number().int() },
    async ({ agent_id }) => {
      const res = await fd.get(`/availabilities/${agent_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view availability", res));
    },
  );
}

export function registerOmnichannelTools(server: McpServer) {
  tool(
    server,
    "list_omnichannel_activities",
    "List omnichannel activities.",
    pageArgs,
    async ({ page, per_page }) => {
      const res = await fd.get("/omnichannel/activities", { page, per_page });
      return text(res.ok ? res.data : errorPayload("Failed to list omnichannel activities", res));
    },
  );
}
