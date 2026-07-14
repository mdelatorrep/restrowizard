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
  name: "list_reservations",
  title: "List reservations",
  description:
    "Return the signed-in user's table reservations. Set upcoming_only=true to return only reservations from today onward.",
  inputSchema: {
    upcoming_only: z.boolean().optional().describe("If true, only return reservations with date >= today."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return. Default 50."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ upcoming_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("table_reservations")
      .select("*")
      .eq("user_id", ctx.getUserId())
      .order("reservation_date", { ascending: true })
      .limit(limit ?? 50);
    if (upcoming_only) {
      const today = new Date().toISOString().slice(0, 10);
      q = q.gte("reservation_date", today);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { reservations: data ?? [] },
    };
  },
});
