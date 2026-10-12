# API Reference

> Generated from the running MCP server by `npm run docs:api` (scripts/gen-api-docs.mjs) — **255 tools**. Do not edit by hand.
> Payload schemas: [SCHEMAS.md](SCHEMAS.md). Upstream reference: https://developers.freshdesk.com/api/

## Conventions

- **Params** lists top-level input keys. Resource payloads (`ticket`, `contact`, …) are objects whose fields are listed in the description and validated by Zod (see [SCHEMAS.md](SCHEMAS.md)).
- Page-based lists accept `page` (≥1) and `per_page` (1–100, default 30). Search/filter tools return max 30 results/page, 10 pages.
- Results are JSON in `content[0].text`. Failures are `{ error, details }` with `isError: true`. Attachment tools also return `image` / `resource` content.

## Index

- [Tickets](#tickets)
- [Conversations](#conversations)
- [Ticket Summary](#ticket-summary)
- [Ticket Fields & Sections](#ticket-fields--sections)
- [Ticket Forms](#ticket-forms)
- [Bulk & Merge](#bulk--merge)
- [Archived Tickets](#archived-tickets)
- [Watchers, Associations & Access](#watchers-associations--access)
- [Ticket Related Lists](#ticket-related-lists)
- [Attachments](#attachments)
- [Contacts](#contacts)
- [Contact Export & Import](#contact-export--import)
- [Contact Fields](#contact-fields)
- [Agents](#agents)
- [Agent Availability](#agent-availability)
- [Groups](#groups)
- [Admin Groups](#admin-groups)
- [Canned Responses](#canned-responses)
- [Solutions (Knowledge Base)](#solutions-knowledge-base)
- [Companies](#companies)
- [Company Export & Import](#company-export--import)
- [Company Fields](#company-fields)
- [Skills](#skills)
- [Roles](#roles)
- [Products](#products)
- [Business Hours](#business-hours)
- [SLA Policies](#sla-policies)
- [Email Configs](#email-configs)
- [Email Mailboxes & Settings](#email-mailboxes--settings)
- [Helpdesk Settings](#helpdesk-settings)
- [Account](#account)
- [Collaboration Threads](#collaboration-threads)
- [Time Entries](#time-entries)
- [Discussions (Forums)](#discussions-forums)
- [Surveys & Satisfaction](#surveys--satisfaction)
- [Automations](#automations)
- [Scenario Automations](#scenario-automations)
- [Custom Objects](#custom-objects)
- [Field Service Management](#field-service-management)
- [Outbound (Email & WhatsApp)](#outbound-email--whatsapp)
- [Jobs](#jobs)
- [Contact Activities](#contact-activities)
- [Prompts](#prompts)

## Tickets

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `get_ticket_fields` | List every ticket field (system + custom) with its name, label, type and allowed choices. Call this before create/update/search when you need the API name of a custom field (e.g. 'cf_order_id') or valid dropdown values. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_ticket_fields) |
| `get_tickets` | List tickets, newest first by default. Without filters Freshdesk only returns tickets created in the last 30 days (use updated_since for older ones) and caps results at 300 pages. Deleted/spam tickets are excluded unless filter='deleted'/'spam'. For field-based queries (status, priority, tags, custom fields, date ranges) prefer search_tickets. Returns { tickets, pagination }. | `page`, `per_page`, `filter`, `requester_id`, `email`, `unique_external_id`, `company_id`, `updated_since`, `order_by`, `order_type`, `include` | [↗](https://developers.freshdesk.com/api/#list_all_tickets) |
| `get_ticket` | Get one ticket by ID. The description and conversations are not always included by default; use include to embed them. | `ticket_id`, `include` | [↗](https://developers.freshdesk.com/api/#view_a_ticket) |
| `create_ticket` | Create a ticket. Required: a requester identifier (email \| requester_id \| phone \| twitter_id \| facebook_id \| unique_external_id) and subject/description. Common fields: subject, description (HTML), status, priority, source, type, group_id, responder_id, company_id, product_id, email_config_id, internal_agent_id, internal_group_id, tags[], cc_emails[], custom_fields{cf_*}, due_by, fr_due_by, lookup_parameter, parent_id (create as child), related_ticket_ids[] (create as tracker). status: 2=Open 3=Pending 4=Resolved 5=Closed; priority: 1=Low 2=Medium 3=High 4=Urgent; source: 1=Email 2=Portal 3=Phone 7=Chat 9=Feedback widget 10=Outbound email. Note 'type' is a top-level field, not a custom field. File attachments need multipart upload and are not supported here. | `ticket` | [↗](https://developers.freshdesk.com/api/#create_ticket) |
| `update_ticket` | Partially update a ticket — only the keys you send change (status, priority, responder_id, group_id, tags, custom_fields, ...). status: 2=Open 3=Pending 4=Resolved 5=Closed; priority: 1=Low 2=Medium 3=High 4=Urgent; source: 1=Email 2=Portal 3=Phone 7=Chat 9=Feedback widget 10=Outbound email. Setting tags replaces the whole tag list. To change internal_agent_id/internal_group_id you must also send status. | `ticket_id`, `ticket` | [↗](https://developers.freshdesk.com/api/#update_ticket) |
| `delete_ticket` | Move a ticket to Trash (soft delete). Reversible with restore_ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#delete_a_ticket) |
| `restore_ticket` | Restore a soft-deleted ticket from Trash. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#restore_a_ticket) |
| `search_tickets` | Filter tickets with Freshdesk query language. Syntax: field:value joined by AND/OR with parentheses; strings in single quotes; numeric/date ranges with :> and :< ; null for empty. Fields: agent_id, group_id, priority, status, tag, type, due_by, fr_due_by, created_at, updated_at, closed_at (dates as 'YYYY-MM-DD'), plus custom fields by name (without cf_ prefix). Example: "status:2 AND priority:>3 AND tag:'vip'". Max 512 chars, 30 results/page, max 10 pages. Archived tickets excluded; index lags a few minutes. Returns { results, total }. | `query`, `page` | [↗](https://developers.freshdesk.com/api/#filter_tickets) |

## Conversations

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `get_ticket_conversation` | List replies and notes on a ticket, oldest first (body, private flag, from/to emails, attachments). By default fetches every page so the full thread is returned; check 'truncated' in the result. Output: { conversations, total_returned, pages_fetched, truncated, next_page }; with fetch_all=false a single page plus pagination{current_page, next_page, prev_page, per_page}. Read this before drafting a reply so the response fits the thread. | `ticket_id`, `page`, `per_page`, `fetch_all`, `max_pages` | [↗](https://developers.freshdesk.com/api/#list_all_ticket_notes) |
| `create_ticket_reply` | Send a public reply to the requester (emails them). Payload: body (HTML, required), optional cc_emails[], bcc_emails[], from_email (must be a configured support email), user_id (agent sending). Use create_ticket_note for internal comments. File attachments (multipart) are not supported. | `ticket_id`, `reply` | [↗](https://developers.freshdesk.com/api/#reply_ticket) |
| `create_ticket_note` | Add a note to a ticket. Payload: body (HTML, required), private (default true — internal, not visible to requester), notify_emails[] (agent emails to notify), incoming (true = appears as from the requester), user_id. File attachments (multipart) are not supported. | `ticket_id`, `note` | [↗](https://developers.freshdesk.com/api/#add_note_to_a_ticket) |
| `update_ticket_conversation` | Edit the body of an existing note (replies that were already emailed cannot be changed). Payload: { body }. | `conversation_id`, `conversation` | [↗](https://developers.freshdesk.com/api/#update_conversation) |
| `delete_conversation` | Permanently delete a note/reply from a ticket. Irreversible. | `conversation_id` | [↗](https://developers.freshdesk.com/api/#delete_conversation) |
| `forward_ticket` | Forward a ticket by email to third parties. Required: body (HTML), to_emails[]. Optional: body_text, cc_emails[], bcc_emails[], from_email, agent_id, include_quoted_text, include_original_attachments. | `ticket_id`, `forward` | [↗](https://developers.freshdesk.com/api/#forward_tickets) |
| `reply_to_forward` | Reply to a third party on a previously forwarded thread. Required: body (HTML), to_emails[]. Optional: body_text, user_id. | `ticket_id`, `reply` | [↗](https://developers.freshdesk.com/api/#reply_to_forward) |
| `delete_attachment` | Permanently delete an attachment (from a ticket, conversation, etc.) by attachment ID. Irreversible. | `attachment_id` | [↗](https://developers.freshdesk.com/api/#delete_an_attachment) |

## Ticket Summary

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `view_ticket_summary` | Get the agent-written/AI summary attached to a ticket, if any. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#view_ticket_summary) |
| `update_ticket_summary` | Create or replace a ticket's summary. | `ticket_id`, `body` | [↗](https://developers.freshdesk.com/api/#update_ticket_summary) |
| `delete_ticket_summary` | Remove a ticket's summary. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#delete_ticket_summary) |

## Ticket Fields & Sections

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `get_field_properties` | Get one ticket field definition by API name (e.g. 'status', 'priority', 'type', 'cf_region'), including its choices. Cheaper to reason about than the full get_ticket_fields list. | `field_name` | [↗](https://developers.freshdesk.com/api/#list_all_ticket_fields) |
| `view_ticket_field` | Admin: view a ticket field with full configuration (choices, sections, portal settings). | `ticket_field_id` | [↗](https://developers.freshdesk.com/api/#view_ticket_field) |
| `create_ticket_field` | Admin: create a custom ticket field. Required: label, type ('custom_text' \| 'custom_paragraph' \| 'custom_checkbox' \| 'custom_number' \| 'custom_decimal' \| 'custom_date' \| 'custom_dropdown' \| 'nested_field'). Optional: label_for_customers, required_for_agents, required_for_customers, required_for_closure, displayed_to_customers, customers_can_edit, position, choices[], dependent_fields[] (nested_field levels), section_mappings[]. | `ticket_field` | [↗](https://developers.freshdesk.com/api/#create_ticket_field) |
| `update_ticket_field` | Admin: update a ticket field (label, required flags, position, choices…). Only sent keys change. | `ticket_field_id`, `ticket_field` | [↗](https://developers.freshdesk.com/api/#update_ticket_field) |
| `delete_ticket_field` | Admin: delete a custom ticket field. Data stored in it becomes inaccessible. | `ticket_field_id` | [↗](https://developers.freshdesk.com/api/#delete_ticket_field) |
| `list_ticket_field_sections` | Admin: list dynamic sections of a dropdown ticket field (sections show extra fields when a given choice is selected). | `ticket_field_id` | [↗](https://developers.freshdesk.com/api/#list_all_section_fields) |
| `view_ticket_field_section` | Admin: view one dynamic section of a ticket field. | `ticket_field_id`, `section_id` | [↗](https://developers.freshdesk.com/api/#list_specific_section) |
| `create_ticket_field_section` | Admin: create a dynamic section on a dropdown ticket field. | `ticket_field_id`, `label`, `choice_ids` | [↗](https://developers.freshdesk.com/api/#create_section) |
| `update_ticket_field_section` | Admin: rename a dynamic section or change which choices reveal it. | `ticket_field_id`, `section_id`, `label`, `choice_ids` | [↗](https://developers.freshdesk.com/api/#update_section) |
| `delete_ticket_field_section` | Admin: delete a dynamic section from a ticket field. | `ticket_field_id`, `section_id` | [↗](https://developers.freshdesk.com/api/#delete_section) |

## Ticket Forms

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_ticket_forms` | List ticket forms shown in the customer portal. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_ticket_forms) |
| `view_ticket_form` | View a ticket form with its fields. | `form_id` | [↗](https://developers.freshdesk.com/api/#view_ticket_form) |
| `create_ticket_form` | Create a portal ticket form. Payload: title (required), description, fields[] (required; must include the requester and company fields). Each field: { id (ticket field ID), label_for_customers, customers_can_edit, required_for_customers, placeholder_for_customers, hint_for_customers, position? }. | `form` | [↗](https://developers.freshdesk.com/api/#create_ticket_form) |
| `update_ticket_form` | Update a ticket form's title, description or fields[] (same field shape as create_ticket_form). | `form_id`, `form` | [↗](https://developers.freshdesk.com/api/#update_ticket_form) |
| `delete_ticket_form` | Delete a ticket form. | `form_id` | [↗](https://developers.freshdesk.com/api/#delete_ticket_form) |
| `clone_ticket_form` | Duplicate a ticket form (creates 'Copy of …' with the same fields). | `form_id` | [↗](https://developers.freshdesk.com/api/#clone_ticket_form) |
| `view_ticket_form_field` | View how one ticket field is configured inside a ticket form. | `form_id`, `field_id` | [↗](https://developers.freshdesk.com/api/#view_ticket_form_field) |
| `update_ticket_form_field` | Update a field inside a ticket form. Payload: label_for_customers, customers_can_edit, required_for_customers, hint_for_customers, placeholder_for_customers, position. | `form_id`, `field_id`, `field` | [↗](https://developers.freshdesk.com/api/#update_ticket_form_field) |
| `delete_ticket_form_field` | Remove a field from a ticket form (the ticket field itself is kept). | `form_id`, `field_id` | [↗](https://developers.freshdesk.com/api/#delete_ticket_form_field) |

## Bulk & Merge

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `bulk_create_tickets` | Undocumented endpoint (not in the public API reference) — may return 404 on some accounts. Create up to 100 tickets in one asynchronous job (same payload shape as create_ticket). Returns a job_id — poll view_job_status. | `tickets` | [↗](https://developers.freshdesk.com/api/#create_ticket) |
| `bulk_update_tickets` | Update up to 100 tickets asynchronously. Payload: { ids: number[], properties?: {status, priority, source, type, group_id, responder_id, product_id, email_config_id, requester_id, parent_id, due_by, fr_due_by, tags, custom_fields, internal_agent_id, internal_group_id, skip_close_notification…}, reply?: { body, from_email? } }. Changing internal agent/group also requires status. Returns a job_id — poll view_job_status. | `bulk_action` | [↗](https://developers.freshdesk.com/api/#bulk_update_tickets) |
| `bulk_delete_tickets` | Soft-delete up to 100 tickets asynchronously. Payload: { ids: number[] }. Returns a job_id — poll view_job_status. | `bulk_action` | [↗](https://developers.freshdesk.com/api/#bulk_delete_tickets) |
| `merge_tickets` | Merge secondary tickets into a primary one (secondaries are closed). Payload: primary_id, ticket_ids[], note_in_primary?{body,private}, note_in_secondary?{body,private}, convert_recepients_to_cc? (Freshdesk's spelling). | `merge` | [↗](https://developers.freshdesk.com/api/#ticket_merge) |

## Archived Tickets

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_archived_tickets` | Undocumented endpoint (not in the public API reference) — may return 404 on some accounts. List archived tickets (closed tickets moved out of the active list; not returned by get_tickets/search_tickets). | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#archive_tickets) |
| `view_archived_ticket` | View an archived ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#view_archive_ticket) |
| `list_archived_ticket_conversations` | List replies and notes on an archived ticket, oldest first. Fetches every page by default. Output: { conversations, total_returned, pages_fetched, truncated, next_page }; with fetch_all=false a single page plus pagination{current_page, next_page, prev_page, per_page}. | `ticket_id`, `page`, `per_page`, `fetch_all`, `max_pages` | [↗](https://developers.freshdesk.com/api/#delete_archive_ticket) |
| `delete_archived_ticket` | Permanently delete an archived ticket. Irreversible. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#delete_archive_ticket) |

## Watchers, Associations & Access

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_ticket_watchers` | List agent IDs watching a ticket (watchers get notified of updates). | `ticket_id` | [↗](https://developers.freshdesk.com/api/#list_all_watchers) |
| `add_ticket_watcher` | Add an agent as a watcher on a ticket. | `ticket_id`, `user_id` | [↗](https://developers.freshdesk.com/api/#add_watcher) |
| `remove_ticket_watcher` | Stop watching a ticket as the API-key owner (Freshdesk only lets the current agent unwatch). | `ticket_id` | [↗](https://developers.freshdesk.com/api/#remove_watcher) |
| `bulk_watch_tickets` | Add one agent as watcher on many tickets (defaults to the API-key owner). | `ids`, `user_id` | [↗](https://developers.freshdesk.com/api/#add_watcher_multiple_tickets) |
| `bulk_unwatch_tickets` | Stop watching many tickets as the API-key owner. | `ids` | [↗](https://developers.freshdesk.com/api/#remove_watcher_multiple_tickets) |
| `get_associated_tickets` | List tickets associated with a ticket: children of a parent, or related tickets of a tracker. To create associations, pass parent_id (child) or related_ticket_ids/association_type on create_ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#get_associated_tickets) |
| `get_prime_association` | Get the prime (parent or tracker) ticket of a child/related ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#ticket_prime_association) |
| `list_ticket_accesses` | List user IDs (besides the requester) that were given access to view a ticket in the portal. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#get_user_accesses) |
| `add_ticket_accesses` | Give users (contacts) access to view a ticket in the portal. | `ticket_id`, `user_ids` | [↗](https://developers.freshdesk.com/api/#create_user_accesses) |
| `update_ticket_accesses` | Grant and/or revoke ticket access for specific users in one call. | `ticket_id`, `add`, `remove` | [↗](https://developers.freshdesk.com/api/#update_user_accesses) |
| `remove_ticket_accesses` | Revoke ALL extra user access on a ticket (requester keeps access). | `ticket_id` | [↗](https://developers.freshdesk.com/api/#delete_user_accesses) |

## Ticket Related Lists

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_ticket_time_entries` | List time entries logged on a ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#list_all_time_entries) |
| `list_ticket_satisfaction_ratings` | List CSAT ratings submitted for a ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#view_all_satisfaction_ratings) |
| `list_ticket_enums` | Return the numeric codes Freshdesk uses for ticket source, status and priority. No API call. | _(none)_ | [↗](https://developers.freshdesk.com/api/#tickets) |

## Attachments

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `get_ticket_attachment` | Download and read one attachment from a ticket or any of its conversations. Images come back as viewable images, text-like files (log, txt, json, xml, csv, yaml, har…) as text, other files (PDF, zip, Office…) as an embedded base64 resource. Video and audio are not downloaded, and files too large for one response (FRESHDESK_MAX_RESPONSE_BYTES) return their metadata. Get attachment IDs from the 'attachments' arrays of get_ticket / get_ticket_conversation. Max 5 MB (FRESHDESK_MAX_ATTACHMENT_BYTES). | `ticket_id`, `attachment_id`, `archived` | [↗](https://developers.freshdesk.com/api/#view_a_ticket) |
| `get_ticket_inline_images` | Return screenshots/images pasted inline in the ticket description and (optionally) conversation bodies — these are NOT in the 'attachments' arrays. Each image is labelled with where it came from (description, customer reply, agent reply, private note). Duplicates (e.g. from quoted replies) and tiny images (signatures, logos, tracking pixels) are skipped. The first content item is a JSON summary of found / returned / skipped images with reasons. | `ticket_id`, `include_conversations`, `max_images`, `min_dimension`, `archived` | [↗](https://developers.freshdesk.com/api/#view_a_ticket) |

## Contacts

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_contacts` | List contacts (customers/requesters), optionally filtered by exact email, phone, mobile, company or state. Deleted contacts are excluded unless state='deleted'. For partial-name lookup use search_contacts; for custom-field queries use filter_contacts. | `page`, `per_page`, `email`, `mobile`, `phone`, `company_id`, `state`, `updated_since`, `contact_type` | [↗](https://developers.freshdesk.com/api/#list_all_contacts) |
| `get_contact` | Get a contact by ID (name, emails, phones, company, custom_fields, tags…). | `contact_id` | [↗](https://developers.freshdesk.com/api/#view_contact) |
| `search_contacts` | Autocomplete contacts by the start of their name (fast, partial match). Returns id + name only. | `query` | [↗](https://developers.freshdesk.com/api/#list_all_contacts) |
| `filter_contacts` | Filter contacts with Freshdesk query language (BETA). Syntax: field:value with AND/OR and parentheses; strings in single quotes; :> / :< for numeric and date ranges; null for empty. Fields: email, phone, mobile, company_id, twitter_id, language, time_zone, tag, active, created_at, updated_at (dates 'YYYY-MM-DD') and custom contact fields by name. Example: "company_id:42 AND tag:'vip'". 30 results/page, max 10 pages. Returns { results, total }. | `query`, `page` | [↗](https://developers.freshdesk.com/api/#filter_contacts) |
| `create_contact` | Create a contact. Required: name and one of email \| phone \| mobile \| twitter_id \| unique_external_id \| social_handler[] (up to 10 Facebook/Instagram/X handles). Optional: other_emails[], company_id, view_all_tickets, other_companies[{company_id, view_all_tickets}], job_title, language, time_zone, address, description, tags[], custom_fields{}, lookup_parameter. | `contact` | [↗](https://developers.freshdesk.com/api/#create_contact) |
| `update_contact` | Partially update a contact; only sent keys change (same fields as create_contact, incl. social_handler[], other_emails[], lookup_parameter). Setting tags, other_emails or other_companies replaces the whole list. | `contact_id`, `contact` | [↗](https://developers.freshdesk.com/api/#update_contact) |
| `delete_contact` | Soft-delete a contact (moves to Deleted; reversible with restore_contact). | `contact_id` | [↗](https://developers.freshdesk.com/api/#delete_contact) |
| `hard_delete_contact` | PERMANENTLY delete a contact and ALL their tickets (GDPR erase). Irreversible. The contact must already be soft-deleted unless force=true. | `contact_id`, `force` | [↗](https://developers.freshdesk.com/api/#hard_delete_contact) |
| `restore_contact` | Restore a soft-deleted contact. | `contact_id` | [↗](https://developers.freshdesk.com/api/#restore_contact) |
| `list_deleted_contacts` | List soft-deleted contacts (shortcut for list_contacts state='deleted'). | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_contacts) |
| `merge_contacts` | Merge duplicate contacts into a primary one; secondaries' tickets move to the primary and secondaries are deleted. Payload: primary_contact_id, secondary_contact_ids[], contact?{email, phone, mobile, twitter_id, unique_external_id, other_emails[], company_ids[]} to pick the merged contact's final values. | `merge` | [↗](https://developers.freshdesk.com/api/#merge_contact) |
| `make_agent` | Convert a contact (must have an email) into an agent. Optional agent settings: occasional, ticket_scope (1=global 2=group 3=restricted), group_ids[], contribution_group_ids[], skill_ids[], signature, focus_mode, type ('support_agent' \| 'field_agent' \| 'collaborator'). | `contact_id`, `agent` | [↗](https://developers.freshdesk.com/api/#make_agent) |
| `send_contact_invite` | Email a customer-portal activation invite to a contact. | `contact_id` | [↗](https://developers.freshdesk.com/api/#send_invite) |

## Contact Export & Import

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `export_contacts` | Start an async CSV export of all contacts. Returns an export id — poll view_contact_export until it has a download url. Use list_contact_fields to discover field names. | `default_fields`, `custom_fields` | [↗](https://developers.freshdesk.com/api/#export_contact) |
| `view_contact_export` | Check a contact export job; when status is 'completed' the response includes the download url. | `export_id` | [↗](https://developers.freshdesk.com/api/#export_contact) |
| `list_contact_imports` | List the 5 most recent contact CSV imports (status, record counts, failure report). | `status` | [↗](https://developers.freshdesk.com/api/#import_contact) |
| `view_contact_import` | View a contact import: progress, completion estimate or failures. | `import_id` | [↗](https://developers.freshdesk.com/api/#import_contact) |
| `cancel_contact_import` | Cancel an in-progress contact import. | `import_id` | [↗](https://developers.freshdesk.com/api/#import_contact) |

## Contact Fields

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_contact_fields` | List all contact field definitions (system + custom) with names, types and choices. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_contact_fields) |
| `view_contact_field` | View one contact field definition. | `contact_field_id` | [↗](https://developers.freshdesk.com/api/#view_contact_field) |
| `create_contact_field` | Admin: create a custom contact field. Required: label, label_for_customers, type ('custom_text' \| 'custom_paragraph' \| 'custom_checkbox' \| 'custom_number' \| 'custom_dropdown' \| 'custom_phone_number' \| 'custom_url' \| 'custom_date'). Also required: agents_can_edit, displayed_for_agents, quick_add_for_agent, unique (booleans). Optional: position, required_for_agents, customers_can_edit, required_for_customers, displayed_for_customers, editable_in_signup, choices[]. | `contact_field` | [↗](https://developers.freshdesk.com/api/#create_contact_field) |
| `update_contact_field` | Admin: update a contact field; only sent keys change. | `contact_field_id`, `contact_field` | [↗](https://developers.freshdesk.com/api/#update_contact_field) |
| `delete_contact_field` | Admin: delete a custom contact field. | `contact_field_id` | [↗](https://developers.freshdesk.com/api/#delete_contact_field) |

## Agents

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `get_agents` | List agents (support staff) with their contact info, ticket_scope, group/role IDs and availability flag. | `page`, `per_page`, `email`, `mobile`, `phone`, `state` | [↗](https://developers.freshdesk.com/api/#list_all_agents) |
| `view_agent` | Get one agent by ID. | `agent_id` | [↗](https://developers.freshdesk.com/api/#view_agent) |
| `view_current_agent` | Get the agent who owns the API key (useful as 'me', e.g. for responder_id). | _(none)_ | [↗](https://developers.freshdesk.com/api/#me) |
| `search_agents` | Autocomplete agents by name or email prefix. Returns id, name, email — use it to resolve a person to an agent ID. | `query` | [↗](https://developers.freshdesk.com/api/#search_agents) |
| `create_agent` | Create (invite) an agent. Fields: email (required on create), ticket_scope (1=global 2=group 3=restricted; required on create), occasional, signature, group_ids[], contribution_group_ids[], role_ids[], skill_ids[], agent_type, language, time_zone, focus_mode. | `agent` | [↗](https://developers.freshdesk.com/api/#create_agent) |
| `bulk_create_agents` | Create many agents in one async job. Each item: create_agent fields plus name, phone, mobile, job_title. Returns a job_id — poll view_job_status. | `agents` | [↗](https://developers.freshdesk.com/api/#create_multiple_agents) |
| `update_agent` | Update an agent; only sent keys change (group_ids/role_ids/skill_ids replace the full list). Fields: email (required on create), ticket_scope (1=global 2=group 3=restricted; required on create), occasional, signature, group_ids[], contribution_group_ids[], role_ids[], skill_ids[], agent_type, language, time_zone, focus_mode. | `agent_id`, `agent` | [↗](https://developers.freshdesk.com/api/#update_agent) |
| `delete_agent` | Delete an agent: they are downgraded to a contact (their tickets are kept). | `agent_id` | [↗](https://developers.freshdesk.com/api/#delete_agent) |

## Agent Availability

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_agent_availabilities` | List all agents with per-channel availability: available, logged_in, assignment_limit, current_assignment_load, status, round_robin_enabled. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_agents_availability) |
| `view_agent_availability` | View one agent's per-channel availability and assignment load. | `agent_id` | [↗](https://developers.freshdesk.com/api/#view_agent_availability) |
| `update_agent_availability` | Update an agent's load settings: per-channel assignment_limit and/or availability_control. | `agent_id`, `channel_availability`, `availability_control` | [↗](https://developers.freshdesk.com/api/#update_agent_availability) |

## Groups

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_groups` | List agent groups (teams tickets can be assigned to). | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_groups) |
| `view_group` | Get one group by ID. | `group_id` | [↗](https://developers.freshdesk.com/api/#view_group) |
| `create_group` | Create a group. Fields: name (required on create), description, agent_ids[], auto_ticket_assign (0\|1), escalate_to (agent ID), unassigned_for ('30m'\|'1h'\|'2h'\|'4h'\|'8h'\|'12h'\|'1d'\|'2d'\|'3d'). | `group` | [↗](https://developers.freshdesk.com/api/#create_group) |
| `update_group` | Update a group; only sent keys change (agent_ids replaces the member list). Fields: name (required on create), description, agent_ids[], auto_ticket_assign (0\|1), escalate_to (agent ID), unassigned_for ('30m'\|'1h'\|'2h'\|'4h'\|'8h'\|'12h'\|'1d'\|'2d'\|'3d'). | `group_id`, `group` | [↗](https://developers.freshdesk.com/api/#update_group) |
| `delete_group` | Delete a group. Tickets assigned to it become unassigned from the group. | `group_id` | [↗](https://developers.freshdesk.com/api/#delete_group) |

## Admin Groups

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_admin_groups` | List groups via the admin API (includes routing/omnichannel settings). Prefer this on Omni accounts. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_admin_groups) |
| `view_admin_group` | Get one group via the admin API (with routing settings). | `group_id` | [↗](https://developers.freshdesk.com/api/#view_admin_group) |
| `create_admin_group` | Create a group via the admin API. Fields: name, description, type ('support_agent_group'\|'field_agent_group'), agent_ids[], escalate_to, unassigned_for, business_calendar_id, allow_agents_to_change_availability, automatic_agent_assignment{enabled, type, settings[]}. | `group` | [↗](https://developers.freshdesk.com/api/#create_admin_group) |
| `update_admin_group` | Update a group via the admin API; only sent keys change. Fields: name, description, type ('support_agent_group'\|'field_agent_group'), agent_ids[], escalate_to, unassigned_for, business_calendar_id, allow_agents_to_change_availability, automatic_agent_assignment{enabled, type, settings[]}. | `group_id`, `group` | [↗](https://developers.freshdesk.com/api/#update_admin_group) |
| `delete_admin_group` | Delete a group via the admin API. | `group_id` | [↗](https://developers.freshdesk.com/api/#delete_admin_group) |
| `list_group_agents` | List the agents who are members of a group. | `group_id` | [↗](https://developers.freshdesk.com/api/#list_all_agents_in_a_group) |
| `update_group_agents` | Add and/or remove agents in a group without resending the full member list. | `group_id`, `add`, `remove` | [↗](https://developers.freshdesk.com/api/#add_or_remove_agent_in_a_group) |

## Canned Responses

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_canned_response_folders` | List canned response (saved reply template) folders with response counts. Start here to browse templates. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_canned_response_folders) |
| `view_canned_response_folder` | View a folder and the id/title of each canned response in it (no content). | `folder_id` | [↗](https://developers.freshdesk.com/api/#view_canned_response_folders) |
| `list_canned_responses` | List canned responses in a folder with full content (content_html, attachments). | `folder_id` | [↗](https://developers.freshdesk.com/api/#get_details_of_canned_responses_in_folders) |
| `view_canned_response` | Get one canned response with its HTML content. Placeholders like {{ticket.requester.name}} are returned unrendered. | `canned_response_id` | [↗](https://developers.freshdesk.com/api/#view_canned_response) |
| `create_canned_response` | Create a canned response. Required: title, content_html, folder_id, visibility (0=all agents 1=personal 2=selected groups), group_ids[] (required when visibility=2). File attachments (multipart) are not supported. | `canned_response` | [↗](https://developers.freshdesk.com/api/#create_canned_response) |
| `bulk_create_canned_responses` | Create many canned responses in one async job. Each item: title, content_html, folder_id, visibility (0=all agents 1=personal 2=selected groups), group_ids[] (required when visibility=2). Returns a job_id — poll view_job_status. | `canned_responses` | [↗](https://developers.freshdesk.com/api/#bulk_create_canned_responses) |
| `update_canned_response` | Update a canned response; only sent keys change. Fields: title, content_html, folder_id, visibility (0=all agents 1=personal 2=selected groups), group_ids[] (required when visibility=2). | `canned_response_id`, `canned_response` | [↗](https://developers.freshdesk.com/api/#update_canned_response) |
| `delete_canned_response` | Undocumented endpoint (not in the public API reference) — may return 404 on some accounts. Delete a canned response. | `canned_response_id` | [↗](https://developers.freshdesk.com/api/#view_canned_response) |
| `create_canned_response_folder` | Create a canned response folder. Payload: { name }. | `folder` | [↗](https://developers.freshdesk.com/api/#create_canned_response_folder) |
| `update_canned_response_folder` | Rename a canned response folder. Payload: { name }. | `folder_id`, `folder` | [↗](https://developers.freshdesk.com/api/#update_canned_response_folder) |
| `delete_canned_response_folder` | Undocumented endpoint (not in the public API reference) — may return 404 on some accounts. Delete a canned response folder. | `folder_id` | [↗](https://developers.freshdesk.com/api/#list_all_canned_response_folders) |

## Solutions (Knowledge Base)

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `search_solution_articles` | Keyword search across Knowledge Base articles (title + body). Returns matching articles with category/folder names. Use this first when looking for help content to answer a customer. | `term` | [↗](https://developers.freshdesk.com/api/#search_solution_article) |
| `list_solution_categories` | List Knowledge Base categories (top level of category → folder → article). | `language` | [↗](https://developers.freshdesk.com/api/#list_all_solution_categories) |
| `view_solution_category` | Get one Knowledge Base category. | `category_id`, `language` | [↗](https://developers.freshdesk.com/api/#view_solution_category) |
| `create_solution_category` | Create a Knowledge Base category. Payload: name (required, unique), description, visible_in_portals[] (portal IDs). | `category` | [↗](https://developers.freshdesk.com/api/#create_solution_category) |
| `update_solution_category` | Update a category (or its translation when language is set); only sent keys change. | `category_id`, `category`, `language` | [↗](https://developers.freshdesk.com/api/#update_solution_category) |
| `delete_solution_category` | Delete a category and EVERYTHING inside it (folders and articles). Irreversible. | `category_id` | [↗](https://developers.freshdesk.com/api/#delete_solution_category) |
| `list_solution_folders` | List top-level folders in a category (with articles_count, sub_folders_count, visibility). | `category_id`, `language` | [↗](https://developers.freshdesk.com/api/#list_all_solution_folders) |
| `list_solution_subfolders` | List subfolders nested inside a folder. | `folder_id`, `language` | [↗](https://developers.freshdesk.com/api/#list_all_solution_folders) |
| `view_solution_category_folder` | Get one Knowledge Base folder. | `folder_id`, `language` | [↗](https://developers.freshdesk.com/api/#view_solution_folder) |
| `create_solution_category_folder` | Create a folder in a category. Fields: name (required, unique in category), description, visibility (1=all 2=logged-in users 3=agents 4=selected companies 5=selected contact segments 6=selected company segments), company_ids[] / contact_segment_ids[] / company_segment_ids[] (for 4/5/6), parent_folder_id (subfolder). | `category_id`, `folder` | [↗](https://developers.freshdesk.com/api/#create_solution_folder) |
| `update_solution_category_folder` | Update a folder (or its translation when language is set); only sent keys change. Fields: name (required, unique in category), description, visibility (1=all 2=logged-in users 3=agents 4=selected companies 5=selected contact segments 6=selected company segments), company_ids[] / contact_segment_ids[] / company_segment_ids[] (for 4/5/6), parent_folder_id (subfolder). | `folder_id`, `folder`, `language` | [↗](https://developers.freshdesk.com/api/#update_solution_folder) |
| `delete_solution_category_folder` | Delete a folder and all its articles/subfolders. Irreversible. | `folder_id` | [↗](https://developers.freshdesk.com/api/#delete_solution_folder) |
| `list_solution_articles` | List articles in a folder (full content included). | `folder_id`, `language` | [↗](https://developers.freshdesk.com/api/#list_all_solution_articles) |
| `view_solution_article` | Get one article with HTML description, status, tags, hits and thumbs up/down. | `article_id`, `language` | [↗](https://developers.freshdesk.com/api/#view_solution_article) |
| `create_solution_article` | Create an article in a folder. Required: title, description, status. Fields: title, description (HTML), status (1=draft 2=published), type (1=permanent 2=workaround), agent_id (author), tags[], seo_data{meta_title, meta_description, meta_keywords}, review_date. | `folder_id`, `article` | [↗](https://developers.freshdesk.com/api/#create_solution_article) |
| `update_solution_article` | Update an article (or its translation when language is set); only sent keys change. Set status=2 to publish. Fields: title, description (HTML), status (1=draft 2=published), type (1=permanent 2=workaround), agent_id (author), tags[], seo_data{meta_title, meta_description, meta_keywords}, review_date. | `article_id`, `article`, `language` | [↗](https://developers.freshdesk.com/api/#update_solution_article) |
| `delete_solution_article` | Delete an article (all translations). Irreversible. | `article_id` | [↗](https://developers.freshdesk.com/api/#delete_solution_article) |
| `create_solution_translation` | Add a translation of an existing category, folder or article (multilingual Knowledge Base must be enabled). Payload uses the same fields as the original (category: name, description; folder: name, description; article: title, description, status). | `kind`, `id`, `language`, `translation` | [↗](https://developers.freshdesk.com/api/#solutions) |

## Companies

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_companies` | List companies (customer organisations) with pagination. Returns { companies, pagination }. | `page`, `per_page`, `updated_since` | [↗](https://developers.freshdesk.com/api/#list_all_companies) |
| `view_company` | Get a company by ID (name, domains, health_score, account_tier, renewal_date, industry, custom_fields…). | `company_id` | [↗](https://developers.freshdesk.com/api/#view_company) |
| `search_companies` | Autocomplete companies by the start of their name. Returns id + name only — use this to resolve a company name to an ID. | `query` | [↗](https://developers.freshdesk.com/api/#search_companies) |
| `filter_companies` | Filter companies with Freshdesk query language (BETA). Syntax: field:value with AND/OR and parentheses; strings in single quotes; :> / :< for numeric and date ranges; null for empty. Fields: domain, created_at, updated_at (dates 'YYYY-MM-DD') and custom company fields by name. Example: "domain:'acme.com' OR industry:'Retail'". 30 results/page, max 10 pages. Returns { results, total }. | `query`, `page` | [↗](https://developers.freshdesk.com/api/#filter_companies) |
| `create_company` | Create a company. Required: name (unique). Optional: description, note, domains[] (contacts with these email domains auto-link), health_score, account_tier, renewal_date, industry, custom_fields{}. | `company` | [↗](https://developers.freshdesk.com/api/#create_company) |
| `update_company` | Partially update a company; only sent keys change. Setting domains replaces the whole list. | `company_id`, `company` | [↗](https://developers.freshdesk.com/api/#update_company) |
| `delete_company` | Permanently delete a company. Its contacts and tickets are kept but unlinked. Irreversible. | `company_id` | [↗](https://developers.freshdesk.com/api/#delete_company) |
| `list_company_contacts` | List contacts that belong to a company. | `company_id`, `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_contacts) |

## Company Export & Import

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `export_companies` | Start an async CSV export of all companies. Returns an export id — poll view_company_export until it has a download url. | `default_fields`, `custom_fields` | [↗](https://developers.freshdesk.com/api/#export_company) |
| `view_company_export` | Check a company export job; when complete the response includes the CSV download url. | `export_id` | [↗](https://developers.freshdesk.com/api/#export_company) |
| `list_company_imports` | List the 5 most recent company CSV imports (status, record counts, failure report). | `status` | [↗](https://developers.freshdesk.com/api/#import_company) |
| `view_company_import` | View a company import: progress, completion estimate or failures. | `import_id` | [↗](https://developers.freshdesk.com/api/#import_company) |
| `cancel_company_import` | Cancel an in-progress company import. | `import_id` | [↗](https://developers.freshdesk.com/api/#import_company) |

## Company Fields

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_company_fields` | List all company field definitions (system + custom) with names, types and choices. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_company_fields) |
| `view_company_field` | View one company field definition. | `company_field_id` | [↗](https://developers.freshdesk.com/api/#view_company_field) |
| `create_company_field` | Admin: create a custom company field. Required: label, type ('custom_text' \| 'custom_paragraph' \| 'custom_checkbox' \| 'custom_number' \| 'custom_dropdown' \| 'custom_phone_number' \| 'custom_url' \| 'custom_date'), agents_can_edit, displayed_for_agents, quick_add_for_agent, unique (booleans). Optional: position, required_for_agents, choices[]. | `company_field` | [↗](https://developers.freshdesk.com/api/#create_company_field) |
| `update_company_field` | Admin: update a company field; only sent keys change. | `company_field_id`, `company_field` | [↗](https://developers.freshdesk.com/api/#update_company_field) |
| `delete_company_field` | Admin: delete a custom company field. | `company_field_id` | [↗](https://developers.freshdesk.com/api/#delete_company_field) |

## Skills

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_skills` | List routing skills (used by skill-based ticket assignment) with their matching conditions and agents. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_skills) |
| `view_skill` | Get one routing skill. | `skill_id` | [↗](https://developers.freshdesk.com/api/#view_skill) |
| `create_skill` | Create a routing skill. Required: name. Fields: name, rank, agents[{id}], match_type ('all'\|'any'), conditions[{resource_type:'ticket'\|'contact'\|'company', field_name, operator ('in'\|'not_in'\|'is'\|'is_not'), value[]}]. | `skill` | [↗](https://developers.freshdesk.com/api/#create_skill) |
| `update_skill` | Update a routing skill; only sent keys change. Fields: name, rank, agents[{id}], match_type ('all'\|'any'), conditions[{resource_type:'ticket'\|'contact'\|'company', field_name, operator ('in'\|'not_in'\|'is'\|'is_not'), value[]}]. | `skill_id`, `skill` | [↗](https://developers.freshdesk.com/api/#update_skill) |
| `delete_skill` | Delete a routing skill. | `skill_id` | [↗](https://developers.freshdesk.com/api/#delete_skill) |

## Roles

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_roles` | List agent roles (Account Admin, Admin, Supervisor, Agent, custom…). Use the IDs in agent role_ids. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_roles) |
| `view_role` | Get one agent role. | `role_id` | [↗](https://developers.freshdesk.com/api/#view_role) |

## Products

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_products` | List products (brands) configured in a multi-product helpdesk. Use the IDs in ticket product_id. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_products) |
| `view_product` | Get one product. | `product_id` | [↗](https://developers.freshdesk.com/api/#view_product) |

## Business Hours

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_business_hours` | List business-hour calendars (working hours, time zone, holidays) used by SLA and groups. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_business_hours) |
| `view_business_hours` | Get one business-hour calendar with its weekly schedule and holidays. | `business_hours_id` | [↗](https://developers.freshdesk.com/api/#view_business_hour) |

## SLA Policies

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_sla_policies` | List SLA policies: response/resolution targets per priority and the conditions they apply to. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_sla_policies) |
| `view_sla_policy` | Undocumented endpoint (not in the public API reference) — may return 404 on some accounts. Get one SLA policy. | `sla_policy_id` | [↗](https://developers.freshdesk.com/api/#list_all_sla_policies) |
| `create_sla_policy` | Create an SLA policy. Required: name, sla_target, applicable_to. Fields: name, description, active, position, is_default, sla_target{priority_1..priority_4: {respond_within, resolve_within (seconds), business_hours, escalation_enabled}}, applicable_to{company_ids[], group_ids[], sources[], ticket_types[], product_ids[]}, escalation{response, resolution}. | `sla_policy` | [↗](https://developers.freshdesk.com/api/#create_sla_policy) |
| `update_sla_policy` | Update an SLA policy (applicable_to must be sent for non-default policies). Fields: name, description, active, position, is_default, sla_target{priority_1..priority_4: {respond_within, resolve_within (seconds), business_hours, escalation_enabled}}, applicable_to{company_ids[], group_ids[], sources[], ticket_types[], product_ids[]}, escalation{response, resolution}. | `sla_policy_id`, `sla_policy` | [↗](https://developers.freshdesk.com/api/#update_sla_policy) |

## Email Configs

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_email_configs` | List support email addresses (email configs). Use an ID as email_config_id when creating outbound emails/tickets. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_email_configs) |
| `view_email_config` | Get one email config. | `email_config_id` | [↗](https://developers.freshdesk.com/api/#view_email_config) |

## Email Mailboxes & Settings

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_email_mailboxes` | List email mailboxes (support addresses with their routing group/product and IMAP/SMTP settings). | `support_email`, `forward_email`, `group_id`, `product_id`, `active`, `order_by`, `order_type` | [↗](https://developers.freshdesk.com/api/#list_all_email_mailboxes) |
| `view_email_mailbox` | Get one email mailbox. | `mailbox_id` | [↗](https://developers.freshdesk.com/api/#view_email_mailbox) |
| `create_email_mailbox` | Create an email mailbox. Fields (* required): support_email*, mailbox_type* ('freshdesk_mailbox'\|'custom_mailbox'), name, group_id, product_id, default_reply_email, custom_mailbox{access_type ('incoming'\|'outgoing'\|'both'), incoming{mail_server, port, use_ssl, authentication, username, password}, outgoing{…same…}} (required for custom_mailbox). | `mailbox` | [↗](https://developers.freshdesk.com/api/#create_email_mailbox) |
| `update_email_mailbox` | Update an email mailbox; only sent keys change. Fields: support_email*, mailbox_type* ('freshdesk_mailbox'\|'custom_mailbox'), name, group_id, product_id, default_reply_email, custom_mailbox{access_type ('incoming'\|'outgoing'\|'both'), incoming{mail_server, port, use_ssl, authentication, username, password}, outgoing{…same…}} (required for custom_mailbox). | `mailbox_id`, `mailbox` | [↗](https://developers.freshdesk.com/api/#update_email_mailbox) |
| `delete_email_mailbox` | Delete an email mailbox. Emails to that address stop creating tickets. | `mailbox_id` | [↗](https://developers.freshdesk.com/api/#delete_email_mailbox) |
| `view_mailbox_settings` | View account-wide email settings (personalized replies, reply-to requester, agent-initiated outbound, forward handling). | _(none)_ | [↗](https://developers.freshdesk.com/api/#view_mailbox_settings) |
| `update_mailbox_settings` | Update account-wide email settings. Send only the flags to change. | `personalized_email_replies`, `create_requester_using_reply_to`, `allow_agent_to_initiate_conversation`, `original_sender_as_requester_for_forward` | [↗](https://developers.freshdesk.com/api/#update_mailbox_settings) |
| `view_automatic_bcc_emails` | View the addresses automatically BCC'd on all ticket communication. | _(none)_ | [↗](https://developers.freshdesk.com/api/#view_automatic_bcc_emails) |
| `update_automatic_bcc_emails` | Replace the list of addresses automatically BCC'd on all ticket communication (max 255 characters total). Send [] to clear. | `emails` | [↗](https://developers.freshdesk.com/api/#update_automatic_bcc_emails) |

## Helpdesk Settings

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `view_helpdesk_settings` | View helpdesk settings: primary/supported languages and portal language options. | _(none)_ | [↗](https://developers.freshdesk.com/api/#settings_helpdesk) |

## Account

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `view_account` | View account info: plan, data center, time zone, agent counts, account admin contact. | _(none)_ | [↗](https://developers.freshdesk.com/api/#view_account) |
| `export_account` | Account admin only: start a full data export (emailed to the admin when ready). resources[].name: tickets \| archive_tickets \| contacts \| companies \| groups \| forums \| canned_responses \| surveys \| solutions…; include examples: tickets → notes, attachments, ticket_states, requester; companies → company_domains. | `date_range`, `resources`, `output_format` | [↗](https://developers.freshdesk.com/api/#generate_export) |

## Collaboration Threads

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `create_thread` | Create a collaboration thread on a ticket (e.g. a forward conversation with third parties). Payload: type ('forward'), parent{id: ticket ID, type: 'ticket'}, title?, participants?{emails[], agents[]}, additional_info?{email_config_id}. | `thread` | [↗](https://developers.freshdesk.com/api/#create_a_thread) |
| `view_thread` | Get a collaboration thread. | `thread_id` | [↗](https://developers.freshdesk.com/api/#get_a_thread) |
| `update_thread` | Update a collaboration thread (title, participants, additional_info). | `thread_id`, `thread` | [↗](https://developers.freshdesk.com/api/#update_a_thread) |
| `delete_thread` | Delete a collaboration thread. | `thread_id` | [↗](https://developers.freshdesk.com/api/#delete_a_thread) |
| `create_thread_message` | Post a message to a collaboration thread (sends email for forward threads). Payload: body (HTML), participants?{email:{to[], cc[], bcc[]}}, additional_info?{has_quoted_text, email_subject}, attachment_ids[]. Use get_thread_message_quote to build quoted text for replies. | `thread_id`, `message` | [↗](https://developers.freshdesk.com/api/#create_message_for_thread) |
| `view_thread_message` | Get a thread message. | `message_id` | [↗](https://developers.freshdesk.com/api/#get_message_for_thread) |
| `get_thread_message_quote` | Get the email-style quoted HTML of a thread message, to append when replying. | `message_id` | [↗](https://developers.freshdesk.com/api/#get_quoted_text) |
| `update_thread_message` | Update a thread message's body or metadata. | `message_id`, `message` | [↗](https://developers.freshdesk.com/api/#update_message_for_thread) |
| `delete_thread_message` | Delete a thread message. | `message_id` | [↗](https://developers.freshdesk.com/api/#delete_message_for_thread) |

## Time Entries

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_time_entries` | List time entries across all tickets, filterable by agent, company, billable flag and execution date range. | `page`, `per_page`, `agent_id`, `company_id`, `executed_after`, `executed_before`, `billable` | [↗](https://developers.freshdesk.com/api/#list_all_time_entries) |
| `create_time_entry` | Log time on a ticket. Fields: agent_id, billable, note, time_spent ('hh:mm'), executed_at (ISO-8601), start_time, timer_running. Omit time_spent and set timer_running=true to start a live timer. | `ticket_id`, `time_entry` | [↗](https://developers.freshdesk.com/api/#create_time_entry) |
| `update_time_entry` | Update a time entry; only sent keys change. Fields: agent_id, billable, note, time_spent ('hh:mm'), executed_at (ISO-8601), start_time, timer_running. | `time_entry_id`, `time_entry` | [↗](https://developers.freshdesk.com/api/#update_time_entry) |
| `toggle_time_entry_timer` | Start a stopped timer or stop a running one on a time entry. | `time_entry_id` | [↗](https://developers.freshdesk.com/api/#toggle_time_entry) |
| `delete_time_entry` | Delete a time entry. | `time_entry_id` | [↗](https://developers.freshdesk.com/api/#delete_time_entry) |

## Discussions (Forums)

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_forum_categories` | List community forum categories (Discussions; legacy feature, only on accounts that have forums enabled). | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_categories) |
| `view_forum_category` | Get one forum category. | `category_id` | [↗](https://developers.freshdesk.com/api/#view_category) |
| `create_forum_category` | Create a forum category. Payload: name (required), description. | `category` | [↗](https://developers.freshdesk.com/api/#create_category) |
| `update_forum_category` | Update a forum category (name, description). | `category_id`, `category` | [↗](https://developers.freshdesk.com/api/#update_category) |
| `delete_forum_category` | Delete a forum category with all its forums and topics. Irreversible. | `category_id` | [↗](https://developers.freshdesk.com/api/#delete_category) |
| `list_forums` | List forums in a forum category. | `category_id` | [↗](https://developers.freshdesk.com/api/#list_all_forums) |
| `view_forum` | Get one forum. | `forum_id` | [↗](https://developers.freshdesk.com/api/#view_forum) |
| `create_forum` | Create a forum in a category. Required: name, forum_type (1=how-to 2=ideas 3=problems 4=announcements), forum_visibility (1=all 2=logged-in 3=agents 4=selected companies). Optional: description, company_ids[] (for visibility 4). | `category_id`, `forum` | [↗](https://developers.freshdesk.com/api/#create_forum) |
| `update_forum` | Update a forum (name, description, forum_type, forum_visibility, company_ids[], forum_category_id to move it). | `forum_id`, `forum` | [↗](https://developers.freshdesk.com/api/#update_forum) |
| `delete_forum` | Delete a forum with all its topics. Irreversible. | `forum_id` | [↗](https://developers.freshdesk.com/api/#delete_forum) |
| `list_topics` | List topics (threads) in a forum. | `forum_id` | [↗](https://developers.freshdesk.com/api/#list_all_topics) |
| `view_topic` | Get one forum topic. | `topic_id` | [↗](https://developers.freshdesk.com/api/#view_topic) |
| `create_topic` | Create a topic in a forum. Payload: title, message (HTML) required; sticky, locked, stamp_type optional. | `forum_id`, `topic` | [↗](https://developers.freshdesk.com/api/#create_topic) |
| `update_topic` | Update a forum topic (title, message, sticky, locked, stamp_type, forum_id to move it). | `topic_id`, `topic` | [↗](https://developers.freshdesk.com/api/#update_topic) |
| `delete_topic` | Delete a forum topic and its comments. | `topic_id` | [↗](https://developers.freshdesk.com/api/#delete_topic) |
| `list_topic_comments` | List comments on a forum topic. | `topic_id` | [↗](https://developers.freshdesk.com/api/#list_all_comments) |
| `create_topic_comment` | Comment on a forum topic. Payload: { body (HTML, required) }. | `topic_id`, `comment` | [↗](https://developers.freshdesk.com/api/#create_comment) |
| `update_topic_comment` | Update a forum comment. Payload: { body?, answer? (true = mark as the topic's answer) }. | `comment_id`, `comment` | [↗](https://developers.freshdesk.com/api/#update_comment) |
| `delete_topic_comment` | Delete a forum comment. | `comment_id` | [↗](https://developers.freshdesk.com/api/#delete_comment) |
| `follow_discussion` | Monitor (follow) a forum or topic so the user is notified of new posts. | `kind`, `id`, `user_id` | [↗](https://developers.freshdesk.com/api/#monitor_forum) |
| `unfollow_discussion` | Stop monitoring a forum or topic. | `kind`, `id`, `user_id` | [↗](https://developers.freshdesk.com/api/#unmonitor_forum) |
| `check_discussion_follow` | Check whether a user monitors a forum or topic. Returns { following: true\|false }. | `kind`, `id`, `user_id` | [↗](https://developers.freshdesk.com/api/#view_monitor_status_for_forum) |
| `list_followed_topics` | List forum topics monitored by a user. | `user_id`, `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_monitored_topics) |
| `list_participated_topics` | List forum topics a user has posted in. | `user_id`, `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_participated_topics) |

## Surveys & Satisfaction

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_csat_surveys` | List customer-satisfaction surveys (new CSAT engine) with their questions, scales, choices and logic. Use the survey id and question ids with create_survey_response / list_survey_responses. | `state`, `per_page`, `next_token`, `prev_token` | [↗](https://developers.freshdesk.com/api/#csat_surveys) |
| `list_survey_responses` | List responses to a CSAT survey (new engine), filterable by date and completion status. | `survey_id`, `created_since`, `status`, `per_page`, `next_token`, `prev_token` | [↗](https://developers.freshdesk.com/api/#view_survey_responses) |
| `create_survey_response` | Submit CSAT feedback for a resolved ticket (new engine). Include at least the required rating question. Answer value: integer for rating scales, string for text, option value string for single choice, array of option values for multi choice. | `survey_id`, `ticket_id`, `answers` | [↗](https://developers.freshdesk.com/api/#create_survey_responses) |
| `list_surveys` | List classic satisfaction surveys (legacy engine) and their questions. | `state` | [↗](https://developers.freshdesk.com/api/#list_all_survey) |
| `view_survey` | Undocumented endpoint (not in the public API reference) — may return 404 on some accounts. Get one classic satisfaction survey. | `survey_id` | [↗](https://developers.freshdesk.com/api/#list_all_survey) |
| `list_satisfaction_ratings` | List classic satisfaction ratings across tickets. Rating values: new surveys 103..-103 (Extremely happy..Extremely unhappy, 100=neutral); classic 1=happy 2=neutral 3=unhappy. | `page`, `per_page`, `created_since`, `user_id` | [↗](https://developers.freshdesk.com/api/#view_all_satisfaction_ratings) |
| `create_satisfaction_rating` | Record a classic satisfaction rating on a ticket. Payload: ratings{default_question: 103..-103 (or 1..3 for classic), <question_id>: value}, feedback?. | `ticket_id`, `rating` | [↗](https://developers.freshdesk.com/api/#create_satisfaction_rating) |

## Automations

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_automation_rules` | List automation rules of one type, in execution order. | `automation_type_id` | [↗](https://developers.freshdesk.com/api/#list_all_automation_rules) |
| `view_automation_rule` | Get one automation rule with its events, conditions and actions. | `automation_type_id`, `rule_id` | [↗](https://developers.freshdesk.com/api/#view_an_automation_rule) |
| `create_automation_rule` | Create an automation rule. Tip: copy the shape of an existing rule from view_automation_rule. Fields: name (required), position, active, performer{type, members[]} (type 4 only), events[{field_name, from, to}] (type 4 only), conditions[{name, match_type 'all'\|'any', properties[{resource_type, field_name, operator, value}]}], operator ('condition_set_1 or condition_set_2'), actions[{field_name, value}]. | `automation_type_id`, `rule` | [↗](https://developers.freshdesk.com/api/#create_an_automation_rule) |
| `update_automation_rule` | Update an automation rule; only sent keys change (conditions/actions replace the full list). Fields: name (required), position, active, performer{type, members[]} (type 4 only), events[{field_name, from, to}] (type 4 only), conditions[{name, match_type 'all'\|'any', properties[{resource_type, field_name, operator, value}]}], operator ('condition_set_1 or condition_set_2'), actions[{field_name, value}]. | `automation_type_id`, `rule_id`, `rule` | [↗](https://developers.freshdesk.com/api/#update_an_automation_rule) |
| `delete_automation_rule` | Delete an automation rule. | `automation_type_id`, `rule_id` | [↗](https://developers.freshdesk.com/api/#delete_an_automation_rule) |

## Scenario Automations

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_scenario_automations` | List scenario automations (one-click macros that apply several ticket actions at once). | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_scenario_automations) |
| `view_scenario_automation` | Undocumented endpoint (not in the public API reference) — may return 404 on some accounts. Get one scenario automation and its actions. | `scenario_id` | [↗](https://developers.freshdesk.com/api/#list_all_scenario_automations) |
| `execute_scenario` | Undocumented endpoint (not in the public API reference) — may return 404 on some accounts. Run a scenario automation on a ticket (applies all its actions). | `ticket_id`, `scenario_id` | [↗](https://developers.freshdesk.com/api/#list_all_scenario_automations) |

## Custom Objects

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_custom_object_schemas` | List custom objects (schemas) defined in the account. | _(none)_ | [↗](https://developers.freshdesk.com/api/#retrieve_existing_custom_objects) |
| `view_custom_object_schema` | Get a custom object schema: field names, types, required flags and lookup targets. Call before creating/filtering records. | `schema_id` | [↗](https://developers.freshdesk.com/api/#retrieve_specific_custom_object) |
| `list_custom_object_records` | List or filter records of a custom object. Pagination is cursor-based: pass next_token from the previous response's _links.next. Filters are AND-ed query conditions: { field_name: value } for equality, or operators via key suffix like { 'age[gt]': 30, 'created_time[gte]': '2024-01-01T00:00:00.000Z' } (gt, lt, gte, lte; != and OR not supported). Lookup filters use the target's ID (ticket display_id, org_contact_id, org_company_id). | `schema_id`, `page_size`, `next_token`, `sort_by`, `sort_order`, `filters` | [↗](https://developers.freshdesk.com/api/#filter_records_of_custom_objects) |
| `count_custom_object_records` | Count records of a custom object. | `schema_id` | [↗](https://developers.freshdesk.com/api/#retrieve_the_count_of_records_custom_objects) |
| `view_custom_object_record` | Get one custom object record. | `schema_id`, `record_id` | [↗](https://developers.freshdesk.com/api/#retrieve_a_custom_object_record) |
| `create_custom_object_record` | Create a custom object record. Payload: { data: { <field_name>: value, … } } using names from view_custom_object_schema. Lookup fields take the target's ID (ticket display_id, org_contact_id, org_company_id, or record id). | `schema_id`, `record` | [↗](https://developers.freshdesk.com/api/#create_a_new_custom_object_record) |
| `update_custom_object_record` | Update a custom object record. Send the full record as returned by view_custom_object_record (including version) with changed data values. | `schema_id`, `record_id`, `record` | [↗](https://developers.freshdesk.com/api/#update_a_custom_object_record) |
| `delete_custom_object_record` | Delete a custom object record. | `schema_id`, `record_id` | [↗](https://developers.freshdesk.com/api/#delete_a_custom_object_record) |

## Field Service Management

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_service_tasks` | List Field Service Management service tasks (tickets of type 'Service Task'; requires the FSM add-on). Optional extra filter in search_tickets syntax, e.g. "status:2 AND agent_id:123". 30 per page, max 10 pages. | `filter`, `page` | [↗](https://developers.freshdesk.com/api/#service_task) |
| `view_service_task` | Get one FSM service task (a ticket) including its cf_fsm_* custom fields. | `task_id` | [↗](https://developers.freshdesk.com/api/#view_service_task) |
| `create_service_task` | Create an FSM service task, optionally under a parent ticket (max 10 per parent). type is forced to 'Service Task'. Fields: subject, description, status, priority, requester_id\|email, responder_id (field technician agent), group_id (service group), custom_fields{cf_fsm_contact_name*, cf_fsm_phone_number*, cf_fsm_service_location*, cf_fsm_appointment_start_time, cf_fsm_appointment_end_time (UTC ISO-8601)} (* required on create); any other create_ticket field (source, tags, product_id, cc_emails, due_by…) is also accepted. | `parent_id`, `task` | [↗](https://developers.freshdesk.com/api/#create_service_task) |
| `update_service_task` | Update an FSM service task (e.g. reschedule, reassign technician, change status); only sent keys change. Fields: subject, description, status, priority, requester_id\|email, responder_id (field technician agent), group_id (service group), custom_fields{cf_fsm_contact_name*, cf_fsm_phone_number*, cf_fsm_service_location*, cf_fsm_appointment_start_time, cf_fsm_appointment_end_time (UTC ISO-8601)} (* required on create). | `task_id`, `task` | [↗](https://developers.freshdesk.com/api/#update_service_task) |
| `delete_service_task` | Delete (trash) an FSM service task. | `task_id` | [↗](https://developers.freshdesk.com/api/#delete_service_task) |

## Outbound (Email & WhatsApp)

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `create_outbound_email` | Start a new email conversation with a customer (creates an outbound ticket, Closed + assigned to you by default so SLA doesn't run). Required: email, subject, email_config_id (see list_email_configs). Optional: name, description (HTML), status (default 5=closed), priority (default 1), type, group_id, tags[], custom_fields{}, due_by, fr_due_by. Subject/description can't be edited later. | `email` | [↗](https://developers.freshdesk.com/api/#create_outbound_email) |
| `send_whatsapp_message` | Send a proactive WhatsApp template message (queued, sent asynchronously). The template must be approved by Meta in your WABA. Returns a message_id — check delivery with view_outbound_message. | `from`, `to`, `template_name`, `language_code`, `components`, `external_reference_id`, `extra` | [↗](https://developers.freshdesk.com/api/#send_outbound_message) |
| `view_outbound_message` | Get the status of a proactive outbound message (e.g. QUEUED, SENT, DELIVERED, READ, FAILED with error_code/error_message). | `message_id` | [↗](https://developers.freshdesk.com/api/#retrieve_outbound_message) |

## Jobs

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `view_job_status` | Check an async bulk job (bulk_update/bulk_delete/bulk_create tickets, bulk agents, bulk canned responses): status and per-item results. | `job_id` | [↗](https://developers.freshdesk.com/api/#view_job) |

## Contact Activities

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `publish_contact_activity` | Publish an external-app event (e.g. 'Placed order #123') to a contact's timeline. Payload activity: name (required, shown in timeline), actor{type: 'contact'\|…, one of email\|id\|twitter_id\|facebook_id\|unique_external_id, is_actor?} (required, who did it), source{name, id} (required, which app), timestamp?, description?, link?, object?{…}, context?{…}. | `activity` | [↗](https://developers.freshdesk.com/api/#publish_omnichannel_activity) |

## Prompts

| Prompt | Args | Purpose |
| --- | --- | --- |
| `create_ticket` | `subject`, `description`, `source`, `priority`, `status`, `email` | Guide for creating a Freshdesk ticket. |
| `create_reply` | `ticket_id`, `reply_message` | Guide for creating a Freshdesk ticket reply. |
