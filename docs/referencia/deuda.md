# Deuda conocida

Registro vivo. Cada fila corresponde a un ítem del backlog (hoja *RestroWizard · Backlog de entregabilidad*). Al cerrarse, se borra de aquí y se anota en `CHANGELOG.md`.

| Deuda | Efecto | Ítem | Plan |
| --- | --- | --- | --- |
| 84 archivos de páginas y componentes llaman a Supabase directo; 33 `supabase as any` | Cambiar una tabla obliga a revisar toda la UI | B-20 | Fase 4 |
| TypeScript sin `strict`; ~840 `any`; ~860 errores de ESLint | Errores de nulos llegan a producción | B-21 | Fase 4; CI ya impide empeorar lo que se toca |
| Paquete inicial de ~3 MB (≈930 KB gzip) | Carga lenta en celulares | B-22 | Fase 3 |
| Handlers de edge con complejidad 49–65 y CORS duplicado | Difícil de cambiar lo que mueve dinero | B-23 | Fase 3 |
| Pruebas: unitarias de librerías y 4 pruebas SQL; faltan RLS con dos tenants y flujos completos | Cambios de permisos sin red | B-11 | Fase 2 |
| Pasarelas de pago con endpoints sandbox; push sin VAPID | Funciones visibles que no funcionan | B-26 | Ocultas (D4); terminar o retirar en fase 3 |
| Tope de IA solo en el copiloto; 17 funciones de IA sin tope | Costo sin techo en esas funciones | B-25 | Extender `_shared/ai-quota.ts` |
| `@lovable.dev/mcp-js` 0.21 y `zod` 3 con avisos altos; requieren versión mayor | `npm audit` con 4 altos (sin críticos) | B-16 | Actualizar con prueba del MCP |
| `.env` versionado (solo valores públicos) | Confusión sobre qué es secreto | B-09 | Sale del índice al dejar Lovable (B-05) |
| Bogotá, COP e impoconsumo fijos en el código; un restaurante por dueño | No sirve para cadenas ni otros países | B-27, B-29 | Fase 4 (D6) |
| Sin factura electrónica DIAN | El POS no sirve como único sistema de venta | C-08 | Fase 2 (D7) |
| Sin cobro ni planes | No hay ingresos que valorar | C-11 | Fase 3 (D8) |
