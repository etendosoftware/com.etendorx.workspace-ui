# Bug: FIC EDIT called with empty ROW_ID

## Síntoma

Al abrir una ventana (ej. Client/System, TAB_ID=145), el backend devuelve:

```json
{ "error": { "message": "Cannot invoke \"String.length()\" because \"clientId\" is null" } }
```

porque el FIC recibe `ROW_ID=` (vacío) en lugar del ID del registro.

## Root Cause

**Race condition de timing:** la FIC se dispara antes de que la tabla auto-seleccione el primer registro.

### Flujo del bug

1. `Tab.tsx:187` inicializa `currentRecordId = tabFormState?.recordId || ""` → `""`
2. `useFormInitialization` construye `params` con `ROW_ID=` (vacío)
3. El `useEffect` en `useFormInitialization.ts:240` dispara `fetch()` sin guard
4. Mientras tanto, `Table/index.tsx:890` llama `setRecordId(String(displayRecords[0].id))` → `"0"`
5. Llega tarde — el primer fetch ya falló

### `getRowId` en `utils.ts:18`

```typescript
const getRowId = (mode, recordId) => {
  if (mode === FormMode.EDIT || mode === SessionMode.SETSESSION) {
    return recordId ?? "null"; // "" no es null/undefined → retorna ""
  }
  return "null";
};
```

`""` pasa el `??` → `ROW_ID=` en la URL.

## Fix

**Archivo:** `packages/MainUI/hooks/useFormInitialization.ts`  
**Línea:** ~243 (dentro del `useEffect` que dispara `fetch()`)

```typescript
// ANTES:
useEffect(() => {
  if (params && !recordLoading) {
    const paramsKey = params.toString();
    if (fetchInProgressRef.current || lastFetchParamsRef.current === paramsKey) return;
    // ...fetch()
  }
}, [params, recordLoading]);

// DESPUÉS: agregar guard para EDIT sin recordId resuelto
useEffect(() => {
  if (params && !recordLoading) {
    if (mode === FormMode.EDIT && !recordId) return; // ← ESTE ES EL FIX

    const paramsKey = params.toString();
    if (fetchInProgressRef.current || lastFetchParamsRef.current === paramsKey) return;
    // ...fetch()
  }
}, [params, recordLoading]);
```

`mode` y `recordId` ya están disponibles en el closure del hook — no requieren cambios en la firma ni en las deps del useEffect (las deps correctas son `[params, recordLoading]` tal como están).

## Archivos relevantes

| Archivo | Línea | Rol |
|---|---|---|
| `packages/MainUI/hooks/useFormInitialization.ts` | 240–262 | Trigger del fetch — **aplicar fix aquí** |
| `packages/MainUI/utils/hooks/useFormInitialization/utils.ts` | 18–23 | `getRowId` — correcto, no tocar |
| `packages/MainUI/components/Window/Tab.tsx` | 187 | `currentRecordId = tabFormState?.recordId \|\| ""` — origen del `""` |
| `packages/MainUI/components/Table/index.tsx` | 890 | `setRecordId(String(displayRecords[0].id))` — llega tarde |

## Verificación

Abrir la ventana Client (window 109) → entrar al registro System (ID "0") → el network request debe mostrar `ROW_ID=0` en lugar de `ROW_ID=`.

## Notas

- No relacionado con ETP-3768
- Afecta cualquier ventana donde el primer registro se auto-selecciona (uIPattern sin record ID en URL)
- El System record con ID `"0"` no es el problema — `"0"` es truthy y pasaría correctamente si llegara a tiempo
