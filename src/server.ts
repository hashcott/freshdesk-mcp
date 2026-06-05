import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTicketTools } from "./tools/tickets.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerAgentTools, registerGroupTools } from "./tools/agents.js";
import { registerCannedTools } from "./tools/canned.js";
import { registerSolutionTools } from "./tools/solutions.js";
import { registerCompanyTools } from "./tools/companies.js";
import {
  registerSkillTools,
  registerRoleTools,
  registerProductTools,
  registerBusinessHoursTools,
  registerSlaTools,
  registerEmailConfigTools,
  registerMailboxTools,
  registerSettingsTools,
  registerAccountTools,
  registerThreadTools,
  registerTimeEntryTools,
} from "./tools/admin_misc.js";
import {
  registerDiscussionTools,
  registerSurveyTools,
  registerAutomationTools,
  registerScenarioTools,
  registerCustomObjectTools,
  registerFsmTools,
  registerOutboundTools,
  registerJobTools,
  registerAvailabilityTools,
  registerOmnichannelTools,
} from "./tools/extras.js";
import { registerPrompts } from "./prompts.js";

export function buildServer(): McpServer {
  const server = new McpServer(
    { name: "freshdesk-mcp", version: "1.0.0" },
    { capabilities: { tools: {}, prompts: {} } }
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
