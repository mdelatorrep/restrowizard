

# Plan: Migrar a GPT-5.2 con Web Search + Guardrails Anti-Alucinación

## Resumen del Problema

El sistema actual genera información **irreal e inventada** porque:

1. Usa el modelo `gpt-5-nano` que es muy básico para tareas de análisis
2. La herramienta `web_search_preview` está declarada pero no configurada correctamente
3. No extrae ni utiliza las **sources** de la búsqueda web
4. No hay instrucciones anti-alucinación en el prompt
5. El formato de respuesta es extenso y difícil de leer

## Solución Propuesta

Migrar a **GPT-5.2** con la herramienta `web_search` configurada correctamente, agregar guardrails anti-alucinación, y reformatear las respuestas para un estilo ejecutivo.

---

## Cambios por Fase

### Fase 1: Actualizar Edge Function con GPT-5.2 + Web Search

**Archivo:** `supabase/functions/business-opening-assistant/index.ts`

**Cambios principales:**

1. Cambiar modelo de `gpt-5-nano` a `gpt-5.2`
2. Cambiar herramienta de `web_search_preview` a `web_search` (versión completa)
3. Agregar `user_location` con país, ciudad y región del proyecto
4. Agregar `include: ["web_search_call.action.sources"]` para obtener fuentes consultadas
5. Aumentar `reasoning.effort` de `low` a `medium` para mejor análisis
6. Agregar `search_context_size: "high"` para obtener más contexto de búsqueda

```typescript
// Configuración corregida
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-5.2',  // Modelo más avanzado
    tools: [{
      type: 'web_search',  // Herramienta completa (no preview)
      search_context_size: 'high',
      user_location: {
        type: 'approximate',
        country: getCountryCode(projectData.country),  // "MX", "CO", etc.
        city: projectData.city,
        region: projectData.neighborhood || projectData.city
      }
    }],
    reasoning: { effort: 'medium' },  // Mejor razonamiento
    include: ['web_search_call.action.sources'],  // Obtener fuentes
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
  }),
});
```

### Fase 2: Agregar Guardrails Anti-Alucinación

**Archivo:** `supabase/functions/business-opening-assistant/index.ts`

Agregar instrucciones explícitas al sistema para evitar información inventada:

```typescript
const ANTI_HALLUCINATION_RULES = `
═══════════════════════════════════════════════════════════════
⚠️ REGLAS DE HONESTIDAD - OBLIGATORIAS
═══════════════════════════════════════════════════════════════
1. NUNCA inventes nombres de negocios, proveedores o direcciones.
   - Si no encuentras información específica, usa categorías genéricas:
     ✅ "Centrales de abasto de la zona"
     ✅ "Distribuidores mayoristas locales"
     ❌ "Distribuidora García S.A. en Calle Reforma 123"

2. Para precios y costos:
   - Si tienes datos reales: usa el valor específico
   - Si no: usa rangos amplios: "Entre $X y $Y aproximadamente"
   - NUNCA inventes un número exacto sin fuente

3. Cuando no tengas información específica, indica:
   - "Consultar directamente con [dependencia/proveedor]"
   - "Verificar en sitio oficial"
   
4. Prioriza CALIDAD sobre CANTIDAD:
   - Mejor 3 recomendaciones sólidas que 10 inventadas
═══════════════════════════════════════════════════════════════
`;
```

### Fase 3: Reformatear Prompts para Estilo Ejecutivo

**Archivo:** `supabase/functions/business-opening-assistant/index.ts`

Cambiar todos los prompts de fase para solicitar formato ejecutivo:

```typescript
const EXECUTIVE_FORMAT_INSTRUCTION = `
FORMATO DE RESPUESTA (OBLIGATORIO):
- Máximo 1 página de contenido
- Usar bullets cortos (max 15 palabras cada uno)
- Incluir solo números clave y métricas importantes
- Terminar cada sección con "Próximo paso:" concreto
- NO incluir explicaciones extensas ni párrafos largos
- Usar tablas solo para comparativas numéricas (max 5 filas)

ESTRUCTURA REQUERIDA:
## Resumen Ejecutivo (3-4 bullets máximo)
## Puntos Clave (5-7 bullets con datos concretos)
## Costos Estimados (tabla si aplica)
## Próximos Pasos (2-3 acciones inmediatas)
`;
```

### Fase 4: Extraer Sources de la Respuesta

**Archivo:** `supabase/functions/business-opening-assistant/index.ts`

Mejorar la extracción de sources de la respuesta de OpenAI:

```typescript
// Extraer sources de web_search_call
let sources: string[] = [];

if (data.output) {
  for (const item of data.output) {
    // Extraer sources del web_search_call
    if (item.type === 'web_search_call' && item.action?.sources) {
      sources = item.action.sources
        .filter((s: any) => s.url && !s.url.includes('oai-'))  // Excluir feeds internos
        .map((s: any) => s.url);
    }
    
    // También extraer de annotations (citas inline)
    if (item.type === 'message' && item.content) {
      for (const content of item.content) {
        if (content.annotations) {
          const annotationUrls = content.annotations
            .filter((a: any) => a.type === 'url_citation')
            .map((a: any) => a.url);
          sources = [...sources, ...annotationUrls];
        }
      }
    }
  }
}

// Eliminar duplicados
sources = [...new Set(sources)];
```

### Fase 5: Agregar Helper para Código de País

**Archivo:** `supabase/functions/business-opening-assistant/index.ts`

```typescript
// Mapeo de países a códigos ISO para user_location
const COUNTRY_CODES: Record<string, string> = {
  'México': 'MX',
  'Mexico': 'MX',
  'Colombia': 'CO',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Perú': 'PE',
  'Peru': 'PE',
  'Ecuador': 'EC',
  'España': 'ES',
  'Spain': 'ES',
  'Estados Unidos': 'US',
  'United States': 'US',
};

const getCountryCode = (country: string): string => {
  return COUNTRY_CODES[country] || 'MX';  // Default México
};
```

### Fase 6: Mejorar Prompts de Cada Fase (Ejecutivo + Anti-Alucinación)

Ejemplo para `legal_requirements`:

```typescript
legal_requirements: (data) => `
${ANTI_HALLUCINATION_RULES}
${EXECUTIVE_FORMAT_INSTRUCTION}
${getLocationContext(data)}

🎯 TAREA: Requisitos legales para ${data.businessType} en ${data.city}, ${data.country}.

## Resumen Ejecutivo
- 3-4 bullets con los requisitos más importantes

## Permisos Principales
Lista los 5-7 permisos OBLIGATORIOS con:
- Nombre del permiso
- Costo aproximado (rango si no tienes dato exacto)
- Tiempo estimado de trámite
- Dependencia responsable

## Costos Estimados
| Concepto | Rango de Costo |
|----------|----------------|
| ... | $X - $Y |

## Próximos Pasos
1. Acción inmediata específica
2. Segunda acción
3. Tercera acción

IMPORTANTE: Si no encuentras el costo o tiempo exacto para un trámite en ${data.city}, indica "Verificar en oficina local" en lugar de inventar un número.
`
```

---

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| `supabase/functions/business-opening-assistant/index.ts` | Reescritura mayor: modelo, herramienta web_search, guardrails, prompts ejecutivos |

---

## Detalles Tecnicos

### Comparacion de Configuracion Actual vs Nueva

| Aspecto | Actual | Nuevo |
|---------|--------|-------|
| Modelo | `gpt-5-nano` | `gpt-5.2` |
| Herramienta | `web_search_preview` | `web_search` (completa) |
| Razonamiento | `effort: "low"` | `effort: "medium"` |
| User location | No configurado | Ciudad/País del proyecto |
| Sources | No extraídas | Extraídas de annotations |
| Guardrails | No existen | Reglas anti-alucinación |
| Formato | Extenso/markdown largo | Ejecutivo/bullets |

### Flujo de Datos Corregido

```text
Usuario inicia análisis de fase
       │
       v
Edge Function recibe request
       │
       v
Construye prompt con:
├── ANTI_HALLUCINATION_RULES
├── EXECUTIVE_FORMAT_INSTRUCTION
├── getLocationContext(data)
└── Prompt específico de la fase
       │
       v
Llama a OpenAI v1/responses
├── model: "gpt-5.2"
├── tools: [{ type: "web_search", user_location, search_context_size }]
├── reasoning: { effort: "medium" }
└── include: ["web_search_call.action.sources"]
       │
       v
Extrae respuesta y sources
├── output_text del mensaje
└── sources de web_search_call.action.sources + annotations
       │
       v
Guarda en DB con sources[]
       │
       v
Frontend muestra análisis ejecutivo
(sources guardadas pero ocultas en UI según preferencia)
```

### Costo Estimado por Analisis

| Modelo | Input (1M tokens) | Output (1M tokens) | Costo por fase (~2K tokens) |
|--------|-------------------|--------------------|-----------------------------|
| gpt-5-nano | ~$0.10 | ~$0.40 | ~$0.001 |
| gpt-5.2 | $1.75 | $14.00 | ~$0.03 |

El costo aumenta ~30x pero la calidad y confiabilidad mejoran significativamente.

---

## Resultado Esperado

1. Los análisis contendrán **información real** basada en búsqueda web actual
2. El modelo **no inventará** nombres, direcciones ni precios específicos sin fuente
3. El formato será **ejecutivo**: 1 página, bullets, números clave
4. Cuando no haya datos específicos, se indicará claramente en lugar de inventar
5. Las **sources** se guardarán en DB (disponibles para futuras referencias aunque no se muestren)
6. La búsqueda se optimizará para la **ciudad y país específicos** del proyecto

