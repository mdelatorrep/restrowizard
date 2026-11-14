
-- IA-05: Ensure upsert(onConflict: user_id,alert_type) works for copilot_alerts
-- Remove duplicates first (keep most recent)
DELETE FROM public.copilot_alerts a
USING public.copilot_alerts b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id
  AND a.alert_type = b.alert_type;

ALTER TABLE public.copilot_alerts
  DROP CONSTRAINT IF EXISTS copilot_alerts_user_id_alert_type_key;

ALTER TABLE public.copilot_alerts
  ADD CONSTRAINT copilot_alerts_user_id_alert_type_key UNIQUE (user_id, alert_type);
