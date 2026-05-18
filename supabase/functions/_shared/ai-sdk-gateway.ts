import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible";

export const createLovableAiGatewayProvider = (lovableApiKey: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });

export type ModelTier = "fast" | "reasoning" | "cheap";

const MODELS: Record<ModelTier, string> = {
  fast: "google/gemini-3-flash-preview",
  reasoning: "openai/gpt-5.2",
  cheap: "google/gemini-2.5-flash-lite",
};

export const pickSdkModel = (tier: ModelTier = "fast") => {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  const gateway = createLovableAiGatewayProvider(key);
  return gateway(MODELS[tier]);
};
