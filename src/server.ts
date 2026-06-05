import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrompts } from "./prompts.js";
import {
  registerAccountTools,
  registerBusinessHoursTools,
  registerEmailConfigTools,
  registerMailboxTools,
  registerProductTools,
  registerRoleTools,
  registerSettingsTools,
  registerSkillTools,
  registerSlaTools,
  registerThreadTools,
  registerTimeEntryTools,
} from "./tools/admin_misc.js";
import { registerAgentTools, registerGroupTools } from "./tools/agents.js";
import { registerCannedTools } from "./tools/canned.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerContactTools } from "./tools/contacts.js";
import {
  registerAutomationTools,
  registerAvailabilityTools,
  registerCustomObjectTools,
  registerDiscussionTools,
  registerFsmTools,
  registerJobTools,
  registerOmnichannelTools,
  registerOutboundTools,
  registerScenarioTools,
  registerSurveyTools,
} from "./tools/extras.js";
import { registerSolutionTools } from "./tools/solutions.js";
import { registerTicketTools } from "./tools/tickets.js";

export function buildServer(): McpServer {
  const server = new McpServer(
    { name: "freshdesk-mcp", version: "1.0.0" },
    { capabilities: { tools: {}, prompts: {} } },
  );

  registerTicketTools(server);
  registerContactTools(server);
  registerAgentTools(server);
  registerGroupTools(server);
  registerCannedTools(server);
  registerSolutionTools(server);
  registerCompanyTools(server);

  registerSkillTools(server);
  registerRoleTools(server);
  registerProductTools(server);
  registerBusinessHoursTools(server);
  registerSlaTools(server);
  registerEmailConfigTools(server);
  registerMailboxTools(server);
  registerSettingsTools(server);
  registerAccountTools(server);
  registerThreadTools(server);
  registerTimeEntryTools(server);

  registerDiscussionTools(server);
  registerSurveyTools(server);
  registerAutomationTools(server);
  registerScenarioTools(server);
  registerCustomObjectTools(server);
  registerFsmTools(server);
  registerOutboundTools(server);
  registerJobTools(server);
  registerAvailabilityTools(server);
  registerOmnichannelTools(server);

  registerPrompts(server);

  return server;
}
