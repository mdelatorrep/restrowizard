
# Plan: Modulo de Beneficios y Formacion para Empleados

## Resumen

Crear un modulo profesional de Beneficios y Formacion integrado en la pestana existente de Talento (`/r/talent`), inspirado en las mejores practicas de plataformas globales como **7shifts** (programas de formacion estructurados), **Typsy** (micro-aprendizaje en hospitalidad), **Jolt** (cumplimiento y compliance), **Wisetail** (gamificacion y leaderboards), y **Deputy** (gestion de beneficios de empleados).

---

## Que hacen los referentes globales

### Formacion (Training)
- **7shifts**: Programas de onboarding estructurados por posicion con checklists, seguimiento de progreso y notificaciones automaticas
- **Typsy**: Micro-lecciones de 5-10 minutos con video, quizzes y certificados digitales; catalogo de +1,500 cursos de hospitalidad
- **Wisetail**: Gamificacion con puntos, badges y leaderboards; rutas de aprendizaje personalizadas por rol
- **Jolt**: Cumplimiento normativo automatizado (seguridad alimentaria, manejo de alcohol, primeros auxilios); alertas de vencimiento

### Beneficios (Benefits)
- **7shifts**: Descuento en comidas (meal perks), acceso a salario anticipado (earned wage access)
- **Deputy**: Seguimiento de beneficios por empleado (salud, vacaciones, descuentos)
- **Toast**: Descuentos en comida del restaurante, bonos por rendimiento, programas de referidos

---

## Arquitectura del Modulo

Se agregaran **2 nuevas pestanas** al modulo de Talento existente (`/r/talent`):

```text
Talento y Turnos
┌──────────┬────────┬──────────────┬───────────┬────────────┬────────────┬──────────────┐
│  Equipo  │ Turnos │Disponibilidad│ Ausencias │ Plantillas │ Formacion  │ Beneficios   │
└──────────┴────────┴──────────────┴───────────┴────────────┴────────────┴──────────────┘
```

---

## 1. Nuevas Tablas de Base de Datos

### 1.1 `training_programs` - Programas de Formacion

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | ID del programa |
| user_id | UUID | Dueno del restaurante |
| title | TEXT | Nombre del programa |
| description | TEXT | Descripcion |
| category | TEXT | onboarding / food_safety / service / leadership / compliance / custom |
| position | TEXT | Posicion objetivo (chef, mesero, etc.) o NULL para todos |
| estimated_hours | NUMERIC | Duracion estimada |
| is_mandatory | BOOLEAN | Si es obligatorio |
| is_active | BOOLEAN | Si esta activo |
| content | JSONB | Contenido estructurado (modulos/lecciones) |
| passing_score | INT | Puntaje minimo para aprobar (0-100) |
| created_at | TIMESTAMPTZ | Fecha creacion |

### 1.2 `staff_training_progress` - Progreso Individual

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | ID del registro |
| user_id | UUID | Dueno del restaurante |
| staff_member_id | UUID FK | Empleado |
| training_program_id | UUID FK | Programa |
| status | TEXT | not_started / in_progress / completed / expired |
| progress_percent | INT | Porcentaje completado (0-100) |
| score | INT | Puntaje obtenido |
| started_at | TIMESTAMPTZ | Inicio |
| completed_at | TIMESTAMPTZ | Finalizacion |
| due_date | DATE | Fecha limite |
| modules_completed | JSONB | Detalle de modulos completados |
| notes | TEXT | Notas del supervisor |

### 1.3 `staff_benefits` - Beneficios de Empleados

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | ID |
| user_id | UUID | Dueno del restaurante |
| benefit_name | TEXT | Nombre del beneficio |
| benefit_type | TEXT | meal_discount / health / bonus / referral / transport / education / wellness / other |
| description | TEXT | Descripcion |
| value | NUMERIC | Valor monetario (si aplica) |
| value_type | TEXT | percentage / fixed / unlimited |
| eligibility_months | INT | Meses minimos de antiguedad |
| is_active | BOOLEAN | Si esta activo |
| applicable_positions | TEXT[] | Posiciones elegibles (NULL = todas) |

### 1.4 `staff_benefit_assignments` - Asignacion de Beneficios

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | UUID PK | ID |
| user_id | UUID | Dueno del restaurante |
| staff_member_id | UUID FK | Empleado |
| benefit_id | UUID FK | Beneficio |
| status | TEXT | active / paused / expired / revoked |
| start_date | DATE | Desde |
| end_date | DATE | Hasta (NULL = indefinido) |
| usage_count | INT | Veces usado (para tracking) |
| notes | TEXT | Notas |

### 1.5 Politicas RLS

- Todas las tablas: lectura/escritura solo para `user_id = auth.uid()`
- Consistente con el patron existente en `staff_members`, `staff_certifications`, etc.

---

## 2. Nuevos Componentes Frontend

### 2.1 `TrainingProgramsManager.tsx`
Componente principal de la pestana "Formacion":
- **KPIs superiores**: Tasa de completacion general, programas activos, empleados certificados, horas de formacion este mes
- **Lista de programas**: Cards con titulo, categoria, progreso agregado, cantidad de asignados
- **Vista de progreso por empleado**: Tabla con nombre, programa, porcentaje, estado, fecha limite
- **Alertas**: Programas vencidos, empleados sin formacion obligatoria

### 2.2 `CreateTrainingDialog.tsx`
Dialogo para crear/editar programas:
- Titulo, descripcion, categoria (con iconos)
- Selector de posicion objetivo
- Constructor de modulos/lecciones (drag & drop)
- Configuracion: obligatorio, puntaje minimo, duracion estimada
- Boton "Generar con IA" que usa Lovable AI para crear contenido basado en la categoria y posicion

### 2.3 `TrainingProgressCard.tsx`
Tarjeta individual de progreso:
- Avatar + nombre del empleado
- Barra de progreso circular
- Estado con badge de color
- Fecha limite con countdown
- Boton de marcar modulo como completado

### 2.4 `BenefitsManager.tsx`
Componente principal de la pestana "Beneficios":
- **KPIs**: Total beneficios activos, empleados cubiertos, costo mensual estimado, satisfaccion
- **Catalogo de beneficios**: Cards con tipo, valor, elegibilidad
- **Asignaciones**: Vista por empleado de sus beneficios activos
- **Recomendaciones IA**: Sugerencias basadas en antiguedad y rendimiento

### 2.5 `CreateBenefitDialog.tsx`
Dialogo para crear beneficios:
- Nombre, tipo (con iconos por categoria), descripcion
- Valor y tipo de valor
- Elegibilidad por antiguedad y posicion
- Templates predefinidos (descuento comida 50%, bono rendimiento, etc.)

### 2.6 `BenefitAssignmentPanel.tsx`
Panel para asignar beneficios:
- Lista de empleados elegibles (filtrada automaticamente por antiguedad y posicion)
- Checkbox multiple para asignacion masiva
- Estado de cada asignacion

---

## 3. Hook: `useStaffDevelopment.ts`

Hook centralizado para formacion y beneficios:
- `trainingPrograms`: Lista de programas
- `trainingProgress`: Progreso de todos los empleados
- `benefits`: Catalogo de beneficios
- `benefitAssignments`: Asignaciones activas
- CRUD para programas, progreso, beneficios y asignaciones
- KPIs calculados: tasa de completacion, costo de beneficios, compliance rate
- `generateTrainingContent(category, position)`: Genera contenido con IA

---

## 4. Integracion con IA (Lovable AI)

### 4.1 Generacion de Programas de Formacion
Usar la edge function `ai-restaurant-agent` existente con un nuevo tipo de consulta para:
- Generar programas completos de onboarding por posicion
- Crear cuestionarios de seguridad alimentaria
- Sugerir rutas de aprendizaje personalizadas basadas en el rendimiento del empleado

### 4.2 Recomendaciones de Beneficios
- Analizar metricas del equipo (rotacion, antiguedad, rendimiento)
- Sugerir beneficios competitivos segun tendencias de la industria
- Estimar impacto en retencion

---

## 5. Cambios en Archivos Existentes

### 5.1 `src/pages/restaurant/Talent.tsx`
- Agregar 2 nuevas pestanas: "Formacion" (GraduationCap) y "Beneficios" (Gift)
- Importar `TrainingProgramsManager` y `BenefitsManager`

### 5.2 `src/components/navigation/AppSidebar.tsx`
- No requiere cambios (ya tiene la entrada de "Talento y Turnos")

### 5.3 `src/hooks/useModulePrerequisites.ts`
- No requiere cambios (el modulo talent ya esta registrado)

---

## 6. Templates Predefinidos

### Programas de Formacion Preconfigurados
1. **Onboarding General** - 4 modulos: cultura, politicas, seguridad, servicio al cliente
2. **Seguridad Alimentaria** - HACCP, manipulacion, temperaturas, alergenos
3. **Servicio al Cliente** - Atencion, manejo de quejas, upselling, protocolo
4. **Barista/Bartender** - Tecnicas de preparacion, presentacion, maridaje
5. **Liderazgo** - Gestion de equipo, resolucion de conflictos, KPIs

### Beneficios Predefinidos
1. **Descuento Comida** - 50% en turno, 25% fuera de turno
2. **Bono por Rendimiento** - Mensual segun score > 85%
3. **Programa de Referidos** - Bono por referir candidato contratado
4. **Dia de Cumpleanos** - Dia libre adicional
5. **Desarrollo Profesional** - Presupuesto para cursos externos

---

## 7. Secuencia de Implementacion

1. Crear migracion de base de datos (4 tablas + RLS)
2. Crear hook `useStaffDevelopment.ts`
3. Crear componentes de Formacion (`TrainingProgramsManager`, `CreateTrainingDialog`, `TrainingProgressCard`)
4. Crear componentes de Beneficios (`BenefitsManager`, `CreateBenefitDialog`, `BenefitAssignmentPanel`)
5. Integrar nuevas pestanas en `Talent.tsx`
6. Agregar generacion de contenido con IA

---

## Seccion Tecnica

### Estructura de `content` JSONB en `training_programs`
```json
{
  "modules": [
    {
      "id": "mod-1",
      "title": "Introduccion",
      "description": "Conoce nuestra cultura",
      "lessons": [
        {
          "id": "les-1",
          "title": "Historia del restaurante",
          "type": "text",
          "content": "...",
          "duration_minutes": 10
        },
        {
          "id": "les-2",
          "title": "Quiz de cultura",
          "type": "quiz",
          "questions": [...],
          "duration_minutes": 5
        }
      ]
    }
  ]
}
```

### Patron de RLS (consistente con tablas existentes)
```sql
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own training programs"
  ON training_programs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Archivos Nuevos
- `supabase/migrations/[timestamp]_add_training_and_benefits.sql`
- `src/hooks/useStaffDevelopment.ts`
- `src/components/talent/TrainingProgramsManager.tsx`
- `src/components/talent/CreateTrainingDialog.tsx`
- `src/components/talent/TrainingProgressCard.tsx`
- `src/components/talent/BenefitsManager.tsx`
- `src/components/talent/CreateBenefitDialog.tsx`
- `src/components/talent/BenefitAssignmentPanel.tsx`

### Archivos Modificados
- `src/pages/restaurant/Talent.tsx` (agregar 2 tabs)
