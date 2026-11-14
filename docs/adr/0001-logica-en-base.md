# ADR-0001 · Qué lógica vive en la base y qué en la app

Estado: aceptada · 14-nov-2026 · ítem B-24

## Contexto

RestroWizard tiene 112 funciones y 293 triggers en Postgres. Algunas reglas que mueven dinero (descuento de inventario por venta, propinas, puntos de lealtad, auditoría del POS) se ejecutan en triggers. El código de la app no las muestra, y un cambio puede alterar cifras sin verse en una revisión de la interfaz.

## Decisión

Va en la base:
- Lo que debe cumplirse sin importar quién escriba: permisos (RLS), integridad, auditoría inmutable, cálculos que otro proceso podría saltarse (inventario por venta, puntos).
- Lo que lee mucho y devuelve poco (agregados del panel, RPC públicas con máscaras).
- Tareas programadas sobre datos (retención, demo, alertas).

Va en la app o en edge functions:
- Integraciones con terceros (pagos, Rappi, IA, correo).
- Reglas de presentación y flujos de varios pasos con el usuario.
- Todo lo que necesite secretos que no sean de la base.

## Consecuencias

- Toda función o trigger nuevo llega por migración y con prueba en `supabase/tests/sql/`.
- El catálogo `docs/referencia/logica-en-base.md` se regenera con `scripts/gen-reference-docs.py` en cada cambio de esquema.
- Las funciones `SECURITY DEFINER` siguen la regla 2 de `CONTRIBUTING.md`.
