# API Reference

> Auto-generated from the running MCP server. Each tool is registered in `src/server.ts`, validated by a strict Zod schema in `src/schemas/index.ts` (see [SCHEMAS.md](SCHEMAS.md)), and links to the canonical Freshdesk Developer Portal endpoint.

## Conventions

- **Params** column lists the top-level input keys. Resource payloads (`ticket`, `contact`, `company`, ...) are bags with their own strict shape — see [SCHEMAS.md](SCHEMAS.md).
- **Docs** column links to the upstream Freshdesk API reference for that endpoint.
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
- [Discussions (Forums/Topics/Comments)](#discussions-forums-topics-comments-)
- [Surveys & Satisfaction](#surveys-satisfaction)
- [Time Entries](#time-entries)
- [Products](#products)
- [Business Hours](#business-hours)
- [SLA Policies](#sla-policies)
- [Email Configs](#email-configs)
- [Email Mailboxes](#email-mailboxes)
- [Automations](#automations)
- [Scenario Automations](#scenario-automations)
- [Custom Objects](#custom-objects)
- [Field Service Management](#field-service-management)
- [Threads (Collaboration)](#threads-collaboration-)
- [Outbound](#outbound)
- [Settings](#settings)
- [Account](#account)
- [Jobs](#jobs)
- [Availability](#availability)
- [Omnichannel](#omnichannel)
- [Prompts](#prompts)

## Tickets

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `get_ticket_fields` | Get all ticket field definitions. | _(none)_ | [↗](https://developers.freshdesk.com/api/#ticket_fields) |
| `get_tickets` | List tickets with pagination + filter support. | `page`, `per_page`, `filter`, `requester_id`, `email`, `company_id`, `updated_since`, `order_by`, `order_type`, `include` | [↗](https://developers.freshdesk.com/api/#list_all_tickets) |
| `create_ticket` | Create a ticket. Validates against Freshdesk ticket schema; unknown keys are passed through. | `ticket` | [↗](https://developers.freshdesk.com/api/#create_ticket) |
| `update_ticket` | Update a ticket (partial update; only provided fields are sent). | `ticket_id`, `ticket` | [↗](https://developers.freshdesk.com/api/#update_ticket) |
| `delete_ticket` | Soft-delete a ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#delete_a_ticket) |
| `get_ticket` | Get a single ticket. | `ticket_id`, `include` | [↗](https://developers.freshdesk.com/api/#view_a_ticket) |
| `search_tickets` | Search tickets using Freshdesk filter syntax. | `query` | [↗](https://developers.freshdesk.com/api/#filter_tickets) |
| `bulk_create_tickets` | Bulk create up to 100 tickets. | `tickets` | [↗](https://developers.freshdesk.com/api/#bulk_create_ticket) |
| `bulk_update_tickets` | Bulk update tickets (ids + properties or reply). | `bulk_action` | [↗](https://developers.freshdesk.com/api/#bulk_update_tickets) |
| `bulk_delete_tickets` | Bulk delete tickets. | `bulk_action` | [↗](https://developers.freshdesk.com/api/#bulk_delete_tickets) |
| `restore_ticket` | Restore a deleted ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#restore_a_ticket) |
| `list_archived_tickets` | List archived tickets. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_archived_tickets) |
| `view_archived_ticket` | View an archived ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#view_an_archived_ticket) |
| `delete_archived_ticket` | Permanently delete an archived ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#delete_an_archived_ticket) |
| `list_archived_ticket_conversations` | List conversations on an archived ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#list_archived_ticket_conversations) |
| `merge_tickets` | Merge tickets into a primary. | `merge` | [↗](https://developers.freshdesk.com/api/#merge_tickets) |
| `forward_ticket` | Forward a ticket. | `ticket_id`, `forward` | [↗](https://developers.freshdesk.com/api/#forward_a_ticket) |
| `list_ticket_time_entries` | List time entries on a ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#list_all_time_entries) |
| `list_ticket_satisfaction_ratings` | List satisfaction ratings on a ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#view_satisfaction_ratings) |
| `list_ticket_enums` | Return numeric ranges for ticket source/status/priority. | _(none)_ | [↗](https://developers.freshdesk.com/api/#tickets) |

## Conversations

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `get_ticket_conversation` | Get conversations for a ticket. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#list_all_conversations_of_a_ticket) |
| `create_ticket_reply` | Reply to a ticket. | `ticket_id`, `reply` | [↗](https://developers.freshdesk.com/api/#create_a_reply) |
| `create_ticket_note` | Add a note to a ticket. | `ticket_id`, `note` | [↗](https://developers.freshdesk.com/api/#create_a_note) |
| `update_ticket_conversation` | Update a conversation (reply or note). | `conversation_id`, `conversation` | [↗](https://developers.freshdesk.com/api/#update_a_conversation) |
| `delete_conversation` | Delete a conversation (reply/note). | `conversation_id` | [↗](https://developers.freshdesk.com/api/#delete_a_conversation) |
| `reply_to_forward` | Reply to a forwarded conversation. | `ticket_id`, `reply` | [↗](https://developers.freshdesk.com/api/#reply_to_a_forward) |

## Ticket Summary

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `view_ticket_summary` | Get a ticket's summary. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#view_ticket_summary) |
| `update_ticket_summary` | Update a ticket's summary. | `ticket_id`, `body` | [↗](https://developers.freshdesk.com/api/#update_ticket_summary) |
| `delete_ticket_summary` | Delete a ticket's summary. | `ticket_id` | [↗](https://developers.freshdesk.com/api/#delete_ticket_summary) |

## Ticket Fields

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `create_ticket_field` | Create a ticket field (admin). | `ticket_field` | [↗](https://developers.freshdesk.com/api/#create_ticket_field) |
| `view_ticket_field` | View a ticket field. | `ticket_field_id` | [↗](https://developers.freshdesk.com/api/#view_a_ticket_field) |
| `update_ticket_field` | Update a ticket field (admin). | `ticket_field_id`, `ticket_field` | [↗](https://developers.freshdesk.com/api/#update_a_ticket_field) |
| `delete_ticket_field` | Delete a ticket field. | `ticket_field_id` | [↗](https://developers.freshdesk.com/api/#delete_a_ticket_field) |
| `get_field_properties` | Get the definition of a single ticket field by name. | `field_name` | [↗](https://developers.freshdesk.com/api/#ticket_fields) |

## Contacts

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_contacts` | List contacts. | `page`, `per_page`, `email`, `mobile`, `phone`, `company_id`, `state`, `updated_since` | [↗](https://developers.freshdesk.com/api/#list_all_contacts) |
| `get_contact` | Get a contact by ID. | `contact_id` | [↗](https://developers.freshdesk.com/api/#view_a_contact) |
| `search_contacts` | Autocomplete search contacts. | `query` | [↗](https://developers.freshdesk.com/api/#list_all_contacts) |
| `create_contact` | Create a contact. | `contact` | [↗](https://developers.freshdesk.com/api/#create_contact) |
| `update_contact` | Update a contact. | `contact_id`, `contact` | [↗](https://developers.freshdesk.com/api/#update_contact) |
| `delete_contact` | Soft-delete a contact. | `contact_id` | [↗](https://developers.freshdesk.com/api/#soft_delete_contact) |
| `hard_delete_contact` | Permanently delete a contact. | `contact_id`, `force` | [↗](https://developers.freshdesk.com/api/#permanently_delete_contact) |
| `restore_contact` | Restore a soft-deleted contact. | `contact_id` | [↗](https://developers.freshdesk.com/api/#restore_a_contact) |
| `merge_contacts` | Merge secondary contacts into a primary. | `merge` | [↗](https://developers.freshdesk.com/api/#merge_contacts) |
| `make_agent` | Convert a contact into an agent. | `contact_id`, `agent` | [↗](https://developers.freshdesk.com/api/#make_agent) |
| `send_contact_invite` | Send a portal invite to a contact. | `contact_id` | [↗](https://developers.freshdesk.com/api/#send_invitation) |
| `list_deleted_contacts` | List soft-deleted contacts. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_contacts) |

## Contact Fields

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_contact_fields` | List contact field definitions. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_contact_fields) |
| `view_contact_field` | View a contact field. | `contact_field_id` | [↗](https://developers.freshdesk.com/api/#view_a_contact_field) |
| `create_contact_field` | Create a contact field. | `contact_field` | [↗](https://developers.freshdesk.com/api/#create_contact_field) |
| `update_contact_field` | Update a contact field. | `contact_field_id`, `contact_field` | [↗](https://developers.freshdesk.com/api/#update_contact_field) |
| `delete_contact_field` | Delete a contact field. | `contact_field_id` | [↗](https://developers.freshdesk.com/api/#delete_contact_field) |

## Companies

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_companies` | List companies with pagination. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_companies) |
| `view_company` | View a company by ID. | `company_id` | [↗](https://developers.freshdesk.com/api/#view_a_company) |
| `search_companies` | Autocomplete companies by name. | `query` | [↗](https://developers.freshdesk.com/api/#search_autocomplete_companies) |
| `find_company_by_name` | Find a company by name. | `name` | [↗](https://developers.freshdesk.com/api/#filter_companies) |
| `create_company` | Create a company. | `company` | [↗](https://developers.freshdesk.com/api/#create_company) |
| `update_company` | Update a company. | `company_id`, `company` | [↗](https://developers.freshdesk.com/api/#update_company) |
| `delete_company` | Delete a company. | `company_id` | [↗](https://developers.freshdesk.com/api/#delete_a_company) |
| `list_company_contacts` | List contacts attached to a company. | `company_id`, `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_contacts_of_a_company) |

## Company Fields

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_company_fields` | List company field definitions. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_company_fields) |
| `view_company_field` | View a company field. | `company_field_id` | [↗](https://developers.freshdesk.com/api/#view_a_company_field) |
| `create_company_field` | Create a company field. | `company_field` | [↗](https://developers.freshdesk.com/api/#create_company_field) |
| `update_company_field` | Update a company field. | `company_field_id`, `company_field` | [↗](https://developers.freshdesk.com/api/#update_company_field) |
| `delete_company_field` | Delete a company field. | `company_field_id` | [↗](https://developers.freshdesk.com/api/#delete_company_field) |

## Agents

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `get_agents` | List agents. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_agents) |
| `view_agent` | View an agent. | `agent_id` | [↗](https://developers.freshdesk.com/api/#view_agent) |
| `create_agent` | Create an agent. | `agent` | [↗](https://developers.freshdesk.com/api/#create_agent) |
| `update_agent` | Update an agent. | `agent_id`, `agent` | [↗](https://developers.freshdesk.com/api/#update_agent) |
| `search_agents` | Autocomplete agents. | `query` | [↗](https://developers.freshdesk.com/api/#search_agents) |
| `view_current_agent` | View the currently authenticated agent. | _(none)_ | [↗](https://developers.freshdesk.com/api/#currently_authenticated_agent) |
| `delete_agent` | Deactivate / delete an agent. | `agent_id` | [↗](https://developers.freshdesk.com/api/#delete_agent) |
| `bulk_create_agents` | Bulk create agents. | `agents` | [↗](https://developers.freshdesk.com/api/#bulk_create_agents) |

## Groups

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_groups` | List groups. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_groups) |
| `create_group` | Create a group. | `group` | [↗](https://developers.freshdesk.com/api/#create_group) |
| `view_group` | View a group. | `group_id` | [↗](https://developers.freshdesk.com/api/#view_a_group) |
| `update_group` | Update a group. | `group_id`, `group` | [↗](https://developers.freshdesk.com/api/#update_a_group) |
| `delete_group` | Delete a group. | `group_id` | [↗](https://developers.freshdesk.com/api/#delete_a_group) |

## Admin Groups

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_admin_groups` | List admin groups. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_groups_sla) |
| `view_admin_group` | View an admin group. | `group_id` | [↗](https://developers.freshdesk.com/api/#view_a_group_sla) |
| `create_admin_group` | Create an admin group. | `group` | [↗](https://developers.freshdesk.com/api/#create_group_sla) |
| `update_admin_group` | Update an admin group. | `group_id`, `group` | [↗](https://developers.freshdesk.com/api/#update_a_group_sla) |
| `delete_admin_group` | Delete an admin group. | `group_id` | [↗](https://developers.freshdesk.com/api/#delete_a_group_sla) |

## Skills

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_skills` | List skills. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_skills) |
| `view_skill` | View a skill. | `skill_id` | [↗](https://developers.freshdesk.com/api/#view_a_skill) |
| `create_skill` | Create a skill. | `skill` | [↗](https://developers.freshdesk.com/api/#create_a_skill) |
| `update_skill` | Update a skill. | `skill_id`, `skill` | [↗](https://developers.freshdesk.com/api/#update_a_skill) |
| `delete_skill` | Delete a skill. | `skill_id` | [↗](https://developers.freshdesk.com/api/#delete_a_skill) |

## Roles

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_roles` | List roles. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_roles) |
| `view_role` | View a role. | `role_id` | [↗](https://developers.freshdesk.com/api/#view_a_role) |

## Canned Responses

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_canned_responses` | List canned responses in a folder. | `folder_id` | [↗](https://developers.freshdesk.com/api/#list_all_canned_responses_in_a_folder) |
| `list_canned_response_folders` | List canned response folders. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_canned_response_folders) |
| `view_canned_response` | View a canned response. | `canned_response_id` | [↗](https://developers.freshdesk.com/api/#view_a_canned_response) |
| `create_canned_response` | Create a canned response. | `canned_response` | [↗](https://developers.freshdesk.com/api/#create_canned_response) |
| `update_canned_response` | Update a canned response. | `canned_response_id`, `canned_response` | [↗](https://developers.freshdesk.com/api/#update_canned_response) |
| `delete_canned_response` | Delete a canned response. | `canned_response_id` | [↗](https://developers.freshdesk.com/api/#delete_a_canned_response) |
| `create_canned_response_folder` | Create a canned response folder. | `folder` | [↗](https://developers.freshdesk.com/api/#create_canned_response_folder) |
| `update_canned_response_folder` | Update a canned response folder. | `folder_id`, `folder` | [↗](https://developers.freshdesk.com/api/#update_canned_response_folder) |
| `delete_canned_response_folder` | Delete a canned response folder. | `folder_id` | [↗](https://developers.freshdesk.com/api/#delete_a_canned_response_folder) |

## Solutions

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_solution_articles` | List solution articles in a folder. | `folder_id` | [↗](https://developers.freshdesk.com/api/#list_all_solution_articles_in_a_folder) |
| `list_solution_folders` | List solution folders in a category. | `category_id` | [↗](https://developers.freshdesk.com/api/#list_all_solution_folders_in_a_category) |
| `list_solution_categories` | List solution categories. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_solution_categories) |
| `view_solution_category` | View a solution category. | `category_id` | [↗](https://developers.freshdesk.com/api/#view_a_solution_category) |
| `create_solution_category` | Create a solution category. | `category` | [↗](https://developers.freshdesk.com/api/#create_a_solution_category) |
| `update_solution_category` | Update a solution category. | `category_id`, `category` | [↗](https://developers.freshdesk.com/api/#update_a_solution_category) |
| `delete_solution_category` | Delete a solution category. | `category_id` | [↗](https://developers.freshdesk.com/api/#delete_a_solution_category) |
| `create_solution_category_folder` | Create a folder under a solution category. | `category_id`, `folder` | [↗](https://developers.freshdesk.com/api/#create_a_solution_folder) |
| `view_solution_category_folder` | View a solution folder. | `folder_id` | [↗](https://developers.freshdesk.com/api/#view_a_solution_folder) |
| `update_solution_category_folder` | Update a solution folder. | `folder_id`, `folder` | [↗](https://developers.freshdesk.com/api/#update_a_solution_folder) |
| `delete_solution_category_folder` | Delete a solution folder. | `folder_id` | [↗](https://developers.freshdesk.com/api/#delete_a_solution_folder) |
| `create_solution_article` | Create a solution article. | `folder_id`, `article` | [↗](https://developers.freshdesk.com/api/#create_a_solution_article) |
| `view_solution_article` | View a solution article. | `article_id` | [↗](https://developers.freshdesk.com/api/#view_a_solution_article) |
| `update_solution_article` | Update a solution article. | `article_id`, `article` | [↗](https://developers.freshdesk.com/api/#update_a_solution_article) |
| `delete_solution_article` | Delete a solution article. | `article_id` | [↗](https://developers.freshdesk.com/api/#delete_a_solution_article) |
| `search_solution_articles` | Search solution articles. | `term` | [↗](https://developers.freshdesk.com/api/#search_solution_articles) |

## Discussions (Forums/Topics/Comments)

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_forum_categories` | List forum categories. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_forum_categories) |
| `view_forum_category` | View a forum category. | `category_id` | [↗](https://developers.freshdesk.com/api/#view_a_category) |
| `create_forum_category` | Create a forum category. | `category` | [↗](https://developers.freshdesk.com/api/#create_a_category) |
| `update_forum_category` | Update a forum category. | `category_id`, `category` | [↗](https://developers.freshdesk.com/api/#update_a_category) |
| `delete_forum_category` | Delete a forum category. | `category_id` | [↗](https://developers.freshdesk.com/api/#delete_a_category) |
| `list_forums` | List forums under a category. | `category_id` | [↗](https://developers.freshdesk.com/api/#list_all_forums_in_a_category) |
| `view_forum` | View a forum. | `forum_id` | [↗](https://developers.freshdesk.com/api/#view_a_forum) |
| `create_forum` | Create a forum. | `category_id`, `forum` | [↗](https://developers.freshdesk.com/api/#create_a_forum) |
| `update_forum` | Update a forum. | `forum_id`, `forum` | [↗](https://developers.freshdesk.com/api/#update_a_forum) |
| `delete_forum` | Delete a forum. | `forum_id` | [↗](https://developers.freshdesk.com/api/#delete_a_forum) |
| `list_topics` | List topics under a forum. | `forum_id` | [↗](https://developers.freshdesk.com/api/#list_all_topics_in_a_forum) |
| `view_topic` | View a topic. | `topic_id` | [↗](https://developers.freshdesk.com/api/#view_a_topic) |
| `create_topic` | Create a topic. | `forum_id`, `topic` | [↗](https://developers.freshdesk.com/api/#create_a_topic) |
| `update_topic` | Update a topic. | `topic_id`, `topic` | [↗](https://developers.freshdesk.com/api/#update_a_topic) |
| `delete_topic` | Delete a topic. | `topic_id` | [↗](https://developers.freshdesk.com/api/#delete_a_topic) |
| `list_topic_comments` | List comments under a topic. | `topic_id` | [↗](https://developers.freshdesk.com/api/#list_all_comments_in_a_topic) |
| `create_topic_comment` | Create a topic comment. | `topic_id`, `comment` | [↗](https://developers.freshdesk.com/api/#create_a_comment) |
| `update_topic_comment` | Update a topic comment. | `comment_id`, `comment` | [↗](https://developers.freshdesk.com/api/#update_a_comment) |
| `delete_topic_comment` | Delete a topic comment. | `comment_id` | [↗](https://developers.freshdesk.com/api/#delete_a_comment) |

## Surveys & Satisfaction

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_surveys` | List surveys. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_surveys) |
| `view_survey` | View a survey. | `survey_id` | [↗](https://developers.freshdesk.com/api/#view_a_survey) |
| `list_satisfaction_ratings` | List all satisfaction ratings. | `page`, `per_page`, `created_since`, `user_id` | [↗](https://developers.freshdesk.com/api/#view_satisfaction_ratings) |
| `create_satisfaction_rating` | Create a satisfaction rating for a ticket. | `ticket_id`, `rating` | [↗](https://developers.freshdesk.com/api/#create_a_satisfaction_rating) |

## Time Entries

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_time_entries` | List all time entries across the account. | `page`, `per_page`, `agent_id`, `company_id`, `executed_after`, `executed_before`, `billable` | [↗](https://developers.freshdesk.com/api/#list_all_time_entries) |
| `create_time_entry` | Create a time entry on a ticket. | `ticket_id`, `time_entry` | [↗](https://developers.freshdesk.com/api/#create_a_time_entry) |
| `update_time_entry` | Update a time entry. | `time_entry_id`, `time_entry` | [↗](https://developers.freshdesk.com/api/#update_a_time_entry) |
| `delete_time_entry` | Delete a time entry. | `time_entry_id` | [↗](https://developers.freshdesk.com/api/#delete_a_time_entry) |
| `toggle_time_entry_timer` | Start/stop a time entry timer. | `time_entry_id` | [↗](https://developers.freshdesk.com/api/#toggle_timer_on_a_time_entry) |

## Products

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_products` | List products. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_products) |
| `view_product` | View a product. | `product_id` | [↗](https://developers.freshdesk.com/api/#view_a_product) |

## Business Hours

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_business_hours` | List business hours configs. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_business_hours) |
| `view_business_hours` | View a business hours config. | `business_hours_id` | [↗](https://developers.freshdesk.com/api/#view_a_business_hour) |

## SLA Policies

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_sla_policies` | List SLA policies. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_sla_policies) |
| `view_sla_policy` | View an SLA policy. | `sla_policy_id` | [↗](https://developers.freshdesk.com/api/#view_a_sla_policy) |

## Email Configs

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_email_configs` | List email configs. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_email_configs) |
| `view_email_config` | View an email config. | `email_config_id` | [↗](https://developers.freshdesk.com/api/#view_an_email_config) |

## Email Mailboxes

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_email_mailboxes` | List email mailboxes. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_mailboxes) |
| `view_email_mailbox` | View an email mailbox. | `mailbox_id` | [↗](https://developers.freshdesk.com/api/#view_a_mailbox) |
| `create_email_mailbox` | Create an email mailbox. | `mailbox` | [↗](https://developers.freshdesk.com/api/#create_a_mailbox) |
| `update_email_mailbox` | Update an email mailbox. | `mailbox_id`, `mailbox` | [↗](https://developers.freshdesk.com/api/#update_a_mailbox) |
| `delete_email_mailbox` | Delete an email mailbox. | `mailbox_id` | [↗](https://developers.freshdesk.com/api/#delete_a_mailbox) |

## Automations

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_automation_rules` | List automation rules of a type (1=ticket-creation, 3=time-triggered, 4=on-update). | `automation_type_id` | [↗](https://developers.freshdesk.com/api/#list_all_automation_rules_of_a_specific_type) |
| `view_automation_rule` | View an automation rule. | `automation_type_id`, `rule_id` | [↗](https://developers.freshdesk.com/api/#view_an_automation_rule) |
| `create_automation_rule` | Create an automation rule. | `automation_type_id`, `rule` | [↗](https://developers.freshdesk.com/api/#create_an_automation_rule) |
| `update_automation_rule` | Update an automation rule. | `automation_type_id`, `rule_id`, `rule` | [↗](https://developers.freshdesk.com/api/#update_an_automation_rule) |
| `delete_automation_rule` | Delete an automation rule. | `automation_type_id`, `rule_id` | [↗](https://developers.freshdesk.com/api/#delete_an_automation_rule) |

## Scenario Automations

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_scenario_automations` | List scenario automations. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_scenario_automations) |
| `view_scenario_automation` | View a scenario automation. | `scenario_id` | [↗](https://developers.freshdesk.com/api/#view_a_scenario_automation) |
| `execute_scenario` | Execute a scenario on a ticket. | `ticket_id`, `scenario_id` | [↗](https://developers.freshdesk.com/api/#execute_scenario_automation) |

## Custom Objects

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_custom_object_schemas` | List custom object schemas. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_schemas) |
| `view_custom_object_schema` | View a custom object schema. | `schema_id` | [↗](https://developers.freshdesk.com/api/#view_a_schema) |
| `list_custom_object_records` | List records for a custom object schema. | `schema_id`, `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_records) |
| `view_custom_object_record` | View a custom object record. | `schema_id`, `record_id` | [↗](https://developers.freshdesk.com/api/#view_a_record) |
| `create_custom_object_record` | Create a custom object record. | `schema_id`, `record` | [↗](https://developers.freshdesk.com/api/#create_a_record) |
| `update_custom_object_record` | Update a custom object record. | `schema_id`, `record_id`, `record` | [↗](https://developers.freshdesk.com/api/#update_a_record) |
| `delete_custom_object_record` | Delete a custom object record. | `schema_id`, `record_id` | [↗](https://developers.freshdesk.com/api/#delete_a_record) |

## Field Service Management

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_service_tasks` | List FSM service tasks. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_service_tasks) |
| `view_service_task` | View an FSM service task. | `task_id` | [↗](https://developers.freshdesk.com/api/#view_a_service_task) |
| `create_service_task` | Create an FSM service task on a ticket. | `ticket_id`, `task` | [↗](https://developers.freshdesk.com/api/#create_a_service_task) |
| `update_service_task` | Update an FSM service task. | `task_id`, `task` | [↗](https://developers.freshdesk.com/api/#update_a_service_task) |
| `delete_service_task` | Delete an FSM service task. | `task_id` | [↗](https://developers.freshdesk.com/api/#delete_a_service_task) |
| `list_appointments` | List FSM appointments. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_appointments) |
| `view_appointment` | View an FSM appointment. | `appointment_id` | [↗](https://developers.freshdesk.com/api/#view_an_appointment) |
| `list_business_calendars` | List FSM business calendars. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_business_calendars) |

## Threads (Collaboration)

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `create_thread` | Create a collaboration thread. | `thread` | [↗](https://developers.freshdesk.com/api/#create_a_thread) |
| `view_thread` | View a thread. | `thread_id` | [↗](https://developers.freshdesk.com/api/#view_a_thread) |
| `update_thread` | Update a thread. | `thread_id`, `thread` | [↗](https://developers.freshdesk.com/api/#update_a_thread) |
| `delete_thread` | Delete a thread. | `thread_id` | [↗](https://developers.freshdesk.com/api/#delete_a_thread) |
| `list_thread_messages` | List messages within a thread. | `thread_id` | [↗](https://developers.freshdesk.com/api/#list_all_messages_within_a_thread) |
| `create_thread_message` | Post a new message to a thread. | `thread_id`, `message` | [↗](https://developers.freshdesk.com/api/#create_a_message) |
| `view_thread_message` | View a thread message. | `message_id` | [↗](https://developers.freshdesk.com/api/#view_a_message) |
| `update_thread_message` | Update a thread message. | `message_id`, `message` | [↗](https://developers.freshdesk.com/api/#update_a_message) |
| `delete_thread_message` | Delete a thread message. | `message_id` | [↗](https://developers.freshdesk.com/api/#delete_a_message) |

## Outbound

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `create_outbound_email` | Create an outbound email ticket. | `email` | [↗](https://developers.freshdesk.com/api/#create_an_outbound_email) |

## Settings

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `view_helpdesk_settings` | View helpdesk settings. | _(none)_ | [↗](https://developers.freshdesk.com/api/#view_helpdesk_settings) |

## Account

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `view_account` | View account information. | _(none)_ | [↗](https://developers.freshdesk.com/api/#view_account_information) |

## Jobs

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `view_job_status` | View bulk job status. | `job_id` | [↗](https://developers.freshdesk.com/api/#view_job_status) |

## Availability

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_agent_availabilities` | List agent availabilities. | _(none)_ | [↗](https://developers.freshdesk.com/api/#list_all_availabilities) |
| `view_agent_availability` | View an agent's availability. | `agent_id` | [↗](https://developers.freshdesk.com/api/#view_an_availability) |

## Omnichannel

| Tool | Description | Params | Docs |
| --- | --- | --- | --- |
| `list_omnichannel_activities` | List omnichannel activities. | `page`, `per_page` | [↗](https://developers.freshdesk.com/api/#list_all_omnichannel_activities) |

## Prompts

| Prompt | Args | Purpose |
| --- | --- | --- |
| `create_ticket` | `subject, description, source, priority, status, email` | Generates a natural-language brief for an LLM to drive `create_ticket`. |
| `create_reply` | `ticket_id, reply_message` | Generates a brief for an HTML reply to a ticket, with conversation-context guidance. |
