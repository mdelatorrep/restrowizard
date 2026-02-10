

# Reajuste del Portal Administrativo del Ecosistema

## Problema Actual

El panel de administracion del ecosistema esta **escondido** dentro de Configuracion > Ecosistema (una tab anidada dentro de otra tab). Ademas tiene varias carencias:

1. **RestroJobs**: Funcional, tiene CRUD de empleos y pipeline de candidatos, pero le falta estadisticas globales y gestion de perfiles de candidatos
2. **RestroLearn**: Bien estructurado con sub-tabs (Cursos, Lecciones, Rutas, Generador IA), pero le falta gestion de certificados, resenas e inscripciones
3. **RestroServices**: Solo tiene CRUD basico de proveedores - **no tiene gestion de solicitudes, propuestas, resenas ni portafolios** del marketplace que ya se implemento
4. **RestroGrowth**: Solo muestra pre-registros - correcto para su estado actual (proximamente)

## Solucion

### 1. Separar el Ecosistema como pagina independiente en el sidebar

Mover el admin del ecosistema de `/r/settings > Ecosistema` a una ruta dedicada `/r/ecosystem-admin` con su propio item en el sidebar, dentro del grupo "Expansion" (junto a Ghost Kitchen y Cadenas). Esto le da la visibilidad que merece y elimina la navegacion anidada.

### 2. Enriquecer RestroServices Admin con sub-tabs

Convertir `ProvidersAdminPanel` en un panel con sub-tabs, similar a lo que ya tiene LearnAdminPanel:

- **Proveedores**: CRUD existente mejorado con los campos nuevos (headline, years_in_business, certifications, service_areas)
- **Solicitudes**: Ver/moderar todas las `service_requests` del marketplace - con filtros por estado, categoria y urgencia
- **Propuestas**: Ver `service_proposals` recibidas, estado de cada una
- **Resenas**: Moderar `provider_reviews`, responder como admin
- **Portafolios**: Ver/moderar items de `provider_portfolio`

### 3. Enriquecer RestroJobs Admin con estadisticas y gestion de candidatos

Agregar sub-tabs al JobsAdminPanel:

- **Empleos**: CRUD actual (sin cambios)
- **Candidatos**: Vista global de todos los `candidate_profiles` registrados, con busqueda y filtros
- **Estadisticas**: KPIs del marketplace (total empleos activos, postulaciones recibidas, tasa de contratacion, empleos urgentes)

### 4. Enriquecer RestroLearn Admin con certificados e inscripciones

Agregar sub-tabs adicionales al LearnAdminPanel:

- **Cursos**: Existente
- **Lecciones**: Existente
- **Rutas**: Existente
- **Generador IA**: Existente
- **Inscripciones**: Ver `course_enrollments` con progreso de cada estudiante
- **Certificados**: Ver `course_certificates` emitidos
- **Resenas**: Moderar `course_reviews`

### 5. Dashboard resumen del ecosistema

Agregar una vista de resumen al inicio de la pagina de administracion con KPIs globales en cards:

- RestroJobs: Empleos activos, candidatos totales, contrataciones del mes
- RestroLearn: Cursos publicados, estudiantes inscritos, certificados emitidos
- RestroServices: Proveedores activos, solicitudes abiertas, proyectos completados
- RestroGrowth: Pre-registros totales

---

## Detalle Tecnico

### Archivos nuevos
- `src/pages/restaurant/EcosystemAdmin.tsx` - Pagina independiente con dashboard de KPIs + tabs del ecosistema
- `src/components/admin/ServicesAdminPanel.tsx` - Panel con sub-tabs para RestroServices (reemplaza ProvidersAdminPanel directo)
- `src/components/admin/ServiceRequestsManager.tsx` - CRUD/moderacion de solicitudes
- `src/components/admin/ServiceProposalsManager.tsx` - Vista de propuestas
- `src/components/admin/ServiceReviewsManager.tsx` - Moderacion de resenas de proveedores
- `src/components/admin/JobsStatsPanel.tsx` - Estadisticas de RestroJobs
- `src/components/admin/CandidatesManager.tsx` - Vista global de perfiles de candidatos
- `src/components/admin/EnrollmentsManager.tsx` - Vista de inscripciones a cursos
- `src/components/admin/CertificatesManager.tsx` - Vista de certificados emitidos
- `src/components/admin/CourseReviewsManager.tsx` - Moderacion de resenas de cursos
- `src/components/admin/EcosystemDashboard.tsx` - KPIs resumen de todo el ecosistema

### Archivos modificados
- `src/App.tsx` - Agregar ruta `/r/ecosystem-admin`
- `src/components/navigation/AppSidebar.tsx` - Agregar item "Admin Ecosistema" en el grupo de expansion
- `src/components/admin/EcosystemAdminTab.tsx` - Refactorizar para usar los nuevos paneles enriquecidos
- `src/components/admin/JobsAdminPanel.tsx` - Envolver en sub-tabs (Empleos, Candidatos, Estadisticas)
- `src/components/admin/LearnAdminPanel.tsx` - Agregar sub-tabs de Inscripciones, Certificados, Resenas
- `src/pages/restaurant/Settings.tsx` - Eliminar la tab "Ecosistema" (ya tiene su propia pagina)

### Sin cambios de base de datos
No se requieren migraciones SQL. Todas las tablas necesarias ya existen (`service_requests`, `service_proposals`, `provider_reviews`, `provider_portfolio`, `candidate_profiles`, `course_enrollments`, `course_certificates`, `course_reviews`). Solo se necesitan queries de lectura y moderacion.

