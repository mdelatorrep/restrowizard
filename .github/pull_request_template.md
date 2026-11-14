## Qué cambia y por qué

<!-- Una o dos frases. Ítem del backlog si aplica (B-xx / C-xx). -->

## Cómo se probó

- [ ] `npm test` y `npm run typecheck`
- [ ] Si toca la base: migración nueva en `supabase/migrations/` y prueba en `supabase/tests/sql/`; `scripts/db-verify.sh` en verde
- [ ] Si toca una edge function: autenticación explícita (sesión, cron o firma)
- [ ] Recorrido en la demo con el rol afectado

## Riesgo

<!-- ¿Toca POS, inventario, dinero o permisos? ¿Cómo se revierte? -->
