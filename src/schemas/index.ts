import { z } from "zod";

/**
 * Strict Zod schemas for Freshdesk core resources.
 * Derived from https://developers.freshdesk.com/api/
 *
 * Conventions:
 * - `*Create`: schema accepted on POST. Required fields enforced.
 * - `*Update`: schema accepted on PUT. Same shape but every field optional.
 * - `.passthrough()` everywhere so vendor-added or custom keys aren't rejected.
 */

// ────────────────────────────────────────────────────────────────────
// Common
// ────────────────────────────────────────────────────────────────────

export const CustomFields = z.record(z.any()).describe("Key-value map of custom field values");

export const TicketSourceEnum = z.union([
  z.literal(1),  // Email
  z.literal(2),  // Portal
  z.literal(3),  // Phone
  z.literal(7),  // Chat
  z.literal(9),  // Feedback Widget
  z.literal(10), // Outbound Email
]);

export const TicketStatusEnum = z.union([
  z.literal(2), // Open
  z.literal(3), // Pending
  z.literal(4), // Resolved
  z.literal(5), // Closed
]);

export const TicketPriorityEnum = z.union([
  z.literal(1), // Low
  z.literal(2), // Medium
  z.literal(3), // High
  z.literal(4), // Urgent
]);

export const TicketAssociationTypeEnum = z.union([
  z.literal(1), // Parent
  z.literal(2), // Child
  z.literal(3), // Tracker
  z.literal(4), // Related
]);

export const AgentTicketScopeEnum = z.union([
  z.literal(1), // Global access
  z.literal(2), // Group access
  z.literal(3), // Restricted access
]);

export const SolutionArticleStatusEnum = z.union([
  z.literal(1), // Draft
  z.literal(2), // Published
]);

export const SolutionArticleTypeEnum = z.union([
  z.literal(1), // Permanent
  z.literal(2), // Workaround
]);

export const SolutionFolderVisibilityEnum = z.union([
  z.literal(1), // All users
  z.literal(2), // Logged in users
  z.literal(3), // Agents
  z.literal(4), // Selected companies
  z.literal(5), // Selected contact segments
  z.literal(6), // Selected company segments
]);

export const ForumTypeEnum = z.union([
  z.literal(1), // Howto
  z.literal(2), // Ideas
  z.literal(3), // Problems
  z.literal(4), // Announcements
]);

export const ForumVisibilityEnum = z.union([
  z.literal(1), // All
  z.literal(2), // Logged in users
  z.literal(3), // Agents
  z.literal(4), // Selected companies
]);

export const TopicStampTypeEnum = z.number().int(); // Open varies

export const CannedResponseVisibilityEnum = z.union([
  z.literal(0), // All agents
  z.literal(1), // Personal
  z.literal(2), // Select groups
]);

export const UnassignedForEnum = z.enum([
  "30m", "1h", "2h", "4h", "8h", "12h", "1d", "2d", "3d",
]);

export const AutomationTypeIdEnum = z.union([
  z.literal(1), // Ticket creation
  z.literal(3), // Time triggered
  z.literal(4), // Ticket updates
]);

// ────────────────────────────────────────────────────────────────────
// Ticket
// ────────────────────────────────────────────────────────────────────

const TicketBase = z.object({
  // Requester (one of email/requester_id/facebook_id/phone/twitter_id/unique_external_id required on create)
  name: z.string().optional(),
  requester_id: z.number().int().optional(),
  email: z.string().email().optional(),
  facebook_id: z.string().optional(),
  phone: z.string().optional(),
  twitter_id: z.string().optional(),
  unique_external_id: z.string().optional(),

  // Core
  subject: z.string().optional(),
  type: z.string().optional(),
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
  description: z.string().optional(),
  description_text: z.string().optional(),
  source: TicketSourceEnum.optional(),
  source_info: z.record(z.any()).optional(),

  // Assignment
  responder_id: z.number().int().optional(),
  group_id: z.number().int().optional(),
  internal_agent_id: z.number().int().optional(),
  internal_group_id: z.number().int().optional(),

  // Related entities
  company_id: z.number().int().optional(),
  product_id: z.number().int().optional(),
  email_config_id: z.number().int().optional(),

  // Emails
  cc_emails: z.array(z.string().email()).optional(),
  reply_cc_emails: z.array(z.string().email()).optional(),
  fwd_emails: z.array(z.string().email()).optional(),
  to_emails: z.array(z.string().email()).optional(),

  // Other
  custom_fields: CustomFields.optional(),
  tags: z.array(z.string()).optional(),
  due_by: z.string().optional(),       // ISO-8601
  fr_due_by: z.string().optional(),    // ISO-8601

  // Linking
  parent_id: z.number().int().optional(),
  association_type: TicketAssociationTypeEnum.optional(),
  associated_tickets_list: z.array(z.number().int()).optional(),

  lookup_parameter: z.string().optional(),
}).passthrough();

export const TicketCreate = TicketBase.refine(
  (v) =>
    !!v.email || !!v.requester_id || !!v.facebook_id ||
    !!v.phone || !!v.twitter_id || !!v.unique_external_id,
  { message: "Provide one of: email, requester_id, facebook_id, phone, twitter_id, unique_external_id" }
).refine(
  (v) => !!v.subject || !!v.description || !!v.description_text,
  { message: "Provide at least one of: subject, description, description_text" }
);

export const TicketUpdate = TicketBase; // All fields already optional

export const TicketBulkUpdateAction = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
  properties: TicketBase.optional(),
  reply: z.object({ body: z.string() }).passthrough().optional(),
}).passthrough();

export const TicketBulkDeleteAction = z.object({
  ids: z.array(z.number().int()).min(1).max(100),
}).passthrough();

export const TicketMerge = z.object({
  primary_id: z.number().int(),
  ticket_ids: z.array(z.number().int()).min(1),
  convert_recepients_to_cc: z.boolean().optional(),
  note_in_primary: z.object({ body: z.string() }).passthrough().optional(),
  note_in_secondary: z.object({ body: z.string() }).passthrough().optional(),
}).passthrough();

export const TicketForward = z.object({
  body: z.string(),
  to_emails: z.array(z.string().email()).min(1),
  cc_emails: z.array(z.string().email()).optional(),
  bcc_emails: z.array(z.string().email()).optional(),
  from_email: z.string().email().optional(),
  include_quoted_text: z.boolean().optional(),
  include_original_attachments: z.boolean().optional(),
}).passthrough();

// ────────────────────────────────────────────────────────────────────
// Conversation (reply / note)
// ────────────────────────────────────────────────────────────────────

export const ReplyCreate = z.object({
  body: z.string(),
  from_email: z.string().email().optional(),
  user_id: z.number().int().optional(),
  cc_emails: z.array(z.string().email()).optional(),
  bcc_emails: z.array(z.string().email()).optional(),
}).passthrough();

export const NoteCreate = z.object({
  body: z.string(),
  incoming: z.boolean().optional(),
  notify_emails: z.array(z.string().email()).optional(),
  private: z.boolean().optional(),
  user_id: z.number().int().optional(),
}).passthrough();

export const ConversationUpdate = z.object({
  body: z.string(),
}).passthrough();

// ────────────────────────────────────────────────────────────────────
// Contact
// ────────────────────────────────────────────────────────────────────

const ContactBase = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  twitter_id: z.string().optional(),
  facebook_id: z.string().optional(),
  unique_external_id: z.string().optional(),
  company_id: z.number().int().optional(),
  other_companies: z.array(z.object({
    company_id: z.number().int(),
    view_all_tickets: z.boolean().optional(),
  }).passthrough()).optional(),
  view_all_tickets: z.boolean().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  job_title: z.string().optional(),
  language: z.string().optional(),
  time_zone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: CustomFields.optional(),
  avatar: z.any().optional(),
}).passthrough();

export const ContactCreate = ContactBase.refine(
  (v) => !!v.name,
  { message: "name is required" }
).refine(
  (v) => !!v.email || !!v.phone || !!v.mobile || !!v.twitter_id || !!v.unique_external_id,
  { message: "Provide one of: email, phone, mobile, twitter_id, unique_external_id" }
);

export const ContactUpdate = ContactBase;

export const ContactsMerge = z.object({
  primary_contact_id: z.number().int(),
  secondary_contact_ids: z.array(z.number().int()).min(1),
  contact: ContactBase.optional(),
}).passthrough();

export const MakeAgentFields = z.object({
  occasional: z.boolean().optional(),
  signature: z.string().optional(),
  ticket_scope: AgentTicketScopeEnum.optional(),
  skill_ids: z.array(z.number().int()).optional(),
  group_ids: z.array(z.number().int()).optional(),
  role_ids: z.array(z.number().int()).optional(),
  agent_type: z.number().int().optional(),
  type: z.string().optional(),
}).passthrough();

// ────────────────────────────────────────────────────────────────────
// Company
// ────────────────────────────────────────────────────────────────────

const CompanyBase = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  note: z.string().optional(),
  domains: z.array(z.string()).optional(),
  custom_fields: CustomFields.optional(),
  health_score: z.string().optional(),
  account_tier: z.string().optional(),
  renewal_date: z.string().optional(),
  industry: z.string().optional(),
  lookup_parameter: z.string().optional(),
}).passthrough();

export const CompanyCreate = CompanyBase.refine((v) => !!v.name, { message: "name is required" });
export const CompanyUpdate = CompanyBase;

// ────────────────────────────────────────────────────────────────────
// Agent
// ────────────────────────────────────────────────────────────────────

const AgentBase = z.object({
  email: z.string().email().optional(),
  ticket_scope: AgentTicketScopeEnum.optional(),
  occasional: z.boolean().optional(),
  signature: z.string().optional(),
  skill_ids: z.array(z.number().int()).optional(),
  group_ids: z.array(z.number().int()).optional(),
  role_ids: z.array(z.number().int()).optional(),
  agent_type: z.number().int().optional(),
  type: z.string().optional(),
  language: z.string().optional(),
  time_zone: z.string().optional(),
  focus_mode: z.boolean().optional(),
  available: z.boolean().optional(),
  contact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    job_title: z.string().optional(),
  }).passthrough().optional(),
}).passthrough();

export const AgentCreate = AgentBase.refine(
  (v) => !!v.email && v.ticket_scope !== undefined,
  { message: "email and ticket_scope are required" }
);

export const AgentUpdate = AgentBase;

// ────────────────────────────────────────────────────────────────────
// Group
// ────────────────────────────────────────────────────────────────────

const GroupBase = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  agent_ids: z.array(z.number().int()).optional(),
  auto_ticket_assign: z.union([z.number().int().min(0).max(1), z.boolean()]).optional(),
  escalate_to: z.number().int().optional(),
  unassigned_for: UnassignedForEnum.optional(),
  business_hour_id: z.number().int().optional(),
  allow_agents_to_change_availability: z.boolean().optional(),
}).passthrough();

export const GroupCreate = GroupBase.refine((v) => !!v.name, { message: "name is required" });
export const GroupUpdate = GroupBase;

// ────────────────────────────────────────────────────────────────────
// Skill
// ────────────────────────────────────────────────────────────────────

const SkillBase = z.object({
  name: z.string().optional(),
  rank: z.number().int().optional(),
  agent_ids: z.array(z.number().int()).optional(),
  condition_match_type: z.enum(["all", "any"]).optional(),
  conditions: z.array(z.record(z.any())).optional(),
}).passthrough();

export const SkillCreate = SkillBase.refine((v) => !!v.name, { message: "name is required" });
export const SkillUpdate = SkillBase;

// ────────────────────────────────────────────────────────────────────
// Canned Response
// ────────────────────────────────────────────────────────────────────

const CannedResponseBase = z.object({
  title: z.string().optional(),
  content_html: z.string().optional(),
  folder_id: z.number().int().optional(),
  visibility: CannedResponseVisibilityEnum.optional(),
  group_ids: z.array(z.number().int()).optional(),
}).passthrough();

export const CannedResponseCreate = CannedResponseBase.refine(
  (v) => !!v.title && !!v.content_html && v.folder_id !== undefined && v.visibility !== undefined,
  { message: "title, content_html, folder_id, visibility are required" }
).refine(
  (v) => v.visibility !== 2 || (Array.isArray(v.group_ids) && v.group_ids.length > 0),
  { message: "group_ids required when visibility=2" }
);

export const CannedResponseUpdate = CannedResponseBase;

export const CannedResponseFolderCreate = z.object({
  name: z.string(),
}).passthrough();

// ────────────────────────────────────────────────────────────────────
// Solutions
// ────────────────────────────────────────────────────────────────────

const SolutionCategoryBase = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  visible_in_portals: z.array(z.number().int()).optional(),
}).passthrough();

export const SolutionCategoryCreate = SolutionCategoryBase.refine((v) => !!v.name, { message: "name is required" });
export const SolutionCategoryUpdate = SolutionCategoryBase;

const SolutionFolderBase = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  visibility: SolutionFolderVisibilityEnum.optional(),
  company_ids: z.array(z.number().int()).optional(),
  contact_segment_ids: z.array(z.number().int()).optional(),
  company_segment_ids: z.array(z.number().int()).optional(),
  parent_folder_id: z.number().int().optional(),
}).passthrough();

export const SolutionFolderCreate = SolutionFolderBase.refine((v) => !!v.name, { message: "name is required" });
export const SolutionFolderUpdate = SolutionFolderBase;

const SolutionArticleBase = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: SolutionArticleStatusEnum.optional(),
  type: SolutionArticleTypeEnum.optional(),
  agent_id: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  seo_data: z.object({
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    meta_keywords: z.string().optional(),
  }).passthrough().optional(),
  review_date: z.string().optional(),
  thumbs_up: z.number().int().optional(),
  thumbs_down: z.number().int().optional(),
}).passthrough();

export const SolutionArticleCreate = SolutionArticleBase.refine(
  (v) => !!v.title && v.status !== undefined && !!v.description,
  { message: "title, description, status are required" }
);

export const SolutionArticleUpdate = SolutionArticleBase;

// ────────────────────────────────────────────────────────────────────
// Time Entry
// ────────────────────────────────────────────────────────────────────

const TimeEntryBase = z.object({
  agent_id: z.number().int().optional(),
  billable: z.boolean().optional(),
  note: z.string().optional(),
  timer_running: z.boolean().optional(),
  time_spent: z.string().regex(/^\d{1,4}:\d{2}$/, "Format HH:MM").optional(),
  executed_at: z.string().optional(),
  start_time: z.string().optional(),
}).passthrough();

export const TimeEntryCreate = TimeEntryBase;
export const TimeEntryUpdate = TimeEntryBase;

// ────────────────────────────────────────────────────────────────────
// Discussions (Forum / Topic / Comment)
// ────────────────────────────────────────────────────────────────────

const ForumCategoryBase = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
}).passthrough();
export const ForumCategoryCreate = ForumCategoryBase.refine((v) => !!v.name, { message: "name is required" });
export const ForumCategoryUpdate = ForumCategoryBase;

const ForumBase = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  forum_type: ForumTypeEnum.optional(),
  forum_visibility: ForumVisibilityEnum.optional(),
  customer_ids: z.array(z.number().int()).optional(),
}).passthrough();
export const ForumCreate = ForumBase.refine((v) => !!v.name && v.forum_type !== undefined, { message: "name and forum_type are required" });
export const ForumUpdate = ForumBase;

const TopicBase = z.object({
  title: z.string().optional(),
  message_html: z.string().optional(),
  sticky: z.boolean().optional(),
  locked: z.boolean().optional(),
  stamp_type: z.number().int().optional(),
}).passthrough();
export const TopicCreate = TopicBase.refine((v) => !!v.title && !!v.message_html, { message: "title and message_html are required" });
export const TopicUpdate = TopicBase;

const CommentBase = z.object({
  body_html: z.string().optional(),
  answer: z.boolean().optional(),
}).passthrough();
export const CommentCreate = CommentBase.refine((v) => !!v.body_html, { message: "body_html is required" });
export const CommentUpdate = CommentBase;

// ────────────────────────────────────────────────────────────────────
// Custom fields (ticket / contact / company field admin)
// ────────────────────────────────────────────────────────────────────

const FieldChoice = z.union([
  z.string(),
  z.object({ value: z.union([z.string(), z.number()]), position: z.number().int().optional() }).passthrough(),
  z.record(z.any()),
]);

const TicketFieldBase = z.object({
  label: z.string().optional(),
  label_for_customers: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  position: z.number().int().optional(),
  required_for_agents: z.boolean().optional(),
  required_for_customers: z.boolean().optional(),
  required_for_closure: z.boolean().optional(),
  displayed_to_customers: z.boolean().optional(),
  customers_can_edit: z.boolean().optional(),
  choices: z.array(FieldChoice).optional(),
  default: z.boolean().optional(),
}).passthrough();
export const TicketFieldCreate = TicketFieldBase.refine((v) => !!v.label && !!v.type, { message: "label and type are required" });
export const TicketFieldUpdate = TicketFieldBase;

const ContactFieldBase = z.object({
  label: z.string().optional(),
  label_for_customers: z.string().optional(),
  type: z.enum([
    "custom_text", "custom_paragraph", "custom_checkbox", "custom_number",
    "custom_dropdown", "custom_phone_number", "custom_url", "custom_date",
  ]).optional(),
  editable_in_signup: z.boolean().optional(),
  position: z.number().int().optional(),
  required_for_agents: z.boolean().optional(),
  customers_can_edit: z.boolean().optional(),
  required_for_customers: z.boolean().optional(),
  displayed_for_customers: z.boolean().optional(),
  choices: z.array(FieldChoice).optional(),
}).passthrough();
export const ContactFieldCreate = ContactFieldBase.refine(
  (v) => !!v.label && !!v.label_for_customers && !!v.type,
  { message: "label, label_for_customers, type are required" }
);
export const ContactFieldUpdate = ContactFieldBase;

const CompanyFieldBase = z.object({
  label: z.string().optional(),
  label_for_customers: z.string().optional(),
  type: z.string().optional(),
  position: z.number().int().optional(),
  required_for_agents: z.boolean().optional(),
  choices: z.array(FieldChoice).optional(),
}).passthrough();
export const CompanyFieldCreate = CompanyFieldBase.refine((v) => !!v.label && !!v.type, { message: "label and type are required" });
export const CompanyFieldUpdate = CompanyFieldBase;

// ────────────────────────────────────────────────────────────────────
// SLA / Business Hours / Products / Email Configs / Mailboxes / Surveys / Ratings
// ────────────────────────────────────────────────────────────────────

export const SatisfactionRatingCreate = z.object({
  ratings: z.record(z.any()),
  feedback: z.string().optional(),
}).passthrough();

const MailboxBase = z.object({
  name: z.string().optional(),
  support_email: z.string().email().optional(),
  forward_email: z.string().email().optional(),
  group_id: z.number().int().optional(),
  product_id: z.number().int().optional(),
  mailbox_type: z.string().optional(),
  active: z.boolean().optional(),
  default_reply_email: z.boolean().optional(),
}).passthrough();
export const MailboxCreate = MailboxBase.refine((v) => !!v.name && !!v.support_email, { message: "name and support_email are required" });
export const MailboxUpdate = MailboxBase;

// ────────────────────────────────────────────────────────────────────
// Automations
// ────────────────────────────────────────────────────────────────────

export const AutomationRuleCreate = z.object({
  name: z.string(),
  position: z.number().int().optional(),
  active: z.boolean().optional(),
  performer: z.record(z.any()).optional(),
  events: z.array(z.record(z.any())).optional(),
  conditions: z.record(z.any()).optional(),
  actions: z.array(z.record(z.any())).optional(),
  operator: z.string().optional(),
  summary: z.string().optional(),
  meta: z.record(z.any()).optional(),
}).passthrough();
export const AutomationRuleUpdate = AutomationRuleCreate.partial().passthrough();

// ────────────────────────────────────────────────────────────────────
// Custom Objects
// ────────────────────────────────────────────────────────────────────

export const CustomObjectRecordCreate = z.object({
  data: z.record(z.any()),
}).passthrough();
export const CustomObjectRecordUpdate = z.object({
  data: z.record(z.any()).optional(),
}).passthrough();

// ────────────────────────────────────────────────────────────────────
// FSM / Threads / Outbound
// ────────────────────────────────────────────────────────────────────

const ServiceTaskBase = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status_id: z.number().int().optional(),
  service_group_id: z.number().int().optional(),
  assigned_field_technician_id: z.number().int().optional(),
  scheduled_start_time: z.string().optional(),
  scheduled_end_time: z.string().optional(),
  service_location: z.record(z.any()).optional(),
  custom_fields: CustomFields.optional(),
}).passthrough();
export const ServiceTaskCreate = ServiceTaskBase.refine((v) => !!v.title, { message: "title is required" });
export const ServiceTaskUpdate = ServiceTaskBase;

const ThreadBase = z.object({
  type: z.enum(["forward", "discussion", "private"]).optional(),
  title: z.string().optional(),
  parent_id: z.number().int().optional(),
  parent_type: z.string().optional(),
  participants: z.object({
    agents: z.array(z.number().int()).optional(),
    teams: z.array(z.number().int()).optional(),
  }).passthrough().optional(),
  additional_info: z.record(z.any()).optional(),
}).passthrough();
export const ThreadCreate = ThreadBase.refine((v) => !!v.type, { message: "type is required" });
export const ThreadUpdate = ThreadBase;

const ThreadMessageBase = z.object({
  body: z.string().optional(),
  thread_id: z.number().int().optional(),
  body_text: z.string().optional(),
  attachment_ids: z.array(z.number().int()).optional(),
}).passthrough();
export const ThreadMessageCreate = ThreadMessageBase.refine((v) => !!v.body || !!v.body_text, { message: "body or body_text required" });
export const ThreadMessageUpdate = ThreadMessageBase;

export const OutboundEmailCreate = z.object({
  subject: z.string(),
  description: z.string(),
  email: z.string().email(),
  email_config_id: z.number().int().optional(),
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
  type: z.string().optional(),
  group_id: z.number().int().optional(),
  responder_id: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: CustomFields.optional(),
}).passthrough();
