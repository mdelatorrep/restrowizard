# Glosario

| Término | Significado en RestroWizard |
| --- | --- |
| Dueño | Usuario dueño del restaurante. Su `auth.users.id` es el `user_id` de casi todas las filas del restaurante. |
| Equipo | Gerentes, cajeros, cocina y personal con acceso (`restaurant_team_members`). |
| Empleado | Persona de la nómina (`staff_members`). Puede o no tener cuenta; si tiene PIN, entra al POS. |
| Día de negocio | Día contable en Bogotá con corte a las 6 a. m. |
| Prime cost | Costo de alimentos y bebidas más costo de personal, como porcentaje de las ventas. |
| P&L | Estado de resultados del periodo. |
| Comanda | Pedido de una mesa en el POS; llega a cocina. |
| Caja / sesión de caja | Turno de caja con apertura, ventas y cierre (`pos_sessions`). |
| Cierre de caja | Arqueo al final del turno; la diferencia genera alerta de fraude si supera el umbral. |
| Supervisor | Rol del POS que autoriza anulaciones, descuentos y cierres con diferencia. |
| Slug | Identificador del restaurante en la URL pública (`/p/clutch-sports-bar`). |
| Código de fidelidad | Código de 8 caracteres con el que el comensal ve y canjea sus puntos. |
| Interruptor de producto | Bandera en `src/config/features.ts` que apaga un módulo sin borrarlo. |
| Línea base | Migración que recrea el esquema completo de producción (`20261114220000_baseline.sql`). |
| Tenant | Un restaurante (un dueño) con sus datos aislados por RLS. |
| Demo | Restaurante ficticio Clutch Sports Bar & Grill que se reconstruye cada día. |
