-- TK-02: Backfill payment_method para órdenes POS históricas que quedaron sin método.
-- 1) Si la orden POS tiene transacción registrada en pos_transactions, derivar de payment_method_name.
-- 2) Si no, marcar 'desconocido' para no contaminar el reporte como 'efectivo'.

UPDATE public.restaurant_orders ro
SET payment_method = sub.canonical
FROM (
  SELECT
    pt.order_id,
    CASE
      WHEN lower(pt.payment_method_name) LIKE '%efectivo%' OR lower(pt.payment_method_name) LIKE '%cash%' THEN 'efectivo'
      WHEN lower(pt.payment_method_name) LIKE '%nequi%' THEN 'nequi'
      WHEN lower(pt.payment_method_name) LIKE '%davi%' THEN 'daviplata'
      WHEN lower(pt.payment_method_name) LIKE '%transfer%' THEN 'transferencia'
      WHEN lower(pt.payment_method_name) LIKE '%crédito%' OR lower(pt.payment_method_name) LIKE '%credito%' OR lower(pt.payment_method_name) LIKE '%credit%' THEN 'tarjeta_credito'
      WHEN lower(pt.payment_method_name) LIKE '%débito%' OR lower(pt.payment_method_name) LIKE '%debito%' OR lower(pt.payment_method_name) LIKE '%debit%' OR lower(pt.payment_method_name) LIKE '%tarjeta%' THEN 'tarjeta_debito'
      WHEN lower(pt.payment_method_name) LIKE '%qr%' THEN 'qr'
      ELSE 'otro'
    END AS canonical,
    ROW_NUMBER() OVER (PARTITION BY pt.order_id ORDER BY pt.amount DESC NULLS LAST) AS rn
  FROM public.pos_transactions pt
  WHERE pt.order_id IS NOT NULL
    AND pt.transaction_type = 'sale'
    AND pt.status = 'completed'
) sub
WHERE ro.id = sub.order_id
  AND sub.rn = 1
  AND (ro.payment_method IS NULL OR ro.payment_method = '');

-- Cualquier otra orden histórica sin método queda marcada como 'desconocido'.
UPDATE public.restaurant_orders
SET payment_method = 'desconocido'
WHERE payment_method IS NULL OR payment_method = '';