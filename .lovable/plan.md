
# Plan: Sistema de URLs Publicas Unificado

## Objetivo
Unificar todas las experiencias publicas del restaurante bajo un solo slug, creando paginas independientes pero cohesivas que compartan la identidad de marca.

---

## Arquitectura de URLs Propuesta

```text
/r/{slug}                    -> Sitio Web Principal (hub central)
/r/{slug}/menu               -> Menu Digital
/r/{slug}/reservas           -> Sistema de Reservaciones
/r/{slug}/domicilios         -> Pedidos a Domicilio  
/r/{slug}/fidelidad          -> Portal de Fidelizacion
/r/{slug}/experiencia        -> Calificacion de Experiencia
```

El slug se toma de `restaurant_websites.slug` y se convierte en el identificador unico para todas las URLs publicas.

---

## Cambios Requeridos

### 1. Actualizacion de Rutas (App.tsx)

Agregar las nuevas rutas publicas que utilizan el slug del website:

- `/r/:slug` - Sitio Web Principal (renombrar desde `/restaurante/:slug`)
- `/r/:slug/menu` - Menu Digital independiente
- `/r/:slug/reservas` - Widget de reservas en pagina completa
- `/r/:slug/domicilios` - Portal de pedidos a domicilio
- `/r/:slug/fidelidad` - Portal de fidelizacion del restaurante
- `/r/:slug}/experiencia` - Formulario de calificacion

Mantener compatibilidad con rutas antiguas mediante redirects.

### 2. Nuevas Paginas Publicas

| Pagina | Archivo | Descripcion |
|--------|---------|-------------|
| Menu Unificado | `PublicMenuUnified.tsx` | Menu digital con el slug del website |
| Reservas | `PublicReservations.tsx` | Pagina completa de reservaciones |
| Domicilios | `PublicDelivery.tsx` | Portal de pedidos con carrito |
| Fidelidad | `PublicLoyaltyRestaurant.tsx` | Portal por restaurante (no por cliente) |
| Experiencia | `PublicExperience.tsx` | Formulario de feedback |

### 3. Hook Compartido para Datos Publicos

Crear `usePublicRestaurantData.ts`:

- Recibe el slug como parametro
- Obtiene datos del website, marca, menus y configuracion
- Aplica estilos dinamicos de marca
- Reutilizable en todas las paginas publicas

### 4. Actualizacion de la Base de Datos

Agregar campo `show_feedback` a la tabla `restaurant_websites` para controlar la visibilidad de la seccion de calificacion (similar a los otros toggles existentes).

### 5. Pagina del Sitio Web Principal

Modificar `PublicRestaurant.tsx`:

- Agregar navegacion a las subpaginas
- Integrar enlaces directos a cada seccion
- Mostrar tarjetas de acceso rapido a cada servicio

### 6. Panel de Gestion de URLs (Website.tsx)

Actualizar la pestana de URLs para mostrar todas las direcciones unificadas:

- Sitio Principal: `/r/{slug}`
- Menu Digital: `/r/{slug}/menu`
- Reservaciones: `/r/{slug}/reservas`
- Domicilios: `/r/{slug}/domicilios`
- Fidelizacion: `/r/{slug}/fidelidad`
- Experiencia: `/r/{slug}/experiencia`

---

## Detalles Tecnicos

### Estructura de Componentes

```text
src/pages/public/
  ├── PublicRestaurantHub.tsx      # Sitio principal
  ├── PublicMenuPage.tsx           # Menu digital
  ├── PublicReservationsPage.tsx   # Reservaciones
  ├── PublicDeliveryPage.tsx       # Domicilios
  ├── PublicLoyaltyPage.tsx        # Fidelizacion
  └── PublicExperiencePage.tsx     # Calificacion

src/hooks/
  └── usePublicRestaurantData.ts   # Hook compartido
```

### Sincronizacion de Marca

Cada pagina publica heredara automaticamente:
- Colores primario, secundario y acento
- Fuentes primaria y secundaria
- Logo del restaurante
- Nombre y tagline

### Navegacion entre Secciones

Implementar un header/footer compartido en todas las paginas publicas que permita navegacion entre secciones sin perder contexto.

---

## Migracion de Datos

### Menus Existentes

Los menus que ya tienen `public_url_slug` independiente seguiran funcionando, pero se agregara la nueva ruta unificada que mostrara todos los menus publicados del restaurante.

### Fidelizacion

Se creara una pagina publica por restaurante donde los clientes pueden buscar su perfil usando email o telefono (similar al portal actual `/mi-fidelidad`), pero accediendo desde el slug del restaurante.

### Feedback

Se mantendra compatibilidad con las campanas existentes (`/feedback/:campaignId`) y se agregara la nueva ruta `/r/{slug}/experiencia` que creara automaticamente una campana por defecto si no existe.

---

## Beneficios

1. **Simplicidad**: Un solo slug para recordar
2. **Consistencia**: Todas las URLs siguen el mismo patron
3. **Marca**: Experiencia visual unificada
4. **SEO**: URLs semanticas y predecibles
5. **QR Codes**: Mas facil generar y compartir enlaces
6. **Administracion**: Gestion centralizada en el modulo de Sitio Web
