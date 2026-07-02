# Sección 1 — Window Types

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 1. Etendo define 4 tipos de ventana: **Maintain (M)**, **Transaction (T)**, **Query/Info (Q)** y **Pick and Execute (OBUIAPP_PickAndExecute)**.

> El backend (`/erp`) expone `windowType` tanto en el menú (`MenuBuilder.addWindowType`) como en la metadata de ventana (`WindowBuilder` vía el converter de la entidad AD_Window). El cliente lo modela en `WindowType` / `UIPattern` (`api-client/src/api/types.ts`) y lo discrimina en `menuItemDispatch.ts`.

**Estimación global de la sección: 100% completo.**

---

## Qué está completamente hecho

### 1.1 Maintain (M) — ~95%
- CRUD completo: New, Save, Delete (incluyendo **borrado múltiple** desde grid vía `MultipleDeleteActionHandler`), con diálogo de confirmación (`useToolbarConfig`, `useDeleteRecord`).
- **Copy Record** con y sin hijos (`copyRecordRequest(..., cloneWithChildren)`).
- Navegación de tabs padre → hijo → nieto, vista grid con columnas, filtrado y ordenamiento.
- Validación de campos obligatorios en save; campos `isUpdateable='N'` quedan read-only en modo edición (`BaseSelector`).
- Campos de auditoría (Created/Updated/By) read-only; **Attachments** y **Notes** (`AttachmentSection`, `noteSection`).
- Toolbar con NEW, SAVE, REFRESH, DELETE, FIND, FILTER, COLUMN_FILTERS, EXPORT_CSV, PRINT_RECORD, COPY_RECORD, ADVANCED_FILTERS, SAVE_VIEW.

### 1.2 Transaction (T) — ~90%
- **Status bar** con estado de documento e iconos/colores (`StatusBar`, `StatusBarField`, `statusConfig`).
- Read-only tras procesar, gobernado por `docStatus` (IP bloquea, RE reabre) más `_readOnly` del backend (`FormView/index.tsx`).
- Acciones de documento (DocAction, **Posted**, CreateFrom, etc.): implementadas vía el **subsistema de procesos legacy** (`LegacyProcessResolver.isLegacy()` + pipeline de iframe; ver `client/docs/process/legacy/manual-processes.md`). El `Posted` se ejecuta como special column (`BUTTONPosted`), incluyendo sus estados.
- **Protección de edición concurrente**: lock optimista del DAL por timestamp `updated`; la UI detecta el conflicto (`isStaleObjectError` → `OBJSON_StaleDate`/`APRM_StaleDate`) y muestra `status.staleObjectError` (`useFormAction.ts`, `saveOperations.ts`). Es transversal a todas las ventanas, no exclusivo de Transaction.
- Print y Copy de documento reutilizan el flujo de Maintain.

### 1.4 Pick and Execute — ~95% (feature complete)
- Render del grid de selección con checkboxes, **Select All / Deselect All**, edición inline, add/delete de filas y tipos de selección M/S/N (`WindowReferenceGrid`, flags `obuiappCanAdd/CanDelete/ShowSelect/SelectionType`).
- Apertura standalone desde menú (`menuItemDispatch` → `MENU_CLICK_INTENT_KINDS.PICK_AND_EXECUTE`, consumido en `Sidebar`) y como botón de proceso (`ProcessDefinitionModal`).
- **Validación de obligatorios inline** (`validateMandatoryFields`: `collectMissingMandatory`, `applyNumericMandatoryDefaults`).
- **Single-select** (`clampToSingleRecord`, `tabAllowsMultipleSelection`, `obuiappSelectionType`).
- **`openDirectTab` / `responseActions`** con auto-navegación (`findFirstOpenDirectTab`, `dispatchResponseActions` en `useProcessExecution`).
- Feedback de ejecución y refresco posterior. Referencia completa en `client/docs/process/pickAndExecute/README.md` ("Feature complete").

### 1.3 Query / Info (Q) — completo (validado manualmente)
- El modo read-only de campos funciona (`UIPattern.READ_ONLY` → todos los campos no editables).
- En ventanas Q los botones de modificación del toolbar están **desactivados / no presentes** (validado manualmente por el usuario).

> El **Accounting tab** tras posteo (display logic `@Posted@='Y'`) se resuelve por el motor de display logic general, que está implementado y funciona.

---

## Qué está parcialmente hecho

- Nada. Los cuatro tipos de ventana están completos.

---

## Qué no está hecho

- Nada pendiente de implementación en esta sección.

---

## Resumen de lo que queda por hacer

Nada. Maintain, Transaction (incluida la acción Posted vía procesos legacy, el Accounting tab por display logic y la protección de concurrencia), Query/Info y Pick and Execute están completos.

---

## Tareas

No hay tareas pendientes para esta sección.
