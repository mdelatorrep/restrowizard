# Fase 1.2 — Streaming en el Copilot

Migrar `CopilotChat` a streaming real con AI SDK (`useChat`) + AI Elements, manteniendo el botón flotante, el briefing dinámico y las quick actions actuales.

## Alcance

- Reescribir el edge function `copilot-chat` para responder con `toUIMessageStreamResponse` (stream SSE).
- Reemplazar la mecánica `supabase.functions.invoke` + estado manual por `useChat` con un `DefaultChatTransport` apuntando al endpoint del function.
- Renderizar mensajes con AI Elements (`Conversation`, `Message`, `MessageContent`, `MessageResponse`, `PromptInput`, `Shimmer`) en lugar de los `Card`+`ScrollArea` actuales.
- Conservar UX existente: FAB flotante, header morado, minimizar/cerrar, badge de alertas no leídas, briefing inicial dinámico (`getDynamicBriefing`) y quick actions (consultor vs operador).
- Botón **Stop** funcional siguiendo el contrato (`stop` desde `useChat`, `abortSignal: request.signal` en el server, ícono cuadrado desde `submitted`).
- No persistimos historial (sin BD/threads): conversación in-memory de la sesión, "Nueva conversación" para limpiar.

## Fuera de alcance

- Tool-calling agéntico, RAG, persistencia de threads (esos van en Fase 2).
- Cambios de auth, RLS, modelos por defecto (sigue `pickModel('fast')` = Gemini 3 Flash).
- Rediseño visual del FAB/burbujas más allá de adaptarlo a AI Elements + tokens del design system.

## Pasos

### 1. Backend — `supabase/functions/copilot-chat/index.ts`
- Reemplazar `callAIGateway` por AI SDK directo usando el helper de gateway:
  - Crear `supabase/functions/_shared/ai-sdk-gateway.ts` que exporte `createLovableAiGatewayProvider` (headers `Lovable-API-Key` + `X-Lovable-AIG-SDK: vercel-ai-sdk`) y un `pickSdkModel(tier)` espejo del existente.
  - En `copilot-chat/index.ts`: `streamText({ model: pickSdkModel('fast'), system: SYSTEM_PROMPT, messages: await convertToModelMessages(messages), abortSignal: req.signal })` y devolver `result.toUIMessageStreamResponse({ headers: corsHeaders })`.
- Mantener CORS headers actuales (incluyendo cabeceras `x-supabase-client-*`).
- Aceptar payload `{ messages: UIMessage[] }` (formato AI SDK). Si llega el formato viejo `{ message, history }`, devolver 400 con mensaje claro (el cliente nuevo no lo usa).
- 402/429 del gateway: dejar que el stream propague el error; AI SDK lo entrega como `onError`.

### 2. Instalación de AI Elements
- Ejecutar `bunx ai-elements@latest add conversation message prompt-input shimmer` para traer los primitives a `src/components/ai-elements/`.
- Verificar que `ai` y `@ai-sdk/react` queden instalados (los añade el CLI; si no, `bun add ai @ai-sdk/react`).

### 3. Frontend — refactor `src/components/CopilotChat.tsx`
- Conservar shell actual (FAB, estados `isOpen`/`isMinimized`, badge de alertas, header, briefing, quick actions).
- Reemplazar `messages`/`inputValue`/`isLoading`/`handleSendMessage` por:
  ```ts
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot-chat`,
      headers: () => ({ Authorization: `Bearer ${session?.access_token ?? VITE_SUPABASE_PUBLISHABLE_KEY}` }),
    }),
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  ```
- Sustituir la lista actual por:
  ```tsx
  <Conversation>
    <ConversationContent>
      {messages.map(m => (
        <Message key={m.id} from={m.role}>
          <MessageContent>
            {m.parts.map((p, i) => p.type === 'text'
              ? <MessageResponse key={i}>{p.text}</MessageResponse>
              : null)}
          </MessageContent>
        </Message>
      ))}
      {status === 'submitted' && <Shimmer>Pensando…</Shimmer>}
    </ConversationContent>
    <ConversationScrollButton />
  </Conversation>
  ```
- Composer con `PromptInput` + `PromptInputTextarea` + `PromptInputFooter` (`justify-end`) + `PromptInputSubmit` con `status`/`onStop={stop}`.
- Quick actions: al hacer click → `sendMessage({ text: action })`.
- Briefing inicial: insertar como primer mensaje assistant vía `setMessages` cuando se abre el chat por primera vez y `messages.length === 0`.
- Botón "Nueva conversación" (icono `RefreshCw` ya importado): `setMessages([])` + reinyectar briefing.
- Focus del textarea al abrir, después de enviar y tras completar stream (`status === 'ready'`).
- Mantener uso de tokens semánticos (`bg-primary`, `text-primary-foreground`, etc.). Mensajes assistant sin fondo; user bubble con `bg-primary text-primary-foreground`.

### 4. Patch `PromptInputSubmit` (vendored)
- En `src/components/ai-elements/prompt-input.tsx` cambiar el branch de `submitted` para mostrar `SquareIcon` (no spinner), como exige el contrato de abort/cancel.

### 5. Verificación
- `supabase.functions.deploy copilot-chat` (automático).
- Probar: abrir Copilot, enviar mensaje → ver tokens streaming; pulsar Stop durante stream → corta y deja el parcial visible; quick action → envía; "Nueva conversación" → limpia y reinyecta briefing; minimizar/cerrar/FAB intactos.
- Confirmar que no quedan referencias al payload viejo `{ message, history }` en el cliente.

## Detalles técnicos

- **Modelo**: `pickSdkModel('fast')` → `google/gemini-3-flash-preview` vía Lovable AI Gateway (consistente con Fase 1.1).
- **Sin persistencia**: respeta el contrato chat-agent (one conversation + no persistence). No se crean tablas ni rutas nuevas.
- **Auth**: el endpoint sigue público (`verify_jwt = false` por defecto). El header `Authorization` con la anon key basta para CORS/funciones.
- **Tipos**: usar `UIMessage` de `ai` para los mensajes; eliminar la interfaz local `Message`.
- **Timer types**: cualquier `setTimeout` que se añada usa `ReturnType<typeof setTimeout>` (regla del proyecto).

## Archivos afectados

- `supabase/functions/_shared/ai-sdk-gateway.ts` (nuevo)
- `supabase/functions/copilot-chat/index.ts` (reescrito a `streamText`)
- `src/components/ai-elements/*` (instalado por CLI)
- `src/components/ai-elements/prompt-input.tsx` (patch de ícono Stop)
- `src/components/CopilotChat.tsx` (refactor a `useChat` + AI Elements)
- `package.json` / lockfile (deps `ai`, `@ai-sdk/react` si faltan)
