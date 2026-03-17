
# Destacar Finanzas y Talento en la Homepage

## Problema
La homepage actual menciona finanzas y talento de forma muy generica:
- En ProductShowcase, solo hay una linea "Finanzas, inventario, talento y operaciones optimizados por IA" dentro de una feature generica de "Inteligencia artificial"
- En ResultsSection, solo "-30% Rotacion de personal" alude a talento
- No hay ninguna seccion que explique el valor concreto del control financiero (Prime Cost, P&L) ni la gestion de personal (turnos, ausencias, formacion)

Estos son los dos mayores dolores de un restaurantero y merecen visibilidad prominente.

## Solucion

Reemplazar la seccion **ProductShowcase** actual (3 features genericas + mockup) por una seccion de **"Dolores resueltos"** con 5 bloques que comunican los problemas reales y como la plataforma los resuelve, dando protagonismo a Finanzas y Talento.

### Estructura nueva de ProductShowcase

```text
+------------------------------------------+
|  "Todo lo que necesitas."                 |
|                                           |
|  [Finanzas]  [Talento]  [Operaciones]     |
|  [Digital]   [IA]                         |
|                                           |
|  Cada bloque:                             |
|  - Icono + Titulo del dolor               |
|  - Dato de la industria (ej: "97% lucha   |
|    con costos")                           |
|  - Que hace RestroWizard al respecto      |
|    (ej: "Prime Cost en tiempo real,       |
|     P&L automatizado, alertas de costos") |
+------------------------------------------+
```

### Los 5 bloques propuestos

1. **Control Financiero** (DollarSign)
   - Dolor: "El 38% de restaurantes no es rentable"
   - Solucion: "Prime Cost en tiempo real, Estado de Resultados (P&L) automatizado y alertas cuando tus costos se desbordan"

2. **Gestion de Talento** (Users)
   - Dolor: "El 45% no encuentra personal calificado"
   - Solucion: "Turnos inteligentes, control de ausencias, programas de formacion y beneficios que reducen la rotacion"

3. **Inventario y Proveedores** (Package)
   - Dolor: "30% de merma descontrolada"
   - Solucion: "Inventario con recetas vinculadas, deduccion automatica por venta y analisis de proveedores con IA"

4. **Presencia Digital** (Globe)
   - Dolor: "El 60% no tiene sitio web"
   - Solucion: "Sitio web, menu digital, reservas y delivery sin comisiones, listo en minutos"

5. **Copiloto IA** (Bot)
   - Dolor: "Decisiones basadas en intuicion"
   - Solucion: "Un copiloto que analiza tu operacion y te dice que hacer antes de que sea tarde"

### Actualizacion del mockup del dashboard

Reemplazar las 3 metricas genericas del mockup (Reservas/Pedidos/Rentabilidad) por metricas que reflejen finanzas y talento:
- **Prime Cost**: 58.2%
- **Costo laboral**: 22.1%
- **Staff activo hoy**: 12/14

El alert de IA se mantiene pero con un mensaje mas financiero:
- "Tu Prime Cost subio 3.2% esta semana. El costo de proteinas aumento un 15%. Te sugiero renegociar con tu proveedor."

### ResultsSection actualizada

Cambiar las 4 metricas para incluir finanzas y talento explicitamente:
- **-12%** Prime Cost promedio
- **-30%** Rotacion de personal
- **+23%** Rentabilidad neta
- **+500** Restaurantes activos

---

## Detalle Tecnico

### Archivos modificados
- **`src/components/ProductShowcase.tsx`** - Reescribir features array con los 5 bloques (finanzas, talento, inventario, digital, IA), actualizar mockup con metricas financieras, cambiar alert de IA
- **`src/components/ResultsSection.tsx`** - Actualizar los 4 metrics para incluir Prime Cost y Rentabilidad

### Paleta
Se mantiene la paleta sobria actual (purple-intense, purple-medium, lavender-light). Los 5 bloques usan todos el mismo estilo monocromatico, sin colores rainbow.

### Sin cambios de base de datos
Solo cambios de contenido en componentes frontend.
