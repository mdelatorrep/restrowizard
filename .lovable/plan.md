
# Plan: Mejoras al Modulo de Inventarios - Alineacion con Referentes Globales

## Resumen Ejecutivo

El modulo actual de inventarios tiene una buena base enterprise con multiples funcionalidades. Sin embargo, tras comparar con los lideres globales (MarketMan, WISK, BlueCart, Lightspeed), he identificado brechas criticas que afectan la funcionalidad end-to-end.

---

## Analisis del Estado Actual

### Funcionalidades Existentes (Lo que ya funciona bien)

| Funcionalidad | Estado | Calidad |
|--------------|--------|---------|
| Items de inventario con par levels | Completo | Buena |
| Ubicaciones de almacenamiento | Completo | Buena |
| Proveedores con calificacion | Completo | Buena |
| Ordenes de compra basicas | Completo | Media |
| Generacion automatica desde par levels | Completo | Buena |
| Conteos fisicos con varianza | Completo | Buena |
| Registro de mermas | Completo | Buena |
| Escaneo de codigo de barras (manual) | Completo | Media |
| Historial de movimientos | Completo | Buena |
| Analisis IA de inventario | Completo | Buena |
| Buscador de proveedores IA | Completo | Buena |

### Brechas Criticas Identificadas

| Gap | Referente | Impacto |
|-----|-----------|---------|
| Deduccion automatica POS no visible | MarketMan, Rezku | Alto - los usuarios no ven las deducciones |
| FIFO sin implementacion UI | WISK, BlueCart | Alto - productos vencen sin control visual |
| Recepcion de OC sin captura de lotes | MarketMan | Medio - trazabilidad incompleta |
| Escaner camara no implementado | WISK | Alto - escaner actual solo acepta texto |
| Dashboard de items criticos faltante | MarketMan | Medio - alertas dispersas |
| Historial de precios sin graficas | BlueCart | Bajo - datos existen pero no se visualizan |
| Transferencias entre ubicaciones sin UI | WISK | Medio - funcion existe pero no accesible |
| Integracion recetas-inventario opaca | MarketMan | Alto - usuarios no entienden el flujo |

---

## Plan de Mejoras Ordenado por Prioridad

### Fase 1: Funcionalidad Critica (Prioridad Alta)

#### 1.1 Dashboard de Alertas Criticas

Agregar una seccion prominente al inicio del modulo que muestre:

- Items vencidos o por vencer (proximos 7 dias)
- Items agotados
- Items bajo par level
- OC pendientes de recepcion
- Conteos vencidos (mas de 30 dias sin contar)

**Archivos a modificar:**
- `src/pages/restaurant/Inventory.tsx` - Agregar componente de alertas antes de los KPIs actuales

**Nuevo componente:**
- `src/components/inventory/CriticalAlertsPanel.tsx`

#### 1.2 Mejora de Recepcion de Ordenes de Compra

El flujo actual de recepcion es demasiado simple. Los referentes permiten:
- Captura de lote y vencimiento por item recibido
- Recepcion parcial con tracking de pendientes
- Vista detallada de items de la OC

**Archivos a modificar:**
- `src/components/inventory/PurchaseOrdersManager.tsx` - Agregar dialog de recepcion detallada
- `src/hooks/useEnterpriseInventory.ts` - Ya tiene `receivePurchaseOrder`, ajustar para UI

**Nuevo componente:**
- `src/components/inventory/ReceiveOrderDialog.tsx`

#### 1.3 Vista FIFO y Gestion de Vencimientos

Agregar una vista dedicada para:
- Ver todos los lotes por item ordenados FIFO
- Alertas visuales de vencimiento inminente
- Accion rapida para registrar merma por vencimiento

**Nuevo componente:**
- `src/components/inventory/ExpirationTracker.tsx`

**Modificacion:**
- Agregar tab "Vencimientos" al modulo principal

#### 1.4 Panel de Integracion Recetas-Inventario

Hacer visible el flujo de deduccion automatica:
- Mostrar que recetas estan vinculadas a items
- Vista de "Que pasa cuando vendo X"
- Log de deducciones recientes

**Nuevo componente:**
- `src/components/inventory/RecipeIntegrationPanel.tsx`

### Fase 2: Mejoras de Usabilidad (Prioridad Media)

#### 2.1 Escaner con Camara

Implementar escaner real usando la API de MediaDevices:
- Uso de libreria `@mantine/hooks` o `quagga2` para decodificacion
- Fallback al input manual actual
- Soporte para escaneo continuo en conteos

**Archivos a modificar:**
- `src/components/inventory/BarcodeScanner.tsx` - Agregar modo camara

#### 2.2 Dialog de Transferencias entre Ubicaciones

Exponer la funcion `transferInventory` existente con UI:
- Seleccion de item, origen y destino
- Cantidad a transferir
- Historial de transferencias

**Nuevo componente:**
- `src/components/inventory/TransferDialog.tsx`

#### 2.3 Grafica de Historial de Precios

Visualizar la tabla `inventory_price_history`:
- Grafica de linea por proveedor
- Comparativa de precios entre proveedores
- Alerta cuando precio sube mas de X%

**Nuevo componente:**
- `src/components/inventory/PriceHistoryChart.tsx`

#### 2.4 Vista Detallada de Item

Al hacer click en un item, mostrar panel lateral con:
- Todos los lotes (FIFO)
- Historial de movimientos
- Historial de precios
- Recetas que lo usan
- Proveedores alternativos

**Nuevo componente:**
- `src/components/inventory/InventoryItemDetail.tsx`

### Fase 3: Mejoras Avanzadas (Prioridad Baja)

#### 3.1 Conteo por Escaneo

Durante un conteo fisico, permitir:
- Escanear codigo de barras
- Ingresar cantidad contada
- Marcar item automaticamente

**Archivos a modificar:**
- `src/components/inventory/InventoryCountsManager.tsx`

**Nuevo componente:**
- `src/components/inventory/CountingSession.tsx`

#### 3.2 Reportes de Inventario

Agregar tab de reportes con:
- Reporte de valoracion (valor total por categoria/ubicacion)
- Reporte de rotacion (dias de inventario promedio)
- Reporte de mermas (tendencias mensuales)
- Export a PDF/Excel

**Nuevo componente:**
- `src/components/inventory/InventoryReports.tsx`

#### 3.3 Ordenes de Compra Automaticas

Envio automatico de OC cuando items bajan del reorder point:
- Configuracion por proveedor
- Dias de pedido automatico
- Notificaciones de confirmacion

**Requiere:**
- Nuevo edge function para automatizacion
- Tabla de configuracion de auto-orders

---

## Cambios Tecnicos Detallados

### Nuevos Componentes (9 total)

```text
src/components/inventory/
  CriticalAlertsPanel.tsx      - Panel de alertas criticas
  ReceiveOrderDialog.tsx       - Recepcion detallada de OC
  ExpirationTracker.tsx        - Vista FIFO y vencimientos
  RecipeIntegrationPanel.tsx   - Vinculo recetas-inventario
  TransferDialog.tsx           - Transferencias entre ubicaciones
  PriceHistoryChart.tsx        - Grafica de precios historicos
  InventoryItemDetail.tsx      - Vista detallada de item
  CountingSession.tsx          - Sesion de conteo con escaneo
  InventoryReports.tsx         - Reportes y exports
```

### Modificaciones a Archivos Existentes

| Archivo | Cambios |
|---------|---------|
| `src/pages/restaurant/Inventory.tsx` | Agregar tabs de Vencimientos, Recetas, Reportes; Integrar alertas |
| `src/components/inventory/BarcodeScanner.tsx` | Agregar modo camara con MediaDevices |
| `src/components/inventory/PurchaseOrdersManager.tsx` | Integrar ReceiveOrderDialog |
| `src/components/inventory/InventoryCountsManager.tsx` | Agregar modo de conteo por escaneo |
| `src/hooks/useEnterpriseInventory.ts` | Agregar queries para FIFO, vinculos recetas |

### Dependencias Nuevas Sugeridas

```text
quagga2 - Decodificacion de codigos de barras via camara
date-fns - Ya instalado, uso extendido para calculos FIFO
```

---

## Estructura Final del Modulo

```text
Tabs principales:
1. Inventario (items, busqueda, stock)
2. Ubicaciones (almacenes, zonas)
3. Proveedores (directorio, calificaciones)
4. Compras (OC, recepcion, historial)
5. Conteos (auditorias, varianzas)
6. Mermas (registro, analisis)
7. Vencimientos (FIFO, alertas) [NUEVO]
8. Recetas (vinculos, deducciones) [NUEVO]
9. Reportes (valoracion, rotacion) [NUEVO]
```

---

## Orden de Implementacion Sugerido

1. CriticalAlertsPanel - Visibilidad inmediata de problemas
2. ReceiveOrderDialog - Completar flujo de compras
3. ExpirationTracker - Control FIFO critico para restaurantes
4. InventoryItemDetail - Vista 360 de cada item
5. RecipeIntegrationPanel - Transparencia en deducciones
6. TransferDialog - Operaciones entre ubicaciones
7. BarcodeScanner con camara - Eficiencia operativa
8. PriceHistoryChart - Analisis de costos
9. CountingSession - Mejora de auditorias
10. InventoryReports - Reportes ejecutivos

---

## Metricas de Exito

- Reduccion de items vencidos sin detectar
- Tiempo promedio de conteo fisico
- Precision de inventario (varianza en conteos)
- Visibilidad del costo de merma
- Uso de ordenes de compra automaticas

