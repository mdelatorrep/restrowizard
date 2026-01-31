
# Plan de Potenciación de Módulos con IA

## Resumen Ejecutivo

La plataforma RestroWizard cuenta con un agente IA central (`ai-restaurant-agent`) que ya potencia 5 módulos principales. Sin embargo, hay **12+ módulos operativos** que actualmente funcionan sin inteligencia artificial pero que tienen datos ricos que pueden beneficiarse enormemente de capacidades predictivas, de análisis y recomendación.

---

## Estado Actual de la Arquitectura IA

### Edge Function Central: `ai-restaurant-agent`

```text
┌─────────────────────────────────────────────────────────────┐
│                    ai-restaurant-agent                       │
├─────────────────────────────────────────────────────────────┤
│  Módulos Actuales:                                          │
│  ├── finances → analyze_profitability, detect_anomalies    │
│  ├── talent → staff_optimization, analyze_candidates        │
│  ├── operations → customer_insights                         │
│  ├── menu-inventory → menu_engineering, inventory_prediction│
│  └── sustainability → sustainability_analysis               │
├─────────────────────────────────────────────────────────────┤
│  Configuración:                                             │
│  • Modelo: gpt-4.1-mini                                     │
│  • Tool: web_search_preview (búsqueda en tiempo real)       │
│  • Max tokens: 2500                                         │
└─────────────────────────────────────────────────────────────┘
```

### Hook Cliente: `useAIAgent.ts`
- Abstracción para llamar al agente central
- Funciones específicas por módulo
- Manejo de loading y errores

---

## Módulos Sin Potenciación IA (Oportunidades)

### 1. Proveedores (`Suppliers.tsx`) - Alta Prioridad

**Datos disponibles:**
- Categorías de proveedores
- Tiempos de entrega (lead_time_days)
- Términos de pago
- Histórico de compras (vía inventario)

**Funciones IA propuestas:**
- `supplier_analysis`: Comparar proveedores por rendimiento, puntualidad y precio
- `supplier_negotiation_tips`: Generar puntos de negociación basados en volumen y mercado
- `alternative_suppliers_search`: Buscar proveedores alternativos usando web_search

**Prompt ejemplo:**
```
Analiza estos proveedores y recomienda estrategias de negociación:
- Proveedor A: Lead time 3 días, pago 30 días
- Proveedor B: Lead time 1 día, pago contado
Incluye precios de mercado actuales para [categoría].
```

---

### 2. Inventarios (`Inventory.tsx`) - Alta Prioridad

**Datos disponibles:**
- Stock actual vs punto de reorden
- Costos unitarios
- Categorías de productos
- Proveedor asociado

**Funciones IA propuestas:**
- `reorder_optimization`: Cantidades óptimas de pedido por producto
- `expiry_prediction`: Predicción de caducidad y desperdicio
- `cost_trend_analysis`: Detectar tendencias de precios de ingredientes

**Integración:**
- Agregar botón "Análisis IA" junto a "Actualizar"
- Mostrar panel de insights similar a FinancesAIModule

---

### 3. Domicilios/Delivery (`Delivery.tsx`) - Alta Prioridad

**Datos disponibles:**
- Órdenes por estado
- Tiempos de entrega
- Direcciones de clientes
- Histórico de pedidos

**Funciones IA propuestas:**
- `delivery_route_optimization`: Optimizar rutas de entrega
- `demand_forecast`: Predecir demanda por zona y horario
- `delivery_time_estimation`: Estimar tiempos realistas de entrega
- `driver_performance`: Analizar rendimiento de repartidores

**Prompt ejemplo:**
```
Analiza estos pedidos de delivery y optimiza:
- Zonas con mayor demanda
- Horarios pico
- Tiempo promedio de entrega actual
Sugiere mejoras operativas específicas.
```

---

### 4. Fidelización/Loyalty (`Loyalty.tsx`) - Alta Prioridad

**Datos disponibles:**
- Puntos por cliente
- Historial de compras
- Tiers (VIP, Regular, Ocasional)
- Riesgo de abandono (churn_risk_score)
- Días desde última compra

**Funciones IA propuestas:**
- `churn_prevention`: Estrategias personalizadas para clientes en riesgo
- `loyalty_tier_recommendations`: Sugerir promociones por tier
- `personalized_offers`: Generar ofertas personalizadas por cliente
- `ltv_optimization`: Estrategias para aumentar lifetime value

**Prompt ejemplo:**
```
Estos clientes están en riesgo de abandono:
- Cliente A: 45 días sin comprar, $500k LTV
- Cliente B: 60 días sin comprar, $200k LTV
Genera campañas de recuperación personalizadas con incentivos apropiados.
```

---

### 5. Recetas (`Recipes.tsx`) - Media Prioridad

**Datos disponibles:**
- Ingredientes y cantidades
- Costos por porción
- Tiempo de preparación
- Dificultad

**Funciones IA propuestas:**
- `recipe_optimization`: Optimizar costos sin afectar calidad
- `ingredient_substitution`: Sugerir sustitutos más económicos
- `menu_pairing`: Recomendar maridajes y combos
- `nutritional_analysis`: Análisis nutricional estimado

---

### 6. Reservaciones (`Reservations.tsx`) - Media Prioridad

**Datos disponibles:**
- Historial de reservas
- Tasas de no-show
- Tamaño de grupos
- Horas pico

**Funciones IA propuestas:**
- `no_show_prediction`: Predecir probabilidad de no-show
- `capacity_optimization`: Optimizar capacidad por hora
- `confirmation_templates`: Generar mensajes de confirmación personalizados
- `overbooking_strategy`: Estrategia de overbooking inteligente

---

### 7. Feedback (`Feedback.tsx`) - Media Prioridad

**Datos disponibles:**
- Ratings y comentarios
- Análisis de sentimiento (ya existe)
- Sugerencias de respuesta IA (parcialmente implementado)

**Funciones IA propuestas:**
- `trend_analysis`: Detectar tendencias en comentarios
- `improvement_priorities`: Priorizar mejoras basadas en feedback
- `response_generation`: Mejorar generación de respuestas (ya existe pero expandir)
- `competitor_comparison`: Comparar con benchmarks de la industria

---

### 8. Turnos/Staff Schedule (`StaffSchedule.tsx`) - Media Prioridad

**Datos disponibles:**
- Turnos programados vs reales
- Horas por empleado
- Costos de labor
- Tasas de cumplimiento

**Funciones IA propuestas:**
- `schedule_optimization`: Optimizar horarios según demanda histórica
- `overtime_prediction`: Predecir horas extra
- `coverage_analysis`: Análisis de cobertura por hora
- `labor_cost_forecast`: Pronóstico de costos laborales

---

## Arquitectura Propuesta

### Opción A: Expandir Edge Function Existente (Recomendada)

Agregar nuevos módulos al `ai-restaurant-agent`:

```typescript
// Nuevos cases en switch(module)
case 'suppliers':
  systemPrompt = `Eres un experto en gestión de cadena de suministro 
  para restaurantes con acceso a búsqueda web...`;
  break;

case 'delivery':
  systemPrompt = `Eres un especialista en logística y delivery 
  para restaurantes...`;
  break;

case 'loyalty':
  systemPrompt = `Eres un experto en marketing de retención y 
  programas de fidelización...`;
  break;

// etc.
```

### Opción B: Edge Functions Especializadas

Crear funciones dedicadas para módulos complejos:
- `ai-delivery-optimizer` - Para análisis de rutas complejos
- `ai-loyalty-engine` - Ya existe parcialmente
- `ai-supplier-analyzer` - Ya existe, potenciar

---

## Implementación por Fases

### Fase 1: Módulos de Alto Impacto (Semana 1-2)
1. **Proveedores**: Análisis y negociación
2. **Inventarios**: Predicción y optimización de pedidos
3. **Delivery**: Demanda y optimización de rutas
4. **Loyalty**: Prevención de churn y ofertas personalizadas

### Fase 2: Módulos de Operaciones (Semana 3-4)
5. **Turnos**: Optimización de horarios
6. **Reservaciones**: Predicción de no-shows
7. **Feedback**: Análisis de tendencias

### Fase 3: Módulos Complementarios (Semana 5-6)
8. **Recetas**: Optimización de costos
9. **POS**: Análisis de patrones de venta
10. **Cocina (KDS)**: Predicción de tiempos

---

## Cambios Técnicos Requeridos

### 1. Actualizar Edge Function (`ai-restaurant-agent/index.ts`)

```typescript
// Agregar nuevos módulos
type AIModule = 
  | 'finances' | 'talent' | 'operations' 
  | 'menu-inventory' | 'sustainability'
  // Nuevos:
  | 'suppliers' | 'delivery' | 'loyalty' 
  | 'reservations' | 'feedback' | 'staff-schedule' 
  | 'recipes';
```

### 2. Actualizar Hook (`useAIAgent.ts`)

```typescript
// Agregar nuevas funciones
const analyzeSuppliers = async (supplierData: any) => {
  return await callAIAgent({
    module: 'suppliers',
    action: 'supplier_analysis',
    data: supplierData
  });
};

const predictDeliveryDemand = async (deliveryData: any) => {
  return await callAIAgent({
    module: 'delivery',
    action: 'demand_forecast',
    data: deliveryData
  });
};

// ... etc
```

### 3. Actualizar Componentes de Página

Cada módulo necesitará:
- Importar `useAIAgent`
- Agregar estado para `aiInsights`
- Agregar botón "Análisis IA"
- Agregar panel de visualización de insights

### 4. Migrar a Lovable AI (Opcional pero Recomendado)

Actualmente usa `OPENAI_API_KEY` directo. Migrar a Lovable AI Gateway:
- Cambiar endpoint a `https://ai.gateway.lovable.dev/v1/chat/completions`
- Usar `LOVABLE_API_KEY` (ya disponible automáticamente)
- Modelo recomendado: `google/gemini-3-flash-preview`

---

## Estimación de Impacto

| Módulo | Valor Agregado | Complejidad |
|--------|---------------|-------------|
| Proveedores | Alto (reducción costos 5-15%) | Baja |
| Inventarios | Alto (reducción desperdicio 10-20%) | Media |
| Delivery | Alto (mejora tiempos 15-25%) | Media |
| Loyalty | Muy Alto (retención +20%) | Media |
| Turnos | Medio (ahorro labor 5-10%) | Baja |
| Reservaciones | Medio (reducción no-shows 30%) | Baja |
| Feedback | Medio (mejora satisfacción) | Baja |
| Recetas | Medio (optimización costos) | Baja |

---

## Próximos Pasos

1. Confirmar prioridades de módulos
2. Implementar Fase 1 (4 módulos prioritarios)
3. Agregar prompts especializados al agente
4. Integrar botones y paneles IA en cada página
5. Considerar migración a Lovable AI para mejor rendimiento y costo
