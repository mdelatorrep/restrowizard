import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_latest_diagnosis",
  title: "Get latest maturity diagnosis",
  description:
    "Return the most recent restaurant maturity diagnosis for the signed-in user, including scores and AI summary if present.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("maturity_diagnoses")
      .select("*")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const diagnosis = data?.[0] ?? null;
    return {
      content: [
        { type: "text", text: diagnosis ? JSON.stringify(diagnosis, null, 2) : "No diagnosis found." },
      ],
      structuredContent: { diagnosis },
    };
  },
});
