# Schema Reference

Per-endpoint Parameter tables for every Freshdesk resource exposed by this MCP server. Tables mirror the format used on the official [Freshdesk Developer Portal](https://developers.freshdesk.com/api/) — `Attribute | Type | Description` — and are enforced at runtime by Zod schemas in [`src/schemas/index.ts`](../src/schemas/index.ts).

**Legend**
- `*` mandatory field
- `†` one of the marked fields is required (any of them)
- All `*Update` schemas share the same shape as `*Create` with **every field optional**
- `.passthrough()` is applied everywhere — unknown / custom keys survive validation

**Validation failure shape**

```json
{
  "error": "Validation error",
  "issues": [
    { "path": "field.path", "code": "invalid_union", "message": "..." }
  ]
}
```

No HTTP call is made when validation fails.

---

## Table of Contents

- [Enums (Ticket / Agent / Solution / Forum / ...)](#enums)
- [Tickets](#tickets)
- [Conversations](#conversations)
- [Ticket Fields](#ticket-fields)
- [Contacts](#contacts)
- [Contact Fields](#contact-fields)
- [Companies](#companies)
- [Company Fields](#company-fields)
- [Agents](#agents)
- [Groups](#groups)
- [Skills](#skills)
- [Canned Responses](#canned-responses)
- [Solutions](#solutions)
- [Discussions](#discussions)
- [Customer Satisfaction & Surveys](#customer-satisfaction--surveys)
- [Time Entries](#time-entries)
- [SLA Policies / Business Hours / Products](#sla--business-hours--products)
- [Email Mailboxes](#email-mailboxes)
- [Automations](#automations)
- [Custom Objects](#custom-objects)
- [Field Service Management](#field-service-management)
- [Threads (Collaboration)](#threads-collaboration)
- [Outbound Email](#outbound-email)

---

## Enums

Numeric Freshdesk enums modeled as Zod literal unions (exhaustive checks).

### Ticket Source — `TicketSourceEnum`

| Source           | Value |
| ---------------- | ----- |
| Email            | `1`   |
| Portal           | `2`   |
| Phone            | `3`   |
| Chat             | `7`   |
| Feedback Widget  | `9`   |
| Outbound Email   | `10`  |

### Ticket Status — `TicketStatusEnum`

| Status   | Value |
| -------- | ----- |
| Open     | `2`   |
| Pending  | `3`   |
| Resolved | `4`   |
| Closed   | `5`   |

### Ticket Priority — `TicketPriorityEnum`

| Priority | Value |
| -------- | ----- |
| Low      | `1`   |
| Medium   | `2`   |
| High     | `3`   |
| Urgent   | `4`   |

### Ticket Association Type — `TicketAssociationTypeEnum`

| Type    | Value |
| ------- | ----- |
| Parent  | `1`   |
| Child   | `2`   |
| Tracker | `3`   |
| Related | `4`   |

### Agent Ticket Scope — `AgentTicketScopeEnum`

| Scope             | Value |
| ----------------- | ----- |
| Global access     | `1`   |
| Group access      | `2`   |
| Restricted access | `3`   |

### Solution Article Status / Type — `SolutionArticleStatusEnum` / `SolutionArticleTypeEnum`

| Status    | Value | | Type       | Value |
| --------- | ----- |-| ---------- | ----- |
| Draft     | `1`   | | Permanent  | `1`   |
| Published | `2`   | | Workaround | `2`   |

### Solution Visibility — `SolutionFolderVisibilityEnum`

| Visibility                | Value |
| ------------------------- | ----- |
| All users                 | `1`   |
| Logged in users           | `2`   |
| Agents only               | `3`   |
| Selected companies        | `4`   |
| Selected contact segments | `5`   |
| Selected company segments | `6`   |

### Forum — `ForumTypeEnum` / `ForumVisibilityEnum`

| Forum Type    | Value | | Forum Visibility    | Value |
| ------------- | ----- |-| ------------------- | ----- |
| Howto         | `1`   | | All                 | `1`   |
| Ideas         | `2`   | | Logged in users     | `2`   |
| Problems      | `3`   | | Agents              | `3`   |
| Announcements | `4`   | | Selected companies  | `4`   |

### Canned Response Visibility — `CannedResponseVisibilityEnum`

| Visibility    | Value |
| ------------- | ----- |
| All agents    | `0`   |
| Personal      | `1`   |
| Select groups | `2`   |

### Group `unassigned_for` — `UnassignedForEnum`

`"30m" | "1h" | "2h" | "4h" | "8h" | "12h" | "1d" | "2d" | "3d"`

### Automation Type — `AutomationTypeIdEnum`

| Type             | Value |
| ---------------- | ----- |
| Ticket creation  | `1`   |
| Time triggered   | `3`   |
| Ticket updates   | `4`   |

---

## Tickets

### Create a Ticket — `TicketCreate`

`POST /api/v2/tickets` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_ticket)

| Attribute | Type | Description |
|-----------|------|-------------|
| name | string | Name of the requester |
| requester_id † | number | User ID of the requester. For existing contacts, the requester_id can be passed instead of the requester's email. |
| email † | string | Email address of the requester. If no contact exists with this email address in Freshdesk, it will be added as a new contact. |
| facebook_id † | string | Facebook ID of the requester. A contact should exist with this facebook_id in Freshdesk. |
| phone † | string | Phone number of the requester. If no contact exists with this phone number in Freshdesk, it will be added as a new contact. If the phone number is set and the email address is not, then the name attribute is mandatory. |
| twitter_id † | string | Twitter handle of the requester. If no contact exists with this handle in Freshdesk, it will be added as a new contact. |
| unique_external_id † | string | External ID of the requester. If no contact exists with this external ID in Freshdesk, they will be added as a new contact. |
| subject | string | Subject of the ticket. Default: `null`. |
| type | string | Helps categorize the ticket according to the different kinds of issues your support team deals with. Default: `null`. |
| status * | number | Status of the ticket (see `TicketStatusEnum`). Default: `2` (Open). |
| priority * | number | Priority of the ticket (see `TicketPriorityEnum`). Default: `1` (Low). |
| description | string | HTML content of the ticket. |
| description_text | string | Plain-text content of the ticket. |
| responder_id | number | ID of the agent to whom the ticket has been assigned. |
| attachments | array of objects | Ticket attachments. Total size cannot exceed **20 MB**. |
| cc_emails | array of strings | Email addresses added in the 'cc' field of the incoming ticket email. |
| custom_fields | dictionary | Key/value pairs containing the names and values of custom fields. |
| due_by | datetime | Response will be `null` unless provided. Auto-computed within seconds of creation. |
| email_config_id | number | ID of email config used for this ticket. If `product_id` is given and `email_config_id` is not, the product's primary `email_config_id` will be set. |
| fr_due_by | datetime | First-response due timestamp. Same null/auto behaviour as `due_by`. |
| group_id | number | ID of the group to which the ticket has been assigned. Defaults to the group associated with the given `email_config_id`. |
| parent_id | number | ID of the parent ticket. Setting this converts the current ticket into a child. |
| product_id | number | ID of the product the ticket is associated with. Ignored if `email_config_id` is set. |
| source * | number | Channel through which the ticket was created (see `TicketSourceEnum`). Default: `2` (Portal). |
| tags | array of strings | Tags associated with the ticket. |
| company_id | number | Company ID of the requester. Only settable when the **Multiple Companies** feature is enabled (Estate plan and above). |
| internal_agent_id | integer | ID of the internal agent the ticket should be assigned to. |
| internal_group_id | integer | ID of the internal group the ticket should be assigned to. |
| lookup_parameter | string | Settable only when Custom Objects + a lookup field on tickets are enabled. Value is `display_id` (record id) or `primary_field_value` (user-defined value). Default: `display_id`. |

**Refinements (enforced locally before HTTP):**

1. Must provide **one of**: `email`, `requester_id`, `facebook_id`, `phone`, `twitter_id`, `unique_external_id`.
2. Must provide **at least one of**: `subject`, `description`, `description_text`.

### Update a Ticket — `TicketUpdate`

`PUT /api/v2/tickets/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#update_ticket)

Same shape as `TicketCreate`; **all fields optional**, refinements removed (Freshdesk supports partial updates).

### Bulk Update Tickets — `TicketBulkUpdateAction`

`PUT /api/v2/tickets/bulk_update` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#bulk_update_tickets)

| Attribute | Type | Description |
|-----------|------|-------------|
| ids * | array of integers | Ticket IDs to update. 1–100 entries. |
| properties | object (TicketBase) | Properties to apply to every ticket in `ids`. |
| reply | `{ body: string }` | Optional reply to add to every ticket. |

### Bulk Delete Tickets — `TicketBulkDeleteAction`

`POST /api/v2/tickets/bulk_delete` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#bulk_delete_tickets)

| Attribute | Type | Description |
|-----------|------|-------------|
| ids * | array of integers | Ticket IDs to delete. 1–100 entries. |

### Merge Tickets — `TicketMerge`

`PUT /api/v2/tickets/merge` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#merge_tickets)

| Attribute | Type | Description |
|-----------|------|-------------|
| primary_id * | number | ID of the primary (surviving) ticket. |
| ticket_ids * | array of integers | IDs of secondary tickets to merge into the primary. |
| convert_recepients_to_cc | boolean | If `true`, recipients of merged tickets are added to the primary's CC. |
| note_in_primary | `{ body: string }` | Note posted on the primary after merge. |
| note_in_secondary | `{ body: string }` | Note posted on each merged ticket. |

### Forward a Ticket — `TicketForward`

`POST /api/v2/tickets/[id]/forward` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#forward_a_ticket)

| Attribute | Type | Description |
|-----------|------|-------------|
| body * | string | HTML content of the forward message. |
| to_emails * | array of strings | Email addresses to forward to (≥1). |
| cc_emails | array of strings | CC recipients. |
| bcc_emails | array of strings | BCC recipients. |
| from_email | string | Sender email (must be a configured support address). |
| include_quoted_text | boolean | Include the original ticket conversation in the forward. |
| include_original_attachments | boolean | Re-attach the ticket's original attachments. |

---

## Conversations

### Create a Reply — `ReplyCreate`

`POST /api/v2/tickets/[id]/reply` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_reply)

| Attribute | Type | Description |
|-----------|------|-------------|
| body * | string | HTML content of the reply. |
| from_email | string | Sender email (must be a configured support address). |
| user_id | number | ID of the agent posting the reply. Defaults to the authenticated agent. |
| cc_emails | array of strings | CC recipients of the reply. |
| bcc_emails | array of strings | BCC recipients of the reply. |

### Create a Note — `NoteCreate`

`POST /api/v2/tickets/[id]/notes` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_note)

| Attribute | Type | Description |
|-----------|------|-------------|
| body * | string | HTML content of the note. |
| incoming | boolean | Mark the note as a customer-supplied (incoming) note. |
| notify_emails | array of strings | Email addresses to notify when the note is posted. |
| private | boolean | If `true`, the note is visible only to agents. |
| user_id | number | ID of the agent posting the note. |

### Update a Conversation — `ConversationUpdate`

`PUT /api/v2/conversations/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#update_a_conversation)

| Attribute | Type | Description |
|-----------|------|-------------|
| body * | string | New HTML content for the reply / note. |

---

## Ticket Fields

### Create / Update Ticket Field — `TicketFieldCreate` / `TicketFieldUpdate`

`POST /api/v2/admin/ticket_fields` · `PUT /api/v2/admin/ticket_fields/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#ticket_fields)

| Attribute | Type | Description |
|-----------|------|-------------|
| label * | string | Display name for the field (as seen by agents). |
| label_for_customers | string | Display name for the field (as seen by customers). |
| type * | string | Field type, e.g. `custom_text`, `custom_dropdown`, `custom_paragraph`, `custom_checkbox`, `custom_number`, `custom_decimal`, `custom_date`, `custom_phone_number`, `custom_url`, etc. |
| description | string | Description shown alongside the field. |
| position | integer | Display position among fields. |
| required_for_agents | boolean | If `true`, agents must fill the field before saving. |
| required_for_customers | boolean | If `true`, customers must fill the field at submit time. |
| required_for_closure | boolean | If `true`, the field must be filled before the ticket can be closed. |
| displayed_to_customers | boolean | Whether the field is visible to customers in the portal. |
| customers_can_edit | boolean | Whether customers can edit the field. |
| choices | array | Choices for dropdown / lookup fields. Each entry is a `string` or `{ value, position? }`. |
| default | boolean | Whether the field is a default Freshdesk field (read-only). |

---

## Contacts

### Create a Contact — `ContactCreate`

`POST /api/v2/contacts` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_contact)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Name of the contact. |
| email † | string | Primary email address. |
| phone † | string | Telephone number. |
| mobile † | string | Mobile number. |
| twitter_id † | string | Twitter handle. |
| unique_external_id † | string | External identifier from a third-party system. |
| facebook_id | string | Facebook ID. |
| company_id | number | Primary company ID. |
| other_companies | array of objects | Additional companies. Each entry is `{ company_id: number, view_all_tickets?: boolean }`. |
| view_all_tickets | boolean | Whether this contact can see all tickets in its primary company. |
| address | string | Postal address. |
| description | string | Free-form description / notes. |
| job_title | string | Job title. |
| language | string | Locale code, e.g. `"en"`, `"vi"`. |
| time_zone | string | IANA timezone, e.g. `"Asia/Ho_Chi_Minh"`. |
| tags | array of strings | Tags. |
| custom_fields | dictionary | Custom contact fields. |
| avatar | file | Profile image (multipart upload only — JSON callers should omit). |

**Refinements:** `name` required; **at least one of** `email`, `phone`, `mobile`, `twitter_id`, `unique_external_id`.

### Update a Contact — `ContactUpdate`

`PUT /api/v2/contacts/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#update_contact)

Same shape, all fields optional, no refinements.

### Merge Contacts — `ContactsMerge`

`POST /api/v2/contacts/merge` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#merge_contacts)

| Attribute | Type | Description |
|-----------|------|-------------|
| primary_contact_id * | number | ID of the contact to keep. |
| secondary_contact_ids * | array of integers | IDs of contacts to merge in (≥1). |
| contact | object | Optional contact-shape patch applied to the primary after merge. |

### Make Agent — `MakeAgentFields`

`PUT /api/v2/contacts/[id]/make_agent` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#make_agent)

| Attribute | Type | Description |
|-----------|------|-------------|
| occasional | boolean | `true` = occasional agent (only billed when active). Default: `false`. |
| signature | string | Agent email signature. |
| ticket_scope | number | Agent's ticket access scope (see `AgentTicketScopeEnum`). |
| skill_ids | array of integers | Skills assigned to the new agent. |
| group_ids | array of integers | Groups the new agent should be in. |
| role_ids | array of integers | Roles the new agent should have. |
| agent_type | integer | Agent type id (e.g. support agent, collaborator). |
| type | string | Specific agent classification when conversions to collaborator are required. |

---

## Contact Fields

### Create / Update Contact Field — `ContactFieldCreate` / `ContactFieldUpdate`

`POST /api/v2/contact_fields` · `PUT /api/v2/contact_fields/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#contact_fields)

| Attribute | Type | Description |
|-----------|------|-------------|
| label * | string | Display name (agents). |
| label_for_customers * | string | Display name (customers). |
| type * | string enum | One of `custom_text`, `custom_paragraph`, `custom_checkbox`, `custom_number`, `custom_dropdown`, `custom_phone_number`, `custom_url`, `custom_date`. |
| editable_in_signup | boolean | Whether customers can fill the field during signup. Default: `false`. |
| position | integer | Display position. Default: `1`. |
| required_for_agents | boolean | Mandatory for agents. Default: `false`. |
| customers_can_edit | boolean | Whether customers can edit in the portal. Default: `false`. |
| required_for_customers | boolean | Mandatory in the customer portal. Default: `false`. |
| displayed_for_customers | boolean | Whether visible in the customer portal. Default: `false`. |
| choices | array | Choices for `custom_dropdown` — each `{ value, position? }`. |

---

## Companies

### Create a Company — `CompanyCreate`

`POST /api/v2/companies` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_company)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Name of the company. |
| description | string | Description of the company. |
| note | string | Internal notes about the company. |
| domains | array of strings | Domains used by the company (auto-associates incoming contacts). |
| health_score | string | Company health indicator. |
| account_tier | string | Account tier classification. |
| renewal_date | datetime | Contract renewal timestamp. |
| industry | string | Industry the company operates in. |
| business_type | string | Classification of business operations. |
| custom_fields | dictionary | Custom company fields. |
| lookup_parameter | string | Custom Objects lookup value (`display_id` or `primary_field_value`). Default: `display_id`. |

### Update a Company — `CompanyUpdate`

`PUT /api/v2/companies/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#update_company)

Same shape; all fields optional.

---

## Company Fields

### Create / Update Company Field — `CompanyFieldCreate` / `CompanyFieldUpdate`

`POST /api/v2/company_fields` · `PUT /api/v2/company_fields/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#company_fields)

| Attribute | Type | Description |
|-----------|------|-------------|
| label * | string | Display name. |
| label_for_customers | string | Display name visible to customers. |
| type * | string | Field type — same vocabulary as contact fields. |
| position | integer | Display position. |
| required_for_agents | boolean | Mandatory for agents. |
| choices | array | Choices for dropdown / multi-select. |

---

## Agents

### Create an Agent — `AgentCreate`

`POST /api/v2/agents` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_agent)

| Attribute | Type | Description |
|-----------|------|-------------|
| email * | string | Agent's email address. Must be unique within the account. |
| ticket_scope * | number | Ticket access scope (see `AgentTicketScopeEnum`). |
| occasional | boolean | `true` = occasional agent (only billed when active). Default: `false`. |
| signature | string | HTML email signature. |
| skill_ids | array of integers | Skills assigned to the agent. |
| group_ids | array of integers | Groups the agent belongs to. |
| role_ids | array of integers | Roles assigned to the agent. |
| agent_type | integer | Agent type id (1 = support, 2 = field, 3 = collaborator, ...). |
| type | string | Specific agent classification (used when converting contacts to collaborators). |
| language | string | Locale code, e.g. `"en"`. |
| time_zone | string | IANA timezone. |
| focus_mode | boolean | Enable Freshdesk focus mode for the agent. |
| available | boolean | Whether the agent is available to receive tickets. |
| contact | object | Nested contact details: `{ name?, email?, phone?, mobile?, job_title? }`. |

### Update an Agent — `AgentUpdate`

`PUT /api/v2/agents/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#update_agent)

Same shape, all fields optional.

---

## Groups

### Create a Group — `GroupCreate`

`POST /api/v2/groups` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_group)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | The designation assigned to this group. |
| description | string | Additional context about the group's purpose. |
| agent_ids | array of integers | IDs of agents to include in the group. |
| auto_ticket_assign | integer / boolean | Enables automated ticket distribution. `0` = disabled, `1` = enabled. |
| escalate_to | integer | Agent ID for escalation routing when a ticket is unassigned past `unassigned_for`. |
| unassigned_for | string enum | Time threshold triggering reassignment: `"30m"`, `"1h"`, `"2h"`, `"4h"`, `"8h"`, `"12h"`, `"1d"`, `"2d"`, `"3d"`. Default: `"30m"`. |
| business_hour_id | integer | Associated business hours configuration. |
| allow_agents_to_change_availability | boolean | Permits agents to modify their availability status. |
| group_type | string | Group classification (e.g. support, sales). |

### Update a Group — `GroupUpdate`

`PUT /api/v2/groups/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#update_a_group)

Same shape; all fields optional.

Admin Groups (SLA-aware variants) use the same schema against `/api/v2/admin/groups`.

---

## Skills

### Create / Update Skill — `SkillCreate` / `SkillUpdate`

`POST /api/v2/admin/skills` · `PUT /api/v2/admin/skills/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#skills)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Name of the skill. |
| rank | integer | Priority rank — Freshdesk evaluates skills in ascending rank order. |
| agent_ids | array of integers | IDs of agents possessing this skill. |
| condition_match_type | string | `"all"` = match every condition (AND); `"any"` = match any (OR). |
| conditions | array of objects | Condition definitions used to auto-assign tickets matching this skill. |

---

## Canned Responses

### Create a Canned Response — `CannedResponseCreate`

`POST /api/v2/canned_responses` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_canned_response)

| Attribute | Type | Description |
|-----------|------|-------------|
| title * | string | Title of the canned response. |
| content_html * | string | HTML body of the response. |
| folder_id * | number | ID of the parent canned-response folder. |
| visibility * | integer | `0` = all agents, `1` = personal, `2` = select groups. |
| group_ids | array of integers | Required when `visibility = 2`. Groups that can use the response. |

### Update a Canned Response — `CannedResponseUpdate`

`PUT /api/v2/canned_responses/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#update_canned_response)

Same shape, all fields optional.

### Create a Canned Response Folder — `CannedResponseFolderCreate`

`POST /api/v2/canned_response_folders`

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Folder name. |

---

## Solutions

### Create a Solution Category — `SolutionCategoryCreate`

`POST /api/v2/solutions/categories` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_solution_category)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Name of the solution category. |
| description | string | Description of the category. |
| visible_in_portals | array of integers | Portal IDs the category is visible in. |

### Create a Solution Folder — `SolutionFolderCreate`

`POST /api/v2/solutions/categories/[category_id]/folders` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_solution_folder)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Name of the folder. |
| description | string | Description of the folder. |
| visibility | integer | Visibility level (see `SolutionFolderVisibilityEnum`). |
| company_ids | array of integers | Required when `visibility = 4`. Companies that can view the folder. |
| contact_segment_ids | array of integers | Required when `visibility = 5`. |
| company_segment_ids | array of integers | Required when `visibility = 6`. |
| parent_folder_id | number | Parent folder ID, for nested folders. |

### Create a Solution Article — `SolutionArticleCreate`

`POST /api/v2/solutions/folders/[folder_id]/articles` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_solution_article)

| Attribute | Type | Description |
|-----------|------|-------------|
| title * | string | Title of the solution article. |
| description * | string | HTML content of the article. |
| status * | integer | Publication status: `1` = draft, `2` = published. |
| type / article_type | integer | Article type: `1` = permanent solution, `2` = workaround. |
| agent_id | number | ID of the author/agent. |
| tags | array of strings | Tags. |
| seo_data | object | `{ meta_title?, meta_description?, meta_keywords? }`. |
| review_date | string | ISO date when the article should be reviewed next. |
| thumbs_up | integer | Up-vote count (read-mostly; settable for migrations). |
| thumbs_down | integer | Down-vote count. |

Update variants (`SolutionCategoryUpdate` / `SolutionFolderUpdate` / `SolutionArticleUpdate`) share the same shape with every field optional.

---

## Discussions

### Create a Forum Category — `ForumCategoryCreate`

`POST /api/v2/discussions/categories` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_category)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Category name. |
| description | string | Description of the category. |

### Create a Forum — `ForumCreate`

`POST /api/v2/discussions/categories/[category_id]/forums` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_forum)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Name of the forum. |
| description | string | Description of the forum. |
| forum_type * | integer | `1` = Howto, `2` = Ideas, `3` = Problems, `4` = Announcements. |
| forum_visibility | integer | `1` = All, `2` = Logged-in users, `3` = Agents only, `4` = Selected companies. |
| customer_ids | array of integers | Required when `forum_visibility = 4`. |

### Create a Topic — `TopicCreate`

`POST /api/v2/discussions/forums/[forum_id]/topics` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_topic)

| Attribute | Type | Description |
|-----------|------|-------------|
| title * | string | Title of the topic. |
| message_html * | string | HTML body of the first post. |
| sticky | boolean | Pin the topic to the top of the forum. |
| locked | boolean | Lock the topic against new replies. |
| stamp_type | integer | Stamp / status integer (forum-type specific, e.g. "Planned", "Implemented", "Already exists"). |

### Create a Comment — `CommentCreate`

`POST /api/v2/discussions/topics/[topic_id]/comments` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_comment)

| Attribute | Type | Description |
|-----------|------|-------------|
| body_html * | string | HTML content of the comment. |
| answer | boolean | Mark this comment as the accepted answer. |

Update variants share the same shape, fields optional.

---

## Customer Satisfaction & Surveys

### Create a Satisfaction Rating — `SatisfactionRatingCreate`

`POST /api/v2/tickets/[ticket_id]/satisfaction_ratings` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_satisfaction_rating)

| Attribute | Type | Description |
|-----------|------|-------------|
| ratings * | dictionary | `{ <question_id>: <choice_id> }` map of question id → selected choice id. |
| feedback | string | Optional free-form comment. |

---

## Time Entries

### Create a Time Entry — `TimeEntryCreate`

`POST /api/v2/tickets/[ticket_id]/time_entries` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_time_entry)

| Attribute | Type | Description |
|-----------|------|-------------|
| time_spent | string | Duration in `HH:MM` format. Required when `timer_running` is `false`. |
| billable | boolean | Whether the time entry is billable. Default: `true`. |
| note | string | Notes about the time entry. |
| agent_id | integer | ID of the agent who spent the time. Default: authenticated agent. |
| executed_at | datetime | When the time was actually spent. Default: current time. |
| start_time | datetime | When the timer started (used with `timer_running`). |
| timer_running | boolean | If `true`, a running timer is created (omit `time_spent`). |

### Update a Time Entry — `TimeEntryUpdate`

`PUT /api/v2/time_entries/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#update_a_time_entry)

Same shape, fields optional.

### Toggle Timer

`PUT /api/v2/time_entries/[id]/toggle_timer` — no body required.

---

## SLA / Business Hours / Products

These resources are **read-only** (list / view); no create schema is exposed by this MCP server.

- `list_sla_policies`, `view_sla_policy` → `/api/v2/sla_policies`
- `list_business_hours`, `view_business_hours` → `/api/v2/business_hours`
- `list_products`, `view_product` → `/api/v2/products`

See [Freshdesk docs ↗](https://developers.freshdesk.com/api/#sla_policies).

---

## Email Mailboxes

### Create / Update Mailbox — `MailboxCreate` / `MailboxUpdate`

`POST /api/v2/email/mailboxes` · `PUT /api/v2/email/mailboxes/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_mailbox)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Mailbox name shown in Freshdesk. |
| support_email * | string | The address customers email (e.g. `support@yourcompany.com`). |
| forward_email | string | The address customer email is forwarded to (Freshdesk-provided). |
| group_id | integer | Default group for tickets received here. |
| product_id | integer | Product associated with the mailbox. |
| mailbox_type | string | Implementation kind, e.g. `"forward_email"`, `"custom_mailbox"`. |
| active | boolean | Whether the mailbox is enabled. |
| default_reply_email | boolean | Whether replies use this address as default. |

---

## Automations

### Create / Update Automation Rule — `AutomationRuleCreate` / `AutomationRuleUpdate`

`POST /api/v2/automations/[type_id]/rules` · `PUT /api/v2/automations/[type_id]/rules/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_an_automation_rule)

| Attribute | Type | Description |
|-----------|------|-------------|
| name * | string | Rule name. |
| position | integer | Execution order within its rule type. |
| active | boolean | Whether the rule is enabled. |
| performer | object | Who performs the action (`agent`, `requester`, `system`, ...). Shape is rule-type specific. |
| events | array of objects | Events that trigger the rule (for "on update" type). |
| conditions | object | Match conditions. |
| actions | array of objects | Actions to execute when matched. |
| operator | string | `"AND"` / `"OR"` between condition groups. |
| summary | string | Human-readable summary (read-mostly). |
| meta | object | Free-form metadata Freshdesk stores alongside the rule. |

Rule-type id values: `1` = ticket-creation, `3` = time-triggered, `4` = ticket-update.

---

## Custom Objects

### Create / Update Custom Object Record — `CustomObjectRecordCreate` / `CustomObjectRecordUpdate`

`POST /api/v2/custom_objects/schemas/[schema_id]/records` · `PUT /api/v2/custom_objects/schemas/[schema_id]/records/[record_id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_record)

| Attribute | Type | Description |
|-----------|------|-------------|
| data * | object | Key/value map matching the custom object schema's field names. |

Schema fields are entirely defined by the user-created custom object; this MCP server passes them through unchanged.

---

## Field Service Management

### Create / Update Service Task — `ServiceTaskCreate` / `ServiceTaskUpdate`

`POST /api/v2/tickets/[ticket_id]/fsm/service_tasks` · `PUT /api/v2/fsm/service_tasks/[id]` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_service_task)

| Attribute | Type | Description |
|-----------|------|-------------|
| title * | string | Task title. |
| description | string | Task description. |
| status_id | integer | Status ID (account-defined). |
| service_group_id | integer | Service group assignment. |
| assigned_field_technician_id | integer | ID of the field technician. |
| scheduled_start_time | datetime | Scheduled start. |
| scheduled_end_time | datetime | Scheduled end. |
| service_location | object | Address / coordinates payload. |
| custom_fields | dictionary | Custom service-task fields. |

---

## Threads (Collaboration)

### Create a Thread — `ThreadCreate`

`POST /api/v2/collaboration/threads` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_thread)

| Attribute | Type | Description |
|-----------|------|-------------|
| type * | string enum | `"forward"`, `"discussion"`, or `"private"`. |
| title | string | Title of the thread. |
| parent_id | number | ID of the parent entity (usually a ticket). |
| parent_type | string | Parent type, e.g. `"Ticket"`. |
| participants | object | `{ agents?: int[], teams?: int[] }`. |
| additional_info | dictionary | Free-form metadata. |

### Create a Thread Message — `ThreadMessageCreate`

`POST /api/v2/collaboration/threads/[thread_id]/messages` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_a_message)

| Attribute | Type | Description |
|-----------|------|-------------|
| body † | string | HTML message body. One of `body` / `body_text` required. |
| body_text † | string | Plain-text message body. |
| thread_id | number | Thread ID (auto-populated from URL on POST). |
| attachment_ids | array of integers | Attachments to associate. |

---

## Outbound Email

### Create an Outbound Email — `OutboundEmailCreate`

`POST /api/v2/tickets/outbound_email` · [Freshdesk docs ↗](https://developers.freshdesk.com/api/#create_an_outbound_email)

| Attribute | Type | Description |
|-----------|------|-------------|
| subject * | string | Subject of the outbound email. |
| description * | string | HTML body of the email. |
| email * | string | Recipient email address. |
| email_config_id | number | Sender email config (defaults to product's primary). |
| status | number | Ticket status created by this outbound send (see `TicketStatusEnum`). |
| priority | number | Priority (see `TicketPriorityEnum`). |
| type | string | Ticket type categorization. |
| group_id | number | Group assignment. |
| responder_id | number | Assigned agent. |
| tags | array of strings | Tags. |
| custom_fields | dictionary | Custom ticket field values. |

---

## Schema-by-tool index

| Schema                            | Used by                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `TicketCreate`                    | `create_ticket`, each element of `bulk_create_tickets`                                   |
| `TicketUpdate`                    | `update_ticket`                                                                          |
| `TicketBulkUpdateAction`          | `bulk_update_tickets`                                                                    |
| `TicketBulkDeleteAction`          | `bulk_delete_tickets`                                                                    |
| `TicketMerge`                     | `merge_tickets`                                                                          |
| `TicketForward`                   | `forward_ticket`                                                                         |
| `ReplyCreate`                     | `create_ticket_reply`, `reply_to_forward`                                                |
| `NoteCreate`                      | `create_ticket_note`                                                                     |
| `ConversationUpdate`              | `update_ticket_conversation`                                                             |
| `TicketFieldCreate/Update`        | `create_ticket_field`, `update_ticket_field`                                             |
| `ContactCreate`                   | `create_contact`                                                                         |
| `ContactUpdate`                   | `update_contact`                                                                         |
| `ContactsMerge`                   | `merge_contacts`                                                                         |
| `MakeAgentFields`                 | `make_agent`                                                                             |
| `ContactFieldCreate/Update`       | `create_contact_field`, `update_contact_field`                                           |
| `CompanyCreate/Update`            | `create_company`, `update_company`                                                       |
| `CompanyFieldCreate/Update`       | `create_company_field`, `update_company_field`                                           |
| `AgentCreate`                     | `create_agent`, each element of `bulk_create_agents`                                     |
| `AgentUpdate`                     | `update_agent`                                                                           |
| `GroupCreate/Update`              | `create_group`, `update_group`, `create_admin_group`, `update_admin_group`               |
| `SkillCreate/Update`              | `create_skill`, `update_skill`                                                           |
| `CannedResponseCreate/Update`     | `create_canned_response`, `update_canned_response`                                       |
| `CannedResponseFolderCreate`      | `create_canned_response_folder`, `update_canned_response_folder`                         |
| `SolutionCategoryCreate/Update`   | `create_solution_category`, `update_solution_category`                                   |
| `SolutionFolderCreate/Update`     | `create_solution_category_folder`, `update_solution_category_folder`                     |
| `SolutionArticleCreate/Update`    | `create_solution_article`, `update_solution_article`                                     |
| `TimeEntryCreate/Update`          | `create_time_entry`, `update_time_entry`                                                 |
| `ForumCategoryCreate/Update`      | `create_forum_category`, `update_forum_category`                                         |
| `ForumCreate/Update`              | `create_forum`, `update_forum`                                                           |
| `TopicCreate/Update`              | `create_topic`, `update_topic`                                                           |
| `CommentCreate/Update`            | `create_topic_comment`, `update_topic_comment`                                           |
| `MailboxCreate/Update`            | `create_email_mailbox`, `update_email_mailbox`                                           |
| `AutomationRuleCreate/Update`     | `create_automation_rule`, `update_automation_rule`                                       |
| `CustomObjectRecordCreate/Update` | `create_custom_object_record`, `update_custom_object_record`                             |
| `ServiceTaskCreate/Update`        | `create_service_task`, `update_service_task`                                             |
| `ThreadCreate/Update`             | `create_thread`, `update_thread`                                                         |
| `ThreadMessageCreate/Update`      | `create_thread_message`, `update_thread_message`                                         |
| `OutboundEmailCreate`             | `create_outbound_email`                                                                  |
| `SatisfactionRatingCreate`        | `create_satisfaction_rating`                                                             |
