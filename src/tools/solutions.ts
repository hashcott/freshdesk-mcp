import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fd, errorPayload } from "../freshdesk.js";
import { text, validate, tool } from "../util.js";
import {
  SolutionCategoryCreate,
  SolutionCategoryUpdate,
  SolutionFolderCreate,
  SolutionFolderUpdate,
  SolutionArticleCreate,
  SolutionArticleUpdate,
} from "../schemas/index.js";

export function registerSolutionTools(server: McpServer) {
  tool(server, "list_solution_articles", "List solution articles in a folder.", { folder_id: z.number().int() }, async ({ folder_id }) => {
    const res = await fd.get(`/solutions/folders/${folder_id}/articles`);
    return text(res.ok ? res.data : errorPayload("Failed to list articles", res));
  });

  tool(server, "list_solution_folders", "List solution folders in a category.", { category_id: z.number().int() }, async ({ category_id }) => {
    const res = await fd.get(`/solutions/categories/${category_id}/folders`);
    return text(res.ok ? res.data : errorPayload("Failed to list folders", res));
  });

  tool(server, "list_solution_categories", "List solution categories.", {}, async () => {
    const res = await fd.get("/solutions/categories");
    return text(res.ok ? res.data : errorPayload("Failed to list categories", res));
  });

  tool(server, "view_solution_category", "View a solution category.", { category_id: z.number().int() }, async ({ category_id }) => {
    const res = await fd.get(`/solutions/categories/${category_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view category", res));
  });

  tool(server, 
    "create_solution_category",
    "Create a solution category.",
    { category: z.record(z.any()) },
    async ({ category }) => {
      const v = validate(SolutionCategoryCreate, category);
      if (!v.ok) return v.reply;
      const res = await fd.post("/solutions/categories", v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create category", res));
    },
  );

  tool(server, 
    "update_solution_category",
    "Update a solution category.",
    { category_id: z.number().int(), category: z.record(z.any()) },
    async ({ category_id, category }) => {
      const v = validate(SolutionCategoryUpdate, category);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/solutions/categories/${category_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update category", res));
    },
  );

  tool(server, "delete_solution_category", "Delete a solution category.", { category_id: z.number().int() }, async ({ category_id }) => {
    const res = await fd.delete(`/solutions/categories/${category_id}`);
    if (res.status === 204) return text({ success: true });
    return text(errorPayload("Failed to delete category", res));
  });

  tool(server, 
    "create_solution_category_folder",
    "Create a folder under a solution category.",
    { category_id: z.number().int(), folder: z.record(z.any()) },
    async ({ category_id, folder }) => {
      const v = validate(SolutionFolderCreate, folder);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/solutions/categories/${category_id}/folders`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create folder", res));
    },
  );

  tool(server, "view_solution_category_folder", "View a solution folder.", { folder_id: z.number().int() }, async ({ folder_id }) => {
    const res = await fd.get(`/solutions/folders/${folder_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view folder", res));
  });

  tool(server, 
    "update_solution_category_folder",
    "Update a solution folder.",
    { folder_id: z.number().int(), folder: z.record(z.any()) },
    async ({ folder_id, folder }) => {
      const v = validate(SolutionFolderUpdate, folder);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/solutions/folders/${folder_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update folder", res));
    },
  );

  tool(server, "delete_solution_category_folder", "Delete a solution folder.", { folder_id: z.number().int() }, async ({ folder_id }) => {
    const res = await fd.delete(`/solutions/folders/${folder_id}`);
    if (res.status === 204) return text({ success: true });
    return text(errorPayload("Failed to delete folder", res));
  });

  tool(server, 
    "create_solution_article",
    "Create a solution article.",
    { folder_id: z.number().int(), article: z.record(z.any()) },
    async ({ folder_id, article }) => {
      const v = validate(SolutionArticleCreate, article);
      if (!v.ok) return v.reply;
      const res = await fd.post(`/solutions/folders/${folder_id}/articles`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to create article", res));
    },
  );

  tool(server, "view_solution_article", "View a solution article.", { article_id: z.number().int() }, async ({ article_id }) => {
    const res = await fd.get(`/solutions/articles/${article_id}`);
    return text(res.ok ? res.data : errorPayload("Failed to view article", res));
  });

  tool(server, 
    "update_solution_article",
    "Update a solution article.",
    { article_id: z.number().int(), article: z.record(z.any()) },
    async ({ article_id, article }) => {
      const v = validate(SolutionArticleUpdate, article);
      if (!v.ok) return v.reply;
      const res = await fd.put(`/solutions/articles/${article_id}`, v.data);
      return text(res.ok ? res.data : errorPayload("Failed to update article", res));
    },
  );

  tool(server, "delete_solution_article", "Delete a solution article.", { article_id: z.number().int() }, async ({ article_id }) => {
    const res = await fd.delete(`/solutions/articles/${article_id}`);
    if (res.status === 204) return text({ success: true });
    return text(errorPayload("Failed to delete article", res));
  });

  tool(server, "search_solution_articles", "Search solution articles.", { term: z.string() }, async ({ term }) => {
    const res = await fd.get("/search/solutions", { term });
    return text(res.ok ? res.data : errorPayload("Failed to search articles", res));
  });
}
