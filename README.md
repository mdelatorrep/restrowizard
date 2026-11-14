# RestroWizard

Software con IA para dueños de restaurantes y bares independientes: prime cost y P&L en tiempo real, punto de venta, inventario con recetas, turnos y propinas, sitio web con carta, reservas y domicilios, fidelización y un copiloto que responde con las cifras del restaurante.

Producción: <https://restrowizard.co> · Demo sin registro: <https://restrowizard.co/demo> (Clutch Sports Bar & Grill).

## Arranque en cinco minutos

Requisitos: Node 22 (`.nvmrc`), npm, y para la base local Postgres 17 con pgvector (o Docker).

```bash
npm ci
cp .env.example .env          # completar con la URL y la llave pública del proyecto Supabase
npm run dev                   # http://localhost:8080
```

Base de datos local reconstruida desde el repositorio, con la demo y las pruebas SQL:

```bash
docker run -d --name rw-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 pgvector/pgvector:pg17
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres scripts/db-verify.sh
```

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción en `dist/` |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint |
| `scripts/db-verify.sh` | Reconstruye la base desde `supabase/migrations`, siembra la demo y corre `supabase/tests/sql` |
| `python3 scripts/gen-reference-docs.py` | Regenera los catálogos de `docs/referencia/` |

## Estructura

```
src/
  pages/            rutas: público (/p/:slug), dueño (/r/*), POS (/:slug/pos), admin (/admin)
  components/       UI por módulo (shadcn/ui + Tailwind)
  hooks/ services/  acceso a datos con el cliente de Supabase
  config/           features.ts (interruptores de módulos), routePermissions.ts
supabase/
  migrations/       línea base + migraciones nuevas (las históricas están en migrations_archive/)
  functions/        35 edge functions (Deno); _shared/ con auth, CORS, IA y cron
  tests/            stubs de Supabase y pruebas SQL
docs/               arquitectura, operación, referencia, ADR
```

## Documentación

- [Arquitectura](docs/arquitectura.md)
- [Despliegue y operación](docs/operacion/despliegue.md) · [Base reproducible](docs/operacion/base-reproducible.md) · [Runbooks](docs/operacion/runbooks.md) · [Cuentas y secretos](docs/operacion/inventario-cuentas-y-secretos.md)
- Referencia: [módulos y cómo agregar uno](docs/referencia/modulos.md) · [funciones edge](docs/referencia/edge-functions.md) · [lógica en la base](docs/referencia/logica-en-base.md) · [glosario](docs/referencia/glosario.md) · [estándares](docs/referencia/estandares.md) · [deuda conocida](docs/referencia/deuda.md)
- [Cómo contribuir](CONTRIBUTING.md) · [Cambios](CHANGELOG.md)

## Licencia

Código propietario. Todos los derechos reservados. Ver `LICENSE` (pendiente del nombre legal del titular, ítem B-03).
