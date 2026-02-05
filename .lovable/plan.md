
# Plan: Reorganizacion del Sidebar para Restaurantes

## ✅ IMPLEMENTADO

## Objetivo
Simplificar y optimizar la navegacion del sidebar agrupando modulos de manera logica, eliminando redundancias y asegurando que cada modulo tenga un proposito claro y diferenciado.

---

## Analisis de la Estructura Actual

### Estructura Actual (8 grupos, ~25 modulos)

```text
1. Principal
   - Dashboard
   - Nuevo Negocio (solo etapas iniciales)
   - Pre-Apertura (solo pre-apertura)
   - Primeros 90 Dias (solo primeros 90 dias)

2. Configuracion Base
   - Marca
   - Recetas
   - Inventarios
   - Proveedores
   - Menus Digitales

3. Ventas y Operaciones
   - Punto de Venta
   - Pedidos
   - Cocina (KDS)
   - Domicilios
   - Reservaciones

4. Analisis IA
   - Finanzas IA
   - Operaciones IA
   - Reportes Ventas
   - Metas de Venta

5. Equipo
   - Talento IA
   - Turnos

6. Clientes
   - Fidelizacion
   - Feedback
   - Soporte PQRS

7. Marketing
   - Sitio Web
   - Social Listening

8. Avanzado
   - Sostenibilidad
   - Ghost Kitchen
   - Gestion de Cadenas
```

---

## Problemas Identificados

| Problema | Modulos Afectados | Impacto |
|----------|-------------------|---------|
| Duplicidad conceptual | Finanzas IA + Reportes Ventas | Confunden al usuario sobre donde ver datos financieros |
| Modulo huerfano | Operaciones IA | Mezcla feedback + lealtad + KPIs sin datos propios |
| Nombre confuso | "Metas de Venta" | Deberia fusionarse con Finanzas o POS Reports |
| Grupo con 1 item | Social Listening solo | Marketing tiene muy poco contenido |
| Modulos muy avanzados visibles | Ghost Kitchen, Cadenas | Mayoria de restaurantes son unidades unicas |
| Ingenieria de Menu removida | Ya integrada en Menus | Correcto, pero verificar consistencia |

---

## Propuesta de Nueva Estructura (5 grupos principales)

```text
1. Principal (contextual por etapa)
   - Dashboard / Nuevo Negocio / Pre-Apertura / Primeros 90 Dias

2. Mi Restaurante
   - Marca e Identidad
   - Recetas y Costos
   - Menus Digitales (incluye Ingenieria de Menu)
   - Inventario y Proveedores

3. Ventas
   - Punto de Venta (POS)
   - Pedidos y Cocina
   - Domicilios
   - Reservaciones
   - Reportes y Metas (fusion de POS Reports + Sales Goals)

4. Equipo y Clientes
   - Talento y Turnos (fusion)
   - Fidelizacion
   - Feedback y Reputacion (fusion de Feedback + Social Listening)
   - Soporte PQRS

5. Presencia Digital
   - Sitio Web y URLs

6. Finanzas y Analisis (solo para operacion normal)
   - Finanzas IA (absorbe Operaciones IA)
   - Sostenibilidad
   
7. Expansion (oculto por defecto, solo operacion normal)
   - Ghost Kitchen
   - Gestion de Cadenas
```

---

## Cambios Detallados

### 1. Fusiones

| Modulos Actuales | Nuevo Modulo | Justificacion |
|------------------|--------------|---------------|
| Finanzas IA + Operaciones IA | Finanzas IA | Operaciones IA duplica datos de otros modulos (feedback, lealtad). Finanzas IA ya tiene KPIs operativos |
| POS Reports + Metas de Venta | Reportes y Metas | Ambos tratan sobre rendimiento de ventas |
| Feedback + Social Listening | Feedback y Reputacion | Ambos miden satisfaccion del cliente |
| Talento IA + Turnos | Talento y Turnos | Ambos sobre gestion de personal |
| Inventario + Proveedores | Inventario y Proveedores | Proveedores es parte del ciclo de inventario |

### 2. Reorganizacion de Grupos

**Grupo "Mi Restaurante"** (configuracion del negocio):
- Marca e Identidad (antes: Marca)
- Recetas y Costos (antes: Recetas) 
- Menus Digitales (sin cambios, ya incluye Ingenieria de Menu)
- Inventario y Proveedores (fusion)

**Grupo "Ventas"** (operaciones diarias):
- Punto de Venta
- Pedidos y Cocina (fusion para unificar flujo de ordenes)
- Domicilios
- Reservaciones
- Reportes y Metas (fusion)

**Grupo "Equipo y Clientes"** (personas):
- Talento y Turnos (fusion)
- Fidelizacion
- Feedback y Reputacion (fusion)
- Soporte PQRS

**Grupo "Presencia Digital"**:
- Sitio Web y URLs (centraliza todas las URLs publicas)

**Grupo "Finanzas"** (analisis avanzado):
- Finanzas IA (ahora incluye insights de operaciones)
- Sostenibilidad

**Grupo "Expansion"** (opcional, colapsado):
- Ghost Kitchen
- Gestion de Cadenas

### 3. Visibilidad por Etapa

| Grupo | conception | enablement | pre_opening | first_90_days | normal_operation |
|-------|------------|------------|-------------|---------------|------------------|
| Principal | Si | Si | Si | Si | Si |
| Mi Restaurante | Marca solo | Si | Si | Si | Si |
| Ventas | No | No | Reservaciones | Si | Si |
| Equipo y Clientes | No | Talento | Si | Si | Si |
| Presencia Digital | No | Si | Si | Si | Si |
| Finanzas | No | No | No | Si | Si |
| Expansion | No | No | No | No | Si |

---

## Archivos a Modificar

### AppSidebar.tsx
- Reestructurar los arrays de items segun nueva organizacion
- Actualizar las funciones de filtrado por etapa
- Implementar grupo "Expansion" colapsable

### Paginas a Fusionar o Redirigir

| Pagina Actual | Accion | Destino |
|---------------|--------|---------|
| `/r/operations` | Redirigir | `/r/finances` (agregar tab de operaciones) |
| `/r/pos-reports` | Mantener | Agregar tab de metas dentro |
| `/r/sales-goals` | Redirigir | `/r/pos-reports` |
| `/r/social-listening` | Redirigir | `/r/feedback` (agregar tab de reputacion) |
| `/r/staff-schedule` | Redirigir | `/r/talent` (agregar tab de turnos) |
| `/r/suppliers` | Redirigir | `/r/inventory` (agregar tab de proveedores) |

### Componentes a Actualizar

1. `FinancesAIModule.tsx` - Agregar tab con datos de operaciones
2. `RestaurantFeedback.tsx` - Agregar tab de Social Listening
3. `RestaurantTalent.tsx` - Agregar tab de programacion de turnos
4. `RestaurantInventory.tsx` - Agregar tab de proveedores
5. `RestaurantPOSReports.tsx` - Agregar tab de metas de venta

---

## Beneficios Esperados

1. **Reduccion de 25 a 15 items** en el sidebar
2. **Grupos mas logicos** que reflejan el flujo de trabajo real
3. **Menos confusion** al eliminar modulos duplicados
4. **Mejor escalabilidad** con grupo de expansion oculto
5. **Navegacion mas rapida** con menos opciones visibles

---

## Notas de Implementacion

- Mantener rutas antiguas con redirects para no romper bookmarks
- Actualizar el hook `useModulePrerequisites` para los nuevos modulos
- Actualizar las referencias en el Dashboard de accesos rapidos
- Considerar agregar un toggle para "Vista Avanzada" que muestre todos los modulos originales para usuarios que lo prefieran
