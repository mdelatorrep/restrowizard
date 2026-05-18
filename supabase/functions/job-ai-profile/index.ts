import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAIGateway, safeParseJson } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { candidate_profile, job_description, job_title, skills_required } = await req.json();

    const prompt = `Eres un experto en reclutamiento gastronómico. Analiza la compatibilidad entre un candidato y una oferta de empleo.

OFERTA: ${job_title}
Descripción: ${job_description}
Habilidades requeridas: ${(skills_required || []).join(', ')}

CANDIDATO:
Nombre: ${candidate_profile.full_name}
Titular: ${candidate_profile.headline || 'No especificado'}
Bio: ${candidate_profile.bio || 'No especificado'}
Años de experiencia: ${candidate_profile.years_experience || 0}
Habilidades: ${(candidate_profile.skills || []).join(', ')}
Certificaciones: ${(candidate_profile.certifications || []).join(', ')}
Ciudad: ${candidate_profile.city || 'No especificado'}

Responde SOLO con un JSON válido (sin markdown):
{
  "match_score": <número entre 0 y 100>,
  "summary": "<3-4 oraciones sobre la compatibilidad del candidato con el puesto>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>"],
  "weaknesses": ["<debilidad 1>", "<debilidad 2>"]
}`;

    const aiResult = await callAIGateway({
      messages: [{ role: "user", content: prompt }],
      tier: "fast",
      temperature: 0.3,
      logPrefix: "[job-ai-profile]",
    });
    const fallback = { match_score: 50, summary: "", strengths: [], weaknesses: [] };
    const result = aiResult.ok
      ? (safeParseJson(aiResult.content) ?? { ...fallback, summary: aiResult.content })
      : fallback;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
