// Shared input validation helpers for Edge Functions
// Usage:
//   import { z, validateBody, jsonResponse, errorResponse, corsHeaders } from "../_shared/validate.ts";
//
//   const Schema = z.object({ name: z.string().min(1).max(255) });
//   const { data, error } = await validateBody(req, Schema);
//   if (error) return error;
//   return jsonResponse({ ok: true, data });

import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export { z, corsHeaders };

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return jsonResponse({ error: message, ...(details ? { details } : {}) }, status);
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

/**
 * Validate JSON body against a Zod schema.
 * Returns { data } on success or { error: Response } on failure (already CORS-safe).
 */
export async function validateBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T>; error?: undefined } | { data?: undefined; error: Response }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: errorResponse("Invalid JSON body", 400) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors),
    };
  }
  return { data: parsed.data };
}

/**
 * Validate query string params against a Zod schema.
 */
export function validateQuery<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): { data: z.infer<T>; error?: undefined } | { data?: undefined; error: Response } {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { obj[k] = v; });
  const parsed = schema.safeParse(obj);
  if (!parsed.success) {
    return {
      error: errorResponse("Invalid query params", 400, parsed.error.flatten().fieldErrors),
    };
  }
  return { data: parsed.data };
}

// Common reusable schemas
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().trim().email().max(255);
export const NonEmptyString = (max = 500) => z.string().trim().min(1).max(max);
