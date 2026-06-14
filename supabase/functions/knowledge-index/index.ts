import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { embedTexts, chunkText } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Missing Authorization" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const requesterId = userData.user.id;

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "index";
    const targetUserId: string = body?.target_user_id || requesterId;

    // Authorize: requester must equal target, OR be an active consultant of target,
    // OR be an active team member of a business owned by target.
    if (targetUserId !== requesterId) {
      const [{ data: consultantLink }, { data: teamLink }] = await Promise.all([
        adminClient
          .from("consultant_clients")
          .select("id")
          .eq("consultant_id", requesterId)
          .eq("client_user_id", targetUserId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
        adminClient
          .from("restaurant_team_members")
          .select("id, restaurant_businesses!inner(owner_id)")
          .eq("user_id", requesterId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
      ]);
      const teamOwner = (teamLink as any)?.restaurant_businesses?.owner_id;
      if (!consultantLink && teamOwner !== targetUserId) {
        return json({ error: "Forbidden: cannot operate on this account" }, 403);
      }
    }

    const userId = targetUserId;

    if (action === "index") {
      const { title, source_type, source_ref, content, metadata, source_id } = body;
      if (!title || !content) {
        return json({ error: "title and content are required" }, 400);
      }

      // Upsert source
      let sourceId = source_id as string | undefined;
      if (sourceId) {
        const { error } = await adminClient
          .from("knowledge_sources")
          .update({
            title,
            source_type: source_type ?? "manual",
            source_ref,
            content,
            metadata: metadata ?? {},
            indexed_at: new Date().toISOString(),
          })
          .eq("id", sourceId)
          .eq("user_id", userId);
        if (error) return json({ error: error.message }, 500);
        // wipe existing chunks
        await adminClient.from("knowledge_chunks").delete().eq("source_id", sourceId);
      } else {
        const { data: inserted, error } = await adminClient
          .from("knowledge_sources")
          .insert({
            user_id: userId,
            title,
            source_type: source_type ?? "manual",
            source_ref,
            content,
            metadata: metadata ?? {},
            indexed_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (error || !inserted) return json({ error: error?.message ?? "insert failed" }, 500);
        sourceId = inserted.id;
      }

      const chunks = chunkText(content);
      if (chunks.length === 0) {
        return json({ ok: true, source_id: sourceId, chunks: 0 });
      }

      // Embed in batches of 32
      const all: number[][] = [];
      for (let i = 0; i < chunks.length; i += 32) {
        const batch = chunks.slice(i, i + 32);
        const embs = await embedTexts(batch);
        all.push(...embs);
      }

      const rows = chunks.map((content, idx) => ({
        source_id: sourceId!,
        user_id: userId,
        chunk_index: idx,
        content,
        embedding: all[idx] as unknown as string, // postgres-js serializes array → vector
      }));

      const { error: insErr } = await adminClient
        .from("knowledge_chunks")
        .insert(rows);
      if (insErr) return json({ error: insErr.message }, 500);

      return json({ ok: true, source_id: sourceId, chunks: chunks.length });
    }

    if (action === "delete") {
      const { source_id } = body;
      if (!source_id) return json({ error: "source_id required" }, 400);
      const { error } = await adminClient
        .from("knowledge_sources")
        .delete()
        .eq("id", source_id)
        .eq("user_id", userId);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("[knowledge-index]", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
