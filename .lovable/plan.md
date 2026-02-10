

# SEO Completo para la Propuesta de Valor de RestroWizard

## Problema Actual

El SEO actual es basico y generico:
- Un solo titulo y descripcion para toda la plataforma
- No hay JSON-LD / Schema.org structured data
- No hay `sitemap.xml`
- El `robots.txt` no tiene referencia al sitemap
- Las OG images apuntan a una imagen generica de Lovable (`lovable.dev/opengraph-image-p98pqg.png`)
- No hay meta tags especificos para las paginas publicas del ecosistema (`/jobs`, `/learn`, `/services`, `/growth`)
- Falta `canonical URL`, `keywords`, y meta tags de idioma/region

## Solucion

### 1. Mejorar `index.html` con SEO avanzado

- Actualizar `title` y `description` para incluir las 5 soluciones del ecosistema
- Agregar `canonical URL` apuntando a `https://restrowizard.lovable.app`
- Agregar meta `keywords` con terminos clave de la industria
- Agregar meta de idioma/region (`hreflang`, `content-language`)
- Actualizar OG image a la imagen propia del proyecto (o placeholder hasta tener una dedicada)
- Agregar Twitter meta tags completos (`twitter:title`, `twitter:description`)
- Inyectar JSON-LD de tipo `SoftwareApplication` con informacion completa de la plataforma

### 2. Crear `public/sitemap.xml`

Mapa del sitio estatico con las rutas publicas principales:
- `/` (Homepage)
- `/auth` (Login/Registro)
- `/jobs` (RestroJobs)
- `/learn` (RestroLearn)
- `/services` (RestroServices)
- `/growth` (RestroGrowth)
- `/diagnosis` (Diagnostico gratuito)
- `/events` (Eventos)

### 3. Actualizar `public/robots.txt`

- Agregar referencia al `sitemap.xml`
- Bloquear rutas privadas (`/r/`, `/c/`, `/admin/`)

### 4. Crear componente `SEOHead` reutilizable

Componente React que usa `document.title` y meta tags dinamicos via `useEffect` para cada pagina publica del ecosistema:
- `/jobs` -> "RestroJobs - Bolsa de Empleo Gastronomico | RestroWizard"
- `/learn` -> "RestroLearn - Formacion para Restaurantes | RestroWizard"
- `/services` -> "RestroServices - Proveedores Gastronomicos | RestroWizard"
- `/growth` -> "RestroGrowth - Emprendimiento Gastronomico | RestroWizard"

### 5. Inyectar JSON-LD en la homepage

Schema.org structured data en `Index.tsx` como `SoftwareApplication` + `Organization` con:
- Nombre, descripcion, logo, URL oficial
- Ofertas del ecosistema como `hasOfferCatalog`
- Tipo de aplicacion, categoria, sistema operativo

---

## Detalle Tecnico

### Archivos nuevos
- `public/sitemap.xml` - Mapa del sitio estatico con rutas publicas
- `src/components/SEOHead.tsx` - Componente reutilizable para meta tags dinamicos por pagina

### Archivos modificados
- `index.html` - Meta tags completos, canonical, keywords, hreflang, JSON-LD principal, OG image corregida
- `public/robots.txt` - Referencia al sitemap + bloqueo de rutas privadas
- `src/pages/Index.tsx` - Inyectar JSON-LD de Organization + SoftwareApplication
- `src/pages/Jobs.tsx` - Agregar SEOHead con titulo y descripcion especificos
- `src/pages/learn/LearnHome.tsx` - Agregar SEOHead
- `src/pages/services/ServicesHome.tsx` - Agregar SEOHead
- `src/pages/Growth.tsx` - Agregar SEOHead
- `src/pages/Diagnosis.tsx` - Agregar SEOHead

### Sin cambios de base de datos
No se requieren migraciones. Todo es contenido estatico y meta tags en el frontend.

