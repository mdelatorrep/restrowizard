# Despliegue

Estado al 14-nov-2026: frontend y edge functions se publican desde Lovable; la base es Lovable Cloud (Supabase gestionado por Lovable). Desde la fase 5 (B-05) todo se despliega con la CLI de Supabase en un proyecto de la empresa; las instrucciones de esa sección ya funcionan contra cualquier proyecto Supabase.

## Frontend

| Hoy (Lovable) | Proyecto propio |
| --- | --- |
| Botón **Publish** en el editor de Lovable. Publica lo que está en `main`. | `npm ci && npm run build` y servir `dist/` en cualquier hosting estático (Cloudflare Pages, Vercel, Netlify). Reescribir todas las rutas a `index.html`. Cabeceras: `Content-Security-Policy` con `frame-ancestors 'self'`, HSTS, `X-Content-Type-Options`. |

Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SITE_URL` (ver `.env.example`).

## Base de datos

1. Crear la migración: `supabase/migrations/AAAAMMDDHHMMSS_que_cambia.sql`. Idempotente cuando se pueda (`IF NOT EXISTS`, `CREATE OR REPLACE`).
2. Probar en local: `scripts/db-verify.sh` (reconstruye todo y corre `supabase/tests/sql`). Si la migración agrega lógica, agregar su prueba SQL.
3. PR → CI verde → merge.
4. Aplicar:
   - Proyecto propio: `supabase db push`.
   - Lovable Cloud (hoy): ejecutar el archivo y registrarlo en `supabase_migrations.schema_migrations` (versión, nombre, sentencias). Nunca SQL suelto sin migración.

## Edge functions

- Proyecto propio: `supabase functions deploy <nombre>` (o sin nombre para todas). `verify_jwt` se toma de `supabase/config.toml`.
- Lovable Cloud (hoy): pedir al agente de Lovable que despliegue las funciones indicadas desde `main`, sin editar archivos.

Secretos de las funciones (nombres en [inventario de cuentas y secretos](inventario-cuentas-y-secretos.md)): `supabase secrets set NOMBRE=valor`.

## Después de desplegar

- `GET /functions/v1/health` responde `{"status":"ok"}` (B-13).
- Recorrer `/demo` con los tres roles.
- Si cambió la base: `select version from supabase_migrations.schema_migrations order by 1 desc limit 3`.
