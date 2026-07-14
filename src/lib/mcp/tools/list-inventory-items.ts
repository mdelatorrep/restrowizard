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
  name: "list_inventory_items",
  title: "List inventory items",
  description:
    "List the signed-in user's inventory items with current stock. Optional low_stock_only flag returns only items at or below par level.",
  inputSchema: {
    low_stock_only: z.boolean().optional().describe("If true, only return items at or below par_level."),
    limit: z.number().int().min(1).max(200).optional().describe("Max items to return. Default 50."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ low_stock_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", ctx.getUserId())
      .limit(limit ?? 50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    let items = data ?? [];
    if (low_stock_only) {
      items = items.filter((it: any) => {
        const stock = Number(it.current_stock ?? it.stock ?? 0);
        const par = Number(it.par_level ?? it.min_stock ?? 0);
        return par > 0 && stock <= par;
      });
    }
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items },
    };
  },
});
