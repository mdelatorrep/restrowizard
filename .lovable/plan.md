

# Habilitar Todas las Soluciones del Ecosistema Restro

## Resumen

Crear paginas dedicadas y completas para **RestroJobs**, **RestroLearn**, **RestroServices** y **RestroGrowth**, cada una con identidad visual propia usando los logos existentes y la paleta de colores de la plataforma. Tambien actualizar la navegacion, el footer y el showcase para que todas las soluciones esten activas e interconectadas.

---

## Cambios por Solucion

### 1. RestroJobs (`/jobs`) - Ya existe, necesita branding
- Actualizar el hero con el **logo de RestroJobs** en lugar de texto plano
- Aplicar gradientes de la paleta (purple-intense, purple-medium, lavender-light)
- Agregar Header y Footer del ecosistema
- Mejorar la seccion de estadisticas con la paleta de marca

### 2. RestroLearn (`/learn`) - Nueva ruta dedicada
- Crear pagina `src/pages/Learn.tsx` separada de Events
- Hero con logo RestroLearn y gradiente de marca
- Secciones: Cursos destacados, Categorias (Cocina, Servicio, Gestion, Marketing), Certificaciones
- Catalogo de cursos con cards (mock data expandido)
- CTA de inscripcion y seccion de instructores destacados
- Header y Footer del ecosistema
- Agregar ruta `/learn` en App.tsx

### 3. RestroServices (`/services`) - Nueva pagina
- Crear pagina `src/pages/Services.tsx`
- Hero con logo RestroServices y gradiente de marca
- Directorio de proveedores por categoria: Equipamiento, Tecnologia, Ingredientes, Consultoria, Diseno
- Cards de proveedores con rating, ubicacion y especialidad (mock data)
- Buscador con filtros por categoria y ubicacion
- Seccion de "Solicitar Cotizacion" y "Publicar Servicio"
- Header y Footer del ecosistema

### 4. RestroGrowth (`/growth`) - Nueva pagina (marcada como "Proximamente")
- Crear pagina `src/pages/Growth.tsx`
- Hero con logo RestroGrowth y gradiente de marca
- Landing page tipo "coming soon" con:
  - Descripcion de la plataforma de emprendimiento e inversion
  - Tres pilares: Inversionistas, Restauranteros, Nuevos Conceptos
  - Formulario de pre-registro (email + tipo de interes)
  - Contador de interesados (mock)
- Header y Footer del ecosistema

---

## Actualizaciones de Navegacion

### Header (`Header.tsx`)
- Actualizar `solutionItems` para que todas tengan `action` funcional:
  - RestroServices -> `/services`
  - RestroGrowth -> `/growth`
- Eliminar el estado "disabled" de RestroGrowth en el dropdown

### Footer (`Footer.tsx`)
- Hacer los logos del footer clickeables con links a sus paginas respectivas

### SolutionsShowcase (`SolutionsShowcase.tsx`)
- Marcar **RestroServices** como activo con `action: '/services'`
- Marcar **RestroGrowth** como activo con `action: '/growth'` (la pagina interna manejara el estado "Proximamente")
- Todas las cards seran clickeables

### App.tsx (Rutas)
- Agregar: `/learn` -> Learn
- Agregar: `/services` -> Services
- Agregar: `/growth` -> Growth
- Actualizar `/events` para redirigir a `/learn` o mantener ambas

---

## Seccion Tecnica

### Archivos nuevos
- `src/pages/Learn.tsx` - Pagina completa de formacion
- `src/pages/Services.tsx` - Directorio de proveedores
- `src/pages/Growth.tsx` - Landing de emprendimiento

### Archivos modificados
- `src/App.tsx` - Nuevas rutas
- `src/pages/Jobs.tsx` - Branding con logo y paleta
- `src/components/Header.tsx` - Links activos para todas las soluciones
- `src/components/Footer.tsx` - Logos clickeables
- `src/components/SolutionsShowcase.tsx` - Todas las soluciones activas

### Patrones de diseno
- Cada pagina usara el Header y Footer existentes para mantener coherencia
- Gradientes basados en la paleta: `from-purple-intense to-purple-medium`
- Cards con `bg-white rounded-2xl shadow-lg border border-lavender-light/30`
- Badges usando `bg-lavender-light/50 text-purple-intense`
- Botones primarios con `bg-gradient-to-r from-purple-medium to-purple-intense`
- Los logos se importan desde `src/assets/logos/`
- Mock data para cursos, proveedores y datos de growth hasta que se implementen tablas en base de datos

