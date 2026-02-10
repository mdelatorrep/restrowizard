
# Modulo Administrativo para Gestionar el Ecosistema Completo

## Resumen

Crear un panel administrativo integrado en la pagina de Configuracion (`/r/settings`) con una nueva pestana "Ecosistema" que permita gestionar las cuatro soluciones: **RestroJobs** (ofertas de empleo), **RestroLearn** (cursos), **RestroServices** (proveedores) y **RestroGrowth** (pre-registros). Cada solucion tendra su sub-pestana con tablas CRUD completas.

---

## Estructura de la Nueva Pestana "Ecosistema"

La pestana se dividira en 4 sub-pestanas, cada una con:
- Tabla de registros existentes con acciones (editar, activar/desactivar, eliminar)
- Boton para crear nuevo registro
- Dialog/formulario para crear y editar
- Filtros basicos por categoria y estado

### Sub-pestana 1: RestroJobs (Empleos)
- Tabla con columnas: Titulo, Categoria, Ubicacion, Tipo, Salario, Candidatos, Estado, Acciones
- Formulario de creacion/edicion con campos: titulo, descripcion, categoria (`job_category`), ubicacion, tipo de empleo (`job_type`), nivel (`experience_level`), salario min/max, beneficios, requisitos
- Toggle para activar/desactivar oferta (`is_active`)
- Ver numero de aplicaciones recibidas

### Sub-pestana 2: RestroLearn (Cursos)
- Tabla con columnas: Titulo, Categoria, Nivel, Duracion, Precio, Inscritos, Rating, Publicado, Acciones
- Formulario: titulo, descripcion, descripcion corta, categoria (`job_category`), nivel (`experience_level`), duracion en horas, precio, es gratuito (toggle), URL de video, URL de thumbnail
- Toggle para publicar/despublicar (`is_published`)

### Sub-pestana 3: RestroServices (Proveedores)
- Tabla con columnas: Nombre, Especialidad, Categoria, Ciudad, Rating, Resenas, Verificado, Activo, Acciones
- Formulario: nombre, descripcion, especialidad, categoria (`service_category`), ciudad, pais, email, telefono, sitio web, tags, rango de precios
- Toggle para verificar y activar/desactivar

### Sub-pestana 4: RestroGrowth (Pre-registros)
- Tabla de solo lectura mostrando los pre-registros almacenados
- Se necesita crear una tabla `growth_preregistrations` en la base de datos para almacenar email e interes
- Columnas: Email, Tipo de Interes, Fecha de Registro
- Exportar a CSV (boton)
- Contador total de pre-registrados

---

## Cambios en Base de Datos

### Nueva tabla: `growth_preregistrations`
```
- id (uuid, PK)
- email (text, NOT NULL, UNIQUE)
- interest_type (text, NOT NULL) -- investor, restaurateur, entrepreneur, curious
- created_at (timestamptz, default now())
```
- RLS: Lectura solo para usuarios autenticados (admins). Insercion publica (para el formulario de Growth).

---

## Seccion Tecnica

### Archivos nuevos
- `src/components/admin/EcosystemAdminTab.tsx` - Componente principal con sub-pestanas
- `src/components/admin/JobsAdminPanel.tsx` - CRUD de empleos
- `src/components/admin/CoursesAdminPanel.tsx` - CRUD de cursos
- `src/components/admin/ProvidersAdminPanel.tsx` - CRUD de proveedores
- `src/components/admin/GrowthAdminPanel.tsx` - Vista de pre-registros
- `src/components/admin/AdminFormDialog.tsx` - Dialog reutilizable para formularios de creacion/edicion

### Archivos modificados
- `src/pages/restaurant/Settings.tsx` - Agregar pestana "Ecosistema" con icono `Layers` importando `EcosystemAdminTab`
- `src/pages/Growth.tsx` - Conectar formulario de pre-registro a la nueva tabla `growth_preregistrations` via Supabase

### Patron de implementacion
- Cada panel usara `useQuery` para listar y `useMutation` para crear/editar/eliminar
- Los formularios se renderizaran dentro de `Dialog` de Radix UI
- Las tablas usaran los componentes `Table` existentes del proyecto
- Los datos se filtran por `user_id` del usuario autenticado usando `useDataUserId`
- Todas las operaciones muestran feedback con `toast` (sonner)
- Los logos de cada solucion se muestran en las sub-pestanas para identidad visual

### Migracion SQL
- Crear tabla `growth_preregistrations`
- Politicas RLS: `INSERT` publico, `SELECT/UPDATE/DELETE` solo para el owner o admin
