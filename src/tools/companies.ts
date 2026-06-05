import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { errorPayload, fd, parseLinkHeader } from "../freshdesk.js";
import {
  CompanyCreate,
  CompanyFieldCreate,
  CompanyFieldUpdate,
  CompanyUpdate,
} from "../schemas/index.js";
import { text, tool, validate } from "../util.js";

const pageArgs = {
  page: z.number().int().min(1).optional().default(1),
  per_page: z.number().int().min(1).max(100).optional().default(30),
};

export function registerCompanyTools(server: McpServer) {
  tool(
    server,
    "list_companies",
    "List companies with pagination.",
    pageArgs,
    async ({ page, per_page }) => {
      const res = await fd.get("/companies", { page, per_page });
      if (!res.ok) return text(errorPayload("Failed to list companies", res));
      const pagination = parseLinkHeader(res.headers.get("link"));
      return text({
        companies: res.data,
        pagination: {
          current_page: page,
          next_page: pagination.next,
          prev_page: pagination.prev,
          per_page,
        },
      });
    },
  );

  tool(
    server,
    "view_company",
    "View a company by ID.",
    { company_id: z.number().int() },
    async ({ company_id }) => {
      const res = await fd.get(`/companies/${company_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to fetch company", res));
    },
  );

  tool(
    server,
    "search_companies",
    "Autocomplete companies by name.",
    { query: z.string() },
    async ({ query }) => {
      const res = await fd.get("/companies/autocomplete", { name: query });
      return text(res.ok ? res.data : errorPayload("Failed to search companies", res));
    },
  );

  tool(
    server,
    "find_company_by_name",
    "Find a company by name.",
    { name: z.string() },
    async ({ name }) => {
      const res = await fd.get("/companies/autocomplete", { name });
      return text(res.ok ? res.data : errorPayload("Failed to find company", res));
    },
  );

  tool(
    server,
    "create_company",
    "Create a company.",
    { company: z.record(z.any()) },
    async ({ company }) => {
      const v = validate(CompanyCreate, company);
      if (!v.ok) return v.reply;
      const res = await fd.post("/companies", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create company", res));
    },
  );

  tool(
    server,
    "update_company",
    "Update a company.",
    { company_id: z.number().int(), company: z.record(z.any()) },
    async ({ company_id, company }) => {
      const v = validate(CompanyUpdate, company);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/companies/${company_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update company", res));
    },
  );

  tool(
    server,
    "delete_company",
    "Delete a company.",
    { company_id: z.number().int() },
    async ({ company_id }) => {
      const res = await fd.delete(`/companies/${company_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete company", res));
    },
  );

  tool(
    server,
    "list_company_contacts",
    "List contacts attached to a company.",
    { company_id: z.number().int(), ...pageArgs },
    async ({ company_id, page, per_page }) => {
      const res = await fd.get(`/companies/${company_id}/contacts`, { page, per_page });
      return text(res.ok ? res.data : errorPayload("Failed to list company contacts", res));
    },
  );

  // Company fields
  tool(server, "list_company_fields", "List company field definitions.", {}, async () => {
    const res = await fd.get("/company_fields");
    return text(res.ok ? res.data : errorPayload("Failed to list company fields", res));
  });

  tool(
    server,
    "view_company_field",
    "View a company field.",
    { company_field_id: z.number().int() },
    async ({ company_field_id }) => {
      const res = await fd.get(`/company_fields/${company_field_id}`);
      return text(res.ok ? res.data : errorPayload("Failed to view company field", res));
    },
  );

  tool(
    server,
    "create_company_field",
    "Create a company field.",
    { company_field: z.record(z.any()) },
    async ({ company_field }) => {
      const v = validate(CompanyFieldCreate, company_field);
      if (!v.ok) return v.reply;
      const res = await fd.post("/company_fields", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create company field", res));
    },
  );

  tool(
    server,
    "update_company_field",
    "Update a company field.",
    { company_field_id: z.number().int(), company_field: z.record(z.any()) },
    async ({ company_field_id, company_field }) => {
      const v = validate(CompanyFieldUpdate, company_field);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/company_fields/${company_field_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update company field", res));
    },
  );

  tool(
    server,
    "delete_company_field",
    "Delete a company field.",
    { company_field_id: z.number().int() },
    async ({ company_field_id }) => {
      const res = await fd.delete(`/company_fields/${company_field_id}`);
      if (res.status === 204) return text({ success: true });
      return text(errorPayload("Failed to delete company field", res));
    },
  );
}
