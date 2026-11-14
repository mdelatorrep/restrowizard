# Cómo contribuir

## Flujo

1. Rama desde `main`: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
2. PR con la plantilla. CI tiene que quedar en verde: tipos, pruebas, build, lint de lo cambiado, auditoría de dependencias, gitleaks y reconstrucción de la base con pruebas SQL.
3. Una revisión aprobada (ver `CODEOWNERS`) y merge con *squash*.

**Lovable** trabaja en su propia rama y entra por PR como cualquier otro autor (decisión D2). Un cambio de Lovable que toque la base debe traer su migración en `supabase/migrations/`.

## Mensajes de commit

[Conventional Commits](https://www.conventionalcommits.org/es/): `tipo(ámbito): qué cambia`, en español.

| Tipo | Para |
| --- | --- |
| `feat` | Funcionalidad nueva para el usuario |
| `fix` | Corrección de un error |
| `chore` | Mantenimiento sin efecto visible (dependencias, configuración) |
| `docs` | Solo documentación |
| `test` | Solo pruebas |
| `refactor` | Cambio interno sin cambio de comportamiento |
| `ci` | Integración continua |

Si el cambio cierra un ítem del backlog, menciónalo: `fix(pos): … (B-02)`.

## Reglas que no se negocian

1. **Ningún cambio a la base fuera de una migración del repo.** Cada migración se registra al aplicarse.
2. **Ninguna función `SECURITY DEFINER` sin `REVOKE … FROM PUBLIC, anon`** y verificación de identidad (`auth.uid()` + `team_owner_ids`), con su prueba en `supabase/tests/sql/`.
3. **Ninguna edge function sin autenticación explícita** (sesión, secreto de cron o firma). `verify_jwt` no cuenta: acepta la llave pública.
4. **Un ítem se cierra con su criterio de aceptación verificado** y anotado en el backlog.
5. **Nada que toque el POS o el inventario se publica entre el 12 de diciembre y el 11 de enero** salvo correcciones urgentes con prueba y plan de reversa.
6. **Ningún secreto en el repo.** Nombres en `docs/operacion/inventario-cuentas-y-secretos.md`; valores en los gestores de secretos.

## Versiones

Cada publicación a producción lleva un tag `vMAYOR.MENOR.PARCHE` y su entrada en `CHANGELOG.md`.
