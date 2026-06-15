
-- ============================================
-- POS Audit Log (inmutable)
-- ============================================
CREATE TABLE IF NOT EXISTS public.pos_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  terminal_id TEXT,
  actor_staff_id UUID,
  actor_user_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  supervisor_staff_id UUID,
  supervisor_name TEXT,
  authorization_id UUID,
  entity TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  reason TEXT,
  amount NUMERIC,
  before JSONB,
  after JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.pos_audit_log TO authenticated;
GRANT ALL ON public.pos_audit_log TO service_role;
ALTER TABLE public.pos_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_audit owner select" ON public.pos_audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "pos_audit insert by owner or service" ON public.pos_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = actor_user_id);

-- Immutability: no updates, no deletes (no policies for them = denied under RLS)
CREATE INDEX IF NOT EXISTS idx_pos_audit_user_created ON public.pos_audit_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_audit_entity ON public.pos_audit_log (entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_pos_audit_action ON public.pos_audit_log (action);

-- Prevent updates/deletes even by table owner via trigger
CREATE OR REPLACE FUNCTION public.pos_audit_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'pos_audit_log is immutable';
END;
$$;

CREATE TRIGGER trg_pos_audit_no_update
  BEFORE UPDATE ON public.pos_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.pos_audit_immutable();

CREATE TRIGGER trg_pos_audit_no_delete
  BEFORE DELETE ON public.pos_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.pos_audit_immutable();

-- ============================================
-- POS Supervisor Authorizations
-- ============================================
CREATE TABLE IF NOT EXISTS public.pos_supervisor_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  supervisor_staff_id UUID NOT NULL,
  supervisor_name TEXT NOT NULL,
  requester_staff_id UUID,
  requester_name TEXT,
  terminal_id TEXT,
  reason_code TEXT NOT NULL,
  reason_text TEXT,
  amount NUMERIC,
  entity TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pos_supervisor_authorizations TO authenticated;
GRANT ALL ON public.pos_supervisor_authorizations TO service_role;
ALTER TABLE public.pos_supervisor_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_sup_auth owner read" ON public.pos_supervisor_authorizations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pos_sup_auth owner insert" ON public.pos_supervisor_authorizations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pos_sup_auth owner update" ON public.pos_supervisor_authorizations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pos_sup_auth_user ON public.pos_supervisor_authorizations (user_id, created_at DESC);

-- ============================================
-- POS Fraud Signals
-- ============================================
CREATE TABLE IF NOT EXISTS public.pos_fraud_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  actor_staff_id UUID,
  actor_name TEXT,
  terminal_id TEXT,
  session_id UUID,
  entity TEXT,
  entity_id UUID,
  amount NUMERIC,
  score NUMERIC,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.pos_fraud_signals TO authenticated;
GRANT ALL ON public.pos_fraud_signals TO service_role;
ALTER TABLE public.pos_fraud_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_fraud owner read" ON public.pos_fraud_signals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pos_fraud owner update" ON public.pos_fraud_signals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pos_fraud insert" ON public.pos_fraud_signals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pos_fraud_user_status ON public.pos_fraud_signals (user_id, status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_fraud_actor ON public.pos_fraud_signals (actor_staff_id);

-- ============================================
-- RPC: pos_log_audit (SECURITY DEFINER for service & client)
-- ============================================
CREATE OR REPLACE FUNCTION public.pos_log_audit(
  p_user_id UUID,
  p_entity TEXT,
  p_action TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_actor_staff_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_supervisor_staff_id UUID DEFAULT NULL,
  p_supervisor_name TEXT DEFAULT NULL,
  p_authorization_id UUID DEFAULT NULL,
  p_session_id UUID DEFAULT NULL,
  p_terminal_id TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_before JSONB DEFAULT NULL,
  p_after JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.pos_audit_log (
    user_id, session_id, terminal_id,
    actor_staff_id, actor_user_id, actor_name, actor_role,
    supervisor_staff_id, supervisor_name, authorization_id,
    entity, entity_id, action, reason, amount,
    before, after, metadata
  ) VALUES (
    p_user_id, p_session_id, p_terminal_id,
    p_actor_staff_id, auth.uid(), p_actor_name, p_actor_role,
    p_supervisor_staff_id, p_supervisor_name, p_authorization_id,
    p_entity, p_entity_id, p_action, p_reason, p_amount,
    p_before, p_after, COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.pos_log_audit(
  UUID, TEXT, TEXT, UUID, UUID, TEXT, TEXT, UUID, TEXT, UUID,
  UUID, TEXT, TEXT, NUMERIC, JSONB, JSONB, JSONB
) TO authenticated, service_role;

-- ============================================
-- RPC: pos_verify_supervisor_pin
-- ============================================
CREATE OR REPLACE FUNCTION public.pos_verify_supervisor_pin(
  p_user_id UUID,
  p_pin TEXT,
  p_reason_code TEXT,
  p_reason_text TEXT DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_entity TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_terminal_id TEXT DEFAULT NULL,
  p_requester_staff_id UUID DEFAULT NULL,
  p_requester_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff RECORD;
  v_auth_id UUID;
BEGIN
  IF p_pin IS NULL OR length(p_pin) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN inválido');
  END IF;

  SELECT id, full_name, pos_role, pin_locked_until
    INTO v_staff
  FROM public.staff_members
  WHERE user_id = p_user_id
    AND pin_hash IS NOT NULL
    AND pin_hash = crypt(p_pin, pin_hash)
    AND pos_role IN ('supervisor', 'admin')
  LIMIT 1;

  IF v_staff.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Supervisor no autorizado');
  END IF;

  IF v_staff.pin_locked_until IS NOT NULL AND v_staff.pin_locked_until > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'PIN bloqueado temporalmente');
  END IF;

  INSERT INTO public.pos_supervisor_authorizations (
    user_id, supervisor_staff_id, supervisor_name,
    requester_staff_id, requester_name, terminal_id,
    reason_code, reason_text, amount, entity, entity_id
  ) VALUES (
    p_user_id, v_staff.id, v_staff.full_name,
    p_requester_staff_id, p_requester_name, p_terminal_id,
    p_reason_code, p_reason_text, p_amount, p_entity, p_entity_id
  )
  RETURNING id INTO v_auth_id;

  RETURN jsonb_build_object(
    'ok', true,
    'authorization_id', v_auth_id,
    'supervisor_staff_id', v_staff.id,
    'supervisor_name', v_staff.full_name,
    'expires_in_seconds', 300
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.pos_verify_supervisor_pin(
  UUID, TEXT, TEXT, TEXT, NUMERIC, TEXT, UUID, TEXT, UUID, TEXT
) TO authenticated, anon;

-- ============================================
-- Trigger: auto-audit on restaurant_orders status / cancel / discount changes
-- ============================================
CREATE OR REPLACE FUNCTION public.pos_audit_order_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
      INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, before, after, amount)
      VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'cancel', auth.uid(),
              jsonb_build_object('status', OLD.status, 'total', OLD.total),
              jsonb_build_object('status', NEW.status, 'total', NEW.total),
              NEW.total);
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, before, after)
      VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'status_change', auth.uid(),
              jsonb_build_object('status', OLD.status),
              jsonb_build_object('status', NEW.status));
    END IF;

    IF COALESCE(OLD.discount_amount, 0) IS DISTINCT FROM COALESCE(NEW.discount_amount, 0) THEN
      INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, amount, before, after)
      VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'discount_applied', auth.uid(),
              COALESCE(NEW.discount_amount, 0) - COALESCE(OLD.discount_amount, 0),
              jsonb_build_object('discount', OLD.discount_amount),
              jsonb_build_object('discount', NEW.discount_amount));
    END IF;

    IF OLD.table_id IS DISTINCT FROM NEW.table_id THEN
      INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, before, after)
      VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'transfer_table', auth.uid(),
              jsonb_build_object('table_id', OLD.table_id),
              jsonb_build_object('table_id', NEW.table_id));
    END IF;
  ELSIF TG_OP = 'INSERT' AND NEW.is_pos_order = true THEN
    INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, after)
    VALUES (NEW.user_id, 'restaurant_order', NEW.id, 'open', auth.uid(),
            jsonb_build_object('table_id', NEW.table_id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pos_audit_order ON public.restaurant_orders;
CREATE TRIGGER trg_pos_audit_order
  AFTER INSERT OR UPDATE ON public.restaurant_orders
  FOR EACH ROW EXECUTE FUNCTION public.pos_audit_order_change();

-- ============================================
-- Trigger: auto-audit on pos_transactions
-- ============================================
CREATE OR REPLACE FUNCTION public.pos_audit_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, amount, after)
    VALUES (NEW.user_id, 'pos_transaction', NEW.id, 'payment', auth.uid(), NEW.amount,
            to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('voided', 'refunded') THEN
    INSERT INTO public.pos_audit_log (user_id, entity, entity_id, action, actor_user_id, amount, before, after)
    VALUES (NEW.user_id, 'pos_transaction', NEW.id, NEW.status, auth.uid(), NEW.amount,
            jsonb_build_object('status', OLD.status), jsonb_build_object('status', NEW.status));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pos_audit_transaction ON public.pos_transactions;
CREATE TRIGGER trg_pos_audit_transaction
  AFTER INSERT OR UPDATE ON public.pos_transactions
  FOR EACH ROW EXECUTE FUNCTION public.pos_audit_transaction();

-- ============================================
-- Trigger: audit pos_sessions open/close
-- ============================================
CREATE OR REPLACE FUNCTION public.pos_audit_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pos_audit_log (user_id, session_id, entity, entity_id, action, actor_user_id, amount, after)
    VALUES (NEW.user_id, NEW.id, 'pos_session', NEW.id, 'open_session', auth.uid(),
            NEW.opening_cash, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'closed' THEN
    INSERT INTO public.pos_audit_log (user_id, session_id, entity, entity_id, action, actor_user_id, amount, before, after)
    VALUES (NEW.user_id, NEW.id, 'pos_session', NEW.id, 'close_session', auth.uid(),
            NEW.cash_difference,
            jsonb_build_object('opening_cash', OLD.opening_cash, 'status', OLD.status),
            to_jsonb(NEW));

    -- Cash variance fraud signal
    IF NEW.cash_difference IS NOT NULL AND abs(NEW.cash_difference) >= GREATEST(50000, COALESCE(NEW.opening_cash, 0) * 0.10) THEN
      INSERT INTO public.pos_fraud_signals (user_id, signal_type, severity, session_id, entity, entity_id, amount, description, evidence)
      VALUES (NEW.user_id, 'cash_variance',
              CASE WHEN abs(NEW.cash_difference) >= 200000 THEN 'high' ELSE 'medium' END,
              NEW.id, 'pos_session', NEW.id, NEW.cash_difference,
              'Descuadre de caja al cierre de turno',
              jsonb_build_object('expected', NEW.expected_cash, 'actual', NEW.actual_cash, 'diff', NEW.cash_difference));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pos_audit_session ON public.pos_sessions;
CREATE TRIGGER trg_pos_audit_session
  AFTER INSERT OR UPDATE ON public.pos_sessions
  FOR EACH ROW EXECUTE FUNCTION public.pos_audit_session();
