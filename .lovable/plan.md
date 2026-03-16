

# Diagnostico: Loop de Onboarding para mdelatorrep@gmail.com

## Problema Raiz

El usuario creo 3 negocios duplicados (03:42, 03:50, 04:01) porque queda atrapado en un ciclo:

1. Selecciona "Negocio Existente" en onboarding
2. `ExistingBusinessOnboarding.handleSubmit()` inserta en `restaurant_businesses` y navega a `/diagnosis`
3. **Nunca llama `refreshUserType()`** - el cache de React Query sigue con `hasCompletedOnboarding: false`
4. Cuando el usuario intenta ir al dashboard, `OnboardingGuard` ve el cache desactualizado y lo redirige de vuelta a `/r/onboarding`
5. El usuario repite el proceso, creando otro negocio duplicado

El flujo "Nuevo Negocio" (`NewBusinessOnboarding`) si llama `refreshUserType()` antes de navegar. El flujo "Negocio Existente" no lo hace.

Ademas, `ExistingBusinessOnboarding` navega a `/diagnosis` (ruta publica) en vez de `/r/dashboard`, lo que desconecta al usuario del flujo protegido.

## Correccion

### 1. `src/components/onboarding/ExistingBusinessOnboarding.tsx`
- Importar y llamar `refreshUserType()` despues de insertar el negocio
- Navegar a `/r/dashboard` en vez de `/diagnosis` (el dashboard ya tiene un widget de diagnostico)
- Esto alinea el comportamiento con `NewBusinessOnboarding`

### 2. Limpiar datos duplicados
- Eliminar los 2 negocios duplicados del usuario, dejando solo el primero (el mas antiguo)

### 3. Sin cambios de esquema
No se requieren migraciones. Solo correccion de logica en el componente y limpieza de datos.

