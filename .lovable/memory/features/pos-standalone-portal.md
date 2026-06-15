---
name: POS Standalone Portal
description: Portal POS independiente en /{slug}/pos con auth dual (PIN + email/SSO), shell dark tablet-first y mapa de mesas en vivo
type: feature
---
URL pública: `/:slug/pos` (resuelve `restaurant_websites.slug` → `user_id`).

**Auth dual**:
- PIN 4–6 dígitos por staff (cifrado con `pgcrypto` en `staff_members.pin_hash`). Validado vía edge function `pos-pin-login` que devuelve un `token_hash` de magic link; el cliente hace `verifyOtp({type:'magiclink', token_hash})` para crear sesión.
- Email/password Supabase estándar como alternativa.
- SSO silencioso: si `getSession()` ya devuelve usuario que es owner o staff vinculado al restaurante, salta el login.
- Cada staff con PIN DEBE tener `linked_user_id` para que el login funcione (la auditoría exige `auth.uid()` real).

**Rol POS**: `staff_members.pos_role` (`cashier|waiter|supervisor|admin`). Supervisor autoriza acciones sensibles (Fase 3).

**Funciones SQL**:
- `set_staff_pin(staff_id, pin)` — SECURITY DEFINER, sólo el owner del restaurante (auth.uid()=user_id) puede cambiar PIN. Disponible a `authenticated`.
- `verify_staff_pin(restaurant_user_id, pin)` — SECURITY DEFINER, sólo `service_role`. Itera staff activos del restaurante y compara con `crypt()`.

**Realtime**: `restaurant_tables` y `restaurant_orders` están en `supabase_realtime` con `REPLICA IDENTITY FULL`. El hook `usePOSLiveMap` los sincroniza por `user_id=eq.{ownerUserId}`.

**TypeScript**: el chain `supabase.from(...).eq(...)` con tipos pesados puede romper con TS2589 "Type instantiation excessively deep". Solución: castear el cliente como `const sb = supabase as any` para hooks complejos.

**Componentes clave**:
- `src/pages/pos/POSLogin.tsx` y `POSMain.tsx` (layout 3 columnas cuando hay mesa seleccionada: mapa compacto · catálogo · comanda).
- `src/components/pos-standalone/{POSShell,TableMap,TableCard,TableSummaryPanel,MenuCatalog,OrderPanel,OrderItemRow,PaymentDialogV2,SplitBillDialog,MergeTablesDialog,TransferTableDialog}.tsx`.
- `src/components/talent/StaffPINManager.tsx` — embebido en el sheet de staff para asignar PIN y rol POS.

**Hooks POS** (Fase 2):
- `usePOSMenu(restaurantUserId)` — items + categorías de menús publicados con Realtime sobre `menu_items` para precio/disponibilidad en vivo.
- `usePOSOrder(restaurantUserId, tableId)` — comanda activa por mesa. `ensureOrder`, `addItem`, `updateQuantity`, `removeItem`, `sendToKitchen`, `markLineStatus`. Items en `restaurant_orders.items jsonb` con shape `{line_id, menu_item_id, name, unit_price, quantity, modifiers, notes, status, added_at}`. Realtime sobre `restaurant_orders` filtrado por `user_id`.
- División de cuenta (por personas o por ítems) crea nuevos `restaurant_orders` con `split_from_order_id`.
- Fusión usa `merged_into_order_id` y marca la mesa origen como `available`.
- Transferencia setea `transferred_from_table_id` + `transferred_by` (auth.uid).
- Pago vía `PaymentDialogV2` (split por medios + propina por medio en `tip_breakdown`) → `processPayment` de `usePOSPayment` + update a `restaurant_orders.payment_status='paid'` + libera mesa.



**Próximas fases** (ver `.lovable/plan.md`): F2 comanda+pagos, F3 autorizaciones+auditoría, F4 IA+canales+reservas, F5 cierre IA+talento+offline.
