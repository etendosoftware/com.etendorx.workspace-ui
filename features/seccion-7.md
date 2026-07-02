# Sección 7 — Record State Machine

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 7. Cubre la **máquina de estados de los documentos**: los estados de documento (`DR`/`IP`/`CO`/`CL`/`VO`/`RE`…), las acciones (Complete, Void, Close, Reactivate, Post…), las transiciones válidas, qué botones están disponibles según el estado y la editabilidad de campos por estado.

> **Clave de arquitectura:** la máquina de estados **no se reimplementa** en la nueva UI. La lógica de negocio (validar al completar, crear reversos al anular, bloquear reactivación si hay documentos dependientes, contabilizar al postear, qué transiciones son legales) vive **server-side en Etendo Classic** y se reutiliza. La nueva UI actúa como capa de presentación: dispara las acciones delegándolas a los procesos clásicos, refresca el registro tras la acción y deriva la editabilidad de cada campo de la metadata.
> Tres piezas hacen el trabajo en el cliente:
> - **Acciones de documento**: se renderizan como botones de proceso desde la metadata del campo botón (`processAction`/`buttonRefList`); su ejecución se delega a los procesos clásicos (pipeline de iframe / `ProcessDefinitionModal`, ya documentado en Secciones 1 y 3).
> - **Editabilidad por estado**: `ad_column.readonlylogic` (p. ej. `@Processed@='Y'`) la traduce el adapter a `readOnlyLogicExpression` y el cliente la evalúa por campo (`BaseSelector`) y por celda de grilla (`Table`), junto con `isUpdatable` y el bloqueo de formulario cuando el documento está `IP` (en proceso).
> - **Re-bloqueo tras la acción**: al terminar una acción de documento, `handleCompleteRefresh` → `refreshRecordAndSession` recarga el registro y la inicialización de formulario, por lo que el nuevo estado vuelve a dirigir el read-only automáticamente.

**Estimación global de la sección: ~95% de cobertura efectiva.** El ciclo de vida del documento funciona de extremo a extremo porque reutiliza el motor clásico: los estados se reconocen, las acciones se ejecutan y validan en el backend, la editabilidad se bloquea/desbloquea según el estado y el registro se re-bloquea tras procesar. El único hueco con impacto real es la **protección de edición concurrente**: el bloqueo optimista lo aplica el backend, pero la nueva UI no lo comunica con un mensaje/flujo dedicado.

---

## Qué está completamente hecho

| Capacidad (checklist 7.6 / 7.x) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Reconocimiento de estados de documento** | El cliente lee el estado del registro (`documentStatus`/`docstatus`/`docStatus`…) y el flag de procesamiento; los 10 estados del spec (`DR`,`IP`,`CO`,`CL`,`VO`,`RE`,`NA`,`WP`,`TEMP`,`??`) coinciden con la lista de referencia `All_Document Status` del AD. |
| **Nuevos documentos en Draft (editable)** | Un registro nuevo (`NEW_RECORD_ID`) entra en `FormMode.NEW` con estado por defecto `DR`; el read-only por estado no aplica y el formulario es editable. |
| **Ejecución de las acciones de documento** | Complete/Void/Close/Reactivate/Post/etc. se ejecutan delegando al proceso clásico correspondiente (botón de documento → popup clásico en iframe, o `ProcessDefinitionModal`). Toda la lógica (validaciones, reversos, contabilización) corre server-side. |
| **Complete valida los datos requeridos** | La validación (líneas existen, cantidades > 0, etc.) la realiza el proceso clásico de completar; los errores se devuelven y se muestran. |
| **Transición a Completed y re-bloqueo** | Tras completar con éxito, `handleCompleteRefresh`/`refreshRecordAndSession` recargan el registro con el nuevo estado (`CO`); la `readonlylogic` `@Processed@='Y'` deja todos los campos en solo lectura sin recargar la página. |
| **Reactivate vuelve a Draft (donde aplica)** | Delegado al proceso clásico de reactivación; el formulario se refresca y vuelve a ser editable si el estado regresa a `DR`. |
| **Reactivate bloqueado con documentos dependientes** | La validación (p. ej. factura ligada a remito) la hace el backend clásico; si la transición no es legal, devuelve error y la UI lo muestra. |
| **Void crea el documento de reverso** | El reverso (facturas, pagos) lo genera el proceso clásico de anulación; la UI solo dispara y refresca. |
| **Documentos Completed/Closed/Voided en solo lectura** | `ad_column.readonlylogic` (1165 columnas, 605 referencian `@Processed@`/`@DocStatus@`) → `readOnlyLogicExpression`, evaluada por campo en formulario y por celda en grilla; `isUpdatable=false` y el bloqueo total del formulario en estado `IP`. |
| **Editabilidad por estado en grilla (edición inline)** | La grilla evalúa `readOnlyLogicExpression` con los valores de la fila + `isReadOnly`/`isUpdatable` por columna, de modo que las líneas de un documento procesado no se editan inline. |
| **Post (contabilizar) y Unpost** | El botón Post es una acción de documento que fija el parámetro de contabilización y delega en el proceso clásico de posteo/despost; el resultado refresca el estado contable. |
| **Dropdown muestra solo acciones válidas para el estado** | El botón de acción resuelve su etiqueta dinámicamente según el estado actual (`buttonRefList`, p. ej. `CO`→"Reactivate"); el conjunto de acciones válidas lo provee el backend (FIC/`refList`) y, en los documentos transaccionales, el combo de acción se filtra dentro del propio popup clásico. |
| **Error ante transición inválida** | Si el backend responde `status: -1`, la UI lanza/empaqueta el error y lo muestra (toast / `ProcessMessageBar`), sin aplicar cambios. |
| **Estado `IP` (en proceso) totalmente bloqueado** | Mientras el documento está `IP` o `processing='Y'`, el formulario se fuerza a solo lectura. |

---

## Qué está parcialmente hecho

- **Protección de edición concurrente:** el bloqueo optimista existe a nivel de backend — la nueva UI envía el `updated` del registro (`inpupdated`) en la inicialización de formulario, por lo que un guardado sobre un registro modificado por otro usuario es rechazado server-side. Sin embargo, la nueva UI **no surface un mensaje/flujo dedicado** ("el registro fue modificado por otro usuario, recargá"): el usuario ve un error de guardado genérico en lugar de una indicación clara de conflicto con opción de recargar. La protección está; la comunicación al usuario es parcial. → **Tarea 1**.

---

## Qué no está hecho

- Nada con impacto real. La barra de estado/progreso "en tiempo real" durante el proceso (último ítem del checklist 7.6) no aplica como brecha: las acciones de documento síncronas tampoco muestran progreso *push* en el clásico, y la nueva UI muestra el modal/iframe de proceso durante la ejecución y refresca el estado al terminar. El monitoreo de procesos en background se cubre con sus ventanas estándar (Sección 3). No se crea tarea.

---

## Resumen de lo que queda por hacer

La máquina de estados está prácticamente completa porque reutiliza íntegramente el motor clásico: la nueva UI reconoce los estados, crea los nuevos documentos en Draft editable, ejecuta y valida las acciones (Complete/Void/Close/Reactivate/Post) delegándolas al backend, bloquea la edición de campos y líneas según el estado (vía `readonlylogic`/`isUpdatable`, en formulario y en grilla), re-bloquea el registro tras procesar, muestra solo las acciones válidas con etiqueta dinámica por estado y propaga los errores de transición inválida. El único pendiente con impacto real es **comunicar adecuadamente los conflictos de edición concurrente** (**Tarea 1**, impacto medio-bajo): el bloqueo ya lo aplica el backend, falta un mensaje/flujo de recarga claro en la UI.

---

## Tareas

### Tarea 1 — Comunicar los conflictos de edición concurrente al guardar

**Descripción:** cuando dos usuarios editan el mismo documento, el backend rechaza el guardado del segundo mediante el bloqueo optimista (la nueva UI ya envía el `updated` del registro), pero el usuario solo recibe un error genérico de guardado. No hay un mensaje claro de "el registro fue modificado por otro usuario" ni una acción guiada para recargar el registro actualizado, como sí ocurre en el clásico.

**Solución propuesta:** detectar la respuesta de conflicto de versión que devuelve el backend al guardar y presentarla como un aviso específico de edición concurrente, ofreciendo al usuario recargar el registro con los datos vigentes antes de reintentar. Reutilizar el mecanismo de mensajería ya existente y el flujo de refresco de registro que la sección usa tras las acciones de documento, sin alterar el resto del manejo de errores de guardado.

**Test cases:**
- Editar y guardar un registro que otro usuario ya modificó muestra un aviso claro de conflicto (no un error genérico).
- El aviso ofrece recargar el registro y, tras recargar, los datos reflejan la versión vigente.
- Un guardado sin conflicto no muestra ningún aviso (sin regresión).
- El resto de errores de guardado (validación, permisos) siguen mostrándose como hasta ahora.
- Aplica tanto en vista formulario como en edición inline de grilla.

**Resultado:** los conflictos de edición concurrente se comunican de forma clara y accionable, igualando la experiencia del clásico y cerrando el último ítem del checklist de la sección.
