# Schema Reference

All Freshdesk resources passed to mutating tools (`create_*`, `update_*`, `bulk_*`, `merge_*`, `forward_*`, ...) are validated by Zod schemas in [`src/schemas/index.ts`](../src/schemas/index.ts).

This page documents every schema. For a quick lookup of which tool uses which schema, see the trailing **Schema-by-tool index**.

---

## Validation Behaviour

- **`*Create`** schemas — required fields are enforced. Used by `POST`/`create_*` tools.
- **`*Update`** schemas — share the same base shape with **every field optional**. Used by `PUT`/`update_*` tools (Freshdesk supports partial updates).
- **`.passthrough()`** is applied everywhere so unknown keys (custom fields with `cf_` prefixes, vendor-added fields, future Freshdesk attributes) survive validation untouched.
- **`.refine()`** captures cross-field invariants Freshdesk enforces server-side — e.g. "a Ticket needs *at least one* of email/requester_id/phone/...". These fire after individual field checks pass.
- On failure the tool returns:
  ```json
  {
    "error": "Validation error",
    "issues": [
      { "path": "field.path", "code": "invalid_union", "message": "..." }
    ]
  }
  ```
  No HTTP call is made.

---

## Enums

Numeric Freshdesk enums modeled as Zod literal unions for exhaustive checks.

### `TicketSourceEnum`
| Source           | Value |
| ---------------- | ----- |
| Email            | `1`   |
| Portal           | `2`   |
| Phone            | `3`   |
| Chat             | `7`   |
| Feedback Widget  | `9`   |
| Outbound Email   | `10`  |

### `TicketStatusEnum`
| Status   | Value |
| -------- | ----- |
| Open     | `2`   |
| Pending  | `3`   |
| Resolved | `4`   |
| Closed   | `5`   |

### `TicketPriorityEnum`
| Priority | Value |
| -------- | ----- |
| Low      | `1`   |
| Medium   | `2`   |
| High     | `3`   |
| Urgent   | `4`   |

### `TicketAssociationTypeEnum`
| Type    | Value |
| ------- | ----- |
| Parent  | `1`   |
| Child   | `2`   |
| Tracker | `3`   |
| Related | `4`   |

### `AgentTicketScopeEnum`
| Scope               | Value |
| ------------------- | ----- |
| Global access       | `1`   |
| Group access        | `2`   |
| Restricted access   | `3`   |

### `SolutionArticleStatusEnum` / `SolutionArticleTypeEnum`
| Status    | Value |    | Type       | Value |
| --------- | ----- | -- | ---------- | ----- |
| Draft     | `1`   |    | Permanent  | `1`   |
| Published | `2`   |    | Workaround | `2`   |

### `SolutionFolderVisibilityEnum`
| Visibility                | Value |
| ------------------------- | ----- |
| All users                 | `1`   |
| Logged in users           | `2`   |
| Agents only               | `3`   |
| Selected companies        | `4`   |
| Selected contact segments | `5`   |
| Selected company segments | `6`   |

### `ForumTypeEnum` / `ForumVisibilityEnum`
| Forum Type    | Value |    | Forum Visibility    | Value |
| ------------- | ----- | -- | ------------------- | ----- |
| Howto         | `1`   |    | All                 | `1`   |
| Ideas         | `2`   |    | Logged in users     | `2`   |
| Problems      | `3`   |    | Agents              | `3`   |
| Announcements | `4`   |    | Selected companies  | `4`   |

### `CannedResponseVisibilityEnum`
| Visibility    | Value |
| ------------- | ----- |
| All agents    | `0`   |
| Personal      | `1`   |
| Select groups | `2`   |

### `UnassignedForEnum`
`"30m" | "1h" | "2h" | "4h" | "8h" | "12h" | "1d" | "2d" | "3d"`

### `AutomationTypeIdEnum`
| Type             | Value |
| ---------------- | ----- |
| Ticket creation  | `1`   |
| Time triggered   | `3`   |
| Ticket updates   | `4`   |

---

## Ticket

### `TicketCreate`

Base shape (all fields optional unless noted):

| Field                       | Type                            | Notes                                                     |
| --------------------------- | ------------------------------- | --------------------------------------------------------- |
| `name`                      | `string`                        | Requester display name                                    |
| `requester_id`              | `int`                           | One of the requester identifiers (see refine)             |
| `email`                     | `email`                         | "                                                         |
| `facebook_id`               | `string`                        | "                                                         |
| `phone`                     | `string`                        | "                                                         |
| `twitter_id`                | `string`                        | "                                                         |
| `unique_external_id`        | `string`                        | "                                                         |
| `subject`                   | `string`                        | One of subject/description/description_text required      |
| `description`               | `string` (HTML)                 | "                                                         |
| `description_text`          | `string` (plain)                | "                                                         |
| `type`                      | `string`                        | Standard system field, not under `custom_fields`          |
| `status`                    | `TicketStatusEnum`              |                                                           |
| `priority`                  | `TicketPriorityEnum`            |                                                           |
| `source`                    | `TicketSourceEnum`              |                                                           |
| `source_info`               | `record`                        |                                                           |
| `responder_id`              | `int`                           | Assigned agent                                            |
| `group_id`                  | `int`                           |                                                           |
| `internal_agent_id`         | `int`                           |                                                           |
| `internal_group_id`         | `int`                           |                                                           |
| `company_id`                | `int`                           |                                                           |
| `product_id`                | `int`                           |                                                           |
| `email_config_id`           | `int`                           |                                                           |
| `cc_emails`                 | `email[]`                       |                                                           |
| `reply_cc_emails`           | `email[]`                       |                                                           |
| `fwd_emails`                | `email[]`                       |                                                           |
| `to_emails`                 | `email[]`                       |                                                           |
| `custom_fields`             | `record`                        | Key/value bag of custom field values                      |
| `tags`                      | `string[]`                      |                                                           |
| `due_by`                    | `string` (ISO 8601)             |                                                           |
| `fr_due_by`                 | `string` (ISO 8601)             | First-response due                                        |
| `parent_id`                 | `int`                           | For child/parent linking                                  |
| `association_type`          | `TicketAssociationTypeEnum`     |                                                           |
| `associated_tickets_list`   | `int[]`                         |                                                           |
| `lookup_parameter`          | `string`                        | Custom Objects lookup                                     |

**Refinements:**

1. Must provide *one of*: `email`, `requester_id`, `facebook_id`, `phone`, `twitter_id`, `unique_external_id`.
2. Must provide *at least one of*: `subject`, `description`, `description_text`.

### `TicketUpdate`

Same shape as `TicketCreate` with both refinements removed (you can update any subset of fields).

### `TicketBulkUpdateAction`

```ts
{
  ids: int[],          // 1..100
  properties?: TicketBase,
  reply?: { body: string }
}
```

### `TicketBulkDeleteAction`

```ts
{ ids: int[] }   // 1..100
```

### `TicketMerge`

```ts
{
  primary_id: int,
  ticket_ids: int[],          // ≥1
  convert_recepients_to_cc?: boolean,
  note_in_primary?: { body: string },
  note_in_secondary?: { body: string }
}
```

### `TicketForward`

```ts
{
  body: string,
  to_emails: email[],         // ≥1
  cc_emails?: email[],
  bcc_emails?: email[],
  from_email?: email,
  include_quoted_text?: boolean,
  include_original_attachments?: boolean
}
```

---

## Conversation

### `ReplyCreate`
```ts
{
  body: string,                // required
  from_email?: email,
  user_id?: int,
  cc_emails?: email[],
  bcc_emails?: email[]
}
```

### `NoteCreate`
```ts
{
  body: string,                // required
  incoming?: boolean,
  notify_emails?: email[],
  private?: boolean,
  user_id?: int
}
```

### `ConversationUpdate`
```ts
{ body: string }
```

---

## Contact

### `ContactCreate`

| Field                | Type        | Notes                                       |
| -------------------- | ----------- | ------------------------------------------- |
| `name`               | `string`    | **required**                                |
| `email`              | `email`     | one of email/phone/mobile/twitter/external  |
| `phone`              | `string`    | "                                           |
| `mobile`             | `string`    | "                                           |
| `twitter_id`         | `string`    | "                                           |
| `facebook_id`        | `string`    |                                             |
| `unique_external_id` | `string`    | one of identifiers                          |
| `company_id`         | `int`       |                                             |
| `other_companies`    | `array`     | `{ company_id, view_all_tickets? }[]`       |
| `view_all_tickets`   | `boolean`   |                                             |
| `address`            | `string`    |                                             |
| `description`        | `string`    |                                             |
| `job_title`          | `string`    |                                             |
| `language`           | `string`    |                                             |
| `time_zone`          | `string`    |                                             |
| `tags`               | `string[]`  |                                             |
| `custom_fields`      | `record`    |                                             |

**Refinements:** `name` required; at least one of `email`, `phone`, `mobile`, `twitter_id`, `unique_external_id`.

### `ContactUpdate`

Same shape, no refinements.

### `ContactsMerge`
```ts
{
  primary_contact_id: int,
  secondary_contact_ids: int[],     // ≥1
  contact?: ContactBase             // overrides applied to the primary
}
```

### `MakeAgentFields`
```ts
{
  occasional?: boolean,
  signature?: string,
  ticket_scope?: AgentTicketScopeEnum,
  skill_ids?: int[],
  group_ids?: int[],
  role_ids?: int[],
  agent_type?: int,
  type?: string
}
```

---

## Company

### `CompanyCreate` / `CompanyUpdate`

| Field             | Type        | Notes                                |
| ----------------- | ----------- | ------------------------------------ |
| `name`            | `string`    | **required on create**               |
| `description`     | `string`    |                                      |
| `note`            | `string`    |                                      |
| `domains`         | `string[]`  |                                      |
| `custom_fields`   | `record`    |                                      |
| `health_score`    | `string`    |                                      |
| `account_tier`    | `string`    |                                      |
| `renewal_date`    | `string`    | ISO date                             |
| `industry`        | `string`    |                                      |
| `lookup_parameter`| `string`    |                                      |

---

## Agent

### `AgentCreate`

| Field           | Type                       | Notes                            |
| --------------- | -------------------------- | -------------------------------- |
| `email`         | `email`                    | **required**                     |
| `ticket_scope`  | `AgentTicketScopeEnum`     | **required**                     |
| `occasional`    | `boolean`                  |                                  |
| `signature`     | `string`                   |                                  |
| `skill_ids`     | `int[]`                    |                                  |
| `group_ids`     | `int[]`                    |                                  |
| `role_ids`      | `int[]`                    |                                  |
| `agent_type`    | `int`                      |                                  |
| `type`          | `string`                   |                                  |
| `language`      | `string`                   |                                  |
| `time_zone`     | `string`                   |                                  |
| `focus_mode`    | `boolean`                  |                                  |
| `available`     | `boolean`                  |                                  |
| `contact`       | `object`                   | `{ name?, email?, phone?, mobile?, job_title? }` |

### `AgentUpdate`

Same shape, no required fields.

---

## Group

### `GroupCreate` / `GroupUpdate`

| Field                                  | Type                  | Notes                          |
| -------------------------------------- | --------------------- | ------------------------------ |
| `name`                                 | `string`              | **required on create**         |
| `description`                          | `string`              |                                |
| `agent_ids`                            | `int[]`               |                                |
| `auto_ticket_assign`                   | `0 \| 1 \| boolean`   |                                |
| `escalate_to`                          | `int`                 |                                |
| `unassigned_for`                       | `UnassignedForEnum`   |                                |
| `business_hour_id`                     | `int`                 |                                |
| `allow_agents_to_change_availability`  | `boolean`             |                                |

Both standard `groups` and SLA-aware `admin/groups` use this schema.

---

## Skill

### `SkillCreate` / `SkillUpdate`

| Field                  | Type              | Notes                              |
| ---------------------- | ----------------- | ---------------------------------- |
| `name`                 | `string`          | **required on create**             |
| `rank`                 | `int`             |                                    |
| `agent_ids`            | `int[]`           |                                    |
| `condition_match_type` | `"all" \| "any"`  |                                    |
| `conditions`           | `record[]`        | Freshdesk condition object array   |

---

## Canned Response

### `CannedResponseCreate`

| Field          | Type                              | Notes                                                |
| -------------- | --------------------------------- | ---------------------------------------------------- |
| `title`        | `string`                          | **required**                                         |
| `content_html` | `string`                          | **required**                                         |
| `folder_id`    | `int`                             | **required**                                         |
| `visibility`   | `CannedResponseVisibilityEnum`    | **required**                                         |
| `group_ids`    | `int[]`                           | **required when `visibility == 2`** (select groups)  |

### `CannedResponseUpdate` — all optional.
### `CannedResponseFolderCreate` — `{ name: string }`.

---

## Solutions

### `SolutionCategoryCreate` / `SolutionCategoryUpdate`

| Field                | Type        | Notes                                 |
| -------------------- | ----------- | ------------------------------------- |
| `name`               | `string`    | **required on create**                |
| `description`        | `string`    |                                       |
| `visible_in_portals` | `int[]`     | Portal IDs                            |

### `SolutionFolderCreate` / `SolutionFolderUpdate`

| Field                  | Type                            | Notes                  |
| ---------------------- | ------------------------------- | ---------------------- |
| `name`                 | `string`                        | **required on create** |
| `description`          | `string`                        |                        |
| `visibility`           | `SolutionFolderVisibilityEnum`  |                        |
| `company_ids`          | `int[]`                         |                        |
| `contact_segment_ids`  | `int[]`                         |                        |
| `company_segment_ids`  | `int[]`                         |                        |
| `parent_folder_id`     | `int`                           |                        |

### `SolutionArticleCreate` / `SolutionArticleUpdate`

| Field           | Type                          | Notes                                  |
| --------------- | ----------------------------- | -------------------------------------- |
| `title`         | `string`                      | **required on create**                 |
| `description`   | `string` (HTML)               | **required on create**                 |
| `status`        | `SolutionArticleStatusEnum`   | **required on create**                 |
| `type`          | `SolutionArticleTypeEnum`     |                                        |
| `agent_id`      | `int`                         |                                        |
| `tags`          | `string[]`                    |                                        |
| `seo_data`      | `object`                      | `{ meta_title?, meta_description?, meta_keywords? }` |
| `review_date`   | `string`                      |                                        |
| `thumbs_up`     | `int`                         |                                        |
| `thumbs_down`   | `int`                         |                                        |

---

## Time Entry

### `TimeEntryCreate` / `TimeEntryUpdate`

| Field           | Type                       | Notes                                |
| --------------- | -------------------------- | ------------------------------------ |
| `agent_id`      | `int`                      |                                      |
| `billable`      | `boolean`                  |                                      |
| `note`          | `string`                   |                                      |
| `timer_running` | `boolean`                  |                                      |
| `time_spent`    | `string` (`HH:MM`)         | Regex `^\d{1,4}:\d{2}$`              |
| `executed_at`   | `string` (ISO)             |                                      |
| `start_time`    | `string` (ISO)             |                                      |

---

## Discussions

### `ForumCategoryCreate` / `Update` — `{ name (required), description? }`.

### `ForumCreate` / `ForumUpdate`

| Field             | Type                  | Notes                  |
| ----------------- | --------------------- | ---------------------- |
| `name`            | `string`              | **required on create** |
| `description`     | `string`              |                        |
| `forum_type`      | `ForumTypeEnum`       | **required on create** |
| `forum_visibility`| `ForumVisibilityEnum` |                        |
| `customer_ids`    | `int[]`               |                        |

### `TopicCreate` / `TopicUpdate`

| Field          | Type      | Notes                  |
| -------------- | --------- | ---------------------- |
| `title`        | `string`  | **required on create** |
| `message_html` | `string`  | **required on create** |
| `sticky`       | `boolean` |                        |
| `locked`       | `boolean` |                        |
| `stamp_type`   | `int`     |                        |

### `CommentCreate` / `CommentUpdate`

| Field       | Type      | Notes                  |
| ----------- | --------- | ---------------------- |
| `body_html` | `string`  | **required on create** |
| `answer`    | `boolean` |                        |

---

## Custom Fields (Ticket / Contact / Company)

### `TicketFieldCreate` / `TicketFieldUpdate`

| Field                       | Type       | Notes                                  |
| --------------------------- | ---------- | -------------------------------------- |
| `label`                     | `string`   | **required on create**                 |
| `label_for_customers`       | `string`   |                                        |
| `type`                      | `string`   | **required on create**                 |
| `description`               | `string`   |                                        |
| `position`                  | `int`      |                                        |
| `required_for_agents`       | `boolean`  |                                        |
| `required_for_customers`    | `boolean`  |                                        |
| `required_for_closure`      | `boolean`  |                                        |
| `displayed_to_customers`    | `boolean`  |                                        |
| `customers_can_edit`        | `boolean`  |                                        |
| `choices`                   | `array`    | `string \| { value, position? }`       |
| `default`                   | `boolean`  |                                        |

### `ContactFieldCreate` / `Update`

`type` is restricted to one of:
`custom_text`, `custom_paragraph`, `custom_checkbox`, `custom_number`, `custom_dropdown`, `custom_phone_number`, `custom_url`, `custom_date`.

| Field                       | Type       | Notes                  |
| --------------------------- | ---------- | ---------------------- |
| `label`                     | `string`   | **required on create** |
| `label_for_customers`       | `string`   | **required on create** |
| `type`                      | enum       | **required on create** |
| `editable_in_signup`        | `boolean`  |                        |
| `position`                  | `int`      |                        |
| `required_for_agents`       | `boolean`  |                        |
| `customers_can_edit`        | `boolean`  |                        |
| `required_for_customers`    | `boolean`  |                        |
| `displayed_for_customers`   | `boolean`  |                        |
| `choices`                   | `array`    |                        |

### `CompanyFieldCreate` / `Update`

| Field                  | Type        | Notes                  |
| ---------------------- | ----------- | ---------------------- |
| `label`                | `string`    | **required on create** |
| `label_for_customers`  | `string`    |                        |
| `type`                 | `string`    | **required on create** |
| `position`             | `int`       |                        |
| `required_for_agents`  | `boolean`   |                        |
| `choices`              | `array`     |                        |

---

## Email Mailbox

### `MailboxCreate` / `MailboxUpdate`

| Field                  | Type       | Notes                  |
| ---------------------- | ---------- | ---------------------- |
| `name`                 | `string`   | **required on create** |
| `support_email`        | `email`    | **required on create** |
| `forward_email`        | `email`    |                        |
| `group_id`             | `int`      |                        |
| `product_id`           | `int`      |                        |
| `mailbox_type`         | `string`   |                        |
| `active`               | `boolean`  |                        |
| `default_reply_email`  | `boolean`  |                        |

---

## Automations

### `AutomationRuleCreate`

```ts
{
  name: string,           // required
  position?: int,
  active?: boolean,
  performer?: record,
  events?: record[],
  conditions?: record,
  actions?: record[],
  operator?: string,
  summary?: string,
  meta?: record
}
```

### `AutomationRuleUpdate`

Same shape, all fields optional.

---

## Custom Objects

### `CustomObjectRecordCreate`
```ts
{ data: record }    // required
```

### `CustomObjectRecordUpdate`
```ts
{ data?: record }
```

---

## FSM / Threads / Outbound

### `ServiceTaskCreate` / `Update`

| Field                          | Type       | Notes                  |
| ------------------------------ | ---------- | ---------------------- |
| `title`                        | `string`   | **required on create** |
| `description`                  | `string`   |                        |
| `status_id`                    | `int`      |                        |
| `service_group_id`             | `int`      |                        |
| `assigned_field_technician_id` | `int`      |                        |
| `scheduled_start_time`         | `string`   |                        |
| `scheduled_end_time`           | `string`   |                        |
| `service_location`             | `record`   |                        |
| `custom_fields`                | `record`   |                        |

### `ThreadCreate` / `ThreadUpdate`

| Field             | Type                                                | Notes                  |
| ----------------- | --------------------------------------------------- | ---------------------- |
| `type`            | `"forward" \| "discussion" \| "private"`            | **required on create** |
| `title`           | `string`                                            |                        |
| `parent_id`       | `int`                                               |                        |
| `parent_type`     | `string`                                            |                        |
| `participants`    | `{ agents?: int[], teams?: int[] }`                 |                        |
| `additional_info` | `record`                                            |                        |

### `ThreadMessageCreate` / `Update`

```ts
{
  body?: string,
  body_text?: string,
  thread_id?: int,
  attachment_ids?: int[]
}
// refine: body OR body_text required
```

### `OutboundEmailCreate`

| Field             | Type                      | Notes                  |
| ----------------- | ------------------------- | ---------------------- |
| `subject`         | `string`                  | **required**           |
| `description`     | `string`                  | **required**           |
| `email`           | `email`                   | **required**           |
| `email_config_id` | `int`                     |                        |
| `status`          | `TicketStatusEnum`        |                        |
| `priority`        | `TicketPriorityEnum`      |                        |
| `type`            | `string`                  |                        |
| `group_id`        | `int`                     |                        |
| `responder_id`    | `int`                     |                        |
| `tags`            | `string[]`                |                        |
| `custom_fields`   | `record`                  |                        |

### `SatisfactionRatingCreate`

```ts
{
  ratings: record,   // required (question_id → answer_id map)
  feedback?: string
}
```

---

## Schema-by-tool index

| Schema                       | Used by                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `TicketCreate`               | `create_ticket`, each element of `bulk_create_tickets`                                    |
| `TicketUpdate`               | `update_ticket`                                                                          |
| `TicketBulkUpdateAction`     | `bulk_update_tickets`                                                                    |
| `TicketBulkDeleteAction`     | `bulk_delete_tickets`                                                                    |
| `TicketMerge`                | `merge_tickets`                                                                          |
| `TicketForward`              | `forward_ticket`                                                                         |
| `ReplyCreate`                | `create_ticket_reply`, `reply_to_forward`                                                |
| `NoteCreate`                 | `create_ticket_note`                                                                     |
| `ConversationUpdate`         | `update_ticket_conversation`                                                             |
| `TicketFieldCreate/Update`   | `create_ticket_field`, `update_ticket_field`                                             |
| `ContactCreate`              | `create_contact`                                                                         |
| `ContactUpdate`              | `update_contact`                                                                         |
| `ContactsMerge`              | `merge_contacts`                                                                         |
| `MakeAgentFields`            | `make_agent`                                                                             |
| `ContactFieldCreate/Update`  | `create_contact_field`, `update_contact_field`                                           |
| `CompanyCreate/Update`       | `create_company`, `update_company`                                                       |
| `CompanyFieldCreate/Update`  | `create_company_field`, `update_company_field`                                           |
| `AgentCreate`                | `create_agent`, each element of `bulk_create_agents`                                     |
| `AgentUpdate`                | `update_agent`                                                                           |
| `GroupCreate/Update`         | `create_group`, `update_group`, `create_admin_group`, `update_admin_group`               |
| `SkillCreate/Update`         | `create_skill`, `update_skill`                                                           |
| `CannedResponseCreate/Update`| `create_canned_response`, `update_canned_response`                                       |
| `CannedResponseFolderCreate` | `create_canned_response_folder`, `update_canned_response_folder`                         |
| `SolutionCategoryCreate/Update` | `create_solution_category`, `update_solution_category`                                |
| `SolutionFolderCreate/Update`| `create_solution_category_folder`, `update_solution_category_folder`                     |
| `SolutionArticleCreate/Update`| `create_solution_article`, `update_solution_article`                                    |
| `TimeEntryCreate/Update`     | `create_time_entry`, `update_time_entry`                                                 |
| `ForumCategoryCreate/Update` | `create_forum_category`, `update_forum_category`                                         |
| `ForumCreate/Update`         | `create_forum`, `update_forum`                                                           |
| `TopicCreate/Update`         | `create_topic`, `update_topic`                                                           |
| `CommentCreate/Update`       | `create_topic_comment`, `update_topic_comment`                                           |
| `MailboxCreate/Update`       | `create_email_mailbox`, `update_email_mailbox`                                           |
| `AutomationRuleCreate/Update`| `create_automation_rule`, `update_automation_rule`                                       |
| `CustomObjectRecordCreate/Update` | `create_custom_object_record`, `update_custom_object_record`                        |
| `ServiceTaskCreate/Update`   | `create_service_task`, `update_service_task`                                             |
| `ThreadCreate/Update`        | `create_thread`, `update_thread`                                                         |
| `ThreadMessageCreate/Update` | `create_thread_message`, `update_thread_message`                                         |
| `OutboundEmailCreate`        | `create_outbound_email`                                                                  |
| `SatisfactionRatingCreate`   | `create_satisfaction_rating`                                                             |
