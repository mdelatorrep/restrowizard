
# Plan de Corrección: Onboarding de Apertura de Nuevo Restaurante

## Resumen del Problema

El flujo de onboarding para "Bubble Lab" (proyecto `eb2535fa-fce2-4fe8-a3be-189cba9d551e`) presenta **tres problemas estructurales**:

1. **La pantalla de Fecha/Presupuesto se salta**: El wizard de 3 pasos muestra el paso 3 por 2 segundos y luego pasa al procesamiento IA sin permitir que el usuario ingrese los datos
2. **El análisis no se muestra en el dashboard**: Los datos existen en la base de datos (7 análisis, 25+ checklist items) pero el frontend muestra 0 resultados
3. **El checklist aparece vacío**: A pesar de que los items fueron creados correctamente

## Hallazgos Clave del Análisis

### Datos en Base de Datos (CONFIRMADOS)
- Proyecto `eb2535fa-fce2-4fe8-a3be-189cba9d551e` existe con `user_id = d6a9577a-5c0d-4ef8-9f97-743f8c57157d`
- 7 análisis de fase en `opening_phase_analyses` con contenido válido
- 25+ items de checklist en `opening_checklist_items`
- **Campos vacíos**: `estimated_budget = null`, `target_opening_date = null`

### Logs de Debug (CONFIRMADOS)
- Todas las fases se analizaron exitosamente (debug_events registra `analyze_phase_success` para las 7 fases)
- El procesamiento completó y se llamó `results_refetch_start` y `results_refetch_end`

### Logs del Cliente (PROBLEMA IDENTIFICADO)
```
[useProjectAnalyses] Fetched analyses: 0
```
Se repite 6 veces consecutivas. **El query devuelve 0 resultados aunque existen en la DB.**

### Peticiones de Red (ANOMALÍA)
```
GET /opening_phase_analyses?project_id=eq.eb2535fa-...
Status: 200
Response Body: []
```
**La API devuelve array vacío aunque los datos existen.**

### Políticas RLS (VERIFICADAS)
Las políticas son correctas:
- SELECT en `opening_phase_analyses`: `EXISTS (SELECT 1 FROM business_opening_projects WHERE id = opening_phase_analyses.project_id AND user_id = auth.uid())`
- El proyecto pertenece al usuario autenticado

### Causa Raíz Identificada

**El problema NO es de RLS ni de código frontend, sino de SINCRONIZACIÓN DE CACHE:**

1. El usuario crea proyecto y navega inmediatamente a "processing"
2. El hook `useProjectAnalyses` se inicializa con `projectId` antes de que React Query reciba el ID correcto
3. React Query cachea un resultado vacío (`[]`) para el `projectId`
4. Cuando los análisis se guardan, la invalidación no fuerza un refetch efectivo porque el componente ya tiene datos cacheados
5. `staleTime: 0` no es suficiente si `refetchOnMount` solo se ejecuta una vez al montar

**Problema adicional - Wizard Step 3:**
El wizard tiene 3 pasos pero cuando `forceNewProject` o `resumeProjectId` existen, el código salta directamente a `step='processing'` sin mostrar el paso 3 (fecha/presupuesto).

---

## Plan de Corrección

### Fase 1: Corregir el Salto del Paso 3 (Fecha/Presupuesto)

**Archivo**: `src/components/opening/OpeningProjectWizard.tsx`

**Cambio**: El wizard ya tiene 3 pasos. El problema es que después de completar el paso 3, `handleSubmit` llama `onSubmit` que inmediatamente navega. Vamos a añadir validación visual para que el paso 3 sea más prominente.

**Archivo**: `src/components/onboarding/NewBusinessOnboarding.tsx`

**Cambios**:
1. Añadir estado `isWizardCompleted` que solo se activa cuando el wizard devuelve datos
2. Eliminar lógica que salta a `processing` antes de que el wizard complete
3. Asegurar que `forceNewProject=true` siempre muestre el wizard completo

```text
Antes:
const [step, setStep] = useState<OnboardingStep>(() => {
  if (forceNewProject) return 'create';
  return initialProjectId ? 'processing' : 'create';
});

Después:
const [step, setStep] = useState<OnboardingStep>('create');
// Solo navegar a 'processing' cuando el wizard complete O cuando se resume
```

### Fase 2: Forzar Refetch Correcto de Datos

**Archivo**: `src/hooks/useBusinessProject.ts`

**Cambios**:
1. Añadir `gcTime: 0` (garbage collection inmediata) para evitar cache stale
2. Cambiar `refetchOnMount: true` a `refetchOnMount: 'always'` 
3. Añadir log de debugging con el resultado real de Supabase

```typescript
export function useProjectAnalyses(projectId: string | null) {
  return useQuery({
    queryKey: ['project-analyses', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      console.log('[useProjectAnalyses] Fetching for:', projectId);
      const { data, error } = await supabase
        .from('opening_phase_analyses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useProjectAnalyses] Error:', error);
        throw error;
      }
      
      console.log('[useProjectAnalyses] Result count:', data?.length, 'First item:', data?.[0]?.phase);
      return data as PhaseAnalysis[];
    },
    enabled: !!projectId && projectId.length > 0,
    staleTime: 0,
    gcTime: 0, // No cachear resultados vacíos
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
```

### Fase 3: Invalidación Agresiva Post-Análisis

**Archivo**: `src/hooks/useBusinessOpening.ts`

**Cambios** en `analyzePhase`:
1. Después de guardar el análisis, invalidar Y remover el cache anterior:

```typescript
// Después de guardar analysis en DB:
queryClient.removeQueries({ queryKey: ['project-analyses', project.id] });
await queryClient.invalidateQueries({ queryKey: ['project-analyses', project.id] });
await queryClient.refetchQueries({ queryKey: ['project-analyses', project.id] });
```

### Fase 4: Pantalla de Edición de Fecha/Presupuesto

**Archivo**: `src/components/opening/OpeningResultsDashboard.tsx`

**Cambios**:
1. Añadir botón "Editar detalles" junto al header que abre un modal
2. El modal permite editar: `target_opening_date`, `estimated_budget`, `description`
3. Al guardar, mostrar botón "Regenerar Plan" (no auto-regenerar)

**Nuevo componente**: `src/components/opening/EditProjectDetailsDialog.tsx`

```typescript
interface Props {
  project: BusinessProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<BusinessProject>) => Promise<void>;
}
```

### Fase 5: Botón "Regenerar Plan" en Dashboard

**Archivo**: `src/components/opening/OpeningResultsDashboard.tsx`

**Cambios**:
1. Añadir prop `onRegenerateAll?: () => Promise<void>`
2. Mostrar badge "Regenerar plan" cuando fecha/presupuesto fueron editados
3. Al hacer clic, re-ejecutar todas las fases con los nuevos datos

**Archivo**: `src/components/onboarding/NewBusinessOnboarding.tsx`

**Cambios**:
1. Implementar `handleRegenerateAll` que llama `analyzePhase` para cada fase secuencialmente
2. Después regenerar checklist

### Fase 6: Validación de Datos No Vacíos en Dashboard

**Archivo**: `src/components/opening/OpeningResultsDashboard.tsx`

**Cambios** en `getAnalysisContent`:
1. Añadir log detallado del objeto completo
2. Manejar caso donde `analysis_data` es objeto pero `.text` está anidado diferente

```typescript
const getAnalysisContent = (analysis: PhaseAnalysis): string => {
  const data = analysis?.analysis_data;
  console.debug('[getAnalysisContent] Raw data:', JSON.stringify(data).slice(0, 200));
  
  if (!data) return 'Sin contenido.';
  if (typeof data === 'string') return data;
  
  // Orden de prioridad de campos
  const textFields = ['text', 'analysis', 'content', 'markdown'];
  for (const field of textFields) {
    if (data[field] && typeof data[field] === 'string' && data[field].length > 10) {
      return data[field];
    }
  }
  
  // Buscar en structured
  if (data.structured?.text) return data.structured.text;
  
  // Stringify como fallback
  return JSON.stringify(data, null, 2);
};
```

---

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| `src/hooks/useBusinessProject.ts` | Configuración de cache agresiva |
| `src/hooks/useBusinessOpening.ts` | Invalidación forzada post-mutación |
| `src/components/onboarding/NewBusinessOnboarding.tsx` | Lógica de navegación de pasos |
| `src/components/opening/OpeningResultsDashboard.tsx` | Extracción de contenido + botón regenerar |
| `src/components/opening/EditProjectDetailsDialog.tsx` | **Nuevo**: Modal de edición |

---

## Detalles Tecnicos

### Configuracion de React Query

El problema principal es que React Query cachea resultados vacios. La solucion es:

```typescript
{
  staleTime: 0,        // Datos siempre considerados obsoletos
  gcTime: 0,           // No mantener cache de queries inactivas
  refetchOnMount: 'always',  // Siempre refetch al montar
  refetchOnWindowFocus: true,
}
```

### Flujo Corregido de Onboarding

```text
Usuario entra a /r/onboarding
       |
       v
   forceNew=true? -----> Mostrar Wizard (3 pasos)
       |                         |
       No                        v
       |                 Usuario completa wizard
       v                         |
   projectId en URL?             v
       |                 createProject.mutateAsync()
       v                         |
   Proyecto existente            v
   < 100% progreso?      setProjectId(nuevo)
       |                         |
       v                         v
   Resume processing      Iniciar processing
       |                         |
       +----------+--------------+
                  |
                  v
         AutomaticProcessingScreen
                  |
                  v
         analyzePhase (x7)
                  |
                  v
         generateChecklist
                  |
                  v
         setStep('results')
                  |
                  v
         refreshResultsData()  <-- Aqui debe forzar refetch real
                  |
                  v
         OpeningResultsDashboard (muestra datos)
```

### Patron de Invalidacion Post-Mutacion

```typescript
// En useBusinessOpening.ts - analyzePhase()

// 1. Guardar en DB
const { data: analysis } = await supabase
  .from('opening_phase_analyses')
  .upsert({...})
  .select()
  .single();

// 2. Limpiar cache anterior (evita mezclar con resultados vacios)
queryClient.removeQueries({ 
  queryKey: ['project-analyses', project.id],
  exact: true 
});

// 3. Invalidar para marcar como stale
await queryClient.invalidateQueries({ 
  queryKey: ['project-analyses', project.id] 
});

// 4. Refetch activo
await queryClient.refetchQueries({ 
  queryKey: ['project-analyses', project.id],
  type: 'active'
});
```

---

## Resultado Esperado

1. El wizard muestra los 3 pasos completos (incluyendo fecha/presupuesto opcionales)
2. El usuario puede omitir fecha/presupuesto (quedan como "Por definir")
3. Despues del procesamiento IA, el dashboard muestra todos los analisis
4. El checklist se muestra correctamente con las 25+ tareas
5. Existe boton para editar fecha/presupuesto y regenerar plan manualmente
