# Inventario de cuentas y secretos

Todo lo que RestroWizard necesita fuera del repositorio para funcionar, a nombre de quién está y cómo se rota. **Aquí van nombres, nunca valores.**

Estado: borrador del 14-nov-2026 (ítem B-06 del plan de cierre). Las celdas "Por confirmar" las completa el titular de las cuentas.

## Cuentas y servicios

| Servicio | Para qué se usa | Identificador | Titular | Plan y costo | Cómo se traspasa |
| --- | --- | --- | --- | --- | --- |
| GitHub | Código fuente | `mdelatorrep/restrowizard` | Cuenta personal `mdelatorrep` | Por confirmar | Transferir el repo a una organización de la empresa |
| Lovable (workspace y proyecto) | Edición asistida, hosting del frontend, despliegue de edge functions | Proyecto `58966662-139e-45f6-b047-0714ac4d5ed9` | Cuenta personal | Por confirmar (consume créditos) | Transferir el proyecto a un workspace de la empresa |
| Lovable Cloud (Supabase) | Base de datos, autenticación, edge functions, almacenamiento | Proyecto `jeqmnulrerilwixohvgw` | Atado al proyecto de Lovable | Incluido en Lovable | Decisión D1: migrar a un proyecto Supabase propio |
| Lovable AI Gateway | Modelo de IA de las 18 funciones de IA | Clave `LOVABLE_API_KEY` | Atado al proyecto de Lovable | Créditos de Lovable | Sustituir por un proveedor con clave propia (B-05) |
| Dominio `restrowizard.co` | Sitio y app en producción | — | Por confirmar (registrador y titular) | Por confirmar | Cambio de titular en el registrador |
| Google Search Console | Indexación del sitio | Verificación por meta en `index.html` | Por confirmar | Gratis | Agregar al nuevo propietario y retirar al anterior |
| Firecrawl | Investigación web del asistente de apertura | Clave `FIRECRAWL_API_KEY` | Por confirmar | Por confirmar | Nueva clave a nombre de la empresa |
| Rappi (API de aliados) | Pedidos, menú y liquidaciones | `RAPPI_API_BASE_URL`; credenciales por restaurante cifradas en la base | Cada restaurante | — | No se traspasa: es del restaurante |
| Pasarelas de pago (Wompi, Bold, Mercado Pago, ePayco) | Cobro en el POS | Credenciales por restaurante en `payment_gateway_credentials` | Cada restaurante | — | No se traspasa. Hoy 0 credenciales cargadas |

## Secretos

| Nombre | Dónde vive | Qué rompe si se filtra | Cómo se rota |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Secretos de edge functions (Lovable Cloud) | Acceso total a la base, saltando RLS | Regenerar en el proyecto Supabase y redesplegar las edge functions |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Edge functions y `.env` del frontend | Nada por sí sola: es pública por diseño y RLS protege | Regenerar junto con la anterior |
| `LOVABLE_API_KEY` | Secretos de edge functions | Consumo de créditos de IA | La administra Lovable |
| `CRON_SECRET` | Secretos de edge functions **y** Vault de la base (`vault.decrypted_secrets`, nombre `CRON_SECRET`) | Cualquiera podría disparar los sondeos de Rappi | Generar uno nuevo y actualizarlo en los dos lugares a la vez |
| `RAPPI_ENCRYPTION_KEY` | Secretos de edge functions | Descifrar las credenciales de Rappi guardadas | Rotar exige re-cifrar las credenciales guardadas: no rotar sin migración |
| `RAPPI_API_BASE_URL` | Secretos de edge functions | — (no es secreto) | — |
| `FIRECRAWL_API_KEY` | Secretos de edge functions | Consumo de la cuenta de Firecrawl | Regenerar en Firecrawl y actualizar el secreto |

## Trabajos programados (pg_cron)

| Trabajo | Frecuencia | En una migración |
| --- | --- | --- |
| `purge_debug_events`, `purge_notifications_log`, `purge_rappi_webhook_events`, `purge_audit_log` | Diario, 3 a. m. UTC | Sí (`20260517221327`) |
| `rappi-orders-poll-every-minute` | Cada minuto | **No** (pendiente en B-04) |
| `rappi-settlements-daily` | Diario, 4 a. m. UTC | **No** (pendiente en B-04) |
| `demo-restaurant-reset`, `demo-restaurant-tick` | Diario / cada hora | Sí (`20261101120000`) |
| `finance-materialize-recurring` | Diario | Sí (`20261101180000`) |
| `purge_pos_pin_attempts` | Diario | Sí (`20261114120000`) |
