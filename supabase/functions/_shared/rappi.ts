// Shared Rappi client + crypto helpers for edge functions
import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-rappi-signature",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const SANDBOX_BASE = "https://services.dev.rappi.com";
const PROD_BASE = "https://services.rappi.com";

export const getRappiBaseUrl = (environment?: string) =>
  Deno.env.get("RAPPI_API_BASE_URL") ??
  (environment === "production" ? PROD_BASE : SANDBOX_BASE);

export const supabaseService = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

export const supabaseAsUser = (authHeader: string) =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

// --- Crypto (AES-GCM, key derived from RAPPI_ENCRYPTION_KEY via SHA-256) ---
// Falls back to SUPABASE_SERVICE_ROLE_KEY (always present & secret) so no manual setup is needed.
async function getKey(): Promise<CryptoKey> {
  const passphrase =
    Deno.env.get("RAPPI_ENCRYPTION_KEY") ??
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    "dev-key-change-me";
  const raw = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode("rappi:" + passphrase),
  );
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encrypt(plain: string): Promise<string> {
  if (!plain) return "";
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv, 0);
  out.set(ct, iv.length);
  return btoa(String.fromCharCode(...out));
}

export async function decrypt(b64: string): Promise<string> {
  if (!b64) return "";
  const key = await getKey();
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = bin.slice(0, 12);
  const ct = bin.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plain);
}

// --- Auth: get / refresh OAuth access token for an integration ---
export async function getAccessToken(integrationId: string): Promise<string> {
  const sb = supabaseService();
  const { data: integ, error } = await sb
    .from("aggregator_integrations")
    .select("id, environment, client_id, client_secret_encrypted, access_token_encrypted, token_expires_at")
    .eq("id", integrationId)
    .maybeSingle();
  if (error || !integ) throw new Error("Integración no encontrada");

  const stillValid = integ.token_expires_at &&
    new Date(integ.token_expires_at).getTime() > Date.now() + 60_000;
  if (stillValid && integ.access_token_encrypted) {
    return decrypt(integ.access_token_encrypted);
  }

  if (!integ.client_id || !integ.client_secret_encrypted) {
    throw new Error("Credenciales Rappi no configuradas");
  }

  const clientSecret = await decrypt(integ.client_secret_encrypted);
  const base = getRappiBaseUrl(integ.environment);
  const res = await fetch(`${base}/api/v2/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: integ.client_id,
      client_secret: clientSecret,
      audience: "api.rappi.com",
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) {
    throw new Error(`OAuth Rappi falló [${res.status}]: ${JSON.stringify(body)}`);
  }
  const token = body.access_token as string;
  const expiresIn = (body.expires_in as number | undefined) ?? 3600;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await sb
    .from("aggregator_integrations")
    .update({
      access_token_encrypted: await encrypt(token),
      token_expires_at: expiresAt,
    })
    .eq("id", integrationId);

  return token;
}

export async function rappiFetch(
  integrationId: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const sb = supabaseService();
  const { data: integ } = await sb
    .from("aggregator_integrations")
    .select("environment")
    .eq("id", integrationId)
    .maybeSingle();
  const token = await getAccessToken(integrationId);
  const base = getRappiBaseUrl(integ?.environment);
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

// --- Auth helper for invoke functions: verify user, return user_id ---
export async function requireUser(req: Request): Promise<{ userId: string; authHeader: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const sb = supabaseAsUser(authHeader);
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized");
  return { userId: data.claims.sub as string, authHeader };
}

export async function requireIntegrationOwnership(integrationId: string, userId: string) {
  const sb = supabaseService();
  const { data } = await sb
    .from("aggregator_integrations")
    .select("id, user_id")
    .eq("id", integrationId)
    .maybeSingle();
  if (!data || data.user_id !== userId) throw new Error("Forbidden");
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export const errorResponse = (err: unknown, status = 500) =>
  jsonResponse({ error: err instanceof Error ? err.message : String(err) }, status);
