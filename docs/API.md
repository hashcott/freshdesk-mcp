# API Reference

Generated from the running MCP server. Every tool listed below is registered by `src/server.ts` and validated against a strict Zod schema in `src/schemas/index.ts`.

## Conventions

- Input arguments shown as `{ key: type, ... }`. `?` means optional.
- Wherever a tool accepts a resource payload (`ticket`, `contact`, `company`, ...), the inner shape is enforced by the corresponding Zod schema in [SCHEMAS.md](SCHEMAS.md). Unknown / custom fields are passed through via `.passthrough()`.
- Endpoints with pagination accept `page` (≥1) and `per_page` (1–100, default 30).
- Server returns one MCP `content[0].text` element containing JSON-stringified result or `{error, ...}` on failure.

## Index

- [Tickets](#tickets)
- [Conversations](#conversations)
- [Ticket Summary](#ticket-summary)
- [Ticket Fields](#ticket-fields)
- [Contacts](#contacts)
- [Contact Fields](#contact-fields)
- [Companies](#companies)
- [Company Fields](#company-fields)
- [Agents](#agents)
- [Groups](#groups)
- [Admin Groups](#admin-groups)
- [Skills](#skills)
- [Roles](#roles)
- [Canned Responses](#canned-responses)
- [Solutions](#solutions)
- [Discussions](#discussions)
- [Surveys & CSAT](#surveys-csat)
- [Time Entries](#time-entries)
- [Products](#products)
- [Business Hours](#business-hours)
- [SLA Policies](#sla-policies)
- [Email Configs](#email-configs)
- [Email Mailboxes](#email-mailboxes)
- [Automations](#automations)
- [Scenario Automations](#scenario-automations)
- [Custom Objects](#custom-objects)
- [FSM](#fsm)
- [Threads](#threads)
- [Outbound](#outbound)
- [Settings](#settings)
- [Account](#account)
- [Jobs](#jobs)
- [Availability](#availability)
- [Omnichannel](#omnichannel)

## Tickets

| Tool | Description | Params |
| --- | --- | --- |
| `get_ticket_fields` | Get all ticket field definitions. | _(none)_ |
| `get_tickets` | List tickets with pagination + filter support. | `page`, `per_page`, `filter`, `requester_id`, `email`, `company_id`, `updated_since`, `order_by`, `order_type`, `include` |
| `create_ticket` | Create a ticket. Validates against Freshdesk ticket schema; unknown keys are passed through. | `ticket` |
| `update_ticket` | Update a ticket (partial update; only provided fields are sent). | `ticket_id`, `ticket` |
| `delete_ticket` | Soft-delete a ticket. | `ticket_id` |
| `get_ticket` | Get a single ticket. | `ticket_id`, `include` |
| `search_tickets` | Search tickets using Freshdesk filter syntax. | `query` |
| `bulk_create_tickets` | Bulk create up to 100 tickets. | `tickets` |
| `bulk_update_tickets` | Bulk update tickets (ids + properties or reply). | `bulk_action` |
| `bulk_delete_tickets` | Bulk delete tickets. | `bulk_action` |
| `restore_ticket` | Restore a deleted ticket. | `ticket_id` |
| `list_archived_tickets` | List archived tickets. | `page`, `per_page` |
| `view_archived_ticket` | View an archived ticket. | `ticket_id` |
| `delete_archived_ticket` | Permanently delete an archived ticket. | `ticket_id` |
| `list_archived_ticket_conversations` | List conversations on an archived ticket. | `ticket_id` |
| `merge_tickets` | Merge tickets into a primary. | `merge` |
| `forward_ticket` | Forward a ticket. | `ticket_id`, `forward` |
| `list_ticket_time_entries` | List time entries on a ticket. | `ticket_id` |
| `list_ticket_satisfaction_ratings` | List satisfaction ratings on a ticket. | `ticket_id` |
| `list_ticket_enums` | Return numeric ranges for ticket source/status/priority. | _(none)_ |

## Conversations

| Tool | Description | Params |
| --- | --- | --- |
| `get_ticket_conversation` | Get conversations for a ticket. | `ticket_id` |
| `create_ticket_reply` | Reply to a ticket. | `ticket_id`, `reply` |
| `create_ticket_note` | Add a note to a ticket. | `ticket_id`, `note` |
| `update_ticket_conversation` | Update a conversation (reply or note). | `conversation_id`, `conversation` |
| `delete_conversation` | Delete a conversation (reply/note). | `conversation_id` |
| `reply_to_forward` | Reply to a forwarded conversation. | `ticket_id`, `reply` |

## Ticket Summary

| Tool | Description | Params |
| --- | --- | --- |
| `view_ticket_summary` | Get a ticket's summary. | `ticket_id` |
| `update_ticket_summary` | Update a ticket's summary. | `ticket_id`, `body` |
| `delete_ticket_summary` | Delete a ticket's summary. | `ticket_id` |

## Ticket Fields

| Tool | Description | Params |
| --- | --- | --- |
| `create_ticket_field` | Create a ticket field (admin). | `ticket_field` |
| `view_ticket_field` | View a ticket field. | `ticket_field_id` |
| `update_ticket_field` | Update a ticket field (admin). | `ticket_field_id`, `ticket_field` |
| `delete_ticket_field` | Delete a ticket field. | `ticket_field_id` |
| `get_field_properties` | Get the definition of a single ticket field by name. | `field_name` |

## Contacts

| Tool | Description | Params |
| --- | --- | --- |
| `list_contacts` | List contacts. | `page`, `per_page`, `email`, `mobile`, `phone`, `company_id`, `state`, `updated_since` |
| `get_contact` | Get a contact by ID. | `contact_id` |
| `search_contacts` | Autocomplete search contacts. | `query` |
| `create_contact` | Create a contact. | `contact` |
| `update_contact` | Update a contact. | `contact_id`, `contact` |
| `delete_contact` | Soft-delete a contact. | `contact_id` |
| `hard_delete_contact` | Permanently delete a contact. | `contact_id`, `force` |
| `restore_contact` | Restore a soft-deleted contact. | `contact_id` |
| `merge_contacts` | Merge secondary contacts into a primary. | `merge` |
| `make_agent` | Convert a contact into an agent. | `contact_id`, `agent` |
| `send_contact_invite` | Send a portal invite to a contact. | `contact_id` |
| `list_deleted_contacts` | List soft-deleted contacts. | `page`, `per_page` |

## Contact Fields

| Tool | Description | Params |
| --- | --- | --- |
| `list_contact_fields` | List contact field definitions. | _(none)_ |
| `view_contact_field` | View a contact field. | `contact_field_id` |
| `create_contact_field` | Create a contact field. | `contact_field` |
| `update_contact_field` | Update a contact field. | `contact_field_id`, `contact_field` |
| `delete_contact_field` | Delete a contact field. | `contact_field_id` |

## Companies

| Tool | Description | Params |
| --- | --- | --- |
| `list_companies` | List companies with pagination. | `page`, `per_page` |
| `view_company` | View a company by ID. | `company_id` |
| `search_companies` | Autocomplete companies by name. | `query` |
| `find_company_by_name` | Find a company by name. | `name` |
| `create_company` | Create a company. | `company` |
| `update_company` | Update a company. | `company_id`, `company` |
| `delete_company` | Delete a company. | `company_id` |
| `list_company_contacts` | List contacts attached to a company. | `company_id`, `page`, `per_page` |

## Company Fields

| Tool | Description | Params |
| --- | --- | --- |
| `list_company_fields` | List company field definitions. | _(none)_ |
| `view_company_field` | View a company field. | `company_field_id` |
| `create_company_field` | Create a company field. | `company_field` |
| `update_company_field` | Update a company field. | `company_field_id`, `company_field` |
| `delete_company_field` | Delete a company field. | `company_field_id` |

## Agents

| Tool | Description | Params |
| --- | --- | --- |
| `get_agents` | List agents. | `page`, `per_page` |
| `view_agent` | View an agent. | `agent_id` |
| `create_agent` | Create an agent. | `agent` |
| `update_agent` | Update an agent. | `agent_id`, `agent` |
| `search_agents` | Autocomplete agents. | `query` |
| `view_current_agent` | View the currently authenticated agent. | _(none)_ |
| `delete_agent` | Deactivate / delete an agent. | `agent_id` |
| `bulk_create_agents` | Bulk create agents. | `agents` |

## Groups

| Tool | Description | Params |
| --- | --- | --- |
| `list_groups` | List groups. | `page`, `per_page` |
| `create_group` | Create a group. | `group` |
| `view_group` | View a group. | `group_id` |
| `update_group` | Update a group. | `group_id`, `group` |
| `delete_group` | Delete a group. | `group_id` |

## Admin Groups

| Tool | Description | Params |
| --- | --- | --- |
| `list_admin_groups` | List admin groups. | `page`, `per_page` |
| `view_admin_group` | View an admin group. | `group_id` |
| `create_admin_group` | Create an admin group. | `group` |
| `update_admin_group` | Update an admin group. | `group_id`, `group` |
| `delete_admin_group` | Delete an admin group. | `group_id` |

## Skills

| Tool | Description | Params |
| --- | --- | --- |
| `list_skills` | List skills. | `page`, `per_page` |
| `view_skill` | View a skill. | `skill_id` |
| `create_skill` | Create a skill. | `skill` |
| `update_skill` | Update a skill. | `skill_id`, `skill` |
| `delete_skill` | Delete a skill. | `skill_id` |

## Roles

| Tool | Description | Params |
| --- | --- | --- |
| `list_roles` | List roles. | `page`, `per_page` |
| `view_role` | View a role. | `role_id` |

## Canned Responses

| Tool | Description | Params |
| --- | --- | --- |
| `list_canned_responses` | List canned responses in a folder. | `folder_id` |
| `list_canned_response_folders` | List canned response folders. | _(none)_ |
| `view_canned_response` | View a canned response. | `canned_response_id` |
| `create_canned_response` | Create a canned response. | `canned_response` |
| `update_canned_response` | Update a canned response. | `canned_response_id`, `canned_response` |
| `delete_canned_response` | Delete a canned response. | `canned_response_id` |
| `create_canned_response_folder` | Create a canned response folder. | `folder` |
| `update_canned_response_folder` | Update a canned response folder. | `folder_id`, `folder` |
| `delete_canned_response_folder` | Delete a canned response folder. | `folder_id` |

## Solutions

| Tool | Description | Params |
| --- | --- | --- |
| `list_solution_articles` | List solution articles in a folder. | `folder_id` |
| `list_solution_folders` | List solution folders in a category. | `category_id` |
| `list_solution_categories` | List solution categories. | _(none)_ |
| `view_solution_category` | View a solution category. | `category_id` |
| `create_solution_category` | Create a solution category. | `category` |
| `update_solution_category` | Update a solution category. | `category_id`, `category` |
| `delete_solution_category` | Delete a solution category. | `category_id` |
| `create_solution_category_folder` | Create a folder under a solution category. | `category_id`, `folder` |
| `view_solution_category_folder` | View a solution folder. | `folder_id` |
| `update_solution_category_folder` | Update a solution folder. | `folder_id`, `folder` |
| `delete_solution_category_folder` | Delete a solution folder. | `folder_id` |
| `create_solution_article` | Create a solution article. | `folder_id`, `article` |
| `view_solution_article` | View a solution article. | `article_id` |
| `update_solution_article` | Update a solution article. | `article_id`, `article` |
| `delete_solution_article` | Delete a solution article. | `article_id` |
| `search_solution_articles` | Search solution articles. | `term` |

## Discussions

| Tool | Description | Params |
| --- | --- | --- |
| `list_forum_categories` | List forum categories. | _(none)_ |
| `view_forum_category` | View a forum category. | `category_id` |
| `create_forum_category` | Create a forum category. | `category` |
| `update_forum_category` | Update a forum category. | `category_id`, `category` |
| `delete_forum_category` | Delete a forum category. | `category_id` |
| `list_forums` | List forums under a category. | `category_id` |
| `view_forum` | View a forum. | `forum_id` |
| `create_forum` | Create a forum. | `category_id`, `forum` |
| `update_forum` | Update a forum. | `forum_id`, `forum` |
| `delete_forum` | Delete a forum. | `forum_id` |
| `list_topics` | List topics under a forum. | `forum_id` |
| `view_topic` | View a topic. | `topic_id` |
| `create_topic` | Create a topic. | `forum_id`, `topic` |
| `update_topic` | Update a topic. | `topic_id`, `topic` |
| `delete_topic` | Delete a topic. | `topic_id` |
| `list_topic_comments` | List comments under a topic. | `topic_id` |
| `create_topic_comment` | Create a topic comment. | `topic_id`, `comment` |
| `update_topic_comment` | Update a topic comment. | `comment_id`, `comment` |
| `delete_topic_comment` | Delete a topic comment. | `comment_id` |

## Surveys & CSAT

| Tool | Description | Params |
| --- | --- | --- |
| `list_surveys` | List surveys. | _(none)_ |
| `view_survey` | View a survey. | `survey_id` |
| `list_satisfaction_ratings` | List all satisfaction ratings. | `page`, `per_page`, `created_since`, `user_id` |
| `create_satisfaction_rating` | Create a satisfaction rating for a ticket. | `ticket_id`, `rating` |

## Time Entries

| Tool | Description | Params |
| --- | --- | --- |
| `list_time_entries` | List all time entries across the account. | `page`, `per_page`, `agent_id`, `company_id`, `executed_after`, `executed_before`, `billable` |
| `create_time_entry` | Create a time entry on a ticket. | `ticket_id`, `time_entry` |
| `update_time_entry` | Update a time entry. | `time_entry_id`, `time_entry` |
| `delete_time_entry` | Delete a time entry. | `time_entry_id` |
| `toggle_time_entry_timer` | Start/stop a time entry timer. | `time_entry_id` |

## Products

| Tool | Description | Params |
| --- | --- | --- |
| `list_products` | List products. | `page`, `per_page` |
| `view_product` | View a product. | `product_id` |

## Business Hours

| Tool | Description | Params |
| --- | --- | --- |
| `list_business_hours` | List business hours configs. | _(none)_ |
| `view_business_hours` | View a business hours config. | `business_hours_id` |

## SLA Policies

| Tool | Description | Params |
| --- | --- | --- |
| `list_sla_policies` | List SLA policies. | _(none)_ |
| `view_sla_policy` | View an SLA policy. | `sla_policy_id` |

## Email Configs

| Tool | Description | Params |
| --- | --- | --- |
| `list_email_configs` | List email configs. | _(none)_ |
| `view_email_config` | View an email config. | `email_config_id` |

## Email Mailboxes

| Tool | Description | Params |
| --- | --- | --- |
| `list_email_mailboxes` | List email mailboxes. | _(none)_ |
| `view_email_mailbox` | View an email mailbox. | `mailbox_id` |
| `create_email_mailbox` | Create an email mailbox. | `mailbox` |
| `update_email_mailbox` | Update an email mailbox. | `mailbox_id`, `mailbox` |
| `delete_email_mailbox` | Delete an email mailbox. | `mailbox_id` |

## Automations

| Tool | Description | Params |
| --- | --- | --- |
| `list_automation_rules` | List automation rules of a type (1=ticket-creation, 3=time-triggered, 4=on-update). | `automation_type_id` |
| `view_automation_rule` | View an automation rule. | `automation_type_id`, `rule_id` |
| `create_automation_rule` | Create an automation rule. | `automation_type_id`, `rule` |
| `update_automation_rule` | Update an automation rule. | `automation_type_id`, `rule_id`, `rule` |
| `delete_automation_rule` | Delete an automation rule. | `automation_type_id`, `rule_id` |

## Scenario Automations

| Tool | Description | Params |
| --- | --- | --- |
| `list_scenario_automations` | List scenario automations. | _(none)_ |
| `view_scenario_automation` | View a scenario automation. | `scenario_id` |
| `execute_scenario` | Execute a scenario on a ticket. | `ticket_id`, `scenario_id` |

## Custom Objects

| Tool | Description | Params |
| --- | --- | --- |
| `list_custom_object_schemas` | List custom object schemas. | _(none)_ |
| `view_custom_object_schema` | View a custom object schema. | `schema_id` |
| `list_custom_object_records` | List records for a custom object schema. | `schema_id`, `page`, `per_page` |
| `view_custom_object_record` | View a custom object record. | `schema_id`, `record_id` |
| `create_custom_object_record` | Create a custom object record. | `schema_id`, `record` |
| `update_custom_object_record` | Update a custom object record. | `schema_id`, `record_id`, `record` |
| `delete_custom_object_record` | Delete a custom object record. | `schema_id`, `record_id` |

## FSM

| Tool | Description | Params |
| --- | --- | --- |
| `list_service_tasks` | List FSM service tasks. | `page`, `per_page` |
| `view_service_task` | View an FSM service task. | `task_id` |
| `create_service_task` | Create an FSM service task on a ticket. | `ticket_id`, `task` |
| `update_service_task` | Update an FSM service task. | `task_id`, `task` |
| `delete_service_task` | Delete an FSM service task. | `task_id` |
| `list_appointments` | List FSM appointments. | `page`, `per_page` |
| `view_appointment` | View an FSM appointment. | `appointment_id` |
| `list_business_calendars` | List FSM business calendars. | _(none)_ |

## Threads

| Tool | Description | Params |
| --- | --- | --- |
| `create_thread` | Create a collaboration thread. | `thread` |
| `view_thread` | View a thread. | `thread_id` |
| `update_thread` | Update a thread. | `thread_id`, `thread` |
| `delete_thread` | Delete a thread. | `thread_id` |
| `list_thread_messages` | List messages within a thread. | `thread_id` |
| `create_thread_message` | Post a new message to a thread. | `thread_id`, `message` |
| `view_thread_message` | View a thread message. | `message_id` |
| `update_thread_message` | Update a thread message. | `message_id`, `message` |
| `delete_thread_message` | Delete a thread message. | `message_id` |

## Outbound

| Tool | Description | Params |
| --- | --- | --- |
| `create_outbound_email` | Create an outbound email ticket. | `email` |

## Settings

| Tool | Description | Params |
| --- | --- | --- |
| `view_helpdesk_settings` | View helpdesk settings. | _(none)_ |

## Account

| Tool | Description | Params |
| --- | --- | --- |
| `view_account` | View account information. | _(none)_ |

## Jobs

| Tool | Description | Params |
| --- | --- | --- |
| `view_job_status` | View bulk job status. | `job_id` |

## Availability

| Tool | Description | Params |
| --- | --- | --- |
| `list_agent_availabilities` | List agent availabilities. | _(none)_ |
| `view_agent_availability` | View an agent's availability. | `agent_id` |

## Omnichannel

| Tool | Description | Params |
| --- | --- | --- |
| `list_omnichannel_activities` | List omnichannel activities. | `page`, `per_page` |

## Prompts

| Prompt | Args | Purpose |
| --- | --- | --- |
| `create_ticket` | `subject, description, source, priority, status, email` | Generates a natural-language brief for an LLM to drive `create_ticket`. |
| `create_reply` | `ticket_id, reply_message` | Generates a brief for an HTML reply to a ticket, with conversation-context guidance. |
