// Regenerates docs/API.md from the live tool registry. Run: npm run build && npm run docs:api
import { readFileSync, writeFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const DOCS = "https://developers.freshdesk.com/api/#";
// Sections in registration order: [title, first tool of the section].
const SECTIONS = [
  ["Tickets", "get_ticket_fields"],
  ["Conversations", "get_ticket_conversation"],
  ["Ticket Summary", "view_ticket_summary"],
  ["Ticket Fields & Sections", "get_field_properties"],
  ["Ticket Forms", "list_ticket_forms"],
  ["Bulk & Merge", "bulk_create_tickets"],
  ["Archived Tickets", "list_archived_tickets"],
  ["Watchers, Associations & Access", "list_ticket_watchers"],
  ["Ticket Related Lists", "list_ticket_time_entries"],
  ["Attachments", "get_ticket_attachment"],
  ["Contacts", "list_contacts"],
  ["Contact Export & Import", "export_contacts"],
  ["Contact Fields", "list_contact_fields"],
  ["Agents", "get_agents"],
  ["Agent Availability", "list_agent_availabilities"],
  ["Groups", "list_groups"],
  ["Admin Groups", "list_admin_groups"],
  ["Canned Responses", "list_canned_response_folders"],
  ["Solutions (Knowledge Base)", "search_solution_articles"],
  ["Companies", "list_companies"],
  ["Company Export & Import", "export_companies"],
  ["Company Fields", "list_company_fields"],
  ["Skills", "list_skills"],
  ["Roles", "list_roles"],
  ["Products", "list_products"],
  ["Business Hours", "list_business_hours"],
  ["SLA Policies", "list_sla_policies"],
  ["Email Configs", "list_email_configs"],
  ["Email Mailboxes & Settings", "list_email_mailboxes"],
  ["Helpdesk Settings", "view_helpdesk_settings"],
  ["Account", "view_account"],
  ["Collaboration Threads", "create_thread"],
  ["Time Entries", "list_time_entries"],
  ["Discussions (Forums)", "list_forum_categories"],
  ["Surveys & Satisfaction", "list_csat_surveys"],
  ["Automations", "list_automation_rules"],
  ["Scenario Automations", "list_scenario_automations"],
  ["Custom Objects", "list_custom_object_schemas"],
  ["Field Service Management", "list_service_tasks"],
  ["Outbound (Email & WhatsApp)", "create_outbound_email"],
  ["Jobs", "view_job_status"],
  ["Contact Activities", "publish_contact_activity"],
];

// Doc anchors: reuse whatever the current API.md links, plus overrides for new/renamed tools.
const links = {};
for (const m of readFileSync("docs/API.md", "utf8").matchAll(/^\| `(\w+)` \|.*\[↗\]\((\S+)\) \|$/gm)) links[m[1]] = m[2];
const anchors = {
  delete_attachment: "delete_an_attachment",
  list_ticket_field_sections: "list_all_section_fields",
  view_ticket_field_section: "list_specific_section",
  create_ticket_field_section: "create_section",
  update_ticket_field_section: "update_section",
  delete_ticket_field_section: "delete_section",
  list_ticket_forms: "list_all_ticket_forms",
  view_ticket_form: "view_ticket_form",
  create_ticket_form: "create_ticket_form",
  update_ticket_form: "update_ticket_form",
  delete_ticket_form: "delete_ticket_form",
  view_ticket_form_field: "view_ticket_form_field",
  update_ticket_form_field: "update_ticket_form_field",
  delete_ticket_form_field: "delete_ticket_form_field",
  get_ticket_attachment: "view_a_ticket",
  get_ticket_inline_images: "view_a_ticket",
  get_ticket_attachments: "view_a_ticket",
  list_ticket_attachments: "view_a_ticket",
  filter_contacts: "filter_contacts",
  export_contacts: "export_contact",
  view_contact_export: "export_contact",
  list_contact_imports: "import_contact",
  view_contact_import: "import_contact",
  cancel_contact_import: "import_contact",
  filter_companies: "filter_companies",
  export_companies: "export_company",
  view_company_export: "export_company",
  list_company_imports: "import_company",
  view_company_import: "import_company",
  cancel_company_import: "import_company",
  list_company_contacts: "list_all_contacts",
  list_agent_availabilities: "list_all_agents_availability",
  view_agent_availability: "view_agent_availability",
  update_agent_availability: "update_agent_availability",
  list_group_agents: "list_all_agents_in_a_group",
  update_group_agents: "add_or_remove_agent_in_a_group",
  view_canned_response_folder: "view_canned_response_folders",
  bulk_create_canned_responses: "bulk_create_canned_responses",
  list_solution_subfolders: "list_all_solution_folders",
  create_solution_translation: "solutions",
  create_sla_policy: "create_sla_policy",
  update_sla_policy: "update_sla_policy",
  view_mailbox_settings: "view_mailbox_settings",
  update_mailbox_settings: "update_mailbox_settings",
  view_automatic_bcc_emails: "view_automatic_bcc_emails",
  update_automatic_bcc_emails: "update_automatic_bcc_emails",
  export_account: "generate_export",
  create_thread_message: "create_message_for_thread",
  get_thread_message_quote: "get_quoted_text",
  list_csat_surveys: "csat_surveys",
  list_survey_responses: "view_survey_responses",
  create_survey_response: "create_survey_responses",
  count_custom_object_records: "retrieve_the_count_of_records_custom_objects",
  list_custom_object_records: "filter_records_of_custom_objects",
  send_whatsapp_message: "send_outbound_message",
  view_outbound_message: "retrieve_outbound_message",
  publish_contact_activity: "publish_omnichannel_activity",
  list_skills: "list_all_skills",
  view_skill: "view_skill",
  create_skill: "create_skill",
  update_skill: "update_skill",
  delete_skill: "delete_skill",
  bulk_update_tickets: "bulk_update_tickets",
  follow_discussion: "monitor_forum",
  unfollow_discussion: "unmonitor_forum",
  check_discussion_follow: "view_monitor_status_for_forum",
  list_followed_topics: "list_all_monitored_topics",
  list_participated_topics: "list_all_participated_topics",
  list_ticket_watchers: "list_all_watchers",
  add_ticket_watcher: "add_watcher",
  remove_ticket_watcher: "remove_watcher",
  bulk_watch_tickets: "add_watcher_multiple_tickets",
  bulk_unwatch_tickets: "remove_watcher_multiple_tickets",
  get_associated_tickets: "get_associated_tickets",
  get_prime_association: "ticket_prime_association",
  list_ticket_accesses: "get_user_accesses",
  add_ticket_accesses: "create_user_accesses",
  update_ticket_accesses: "update_user_accesses",
  remove_ticket_accesses: "delete_user_accesses",
  clone_ticket_form: "clone_ticket_form",
  get_ticket_conversation: "list_all_ticket_notes",
  list_archived_ticket_conversations: "delete_archive_ticket",
  list_service_tasks: "service_task",
  create_service_task: "create_service_task",
  update_service_task: "update_service_task",
  delete_service_task: "delete_service_task",
  view_service_task: "view_service_task",
};
for (const [k, v] of Object.entries(anchors)) links[k] = DOCS + v;

const t = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env: { ...process.env, MCP_TRANSPORT: "stdio", FRESHDESK_API_KEY: "x", FRESHDESK_DOMAIN: "example.invalid" },
  stderr: "ignore",
});
const client = new Client({ name: "gen-api-docs", version: "0" });
await client.connect(t);
const { tools } = await client.listTools();
const { prompts } = await client.listPrompts();
await client.close();

const cell = (s) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-");
const starts = new Map(SECTIONS.map(([title, first]) => [first, title]));
const body = [];
const missing = [];
for (const tool of tools) {
  if (starts.has(tool.name)) {
    body.push(`\n## ${starts.get(tool.name)}\n`, "| Tool | Description | Params | Docs |", "| --- | --- | --- | --- |");
  }
  const params = Object.keys(tool.inputSchema?.properties ?? {});
  if (!links[tool.name]) missing.push(tool.name);
  body.push(
    `| \`${tool.name}\` | ${cell(tool.description ?? "")} | ${params.length ? params.map((p) => `\`${p}\``).join(", ") : "_(none)_"} | ${links[tool.name] ? `[↗](${links[tool.name]})` : ""} |`,
  );
}
if (starts.size !== SECTIONS.length || !starts.has(tools[0].name)) throw new Error("bad SECTIONS");
const unseen = SECTIONS.filter(([, first]) => !tools.some((x) => x.name === first));
if (unseen.length) throw new Error(`Unknown section start tools: ${unseen.map((s) => s[1])}`);

const out = `# API Reference

> Generated from the running MCP server by \`npm run docs:api\` (scripts/gen-api-docs.mjs) — **${tools.length} tools**. Do not edit by hand.
> Payload schemas: [SCHEMAS.md](SCHEMAS.md). Upstream reference: https://developers.freshdesk.com/api/

## Conventions

- **Params** lists top-level input keys. Resource payloads (\`ticket\`, \`contact\`, …) are objects whose fields are listed in the description and validated by Zod (see [SCHEMAS.md](SCHEMAS.md)).
- Page-based lists accept \`page\` (≥1) and \`per_page\` (1–100, default 30). Search/filter tools return max 30 results/page, 10 pages.
- Results are JSON in \`content[0].text\`. Failures are \`{ error, details }\` with \`isError: true\`. Attachment tools also return \`image\` / \`resource\` content.

## Index

${SECTIONS.map(([title]) => `- [${title}](#${slug(title)})`).join("\n")}
- [Prompts](#prompts)
${body.join("\n")}

## Prompts

| Prompt | Args | Purpose |
| --- | --- | --- |
${prompts.map((p) => `| \`${p.name}\` | ${(p.arguments ?? []).map((a) => `\`${a.name}\``).join(", ")} | ${cell(p.description ?? "")} |`).join("\n")}
`;
writeFileSync("docs/API.md", out);
console.log(`docs/API.md: ${tools.length} tools${missing.length ? `; no doc link: ${missing.join(", ")}` : ""}`);
