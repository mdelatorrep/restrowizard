# Estándares de código

## TypeScript y React

- Componentes funcionales con hooks. Un componente por archivo cuando pasa de ~150 líneas.
- Acceso a datos en `src/hooks` o `src/services`, con React Query (`src/lib/queryKeys.ts` para las llaves). Los componentes nuevos no importan el cliente de Supabase.
- Nada de `any` nuevo: usar los tipos generados (`src/integrations/supabase/types.ts`) o tipos propios. La línea base de `any` solo puede bajar (B-21).
- Textos visibles en español de Colombia, en lenguaje del dueño ("caja", "comanda", "insumo"), sin anglicismos innecesarios.
- Fechas y horas siempre en zona `America/Bogota`; día de negocio con `src/lib/businessDay.ts`.
- Dinero en COP sin decimales en pantalla; cálculos con `number` y redondeo al final.

## SQL

- Migraciones idempotentes cuando se pueda. Nombres de objetos en inglés (como el resto del esquema); comentarios en español.
- RLS en toda tabla nueva. Políticas con `team_owner_ids`.
- `SECURITY DEFINER` solo con `SET search_path` fijo, `REVOKE … FROM PUBLIC, anon` y prueba.

## Edge functions

- Autenticación explícita al inicio (`_shared/require-auth.ts` o `_shared/require-cron.ts`).
- Validar el cuerpo con zod; responder errores con el motivo en `{ "error": "…" }` y el código HTTP correcto (400, 401, 403, 404, 429).
- Nunca registrar en logs datos personales ni secretos.
- Llamadas de IA por `_shared/ai-gateway.ts` / `ai-sdk-gateway.ts`, con tope diario (`_shared/ai-quota.ts`).

## Pruebas

- Lógica pura con Vitest junto al archivo (`*.test.ts`).
- Permisos y reglas de la base en `supabase/tests/sql/*.test.sql`, que corren en `scripts/db-verify.sh` y en CI.
