
# Rediseno Completo de RestroJobs - Bolsa de Empleo Gastronomica Profesional

## Vision General

Transformar RestroJobs de un listado basico de empleos a una plataforma de empleo gastronomica completa inspirada en **OysterLink**, **Poached Jobs** y **Culinary Agents**. El sistema tendra dos experiencias diferenciadas:

1. **Candidatos** (publico): buscar empleos, crear perfil profesional, postularse, seguir estado
2. **Restaurantes** (desde RestroWizard): publicar ofertas, recibir CVs, gestionar pipeline de candidatos con IA

---

## Parte 1: Base de Datos - Nuevas Tablas y Cambios

### Nueva tabla: `candidate_profiles`
Perfil profesional del candidato (similar a un CV estructurado).

| Campo | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NOT NULL | Usuario autenticado |
| full_name | text NOT NULL | Nombre completo |
| headline | text | Titulo profesional ("Chef de Partida con 5 anos de experiencia") |
| bio | text | Resumen profesional |
| phone | text | Telefono |
| city | text | Ciudad |
| country | text DEFAULT 'Colombia' | Pais |
| years_experience | integer DEFAULT 0 | Anos de experiencia |
| desired_salary_min | integer | Salario deseado minimo |
| desired_salary_max | integer | Salario deseado maximo |
| desired_job_types | text[] | Tipos de empleo deseados |
| desired_categories | text[] | Categorias de interes |
| skills | text[] | Habilidades (ej: "Sushi", "Pasteleria", "POS") |
| certifications | text[] | Certificaciones (ej: "HACCP", "Manipulacion de alimentos") |
| languages | text[] | Idiomas |
| availability | text DEFAULT 'immediate' | immediate, 2_weeks, 1_month, negotiable |
| resume_url | text | URL del CV subido |
| photo_url | text | Foto de perfil |
| is_actively_looking | boolean DEFAULT true | Buscando activamente |
| profile_completeness | integer DEFAULT 0 | Porcentaje de completitud |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Nueva tabla: `candidate_experience`
Historial laboral del candidato.

| Campo | Tipo |
|---|---|
| id | uuid PK |
| candidate_id | uuid FK -> candidate_profiles |
| company_name | text NOT NULL |
| position | text NOT NULL |
| city | text |
| start_date | date |
| end_date | date (null = actual) |
| description | text |
| is_current | boolean DEFAULT false |

### Nueva tabla: `job_saved`
Empleos guardados/favoritos por candidatos.

| Campo | Tipo |
|---|---|
| id | uuid PK |
| user_id | uuid NOT NULL |
| job_id | uuid FK -> jobs |
| created_at | timestamptz |
| UNIQUE(user_id, job_id) |

### Modificacion: tabla `jobs`
Agregar campos para enriquecer las ofertas:

| Campo nuevo | Tipo | Descripcion |
|---|---|---|
| company_name | text | Nombre visible del restaurante |
| company_logo_url | text | Logo del restaurante |
| urgent | boolean DEFAULT false | Contratacion urgente |
| remote_option | text DEFAULT 'onsite' | onsite, hybrid, remote |
| responsibilities | text | Responsabilidades del puesto |
| skills_required | text[] | Habilidades requeridas |
| perks | text[] | Ventajas adicionales |

### Modificacion: tabla `job_applications`
Agregar campos para el pipeline de candidatos:

| Campo nuevo | Tipo | Descripcion |
|---|---|---|
| candidate_profile_id | uuid FK -> candidate_profiles | Perfil del candidato |
| applicant_name | text | Nombre (para referencia rapida) |
| applicant_email | text | Email |
| applicant_phone | text | Telefono |
| ai_match_score | integer | Puntuacion de compatibilidad IA (0-100) |
| ai_summary | text | Resumen generado por IA del candidato |
| interview_date | timestamptz | Fecha de entrevista programada |
| rejection_reason | text | Razon de rechazo |
| employer_notes | text | Notas internas del empleador |

### RLS Policies

- **candidate_profiles**: SELECT/INSERT/UPDATE/DELETE propietario (user_id = auth.uid()); SELECT publico para restaurantes con ofertas activas
- **candidate_experience**: mismas reglas que candidate_profiles via FK
- **job_saved**: solo propietario
- **jobs** (nuevos campos): mantener politicas existentes
- **job_applications** (nuevos campos): mantener politicas existentes

---

## Parte 2: Experiencia del Candidato (Pagina Publica `/jobs`)

### 2.1 Pagina principal rediseñada

**Hero**: Logo RestroJobs + barra de busqueda avanzada con:
- Busqueda por texto (titulo, empresa, descripcion)
- Filtro por ubicacion/ciudad
- Filtro por categoria (Cocina, Servicio, Gestion, etc.)
- Filtro por tipo de empleo (Tiempo completo, Medio tiempo, etc.)
- Filtro por nivel de experiencia
- Filtro por rango salarial
- Badge "Urgente" para contrataciones inmediatas

**Listado de empleos**: Cards rediseñadas con:
- Logo del restaurante (company_logo_url)
- Nombre del restaurante (company_name)
- Titulo del puesto, ubicacion, tipo, nivel
- Rango salarial (si visible)
- Tags de habilidades requeridas
- Badge "Urgente" si aplica
- Tiempo desde publicacion
- Boton "Guardar" (bookmark) y "Postularse"

**Sidebar de estadisticas**:
- Total de ofertas activas
- Categorias populares
- Ciudades con mas ofertas

### 2.2 Pagina de detalle del empleo (`/jobs/:id`)

Nueva ruta con vista completa de la oferta:
- Informacion del restaurante (nombre, logo)
- Descripcion completa, responsabilidades, requisitos
- Habilidades requeridas (tags)
- Beneficios y perks
- Rango salarial
- Tipo de empleo, nivel, modalidad
- Boton "Postularse" prominente
- Ofertas similares al final

### 2.3 Formulario de postulacion (Dialog)

Al hacer clic en "Postularse":
- Si no esta autenticado -> redirigir a /auth con retorno
- Si esta autenticado pero sin perfil de candidato -> invitar a crear perfil
- Si tiene perfil -> mostrar dialog de confirmacion con:
  - Resumen del perfil del candidato (pre-llenado)
  - Campo de carta de presentacion (textarea)
  - Opcion de subir CV especifico para esta oferta
  - Boton "Enviar postulacion"

### 2.4 Panel del candidato (`/jobs/my-applications`)

Dashboard personal del candidato con:
- **Mis Postulaciones**: lista con estado (Pendiente, En revision, Entrevista, Oferta, Contratado, Rechazado) con badges de colores
- **Empleos Guardados**: lista de bookmarks
- **Mi Perfil**: editor de perfil profesional completo
  - Datos personales
  - Experiencia laboral (agregar/editar/eliminar)
  - Habilidades y certificaciones (tags editables)
  - Subida de CV (PDF)
  - Barra de completitud del perfil
- **Alertas de empleo**: toggle para recibir notificaciones de nuevas ofertas en categorias de interes

---

## Parte 3: Experiencia del Restaurante (desde RestroWizard `/r/settings` > Ecosistema > RestroJobs)

### 3.1 Panel de gestion de ofertas (JobsAdminPanel mejorado)

Rediseno del panel actual con:
- Tabla enriquecida: titulo, categoria, ubicacion, tipo, postulaciones recibidas, vistas, estado, urgente, acciones
- Formulario de creacion mejorado con los nuevos campos (company_name auto-llenado desde brand, responsibilities, skills_required, perks, urgent, remote_option)
- Vista previa de como se vera la oferta en el portal publico
- Duplicar oferta existente

### 3.2 Pipeline de candidatos (nueva vista)

Al hacer clic en una oferta -> ver candidatos:
- **Tablero tipo Kanban** con columnas por estado: Pendiente -> En revision -> Entrevista -> Oferta -> Contratado / Rechazado
- Cada tarjeta de candidato muestra:
  - Nombre, foto, headline
  - Puntuacion de compatibilidad IA (badge de color)
  - Resumen IA del candidato
  - Boton para ver perfil completo
  - Boton para mover de estado (dropdown)
  - Campo de notas internas
  - Programar entrevista (date picker)
- Filtros por puntuacion IA y estado

### 3.3 Generacion de perfil con IA

Edge function `job-ai-profile` que:
- Recibe el CV (resume_url) + datos del perfil del candidato + descripcion de la oferta
- Genera:
  - **Match Score** (0-100): compatibilidad candidato-puesto
  - **Resumen ejecutivo**: 3-4 oraciones sobre por que es buen candidato
  - **Fortalezas y debilidades**: respecto a la oferta
- Se ejecuta automaticamente al recibir una nueva postulacion
- Resultados se guardan en `ai_match_score` y `ai_summary` de `job_applications`

---

## Parte 4: Archivos a Crear y Modificar

### Archivos nuevos
- `src/pages/JobDetail.tsx` - Pagina de detalle de empleo (/jobs/:id)
- `src/pages/CandidateDashboard.tsx` - Panel del candidato (/jobs/my-applications)
- `src/components/jobs/JobCard.tsx` - Card rediseñada para listado
- `src/components/jobs/JobFiltersPanel.tsx` - Panel lateral de filtros avanzados
- `src/components/jobs/ApplyDialog.tsx` - Dialog de postulacion
- `src/components/jobs/CandidateProfileEditor.tsx` - Editor de perfil profesional
- `src/components/jobs/CandidateExperienceForm.tsx` - Formulario de experiencia laboral
- `src/components/jobs/ApplicationStatusTracker.tsx` - Timeline visual del estado
- `src/components/jobs/SavedJobsList.tsx` - Lista de empleos guardados
- `src/components/admin/JobCandidatesPipeline.tsx` - Pipeline Kanban de candidatos
- `src/components/admin/CandidateCard.tsx` - Tarjeta de candidato en el pipeline
- `src/components/admin/CandidateProfileSheet.tsx` - Sheet lateral con perfil completo
- `src/hooks/useCandidateProfile.ts` - Hook para perfil de candidato
- `src/hooks/useJobApplications.ts` - Hook para postulaciones
- `src/hooks/useSavedJobs.ts` - Hook para empleos guardados
- `supabase/functions/job-ai-profile/index.ts` - Edge function para analisis IA

### Archivos modificados
- `src/App.tsx` - Nuevas rutas: /jobs/:id, /jobs/my-applications
- `src/pages/Jobs.tsx` - Rediseno completo con filtros avanzados y cards mejoradas
- `src/components/admin/JobsAdminPanel.tsx` - Enriquecer formulario + agregar acceso al pipeline
- `src/hooks/useJobs.ts` - Agregar nuevos campos y filtros

### Migraciones SQL
1. Crear tabla `candidate_profiles` con RLS
2. Crear tabla `candidate_experience` con RLS
3. Crear tabla `job_saved` con RLS
4. ALTER TABLE `jobs` agregar campos nuevos
5. ALTER TABLE `job_applications` agregar campos nuevos
6. Trigger para actualizar `profile_completeness` automaticamente
7. Trigger para incrementar `applications_count` en jobs al insertar aplicacion

---

## Parte 5: Restriccion Clave - Solo Restaurantes de RestroWizard

La restriccion ya esta implementada de forma natural:
- La tabla `jobs` requiere `employer_id` que es el `user_id` del restaurante registrado en RestroWizard
- Las politicas RLS validan `auth.uid() = employer_id` para crear/editar ofertas
- El panel de creacion de ofertas solo esta disponible dentro de `/r/settings` (requiere autenticacion y onboarding completado)
- En la pagina publica `/jobs`, el boton "Publicar Empleo" redirige al login y luego a la plataforma RestroWizard
- Se agregara un texto claro: "Solo restaurantes registrados en RestroWizard pueden publicar ofertas"
