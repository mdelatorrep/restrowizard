import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const levelLabels: Record<string, string> = {
  entry: "principiante", mid: "intermedio", senior: "avanzado",
};

const categoryLabels: Record<string, string> = {
  kitchen: "cocina", service: "servicio", management: "gestión de restaurantes",
  bartender: "bartending y coctelería", marketing: "marketing gastronómico", finance: "finanzas para restaurantes",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, course_title, category, level, target_role, lesson_title, course_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";
    const tools: any[] = [];
    let tool_choice: any = undefined;

    if (mode === "course") {
      systemPrompt = `Eres un experto en formación profesional para la industria gastronómica. Generas estructuras de cursos completas, prácticas y motivadoras en español. Tu objetivo es crear contenido que ayude a los profesionales a crecer en sus carreras y enamorarse de la industria.`;
      userPrompt = `Genera la estructura completa para un curso de ${categoryLabels[category] || category} nivel ${levelLabels[level] || level}${target_role ? ` para el rol de ${target_role}` : ''}.\n\nTítulo: "${course_title}"\n\nGenera una estructura con descripción, lo que aprenderán, requisitos previos, y 5-8 lecciones con títulos, descripciones, tipo de contenido y duración.`;
      tools.push({
        type: "function",
        function: {
          name: "generate_course_structure",
          description: "Genera la estructura completa de un curso gastronómico",
          parameters: {
            type: "object",
            properties: {
              course: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  short_description: { type: "string" },
                  what_you_learn: { type: "array", items: { type: "string" } },
                  requirements: { type: "array", items: { type: "string" } },
                  tags: { type: "array", items: { type: "string" } },
                  estimated_hours: { type: "number" },
                },
                required: ["title", "description", "short_description", "what_you_learn", "requirements", "tags", "estimated_hours"],
              },
              lessons: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    content_type: { type: "string", enum: ["text", "video", "quiz"] },
                    duration_minutes: { type: "number" },
                  },
                  required: ["title", "description", "content_type", "duration_minutes"],
                },
              },
            },
            required: ["course", "lessons"],
          },
        },
      });
      tool_choice = { type: "function", function: { name: "generate_course_structure" } };
    } else if (mode === "lesson") {
      systemPrompt = `Eres un instructor experto en la industria gastronómica. Generas contenido educativo práctico, motivador y en español. Incluyes ejemplos reales, tips profesionales y mejores prácticas de la industria.`;
      userPrompt = `Genera el contenido completo para la lección "${lesson_title}" de nivel ${levelLabels[level] || level}.${course_context ? `\n\nContexto del curso: ${course_context}` : ''}\n\nGenera contenido en markdown con teoría, ejemplos prácticos, tips profesionales, y un quiz de 5 preguntas de opción múltiple.`;
      tools.push({
        type: "function",
        function: {
          name: "generate_lesson_content",
          description: "Genera contenido completo de una lección con texto y quiz",
          parameters: {
            type: "object",
            properties: {
              content: { type: "string", description: "Contenido de la lección en markdown" },
              quiz: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correct: { type: "number" },
                        explanation: { type: "string" },
                      },
                      required: ["question", "options", "correct", "explanation"],
                    },
                  },
                },
                required: ["questions"],
              },
            },
            required: ["content", "quiz"],
          },
        },
      });
      tool_choice = { type: "function", function: { name: "generate_lesson_content" } };
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta más tarde" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos agotados" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Error del servicio de IA");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No se recibió respuesta estructurada");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("learn-ai-content error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
