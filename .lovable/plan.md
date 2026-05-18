
# Plan: Modernización IA de RestroWizard (Fases 1-3)

Default texto: **Mix automático** — `google/gemini-3-flash-preview` para tareas frecuentes, `openai/gpt-5.2` para análisis ejecutivos/planes de apertura, `google/gemini-2.5-flash-lite` para clasificación/resumen masivo.

---

## Fase 1 — Cimientos IA (impacto: -70% costo, +UX streaming)

**Objetivo**: dejar de pagar OpenAI directo, unificar telemetría, modernizar Copilot.

### 1.1 Migrar 13 edge functions a Lovable AI Gateway

Funciones a migrar (todas usan hoy `https://api.openai.com/v1/chat/completions` + `OPENAI_API_KEY`):

`ai-proactive-alerts`, `ai-restaurant-agent`, `brand-ai-generator`, `business-opening-assistant`, `copilot-chat`, `feedback-ai-analysis`, `job-ai-profile`, `maturity-ai-engine`, `recipe-ai-assistant`, `sales-ai-projections`, `social-ai-analysis`, `supplier-analyzer`, `support-ai-assistant`, `sustainability-ai-analysis`.

Patrón único en `supabase/functions/_shared/ai-gateway.ts`:
- Helper `createLovableAiGatewayProvider(LOVABLE_API_KEY)` con headers `Lovable-API-Key` + `X-Lovable-AIG-SDK`.
- Helper `pickModel(task: 'fast'|'reasoning'|'cheap')` que retorna el modelo correcto del mix.
- Manejo unificado de 429/402, retries con backoff exponencial.

Eliminar dependencia de `OPENAI_API_KEY` cuando la migración esté completa.

### 1.2 Streaming en Copilot (`AICopilot.tsx` + `copilot-chat`)

- Reescribir `copilot-chat/index.ts` con `streamText` del AI SDK (`npm:ai`) y `toUIMessageStreamResponse`.
- Cliente: instalar AI Elements (`conversation`, `message`, `prompt-input`, `tool`, `shimmer`) y `useChat` con `DefaultChatTransport`.
- Renderizar `message.parts`, indicador "Pensando…" durante `submitted`, botón stop con `abortSignal`.
- Mantener estilo Apple-like minimal (memoria: `#3E1064` / `#D4A5DB`).

### 1.3 Structured Output (AI SDK Output API)

Reemplazar el patrón "pide JSON → strip ```json → JSON.parse" en:
- `maturity-ai-engine`, `feedback-ai-analysis`, `sales-ai-projections`, `social-ai-analysis`, `supplier-analyzer`, `recipe-ai-assistant`.

Usar `Output.object({ schema: z.object({...}) })` con Zod. Elimina los crashes de parseo (memoria: "AI Parsing Robustness").

---

## Fase 2 — Agente accionable + RAG

**Objetivo**: el Copilot deja de "solo conversar" y empieza a ejecutar acciones; responde con contexto real del restaurante.

### 2.1 Tool-calling agéntico en Copilot

Definir tools del AI SDK en `copilot-chat`, con `stopWhen: stepCountIs(50)`:

| Tool | Acción | needsApproval |
|---|---|---|
| `get_kpis` | Lee Prime Cost, Food Cost, ventas semanales | no |
| `analyze_menu_engineering` | Devuelve Estrellas/Caballos/Perros/Puzzles | no |
| `find_recipe_by_name` | Búsqueda + costeo | no |
| `update_menu_item_price` | Ajusta precio de venta | **sí** |
| `create_inventory_purchase_order` | Genera OC a proveedor | **sí** |
| `trigger_proactive_alert_scan` | Lanza `ai-proactive-alerts` en background | no |
| `summarize_recent_feedback` | Llama a `feedback-ai-analysis` | no |
| `search_knowledge_base` | RAG (ver 2.2) | no |

UI: mostrar cada tool-call con `<Tool>` (status, input plegado, output formateado).

### 2.2 RAG con pgvector

Nuevas tablas:
- `knowledge_chunks(business_id, source_type, source_id, content, embedding vector(768), metadata jsonb)`
- `knowledge_sources(business_id, type, name, indexed_at)` — para tracking de qué se ha indexado.

Pipeline de indexación (edge function `knowledge-index`):
- Triggers cuando el usuario crea/edita: recetas, manuales SOP, políticas, descripción del negocio, reseñas largas, planes de apertura.
- Embeddings con `google/text-embedding-004` vía Gateway (768 dims).
- Chunking ~500 tokens con overlap 50.

Función RPC `match_knowledge(query_embedding, business_id, threshold, count)` con índice IVFFlat.

Tool `search_knowledge_base` del Copilot consume esa RPC y devuelve top-5 chunks como contexto.

UI nueva: página `/r/knowledge` (lista de fuentes indexadas, reindex manual, estado).

---

## Fase 3 — Multimodal + Realtime

**Objetivo**: capacidades visibles que diferencian la propuesta de valor frente a competencia.

### 3.1 OCR de facturas de proveedor (Vision)

- Nueva edge function `invoice-ocr` con Gemini 3 Flash multimodal.
- Input: imagen/PDF (subido a Supabase Storage bucket `invoices`).
- Output structured: `{ supplier, date, lines: [{ sku, name, qty, unit_price, total }], total, tax }`.
- UI: botón "Subir factura" en módulo Inventario → preview + edición → confirmar → crea movimientos de stock con coste real (alimenta FIFO).

### 3.2 Foto-costeo de plato

- En `MenuItemDialog`, botón "Analizar foto del plato".
- Edge function `dish-photo-analyze`: Gemini Vision identifica ingredientes visibles, sugiere receta + porciones, cruza con inventario para coste estimado.
- El usuario revisa y guarda.

### 3.3 Transcripción de voz (Whisper / Gemini audio)

- Componente `<VoiceCapture>` reutilizable (graba audio del browser).
- Edge function `audio-transcribe` → Gemini 3 Flash audio (o ElevenLabs Scribe v2 como alternativa).
- Casos de uso:
  - Quejas verbales de clientes → entra en `feedback-ai-analysis` como texto.
  - Notas de voz del manager en cierre de turno → estructura JSON con incidencias/ventas/observaciones.
  - Dictado de recetas en cocina.

### 3.4 Realtime AI Alerts (push proactivo)

- Habilitar `supabase_realtime` para `ai_alerts`.
- Hook `useRealtimeAlerts(businessId)` suscrito al canal; toast + badge en sidebar.
- `ai-proactive-alerts` ya existe → se programa con `pg_cron` cada 30 min: detecta Food Cost spike >5%, stock crítico, caída de tráfico web, picos de quejas → inserta en `ai_alerts` → realtime push.
- Integración con `send-push-notification` para PWA cuando el usuario está fuera de la app (memoria: `useNativeCapabilities`).

---

## Detalles técnicos

### Secrets necesarios
- `LOVABLE_API_KEY` (ya provisionado por Lovable Cloud).
- `OPENAI_API_KEY` se mantiene durante la migración y se borra al final de Fase 1.
- Opcional Fase 3.3: `ELEVENLABS_API_KEY` si se usa Scribe v2 en vez de Gemini audio.

### Migraciones DB
- `knowledge_sources`, `knowledge_chunks` (con extensión `vector`).
- `ai_alerts` (si no existe ya con la forma correcta) + `ALTER PUBLICATION supabase_realtime ADD TABLE ai_alerts`.
- `invoice_uploads(business_id, storage_path, status, parsed_json, created_inventory_movements)`.
- Storage bucket `invoices` privado con RLS por `business_id`.
- RLS en todo lo nuevo con la función `is_business_owner` existente.

### Refactor de componentes grandes (oportunista)
Durante Fase 1.2 se reescribe `src/components/AICopilot.tsx` con AI Elements — aprovechar para extraer:
- `CopilotMessage.tsx`, `CopilotToolCall.tsx`, `CopilotComposer.tsx`, `CopilotEmptyState.tsx`.

### Memoria a actualizar
- `mem://technical/ai-configuration-standards`: marcar AI SDK + Gateway como estándar único, prohibir `fetch` directo a OpenAI.
- Nueva `mem://features/ai-agent-tools`: catálogo de tools del Copilot y cuáles requieren `needsApproval`.
- Nueva `mem://features/rag-knowledge-base`: cómo indexar y consultar.
- Nueva `mem://technical/multimodal-pipelines`: convenciones OCR/Vision/Audio.

### Orden de ejecución sugerido
1. Fase 1.1 (migración Gateway) — base obligatoria.
2. Fase 1.3 (Structured Output) — junto con cada migración.
3. Fase 1.2 (Streaming Copilot) — primer impacto visible.
4. Fase 2.2 (RAG infra) antes que 2.1.
5. Fase 2.1 (Tool-calling).
6. Fase 3.1 (OCR facturas) → mayor ROI demostrable.
7. Fase 3.4 (Realtime alerts).
8. Fase 3.2 y 3.3 (foto-costeo y voz) — features "wow".

### Fuera de alcance
- Cambiar arquitectura de auth o RLS existente.
- Reemplazar `@react-pdf/renderer` u otros generadores ya estables.
- Reescribir módulos POS / Loyalty / Sustainability (solo se les conectan tools si aplica).
