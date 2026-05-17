# Service Layer

Capa de servicios tipados sobre el cliente Supabase. Centraliza queries y RPCs
para evitar `supabase.from()` duplicado en hooks/componentes.

## Convenciones

- Cada archivo expone funciones puras `async` (sin estado).
- Retornan `{ data, error }` o lanzan `ServiceError` cuando aplica.
- No tocan React Query — los hooks lo siguen orquestando.
- Toda nueva query a Supabase desde hooks/páginas debe pasar por aquí.
</content>
