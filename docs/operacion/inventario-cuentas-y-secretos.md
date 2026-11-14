# Inventario de cuentas y secretos

Todo lo que RestroWizard necesita fuera del repositorio para funcionar, a nombre de quién está y cómo se rota. **Aquí van nombres, nunca valores.**

Estado: borrador del 14-nov-2026, actualizado en la noche (ítem B-06). Las celdas "Por confirmar" las completa el titular de las cuentas.

## Cuentas y servicios

| Servicio | Para qué se usa | Identificador | Titular | Plan y costo | Cómo se traspasa |
| --- | --- | --- | --- | --- | --- |
| GitHub | Código fuente | `mdelatorrep/restrowizard` | Cuenta personal `mdelatorrep` | Por confirmar | Transferir el repo a una organización de la empresa |
| Lovable (workspace y proyecto) | Edición asistida, hosting del frontend, despliegue de edge functions | Proyecto `58966662-139e-45f6-b047-0714ac4d5ed9` | Cuenta personal | Por confirmar (consume créditos) | Transferir el proyecto a un workspace de la empresa |
| Lovable Cloud (Supabase) | Base de datos, autenticación, edge functions, almacenamiento | Proyecto `jeqmnulrerilwixohvgw` | Atado al proyecto de Lovable | Incluido en Lovable | Decisión D1: migrar a un proyecto Supabase propio |
| Lovable AI Gateway | Modelo de IA de las 18 funciones de IA | Clave `LOVABLE_API_KEY` | Atado al proyecto de Lovable | Créditos de Lovable | Sustituir por un proveedor con clave propia (B-05) |
| Dominio `restrowizard.co` | Sitio y app en producción | — | Por confirmar (registrador y titular) | Por confirmar | Cambio de titular en el registrador |
| Google Search Console | Indexación del sitio | Verificación por meta en `index.html` | Por confirmar | Gratis | Agregar al nuevo propietario y retirar al anterior |
| Resend | Correo de alertas diarias (C-10) | Secretos `RESEND_API_KEY`, `ALERTS_FROM_EMAIL` | Por crear, a nombre de la empresa | Gratis hasta 3.000 correos/mes | Se crea directamente a nombre de la empresa |
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
| `RESEND_API_KEY` / `ALERTS_FROM_EMAIL` | Secretos de edge functions | Envío de correos a nombre del dominio | Regenerar en Resend y actualizar el secreto |
| `project_url` | Vault de la base | — (no es secreto; lo usan los cron para llamar funciones) | Actualizar si cambia el proyecto |
| `pgw_<id>` | Vault de la base | Cobrar a nombre del restaurante con su pasarela | La rota el restaurante desde Ajustes (B-07) |
| `FIRECRAWL_API_KEY` | Secretos de edge functions | Consumo de la cuenta de Firecrawl | Regenerar en Firecrawl y actualizar el secreto |

## Trabajos programados (pg_cron)

Todos en migraciones (`20261114220100_cron_jobs.sql`, `20261114230000_…`, `20261114233000_…`). Horas en UTC (Bogotá = UTC−5).

| Trabajo | Frecuencia | Qué hace |
| --- | --- | --- |
| `demo-restaurant-reset` | 09:05 diario | Reconstruye la demo (`seed_demo_restaurant`, `seed_demo_extras`) |
| `demo-restaurant-tick` | Cada hora | Avanza la operación de la demo |
| `finance-materialize-recurring` | 10:20 diario | Genera gastos recurrentes |
| `daily-alerts-generate` | 11:50 diario | Crea alertas de ventas e inventario (C-10) |
| `daily-alerts-email` | 12:00 diario | Envía el correo de alertas (C-10) |
| `purge_*` (6) | 03:15–03:40 diario | Retención de logs, auditoría, intentos de PIN, uso de IA |
| `rappi-orders-poll-every-minute`, `rappi-settlements-daily` | Cada minuto / 04:00 | Solo llaman a Rappi si hay integraciones activas (B-25) |
