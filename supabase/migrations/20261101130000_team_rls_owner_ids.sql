-- Rendimiento del acceso de equipo (B-05).
--
-- Las políticas team_read / team_write llamaban team_can(user_id, …) por cada
-- fila. Con 20.000 deducciones de inventario en un mes, el gerente esperaba
-- ~4 s por pantalla. team_owner_ids() devuelve una sola vez los dueños cuyos
-- datos puede ver el usuario actual, y la política se vuelve un
-- `user_id IN (subconsulta)` que Postgres evalúa una vez por consulta.
-- team_can() se mantiene para los RPC que validan un dueño puntual.

CREATE OR REPLACE FUNCTION public.team_owner_ids(_modules text[], _level text DEFAULT 'read')
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() WHERE auth.uid() IS NOT NULL
  UNION
  SELECT b.owner_id
  FROM restaurant_businesses b
  JOIN restaurant_team_members m ON m.business_id = b.id
  WHERE m.user_id = auth.uid() AND m.status = 'active'
    AND EXISTS (SELECT 1 FROM unnest(_modules) mod
                WHERE public.has_module_access(auth.uid(), b.id, mod, _level));
$$;

REVOKE ALL ON FUNCTION public.team_owner_ids(text[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_owner_ids(text[], text) TO authenticated;

-- Reescribe toda política team_read / team_write que todavía use team_can().
-- Idempotente: si ya están convertidas, no hace nada.
DO $$
DECLARE
  p record;
  arg_re constant text := '([A-Za-z_][A-Za-z0-9_.]*), ((?:''[^'']*''::text\[\])|(?:ARRAY\[[^\]]*\]))';
  new_qual text;
  new_check text;
  conv text;
BEGIN
  FOR p IN
    SELECT tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN ('team_read', 'team_write')
      AND (coalesce(qual, '') LIKE '%team_can(%' OR coalesce(with_check, '') LIKE '%team_can(%')
  LOOP
    new_qual := p.qual;
    new_check := p.with_check;
    -- Con nivel explícito ('write') y luego sin él (nivel por defecto 'read').
    new_qual := regexp_replace(new_qual, 'team_can\(' || arg_re || ', (''[a-z]+''::text)\)',
                               '(\1 IN (SELECT public.team_owner_ids(\2, \3)))', 'g');
    new_qual := regexp_replace(new_qual, 'team_can\(' || arg_re || '\)',
                               '(\1 IN (SELECT public.team_owner_ids(\2, ''read'')))', 'g');
    IF new_check IS NOT NULL THEN
      new_check := regexp_replace(new_check, 'team_can\(' || arg_re || ', (''[a-z]+''::text)\)',
                                  '(\1 IN (SELECT public.team_owner_ids(\2, \3)))', 'g');
      new_check := regexp_replace(new_check, 'team_can\(' || arg_re || '\)',
                                  '(\1 IN (SELECT public.team_owner_ids(\2, ''read'')))', 'g');
    END IF;

    conv := format('ALTER POLICY %I ON public.%I', p.policyname, p.tablename);
    IF new_qual IS NOT NULL THEN conv := conv || format(' USING (%s)', new_qual); END IF;
    IF new_check IS NOT NULL THEN conv := conv || format(' WITH CHECK (%s)', new_check); END IF;
    EXECUTE conv;
  END LOOP;
END $$;
