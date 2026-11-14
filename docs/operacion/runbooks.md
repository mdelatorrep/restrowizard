# Runbooks

## La demo se ve vacía o rara

La demo (Clutch Sports Bar & Grill) se reconstruye cada día a las 4:05 a. m. de Bogotá (`demo-restaurant-reset`) y avanza cada hora (`demo-restaurant-tick`).

1. ¿Corrió? `select status, return_message, start_time from cron.job_run_details where jobid = (select jobid from cron.job where jobname = 'demo-restaurant-reset') order by start_time desc limit 3;`
2. Reconstruir a mano: `select public.seed_demo_restaurant(); select public.seed_demo_extras();`
3. Si falla, el mensaje de error dice qué tabla; revisar la última migración que la tocó.

## Un trabajo programado falla

1. `select j.jobname, d.status, d.return_message, d.start_time from cron.job_run_details d join cron.job j using (jobid) where d.status <> 'succeeded' and d.start_time > now() - interval '1 day' order by d.start_time desc;`
2. Los de Rappi solo llaman a la función si hay integraciones activas; si fallan, revisar los secretos `project_url` y `CRON_SECRET` en Vault y que el secreto `CRON_SECRET` de las edge functions sea el mismo.
3. `GET /functions/v1/health` reporta los trabajos con fallas en las últimas 24 horas.

## Rotar una llave

| Llave | Pasos |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` / llave pública | Regenerar en el proyecto Supabase → actualizar `.env` del frontend y los secretos de funciones → redesplegar frontend y funciones |
| `CRON_SECRET` | Generar valor nuevo → `supabase secrets set CRON_SECRET=…` → `select vault.update_secret((select id from vault.secrets where name='CRON_SECRET'), '<nuevo>')` en el mismo minuto |
| `RAPPI_ENCRYPTION_KEY` | No rotar sin migrar: re-cifrar las credenciales guardadas con la llave nueva antes de cambiarla |
| Llave privada de una pasarela | El restaurante la cambia en Ajustes; se guarda cifrada en Vault (B-07) y se rota sobre el mismo secreto |
| `RESEND_API_KEY` | Crear llave nueva en Resend → `supabase secrets set` → borrar la anterior |

## Un cajero no puede entrar con su PIN

1. ¿Bloqueo por intentos? `select * from pos_pin_attempts where created_at > now() - interval '1 hour' order by created_at desc;` — 5 fallos por IP en 15 min bloquean esa IP; 100 en una hora bloquean el restaurante. Se libera solo.
2. ¿Tiene PIN? `select name, pin_hash is not null, pin_locked_until from staff_members where user_id = '<dueño>';`
3. La primera vez que entra se le crea una cuenta técnica `pos-<id>@pos.restrowizard.app` y su acceso al equipo (C-05).

## Restaurar un respaldo

Lovable Cloud no expone la restauración al dueño de la cuenta; pedirla a soporte de Lovable. En proyecto propio: Dashboard de Supabase → Database → Backups → Restore (PITR si el plan lo incluye). Probar la restauración una vez al trimestre en el proyecto de staging (B-13).
