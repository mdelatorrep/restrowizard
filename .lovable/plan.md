

## Diagnóstico confirmado

**Evidencia de la base de datos**: El usuario `e744c98a` (mdelatorrep@gmail.com) tiene 0 registros en `restaurant_businesses`. Los debug_events muestran un ciclo repetitivo:

```text
/r/dashboard → hasCompletedOnboarding:false → redirect /r/onboarding
/r/onboarding → hasCompletedOnboarding:false → allow (muestra onboarding)
```

**Causa raíz**: `refreshUserType()` sobreescribe el cache optimista de `markOnboardingComplete()`.

La secuencia problemática en los 3 flujos:

```text
1. markOnboardingComplete('restaurant_owner')  ← cache = true ✅
2. refreshUserType().catch(() => {})           ← invalida + refetch en background
3. navigate('/r/dashboard')                    ← guard lee cache = true ✅
4. ...refetch completa: DB no tiene business   ← cache = false ❌
5. Guard re-render → redirect a /r/onboarding  ← LOOP
```

El `refreshUserType` ejecuta `invalidateQueries` + `refetchQueries` que inmediatamente sobreescribe el valor optimista con datos de la DB. Si el insert aun no se ha propagado o si el flujo "nuevo negocio" no llegó al paso de insert, el refetch devuelve `false`.

Para el flujo de consultor, ni siquiera se llama `markOnboardingComplete`; depende enteramente de `await refreshUserType()` que puede fallar.

---

## Plan de corrección

### 1. Hacer `markOnboardingComplete` resiliente a refetch

En `useUserType.ts`: antes de setear el cache, cancelar queries en vuelo para evitar que un refetch pendiente lo sobreescriba.

```typescript
const markOnboardingComplete = (type: UserType = 'restaurant_owner') => {
  queryClient.cancelQueries({ queryKey });  // ← NUEVO: cancela refetch en curso
  queryClient.setQueryData(queryKey, { userType: type, hasCompletedOnboarding: true });
};
```

### 2. Eliminar `refreshUserType()` de rutas de navegación críticas

En estos 3 archivos, quitar la llamada a `refreshUserType()` que se ejecuta junto a `markOnboardingComplete` + `navigate`:

- **ExistingBusinessOnboarding.tsx** (`handleSubmit`): Quitar `refreshUserType().catch(() => {})`
- **NewBusinessOnboarding.tsx** (`handleCompleteSetup` y `handleGoToDashboard`): Quitar `refreshUserType().catch(() => {})`

El refetch se hará naturalmente por `staleTime` (5 seg) cuando el usuario ya esté en el dashboard.

### 3. Agregar `markOnboardingComplete` al flujo de consultor

En **ConsultantOnboarding.tsx** (`handleSubmit`): Agregar `markOnboardingComplete('consultant')` antes de `navigate('/c/dashboard')`. Actualmente solo usa `await refreshUserType()` que puede retornar datos obsoletos.

### 4. Agregar guard de seguridad temporal en OnboardingGuard

En **OnboardingGuard.tsx**: Si `hasCompletedOnboarding` es `false` pero los datos aún se están recargando (`isFetching` del query), mostrar loading en vez de redirigir. Esto previene redirects durante refetch en background.

### 5. Aumentar staleTime del query de userType

En **useUserType.ts**: Cambiar `staleTime` de 5 segundos a 30 segundos para reducir refetches innecesarios durante navegación post-onboarding.

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useUserType.ts` | `cancelQueries` en `markOnboardingComplete`; `staleTime: 30_000` |
| `src/components/onboarding/ExistingBusinessOnboarding.tsx` | Quitar `refreshUserType()` de handleSubmit |
| `src/components/onboarding/NewBusinessOnboarding.tsx` | Quitar `refreshUserType()` de handleCompleteSetup y handleGoToDashboard |
| `src/pages/consultant/Onboarding.tsx` | Agregar `markOnboardingComplete('consultant')` antes de navigate |

