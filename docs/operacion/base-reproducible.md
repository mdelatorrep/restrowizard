# Base reproducible (B-04)

## Qué cambió el 14-nov-2026

- Las 139 migraciones históricas se movieron a `supabase/migrations_archive/`. 86 fallaban en una base vacía (la primera usaba una función creada después) y 22 se habían aplicado a mano en producción. Se conservan como historia; no se ejecutan.
- `supabase/migrations/20261114220000_baseline.sql` es la **línea base**: el esquema completo de producción generado desde su catálogo con `supabase/tools/schema_dump.sql`.
- `20261114220100_cron_jobs.sql` lleva al repo los trabajos de pg_cron, portables entre proyectos.
- `supabase/seed.sql` crea la demo, separada de las migraciones.

## Evidencia de que la línea base es fiel

Huellas MD5 del catálogo de producción y de una base reconstruida desde el repositorio, comparadas el 14-nov:

| Objeto | Resultado |
| --- | --- |
| Columnas (tipo, nulos, defaults) de tablas y vistas | Idénticas |
| Índices | Idénticos |
| Funciones (cuerpo, SECURITY DEFINER, search_path) | Idénticas |
| Permisos de funciones y tablas | Idénticos |
| Políticas RLS (public y storage) | Idénticas |
| RLS activada por tabla | Idéntica |
| Triggers (public y auth) | Idénticos |
| Vistas | Idénticas |
| Restricciones | Idénticas salvo una diferencia de forma: el CHECK de `staff_shifts.status` se reescribe al re-parsearse; es equivalente |

`scripts/db-verify.sh` reconstruye la base, siembra la demo (≈5.100 pedidos) y corre las pruebas SQL. Corre en CI en cada PR.

## Proyecto nuevo (staging o traslado)

```bash
supabase link --project-ref <ref>
supabase db push                      # línea base + migraciones nuevas
psql "$DB_URL" -c "select vault.create_secret('https://<ref>.supabase.co', 'project_url')"
psql "$DB_URL" -c "select vault.create_secret('<mismo valor que el secreto CRON_SECRET>', 'CRON_SECRET')"
psql "$DB_URL" -f supabase/seed.sql   # solo si se quiere la demo
```

## Proyecto actual (Lovable Cloud)

Producción ya tiene registradas `20261114220000` y `20261114220100`, además de las históricas. Al pasar a un proyecto propio con la CLI, marcar las históricas como revertidas para que no se busquen en local:

```bash
supabase migration list            # muestra las remotas que no existen en local
supabase migration repair --status reverted <versiones históricas>
```

## Regenerar la línea base

Solo si producción cambió fuera de las migraciones (no debería pasar). Crear `_ops_schema_dump()` con `supabase/tools/schema_dump.sql`, llamarla como `service_role`, guardar el resultado y borrar la función.
