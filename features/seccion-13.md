# Sección 13 — Record Creation, Editing, and Persistence

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 13. Cubre el ciclo de vida de un registro: modos de inicialización del formulario (13.0), alta (13.1), edición (13.2), edición inline en grilla (13.3), formulario "sucio" / cambios sin guardar (13.4) y borrado (13.5).

> **Clave de arquitectura:** la preparación de datos del formulario la resuelve el backend clásico `FormInitializationComponent` (FIC), invocado por la nueva UI vía el kernel del adapter en los cuatro modos `NEW` / `EDIT` / `CHANGE` / `SETSESSION`. El cliente **no** reimplementa defaults, callouts ni filtrado de combos: arma el payload (`buildFormInitializationPayload`, `_gridVisibleProperties`, valores `inp*`), llama al FIC y **aplica** la respuesta (defaults, `auxiliaryInputValues`, `sessionAttributes`, `columnValues`) al formulario y a la sesión de la nueva UI. Los callouts (`MODE=CHANGE`, `CHANGED_COLUMN`) se orquestan en el cliente con `globalCalloutManager` (supresión durante la carga inicial, espera de idle antes de guardar, cascadas). El guardado y el borrado usan el **datasource servlet** clásico; la validación de obligatorios, la detección de edición concurrente (`OBStaleObjectException`) y las restricciones de FK se resuelven/propagan desde el backend.

**Estimación global de la sección: ~85% de cobertura efectiva.** Los modos del FIC (13.0), el alta (13.1), la edición (13.2) y la edición inline en grilla (13.3) están sólidamente implementados, incluyendo callouts con cascada, validación de obligatorios con asterisco, lógica read-only, detección de edición concurrente y borrado con confirmación (individual y múltiple). El hueco principal está en **13.4 (cambios sin guardar)**: la nueva UI adopta un modelo distinto al clásico —**autosave al navegar entre registros** y **confirmación al cerrar la pestaña de ventana**— pero **no** implementa el prompt del navegador (`beforeunload`) al cerrar la pestaña del browser, ni un aviso de "descartar cambios" al pulsar *New* o seleccionar otro registro con el formulario sucio. Puntos menores en 13.5 (selección del siguiente registro tras borrar).

---

## Qué está completamente hecho

| Comportamiento (checklist 13.x) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **13.0 Modo NEW aplica defaults antes de mostrar el formulario** | `useFormInitialization` con `MODE=NEW`; el FIC del backend calcula defaults/context vars/callouts iniciales y el cliente los aplica (`applyFullInitialization`). En tab raíz se limpia primero el contexto de sesión (`clearRecordContextFromSession`) para evitar fugas de valores previos. |
| **13.0 Modo EDIT carga los valores almacenados** | `MODE=EDIT` con `ROW_ID` + valores `inp*` del registro (`buildPayloadByInputName`); enriquecido con campos de auditoría (`enrichWithAuditFields`). |
| **13.0 Modo CHANGE dispara callouts sólo del campo cambiado (y cascadas)** | `useCallout` (`MODE=CHANGE`, `CHANGED_COLUMN`); `globalCalloutManager` encola/ejecuta y propaga cascadas; los `columnValues` devueltos se aplican sin resetear campos no relacionados. |
| **13.0 Modo SETSESSION fija variables de sesión sin renderizar** | `SessionMode.SETSESSION` + `buildSessionResetPayload` (usa `hqlName`/property-path como exige el FIC); alimenta el sync de sesión de la nueva UI. |
| **13.0 Combos re-filtrados / auxiliary inputs recalculados tras contexto** | Resuelto por el FIC del backend; el cliente aplica `auxiliaryInputValues` (`setAuxiliaryInputs`) y las opciones de combo devueltas. |
| **13.1 "New" limpia el formulario y entra en modo creación** | `handleNewRecord`: `FormMode.NEW`, `recordId=new`, remonta el formulario, limpia selección de tabs hijos y estado. Atajo `Ctrl+N`. |
| **13.1 Defaults de columna y de context vars** | Provenientes del FIC (`@AD_Org_ID@`, `@#Date@`, `@SQL=…`, literales); la organización por defecto la fija el backend. |
| **13.1 Campos obligatorios distinguidos visualmente** | `FieldLabel` renderiza asterisco (`requiredAsterisk`) cuando el campo es `required`. |
| **13.1 Campos de auditoría vacíos en alta** | `enrichWithAuditFields` no agrega auditoría en modo `NEW`. |
| **13.1 Guardar con obligatorios completos crea y devuelve el registro** | `useFormAction.execute` → datasource servlet; `onSuccess` recibe el registro creado. |
| **13.1 Guardar con obligatorios faltantes muestra error** | `useFormValidation.validateRequiredFields`; el botón de guardar se deshabilita y al forzar el guardado se listan los campos faltantes. |
| **13.1 Tras guardar, transición NEW→EDIT con el ID** | `onSuccess`: `setCurrentMode(EDIT)` + `setCurrentRecordId(newRecordId)`, sin reconstrucción visual (`justSavedFromNewRef`). |
| **13.2 Click en fila de grilla abre el registro con sus valores** | Navegación a FormView con `recordId`; merge de datos de registro + `initialState` (`availableFormData`). |
| **13.2 Campos read-only (`isreadonly`) no editables** | `isReadOnly` por `uIPattern`/`_readOnly` del registro (seguridad DAL) + estado del documento (IP/RE). |
| **13.2 `readonlylogic` evaluada por campo** | `useDisplayLogic` / motor de expresiones (`utils/expressions`) evalúa lógicas dinámicas por campo. |
| **13.2 Campos calculados se actualizan por callouts** | Callouts `MODE=CHANGE` + `columnValues`; `useDefaultValueReaction` para reacciones a defaults. |
| **13.2 Editar marca el formulario como "dirty"** | `formState.isDirty` de react-hook-form → `markFormAsChanged` + `setWindowDirtySource`. |
| **13.2 Guardar persiste cambios y limpia el estado dirty** | `onSuccess` hace `stableReset(getValues, { keepDirty:false })` → `isDirty=false`. |
| **13.2 Detección de edición concurrente** | `isStaleObjectError` detecta `OBStaleObjectException` (`@OBJSON_StaleDate@`) y muestra `status.staleObjectError`. |
| **13.3 Edición inline en grilla (patrón ED)** | Infraestructura completa: `editingRowUtils`, `useInlineEditInitialization`, `CellEditorFactory` (fecha, numérico, texto, booleano, TableDir, select). |
| **13.3 Tab→siguiente celda, Enter→confirma/siguiente fila, Escape→cancela** | Editores de celda con `useKeyboardNavigation` (casos `Tab`/`Enter`/`Escape` con `preventDefault`). |
| **13.3 Callouts al cambiar valor de celda** | `useInlineCallout` (mismo FIC `MODE=CHANGE`). |
| **13.3 Errores de validación bloquean el guardado de fila y la resaltan** | `useGridRowValidation` + `RowValidationResult`/`validationErrors` por campo. |
| **13.3 Alta de nueva fila / guardado al salir de fila** | `handleInsertRow` (fila nueva arriba, defaults por FIC), autosave al salir/blur de fila (`saveOperations`). |
| **13.3 Cancelar edición pide confirmación si hay cambios** | `handleCancelOperation` muestra "Discard changes?/Discard New Row" cuando hay `hasUnsavedChanges`. |
| **13.4 Indicador de dirty y descarte que restaura el original** | Estado del botón de guardar según `isDirty`; *refresh/reset* (`onReset` → `refetch`) re-obtiene del servidor y limpia cambios. |
| **13.4 Confirmación al cerrar una ventana con cambios** | `dirtyWindows` en `windowStore` + `WindowTabs.handleCloseWindow` → diálogo "unsaved changes" (compartido con Sección 12). |
| **13.5 Borrado con diálogo de confirmación** | `useToolbarConfig.handleDeleteRecord` → `showConfirmModal` (texto individual o múltiple). |
| **13.5 Borrado exitoso quita el registro y muestra mensaje** | `useDeleteRecord.onSuccess` + `showDeleteSuccessModal`; refresca padres (`triggerParentRefreshes`). |
| **13.5 Errores de FK / registro referenciado con nombre de entidad** | El mensaje de error del backend (`data.response.error.message`) se propaga al modal. |
| **13.5 Borrado múltiple desde la grilla** | `handleMultiDeleteRecord` (`MultipleDeleteActionHandler`) con la selección de filas. |
| **13.5 Sin undo (permanente tras confirmar)** | Por diseño; no hay restauración. |

---

## Qué está parcialmente hecho

- **13.2 "Guardar sin cambios no genera request al servidor":** en la práctica el botón de guardar sólo se habilita cuando el formulario está `dirty` (o en `NEW` válido), por lo que no se dispara un guardado innecesario; además el payload envía diffs (`buildFormPayload` con `oldValues`). No hay, sin embargo, un guard explícito que rechace un guardado forzado sin cambios. Comportamiento equivalente en la práctica. → sin tarea (aceptable).
- **13.4 Aviso al navegar a otro registro con el formulario sucio:** el clásico **avisa/descarta**; la nueva UI hace **autosave** antes de navegar (`useRecordNavigation.performAutosaveIfNeeded`: si `isDirty`, guarda y si falla bloquea la navegación). Es una desviación funcional deliberada (guarda en vez de preguntar), no una pérdida silenciosa. → **Tarea 2** (alinear/confirmar UX).
- **13.4 Aviso al pulsar "New" con el formulario sucio:** `handleNewRecord` limpia el formulario sin diálogo de "descartar cambios". Los cambios no guardados se pierden sin preguntar (aunque el estado dirty sí se rastrea). → **Tarea 2**.
- **13.5 Tras borrar, seleccionar el siguiente registro:** en FormView el borrado hace *back* a la grilla (`onBack`) y refresca; no se verificó una selección automática del "siguiente" registro como en el clásico (queda estado vacío / grilla refrescada). → **Tarea 3** (impacto bajo).

---

## Qué no está hecho

- **13.4 Prompt del navegador al cerrar la pestaña con cambios sin guardar:** no existe ningún handler `beforeunload`/`onbeforeunload` en el cliente. Cerrar/recargar la pestaña del navegador con un formulario sucio **no** dispara el aviso nativo del browser; los cambios se pierden sin advertencia a ese nivel. → **Tarea 1**.

> **No son brechas / fuera del alcance del cliente:**
> - **13.0 Cálculo de defaults, callouts, filtrado de combos y auxiliary inputs:** lo resuelve el `FormInitializationComponent` del backend (modos NEW/EDIT/CHANGE/SETSESSION); el cliente sólo arma el payload y aplica la respuesta.
> - **13.1 Render de los 46 tipos de referencia en alta / 13.2 su despliegue en edición:** cubierto y evaluado en la **Sección 2** (por tipo de referencia); no es trabajo nuevo de esta sección.
> - **13.2 Detección de edición concurrente / 13.5 restricciones de FK y referencias:** el enforcement es del backend (DAL/Hibernate); el cliente detecta y muestra el mensaje.

---

## Resumen de lo que queda por hacer

El núcleo de creación, edición y persistencia está prácticamente completo: los cuatro modos del FIC (NEW/EDIT/CHANGE/SETSESSION) se invocan y aplican correctamente, con callouts en cascada, supresión durante la carga inicial y espera de idle antes de guardar; el alta y la edición cubren defaults, obligatorios con asterisco, lógica read-only, campos calculados, transición NEW→EDIT y detección de edición concurrente; la edición inline en grilla (patrón ED) tiene edición de celda, navegación por teclado (Tab/Enter/Escape), callouts, validación por fila, alta de fila, autosave al salir y confirmación al descartar; y el borrado ofrece confirmación, borrado múltiple, propagación de errores de FK y refresco de padres. Las brechas se concentran en el manejo de **cambios sin guardar (13.4)**: falta el **prompt del navegador (`beforeunload`)** al cerrar la pestaña del browser (**Tarea 1**) y falta alinear los **avisos de descarte** al pulsar *New* o al cambiar de registro/tab con el formulario sucio, hoy resueltos con autosave o sin aviso (**Tarea 2**). Queda además un ajuste menor: la **selección del siguiente registro tras borrar** (**Tarea 3**).

---

## Tareas

### Tarea 1 — Prompt del navegador al cerrar la pestaña con cambios sin guardar

**Descripción:** cerrar o recargar la pestaña del navegador con un formulario (o una fila inline) en estado sucio no muestra ninguna advertencia nativa; los cambios se pierden sin que el usuario pueda cancelar. El clásico advierte a nivel del navegador en esa situación.

**Solución propuesta:** conectar el estado global de "hay cambios sin guardar" (ya rastreado por ventana/tab en el store de ventanas y por fila en la edición inline) a un aviso a nivel de documento del navegador que se active mientras exista al menos una fuente sucia, y se desactive cuando todo esté guardado o descartado. No cambia la lógica de guardado, sólo agrega la barrera de salida.

**Test cases:**
- Con un formulario sucio, intentar cerrar/recargar la pestaña muestra el aviso nativo del navegador.
- Con una fila inline con cambios sin guardar, ocurre lo mismo.
- Sin cambios pendientes, cerrar/recargar no muestra ningún aviso.
- Tras guardar o descartar, el aviso deja de aparecer.

**Resultado:** el usuario no pierde cambios al cerrar/recargar la pestaña sin haber guardado, con paridad frente al clásico.

### Tarea 2 — Avisos de descarte al pulsar "New" o cambiar de registro con formulario sucio

**Descripción:** el clásico advierte ("¿Descartar cambios?") antes de limpiar el formulario al pulsar *New* o al seleccionar otro registro con cambios sin guardar. La nueva UI hoy limpia sin aviso al pulsar *New* y hace autosave al navegar entre registros, comportamientos que difieren de la expectativa del checklist.

**Solución propuesta:** unificar la política de cambios sin guardar en las transiciones dentro de la ventana (pulsar *New*, seleccionar otro registro, cambiar de tab): ante un formulario sucio, ofrecer al usuario la decisión (guardar / descartar / cancelar) de forma consistente, reutilizando el rastreo de estado dirty existente. Definir con el equipo si el autosave actual al navegar se mantiene como opción o se reemplaza por el aviso.

**Test cases:**
- Pulsar *New* con el formulario sucio ofrece guardar/descartar/cancelar antes de limpiar.
- Seleccionar otro registro con cambios sin guardar aplica la misma política.
- Cambiar de tab dentro de la ventana con cambios sin guardar advierte antes de descartar.
- Cancelar mantiene el formulario y los cambios intactos.

**Resultado:** el manejo de cambios sin guardar es coherente y predecible en todas las transiciones internas de la ventana.

### Tarea 3 — Selección del siguiente registro tras un borrado

**Descripción:** tras borrar un registro, el clásico deja seleccionado el siguiente registro (o muestra estado vacío si no hay más). En la nueva UI el borrado desde el formulario vuelve a la grilla y refresca, sin garantizar la selección automática del siguiente registro.

**Solución propuesta:** al completarse un borrado, seleccionar automáticamente un registro vecino de la lista actual (siguiente o anterior según disponibilidad) y, si la lista queda vacía, mostrar el estado vacío correspondiente, reutilizando el mecanismo de selección existente de la grilla.

**Test cases:**
- Borrar un registro intermedio deja seleccionado el siguiente.
- Borrar el último registro selecciona el anterior.
- Borrar el único registro muestra el estado vacío.
- El borrado múltiple deja una selección coherente tras removerse las filas.

**Resultado:** el flujo posterior al borrado es fluido y consistente con el clásico, sin dejar la grilla sin contexto de selección.
