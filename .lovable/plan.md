
# RestroLearn - El Platzi de la Industria Gastronomica

## Vision

Transformar RestroLearn de un catalogo basico de cursos a una **plataforma de formacion profesional completa** para la industria gastronomica. Inspirada en el modelo de Platzi (learning paths, progreso visual, comunidad) pero enfocada en resolver los dolores reales del sector: alta rotacion (80% por factores emocionales), falta de capacitacion estandarizada, ausencia de carrera profesional visible, y desconexion emocional con la industria.

### Dolores Principales que Resuelve

1. **Rotacion masiva**: 8 de cada 10 renuncias son emocionales - no hay crecimiento visible
2. **Onboarding inexistente**: cada restaurante entrena "a la carrera", sin estructura
3. **Certificaciones fragmentadas**: HACCP, manipulacion de alimentos, etc. son caras y desconectadas
4. **Sin carrera profesional**: un mesero no ve como llegar a maitre o gerente
5. **Contenido desactualizado**: manuales impresos que nadie lee
6. **Barrera idiomatica**: todo el contenido de calidad esta en ingles

---

## Parte 1: Base de Datos - Nuevas Tablas

### Nueva tabla: `learning_tracks`
Rutas de aprendizaje (el equivalente a "learning paths" de Platzi).

| Campo | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| title | text NOT NULL | "De Mesero a Maitre", "Chef Ejecutivo" |
| slug | text UNIQUE | URL amigable |
| description | text | Descripcion larga |
| short_description | text | Descripcion corta |
| target_role | text | Rol objetivo: "mesero", "chef", "bartender", "gerente" |
| difficulty | text DEFAULT 'beginner' | beginner, intermediate, advanced |
| estimated_weeks | integer | Duracion estimada en semanas |
| courses_count | integer DEFAULT 0 | Numero de cursos incluidos |
| enrollments_count | integer DEFAULT 0 | Inscritos |
| thumbnail_url | text | Imagen |
| icon_emoji | text | Emoji representativo |
| is_published | boolean DEFAULT false | |
| is_featured | boolean DEFAULT false | |
| order_index | integer DEFAULT 0 | Orden de despliegue |
| created_at | timestamptz | |

### Nueva tabla: `learning_track_courses`
Relacion N:N entre tracks y cursos (con orden).

| Campo | Tipo |
|---|---|
| id | uuid PK |
| track_id | uuid FK -> learning_tracks |
| course_id | uuid FK -> training_courses |
| order_index | integer DEFAULT 0 |
| is_mandatory | boolean DEFAULT true |

### Nueva tabla: `course_lessons`
Lecciones individuales dentro de un curso (modulos/clases).

| Campo | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| course_id | uuid FK -> training_courses | |
| title | text NOT NULL | Titulo de la leccion |
| description | text | |
| content_type | text DEFAULT 'text' | text, video, quiz, ai_interactive |
| content | text | Contenido en markdown o HTML |
| video_url | text | URL de video si aplica |
| duration_minutes | integer DEFAULT 10 | Duracion estimada |
| order_index | integer DEFAULT 0 | Orden dentro del curso |
| is_free_preview | boolean DEFAULT false | Vista previa gratuita |
| ai_generated | boolean DEFAULT false | Generado por IA |
| created_at | timestamptz | |

### Nueva tabla: `lesson_progress`
Progreso del estudiante por leccion.

| Campo | Tipo |
|---|---|
| id | uuid PK |
| user_id | uuid NOT NULL |
| lesson_id | uuid FK -> course_lessons |
| course_id | uuid FK -> training_courses |
| is_completed | boolean DEFAULT false |
| completed_at | timestamptz |
| time_spent_seconds | integer DEFAULT 0 |
| quiz_score | integer |
| created_at | timestamptz |
| UNIQUE(user_id, lesson_id) |

### Nueva tabla: `course_reviews`
Resenas de cursos por estudiantes.

| Campo | Tipo |
|---|---|
| id | uuid PK |
| user_id | uuid NOT NULL |
| course_id | uuid FK -> training_courses |
| rating | integer NOT NULL (1-5) |
| comment | text |
| created_at | timestamptz |
| UNIQUE(user_id, course_id) |

### Nueva tabla: `course_certificates`
Certificados emitidos al completar cursos/tracks.

| Campo | Tipo |
|---|---|
| id | uuid PK |
| user_id | uuid NOT NULL |
| course_id | uuid FK (nullable) |
| track_id | uuid FK (nullable) |
| certificate_type | text | course, track |
| certificate_number | text UNIQUE | Numero unico |
| issued_at | timestamptz |
| metadata | jsonb | datos adicionales: nombre, puntaje, etc. |

### Modificacion: tabla `training_courses`
Agregar campos para soportar lecciones y contenido IA:

| Campo nuevo | Tipo | Descripcion |
|---|---|---|
| lessons_count | integer DEFAULT 0 | Total de lecciones |
| total_duration_minutes | integer DEFAULT 0 | Duracion total |
| instructor_name | text | Nombre del instructor |
| instructor_bio | text | Bio del instructor |
| instructor_photo_url | text | Foto |
| what_you_learn | text[] | Lo que aprenderas (bullets) |
| requirements | text[] | Requisitos previos |
| tags | text[] | Tags de busqueda |
| completion_certificate | boolean DEFAULT true | Emite certificado |
| ai_generated_content | boolean DEFAULT false | Contenido generado con IA |

### Modificacion: tabla `course_enrollments`
Agregar campos de progreso detallado:

| Campo nuevo | Tipo |
|---|---|
| lessons_completed | integer DEFAULT 0 |
| total_lessons | integer DEFAULT 0 |
| last_lesson_id | uuid |
| certificate_id | uuid FK -> course_certificates |
| enrolled_via | text DEFAULT 'direct' | direct, track, employer |

### RLS Policies

- **learning_tracks**: SELECT publico (is_published = true); INSERT/UPDATE/DELETE solo admin
- **learning_track_courses**: SELECT publico; INSERT/UPDATE/DELETE solo admin
- **course_lessons**: SELECT para inscritos o si is_free_preview = true; INSERT/UPDATE/DELETE solo admin
- **lesson_progress**: solo propietario (user_id = auth.uid())
- **course_reviews**: SELECT publico; INSERT/UPDATE/DELETE propietario
- **course_certificates**: SELECT propietario; INSERT via trigger/function

---

## Parte 2: Experiencia del Estudiante

### 2.1 Pagina principal rediseñada (`/learn`)

**Hero**: Logo RestroLearn + headline motivacional ("Enamorate de nuevo de la gastronomia. Crece con cada leccion.")

**Seccion "Learning Tracks" (Rutas de Aprendizaje)**: 
Cards horizontales con la ruta completa visualizada:
- "De Ayudante a Chef de Partida" (8 cursos, 12 semanas)
- "Mesero a Maitre: El Arte del Servicio" (6 cursos, 8 semanas)
- "Bartender Profesional" (5 cursos, 6 semanas)
- "Gestion de Restaurantes" (10 cursos, 16 semanas)
- "Marketing Gastronomico Digital" (4 cursos, 5 semanas)
- "Emprendimiento Gastronomico" (7 cursos, 10 semanas)

**Seccion "Cursos Populares"**: Grid de cursos con progreso si el usuario esta inscrito

**Seccion "Generar Curso con IA"**: CTA para que restaurantes o instructores generen contenido de formacion con IA (titulo + descripcion -> IA genera modulos, lecciones, quizzes)

**Seccion "Certificaciones"**: Certificaciones oficiales disponibles

**Seccion CTA**: "¿Eres restaurante? Capacita a tu equipo con RestroLearn desde RestroWizard"

### 2.2 Pagina de detalle del track (`/learn/track/:slug`)

Vista completa de la ruta de aprendizaje:
- Nombre, descripcion, duracion estimada, nivel
- Lista de cursos incluidos con orden y duracion
- Progreso del usuario si esta inscrito
- Boton "Iniciar Ruta" o "Continuar"
- Testimonios de egresados

### 2.3 Pagina de detalle del curso (`/learn/course/:id`)

Vista completa del curso:
- Info del instructor (nombre, foto, bio)
- Lo que aprenderas (bullets)
- Requisitos previos
- Indice de lecciones (con preview gratuito marcado)
- Resenas y rating
- Boton "Inscribirse" o "Continuar Leccion X"
- Barra de progreso si esta inscrito

### 2.4 Visor de leccion (`/learn/course/:id/lesson/:lessonId`)

Experiencia de aprendizaje inmersiva:
- Contenido en markdown renderizado (texto + imagenes)
- Video embebido si aplica
- Quiz interactivo si el tipo es "quiz"
- Leccion interactiva con IA si el tipo es "ai_interactive" (el estudiante puede hacer preguntas sobre el contenido y la IA responde contextualmente)
- Navegacion anterior/siguiente leccion
- Checkbox "Marcar como completada"
- Barra de progreso del curso

### 2.5 Dashboard del estudiante (`/learn/mi-progreso`)

Panel personal:
- **Cursos activos**: con barra de progreso y boton "Continuar"
- **Tracks activos**: progreso visual de la ruta
- **Certificados obtenidos**: con opcion de descargar
- **Estadisticas**: horas de estudio, cursos completados, racha de dias
- **Recomendaciones IA**: cursos sugeridos basados en el perfil y progreso

---

## Parte 3: Generacion de Contenido con IA

### Edge Function: `learn-ai-content`

Funcionalidad para generar contenido de cursos con IA:

**Modo 1 - Generar estructura de curso**:
- Input: titulo del curso, categoria, nivel objetivo, rol destino
- Output: estructura completa con modulos, lecciones, descripciones, duracion estimada

**Modo 2 - Generar contenido de leccion**:
- Input: titulo de la leccion, contexto del curso, nivel
- Output: contenido en markdown (teoria, ejemplos practicos, tips), quiz de 5 preguntas

**Modo 3 - Tutor IA interactivo**:
- Input: contenido de la leccion + pregunta del estudiante
- Output: respuesta contextualizada al contenido de esa leccion

**Modo 4 - Recomendaciones personalizadas**:
- Input: perfil del usuario, historial de cursos, progreso
- Output: 3-5 cursos/tracks recomendados con justificacion

---

## Parte 4: Panel Admin (CoursesAdminPanel mejorado)

Enriquecer el panel existente en Settings > Ecosistema > RestroLearn:

### Sub-tabs del admin:
1. **Cursos**: CRUD existente + nuevos campos (instructor, what_you_learn, requirements, tags)
2. **Lecciones**: Gestion de lecciones por curso (reordenar, editar contenido, marcar preview)
3. **Tracks**: Crear/editar rutas de aprendizaje, asignar cursos con orden
4. **Generador IA**: Interfaz para generar cursos y lecciones completas con IA
5. **Certificados**: Ver certificados emitidos
6. **Resenas**: Moderar resenas de estudiantes

---

## Parte 5: Archivos a Crear y Modificar

### Archivos nuevos
- `src/pages/learn/LearnHome.tsx` - Pagina principal rediseñada
- `src/pages/learn/TrackDetail.tsx` - Detalle de ruta de aprendizaje
- `src/pages/learn/CourseDetail.tsx` - Detalle de curso con lecciones
- `src/pages/learn/LessonViewer.tsx` - Visor de leccion inmersivo
- `src/pages/learn/StudentDashboard.tsx` - Dashboard del estudiante
- `src/components/learn/TrackCard.tsx` - Card de ruta de aprendizaje
- `src/components/learn/CourseCard.tsx` - Card de curso mejorada
- `src/components/learn/LessonSidebar.tsx` - Indice lateral de lecciones
- `src/components/learn/ProgressRing.tsx` - Anillo de progreso visual
- `src/components/learn/QuizComponent.tsx` - Componente de quiz interactivo
- `src/components/learn/AITutor.tsx` - Chat contextual con IA dentro de la leccion
- `src/components/learn/CertificateCard.tsx` - Card de certificado
- `src/components/learn/CourseReviewForm.tsx` - Formulario de resena
- `src/components/admin/LearnAdminPanel.tsx` - Panel admin con sub-tabs
- `src/components/admin/LessonsManager.tsx` - CRUD de lecciones
- `src/components/admin/TracksManager.tsx` - CRUD de tracks
- `src/components/admin/AIContentGenerator.tsx` - Generador de contenido con IA
- `src/hooks/useLearnData.ts` - Hook para datos de cursos, tracks, progreso
- `src/hooks/useLessonProgress.ts` - Hook para progreso de lecciones
- `supabase/functions/learn-ai-content/index.ts` - Edge function para generacion IA

### Archivos modificados
- `src/App.tsx` - Nuevas rutas: /learn (rediseñado), /learn/track/:slug, /learn/course/:id, /learn/course/:id/lesson/:lessonId, /learn/mi-progreso
- `src/pages/Learn.tsx` - Reemplazar con LearnHome (o redirigir)
- `src/components/admin/EcosystemAdminTab.tsx` - Reemplazar CoursesAdminPanel con LearnAdminPanel
- `src/components/admin/CoursesAdminPanel.tsx` - Enriquecer con nuevos campos
- `supabase/config.toml` - Agregar la nueva edge function

### Migraciones SQL
1. Crear tabla `learning_tracks` con RLS
2. Crear tabla `learning_track_courses` con RLS
3. Crear tabla `course_lessons` con RLS
4. Crear tabla `lesson_progress` con RLS
5. Crear tabla `course_reviews` con RLS
6. Crear tabla `course_certificates` con RLS
7. ALTER TABLE `training_courses` agregar campos nuevos
8. ALTER TABLE `course_enrollments` agregar campos nuevos
9. Trigger para actualizar `courses_count` en tracks
10. Trigger para actualizar `lessons_count` y `total_duration_minutes` en cursos
11. Trigger para recalcular `average_rating` en cursos al insertar review
12. Function para emitir certificado automaticamente al completar 100%

---

## Parte 6: Tracks de Formacion Pre-cargados (Seed Data)

### Track 1: "De Ayudante a Chef de Partida"
Cursos: Higiene y Manipulacion de Alimentos -> Tecnicas Basicas de Cocina -> Mise en Place Profesional -> Gestion de Estaciones -> Costos y Mermas -> Control de Calidad -> Liderazgo en Cocina -> Cocina Creativa

### Track 2: "Mesero a Maitre: El Arte del Servicio"
Cursos: Fundamentos del Servicio -> Protocolo de Mesa -> Vinos y Maridaje -> Manejo de Quejas -> Upselling Efectivo -> Liderazgo en Sala

### Track 3: "Bartender Profesional"
Cursos: Cocteleria Clasica -> Mixologia Avanzada -> Servicio de Bar -> Gestion de Inventario de Bar -> Tendencias en Bebidas

### Track 4: "Gestion de Restaurantes"
Cursos: Finanzas para Restaurantes -> Food Cost y Prime Cost -> Gestion de Personal -> Marketing Gastronomico -> Operaciones Diarias -> Tecnologia y POS -> Cadena de Suministro -> Normas Sanitarias -> Planificacion Estrategica -> Apertura de Nuevos Locales

### Track 5: "Marketing Gastronomico Digital"
Cursos: Redes Sociales para Restaurantes -> Fotografia Gastronomica -> Google My Business -> Delivery y Apps -> Email Marketing

### Track 6: "Emprendimiento Gastronomico"
Cursos: Modelo de Negocio -> Plan Financiero -> Busqueda de Local -> Diseno de Menu -> Marco Legal -> Marketing de Apertura -> Primeros 90 Dias

Cada track y sus cursos se crearan con datos seed en la migracion, incluyendo 3-5 lecciones iniciales generadas por IA por curso.
