
## Auditoría funcional end-to-end — RestroWizard

Alcance: verificar que todos los módulos del ecosistema (RestroWizard, RestroJobs, RestroLearn, RestroServices, RestroGrowth + Admin) estén **completos, accesibles, conectados y sin roturas**. Entregable: listado priorizado de hallazgos a corregir en un próximo turno.

### Metodología

1. Mapeo: rutas en `App.tsx` ↔ entradas en `AppSidebar.tsx` ↔ páginas existentes ↔ hooks/edge functions ↔ tablas/RLS.
2. Recorrido en preview por cada área (autenticado) verificando: render, queries OK, botones funcionales, navegación cruzada.
3. Cruce con `useModulePrerequisites` y `useRestaurantLifecycle` para coherencia de habilitación.
4. Revisión de edge functions desplegadas vs. invocaciones desde el cliente.
5. Lint Supabase + estado Cloud.

### Hallazgos preliminares ya detectados (a confirmar en la auditoría)

**Bloqueadores / inconsistencias funcionales**
- `useModulePrerequisites.modules` no registra las claves `'knowledge'` ni `'invoices'`, mientras que el sidebar sí declara `moduleKey: 'knowledge'` y `moduleKey: 'invoices'`. Resultado: el gating cae al default `{ enabled: true }`, lo que **funciona por accidente** pero rompe la coherencia del modelo de prerequisitos (sin tooltip de bloqueo, sin orden lógico en el lifecycle).
- Servicio PWA: `SW registration failed` por redirect en `/sw.js`. Afecta background sync y push declarados como base de Phase 3.4.
- Rutas legadas con `<Navigate>` (`/r/operations`, `/r/social-listening`, `/r/sales-goals`, `/r/staff-schedule`, `/r/menu-engineering`, `/r/suppliers`): verificar que ningún link interno siga apuntando a la URL vieja sin `replace`, y que la pestaña `?tab=` destino exista.
- `/c` (consultor) no tiene `index` route — entrar a `/c` muestra blank. Falta `<Route index element={<Navigate to="dashboard" />} />`.

**Conexiones AI / Copilot**
- `CopilotChat` apunta a `copilot-chat` edge function: validar que las tools registradas (knowledge search, alerts, finanzas) respondan y que el streaming UI renderice `tool` parts (componente `ai-elements/tool.tsx` recién creado).
- `knowledge-index` y `invoice-ocr`: verificar handshake con frontend (errores comunes: bucket `invoices` privado pero subida sin path namespaced por `user_id`, embeddings sin `OPENAI`/Lovable AI gateway key, CORS).
- Alerts en tiempo real: revisar que `copilot_alerts` realmente esté en `supabase_realtime` publication y que `AppHeader` consuma el badge.

**Multi-business / RLS**
- Confirmar que `Invoices.tsx` y `Knowledge.tsx` filtran por `user_id` activo del `ActiveClientContext` y no por `auth.uid()` directo (rompería para consultores operando otra cuenta).
- Storage bucket `invoices`: políticas RLS con `auth.uid()::text = (storage.foldername(name))[1]`.

**Navegación / UX**
- Sidebar: orden y agrupación con los 2 nuevos items (Knowledge, Invoices) — definir grupo (Operaciones vs. IA) y prerequisito lógico (Invoices requiere Suppliers/Inventory; Knowledge no requiere nada).
- Mobile (411px): verificar overflow en nuevas páginas (Invoices con cámara, Knowledge con upload).
- Breadcrumbs / títulos coherentes con `ModulePageLayout`.

**Edge functions desplegadas vs. usadas**
- Cruzar `supabase/functions/*` con invocaciones en código. Detectar funciones huérfanas o invocaciones a funciones no desplegadas.

**Datos cruzados entre módulos**
- Invoices → debería poder enlazar a un `supplier_id` de `inventory_suppliers` y, al confirmar, generar movimiento de inventario o cuenta por pagar en Finanzas. Hoy probablemente está aislado.
- Knowledge → el copilot debería poder consultar embeddings vía tool; verificar tool wiring en `copilot-chat`.
- Alerts → al hacer click en alerta deep-link al módulo origen (Inventory, Finanzas, Feedback).

### Plan de auditoría a ejecutar

```text
1. Mapa estático
   - Diff rutas App.tsx vs sidebar items vs archivos existentes
   - Lista de moduleKeys declarados vs registrados en prerequisites

2. Recorrido preview (autenticado restaurant_owner)
   /r, /r/dashboard, /r/finances, /r/talent, /r/menus, /r/recipes,
   /r/inventory, /r/orders, /r/pos, /r/kitchen, /r/pos-reports,
   /r/reservations, /r/delivery, /r/loyalty, /r/feedback, /r/brand,
   /r/website, /r/sustainability, /r/support, /r/new-business,
   /r/first-90-days, /r/pre-opening, /r/ghost-kitchen,
   /r/chain-management, /r/my-development, /r/knowledge, /r/invoices,
   /r/integrations/rappi, /r/settings, /r/ecosystem-admin
   Para cada uno: render OK, sin error en consola, queries 200, CTAs vivos.

3. Recorrido consultor (/c/*) y admin (/admin/*)
4. Recorrido público (/p/:slug/*, /jobs, /learn, /services, /growth, /mi-fidelidad)
5. Copilot: enviar mensaje, validar streaming + tool call + alerts realtime
6. Invoices OCR: subir imagen test, verificar extracción
7. Knowledge: indexar doc, consultar desde copilot

8. Supabase linter + cloud_status
9. Edge function logs (errores recientes en cada función)
```

### Entregable final

Reporte estructurado:
- **P0 (bloqueadores)**: roturas reales (crash, 500, página blanca, RLS denegada).
- **P1 (coherencia)**: módulos sin gating correcto, links rotos, navegación inconsistente, integraciones AI sin tool wiring.
- **P2 (pulido)**: orden de sidebar, mobile overflow, copy, deep-links de alertas.

Para cada hallazgo: archivo + línea, causa raíz, fix propuesto en 1–3 líneas. Sin cambios de código en este turno — al aprobar el reporte, se ejecuta plan de fixes en orden P0 → P1 → P2.

### Notas técnicas

- No tocar `src/integrations/supabase/client.ts` ni `types.ts`.
- Cualquier cambio de RLS / publicación realtime / bucket: via `supabase--migration`.
- Mantener UI en español, tokens semánticos, mobile-first.
