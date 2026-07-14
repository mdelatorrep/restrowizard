import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_menu_items",
  title: "List menu items",
  description:
    "List the signed-in user's menu items (name, category, price, cost). Optionally filter by a text query on name.",
  inputSchema: {
    query: z.string().trim().optional().describe("Optional text to filter items by name (ILIKE)."),
    limit: z.number().int().min(1).max(200).optional().describe("Max items to return. Default 50."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("menu_items")
      .select("id, name, category, price, cost, is_available")
      .eq("user_id", ctx.getUserId())
      .order("name")
      .limit(limit ?? 50);
    if (query) q = q.ilike("name", `%${query}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { items: data ?? [] },
    };
  },
});
