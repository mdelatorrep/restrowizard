
# RestroServices - Marketplace Gastronomico donde Oferta y Demanda se Encuentran

## Vision

Transformar RestroServices de un directorio estatico de proveedores a un **marketplace bidireccional completo** donde restaurantes publican necesidades y proveedores ofertan soluciones. Inspirado en marketplaces especializados como **Cheetah** (suministros), **Restaurantji** (servicios), **FoodServiceDirect** y **Thumbtack** (modelo de solicitud-propuesta), pero enfocado 100% en la industria gastronomica latinoamericana.

### Dolores que Resuelve
1. **Fragmentacion de proveedores**: cada restaurante busca por su cuenta, sin estandares de calidad
2. **Sin comparacion de precios**: no hay forma facil de comparar multiples proveedores
3. **Proceso manual de cotizacion**: WhatsApp, llamadas, correos sin seguimiento
4. **Sin trazabilidad**: no hay historial de contrataciones, calificaciones ni garantias
5. **Proveedores sin vitrina**: los buenos proveedores no tienen donde mostrar su trabajo

---

## Parte 1: Base de Datos - Nuevas Tablas

### Nueva tabla: `service_requests`
Necesidades/solicitudes publicadas por restaurantes (lado DEMANDA).

| Campo | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NOT NULL | Restaurante que publica |
| title | text NOT NULL | "Necesito proveedor de POS", "Busco diseno de carta" |
| description | text | Descripcion detallada de la necesidad |
| category | service_category | Categoria del servicio |
| budget_min | integer | Presupuesto minimo |
| budget_max | integer | Presupuesto maximo |
| city | text | Ciudad donde se necesita |
| country | text DEFAULT 'Colombia' | |
| urgency | text DEFAULT 'normal' | urgent, normal, flexible |
| deadline | date | Fecha limite |
| requirements | text[] | Requisitos especificos |
| attachments | text[] | URLs de archivos adjuntos |
| status | text DEFAULT 'open' | open, in_progress, completed, cancelled |
| proposals_count | integer DEFAULT 0 | Propuestas recibidas |
| selected_proposal_id | uuid | Propuesta seleccionada |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Nueva tabla: `service_proposals`
Propuestas de proveedores a solicitudes (lado OFERTA).

| Campo | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| request_id | uuid FK -> service_requests | Solicitud a la que responde |
| provider_id | uuid FK -> service_providers | Proveedor que propone |
| user_id | uuid NOT NULL | Usuario del proveedor |
| message | text NOT NULL | Propuesta detallada |
| price | numeric | Precio propuesto |
| estimated_delivery_days | integer | Tiempo estimado de entrega |
| attachments | text[] | Archivos adjuntos |
| status | text DEFAULT 'pending' | pending, accepted, rejected, withdrawn |
| created_at | timestamptz | |

### Nueva tabla: `provider_reviews`
Resenas de restaurantes a proveedores despues de una contratacion.

| Campo | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NOT NULL | Restaurante que califica |
| provider_id | uuid FK -> service_providers | |
| request_id | uuid FK -> service_requests | Solicitud relacionada |
| rating | integer NOT NULL (1-5) | |
| quality_rating | integer (1-5) | Calidad del servicio |
| punctuality_rating | integer (1-5) | Puntualidad |
| communication_rating | integer (1-5) | Comunicacion |
| comment | text | |
| response | text | Respuesta del proveedor |
| created_at | timestamptz | |

### Nueva tabla: `provider_portfolio`
Portafolio de trabajos del proveedor.

| Campo | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | |
| provider_id | uuid FK -> service_providers | |
| title | text NOT NULL | |
| description | text | |
| image_url | text | |
| client_name | text | |
| project_date | date | |
| category | service_category | |
| created_at | timestamptz | |

### Modificacion: tabla `service_providers`
Agregar campos para enriquecer el perfil del proveedor:

| Campo nuevo | Tipo | Descripcion |
|---|---|---|
| headline | text | Titulo profesional corto |
| years_in_business | integer | Anos en el mercado |
| team_size | text | solo, 2-5, 6-15, 16-50, 50+ |
| response_time_hours | integer DEFAULT 24 | Tiempo promedio de respuesta |
| completed_projects | integer DEFAULT 0 | Proyectos completados |
| cover_image_url | text | Imagen de portada |
| social_links | jsonb | Redes sociales |
| certifications | text[] | Certificaciones |
| service_areas | text[] | Ciudades/areas de servicio |

### Modificacion: tabla `service_bookings`
Agregar campos para vincular con solicitudes:

| Campo nuevo | Tipo | Descripcion |
|---|---|---|
| request_id | uuid FK -> service_requests | |
| proposal_id | uuid FK -> service_proposals | |
| review_id | uuid FK -> provider_reviews | |

### RLS Policies

- **service_requests**: SELECT publico (status = 'open'); INSERT/UPDATE/DELETE solo propietario (user_id = auth.uid())
- **service_proposals**: INSERT solo proveedores autenticados; SELECT propietario o dueno de la solicitud
- **provider_reviews**: SELECT publico; INSERT solo propietario con booking completado
- **provider_portfolio**: SELECT publico; INSERT/UPDATE/DELETE solo propietario del provider

---

## Parte 2: Experiencia Publica (`/services`)

### 2.1 Pagina principal rediseñada

**Hero**: Logo RestroServices + headline ("El marketplace donde tu restaurante encuentra todo lo que necesita") + barra de busqueda avanzada

**Dos modos de navegacion** (tabs principales):
- **Proveedores** (directorio): explorar proveedores verificados por categoria
- **Solicitudes Abiertas** (tablero de necesidades): ver que buscan los restaurantes

**Seccion "Proveedores Destacados"**: Cards premium de proveedores verificados con portfolio, rating, proyectos completados

**Seccion "Solicitudes Recientes"**: Feed de necesidades publicadas por restaurantes con presupuesto, categoria, urgencia

**Seccion "Categorias"**: Grid visual de las categorias de servicio con contadores

**Seccion CTA dual**:
- "Eres proveedor? Registra tu empresa" -> formulario de registro de proveedor
- "Eres restaurante en RestroWizard? Publica tu necesidad" -> login/redirect a /r/settings

**Estadisticas del marketplace**: Proveedores activos, solicitudes resueltas, calificacion promedio

### 2.2 Pagina de detalle del proveedor (`/services/provider/:id`)

Perfil completo del proveedor:
- Cover image + logo + nombre + headline + verificado badge
- Bio y descripcion de servicios
- Estadisticas: proyectos completados, anos en el mercado, tiempo de respuesta, rating
- Portafolio de trabajos (galeria con lightbox)
- Servicios ofrecidos (tags)
- Areas de servicio / ciudades
- Certificaciones
- Resenas de clientes con rating desglosado (calidad, puntualidad, comunicacion)
- Boton "Solicitar Cotizacion" (abre dialog de contacto)
- Boton "Ver Propuestas" si tiene propuestas activas

### 2.3 Pagina de detalle de solicitud (`/services/request/:id`)

Vista de una necesidad publicada:
- Titulo, descripcion, categoria, presupuesto, urgencia, deadline
- Requisitos especificos
- Nombre del restaurante (anonimizado si prefiere)
- Numero de propuestas recibidas
- Boton "Enviar Propuesta" (solo proveedores autenticados)
- Propuestas visibles solo para el dueno de la solicitud

### 2.4 Registro de proveedor (`/services/register`)

Formulario para que proveedores se registren:
- Datos basicos (nombre, especialidad, categoria, ciudad)
- Contacto (email, telefono, sitio web)
- Descripcion de servicios
- Portafolio inicial (subir imagenes)
- Tags y certificaciones
- El registro crea una cuenta + un `service_provider` vinculado

---

## Parte 3: Experiencia del Restaurante (desde RestroWizard)

### 3.1 Modulo de Servicios en RestroWizard (`/r/suppliers` o nuevo tab en Settings)

Desde el panel del restaurante, acceso a:

**Tab "Mis Solicitudes"**:
- Crear nueva solicitud de servicio (titulo, descripcion, categoria, presupuesto, urgencia, deadline)
- Ver solicitudes activas con numero de propuestas
- Al hacer clic -> ver propuestas recibidas con detalle de cada proveedor
- Aceptar/rechazar propuestas
- Contratar proveedor (crea un `service_booking`)
- Calificar proveedor al completar el servicio

**Tab "Proveedores Favoritos"**:
- Lista de proveedores guardados
- Historial de contrataciones pasadas
- Acceso rapido a cotizar

**Tab "Mis Contrataciones"**:
- Historial de bookings con estado (pendiente, confirmado, completado)
- Opcion de calificar

### 3.2 Panel admin de proveedores (ProvidersAdminPanel mejorado)

Enriquecer el panel existente en Settings > Ecosistema > RestroServices:

**Sub-tabs**:
1. **Proveedores**: CRUD existente + nuevos campos (headline, years_in_business, certifications, service_areas)
2. **Solicitudes**: Ver todas las solicitudes del marketplace con moderacion
3. **Propuestas**: Ver propuestas enviadas/recibidas
4. **Portafolio**: Gestionar portafolio del proveedor (si el usuario es proveedor)
5. **Resenas**: Moderar resenas

---

## Parte 4: Experiencia del Proveedor

### 4.1 Dashboard del proveedor (`/services/dashboard`)

Panel para proveedores registrados:

- **Resumen**: solicitudes abiertas en su categoria, propuestas enviadas, proyectos completados, rating
- **Solicitudes Relevantes**: feed de solicitudes en sus categorias/ciudades
- **Mis Propuestas**: estado de propuestas enviadas (pendiente, aceptada, rechazada)
- **Mi Perfil**: editor de perfil de proveedor
- **Mi Portafolio**: gestionar imagenes y proyectos
- **Mis Resenas**: ver calificaciones recibidas

---

## Parte 5: Archivos a Crear y Modificar

### Archivos nuevos
- `src/pages/services/ServicesHome.tsx` - Pagina principal rediseñada con tabs Proveedores/Solicitudes
- `src/pages/services/ProviderDetail.tsx` - Perfil completo del proveedor
- `src/pages/services/RequestDetail.tsx` - Detalle de solicitud con propuestas
- `src/pages/services/ProviderDashboard.tsx` - Dashboard del proveedor
- `src/pages/services/ProviderRegister.tsx` - Registro de proveedor
- `src/components/services/ProviderCard.tsx` - Card rediseñada de proveedor
- `src/components/services/RequestCard.tsx` - Card de solicitud abierta
- `src/components/services/ProposalDialog.tsx` - Dialog para enviar propuesta
- `src/components/services/ReviewForm.tsx` - Formulario de calificacion desglosada
- `src/components/services/PortfolioGallery.tsx` - Galeria de portafolio
- `src/components/services/ServiceRequestForm.tsx` - Formulario de solicitud (para restaurantes)
- `src/hooks/useServiceMarketplace.ts` - Hook para solicitudes, propuestas, reviews
- `src/hooks/useProviderProfile.ts` - Hook para perfil de proveedor

### Archivos modificados
- `src/App.tsx` - Nuevas rutas: /services (rediseñado), /services/provider/:id, /services/request/:id, /services/dashboard, /services/register
- `src/pages/Services.tsx` - Reemplazar con ServicesHome (o redirigir)
- `src/components/admin/ProvidersAdminPanel.tsx` - Enriquecer con nuevos campos y sub-tabs
- `src/components/admin/EcosystemAdminTab.tsx` - Actualizar referencia si cambia el panel

### Migraciones SQL
1. Crear tabla `service_requests` con RLS
2. Crear tabla `service_proposals` con RLS
3. Crear tabla `provider_reviews` con RLS
4. Crear tabla `provider_portfolio` con RLS
5. ALTER TABLE `service_providers` agregar nuevos campos
6. ALTER TABLE `service_bookings` agregar campos de vinculacion
7. Trigger para actualizar `proposals_count` en service_requests
8. Trigger para recalcular `average_rating` y `completed_projects` en service_providers al insertar review
9. Trigger para actualizar `reviews_count` en service_providers

---

## Parte 6: Restriccion Clave - Solo Restaurantes de RestroWizard Publican Necesidades

- La tabla `service_requests` requiere `user_id` que es el usuario autenticado del restaurante en RestroWizard
- Las politicas RLS validan `auth.uid() = user_id` para crear solicitudes
- El formulario de creacion de solicitudes solo esta disponible dentro de `/r/` (requiere autenticacion y onboarding completado)
- En la pagina publica, el boton "Publicar Necesidad" redirige al login y luego a RestroWizard
- Los proveedores pueden registrarse libremente pero sus propuestas pasan por el marketplace publico
- Solo restaurantes con sesion activa pueden ver las propuestas a sus solicitudes
