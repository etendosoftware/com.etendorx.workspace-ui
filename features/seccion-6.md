# Sección 6 — Callouts

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 6. Un *callout* es lógica que se dispara cuando cambia el valor de un campo y que puede auto-rellenar otros campos, validar el valor, recalcular derivados, mostrar mensajes y filtrar las opciones de combos relacionados. Se definen en `ad_callout` y se enlazan a columnas vía `ad_column.ad_callout_id`.

> **Clave de arquitectura:** los callouts **no se reimplementan** en la nueva UI. Se ejecutan *server-side* reutilizando el `FormInitializationComponent` (FIC) clásico de Etendo: al cambiar un campo, la nueva UI hace `POST` al kernel con `MODE=CHANGE` + `CHANGED_COLUMN` y el FIC corre **toda la cadena de callouts** (Java/SQL) del registro y devuelve `columnValues`, `auxiliaryInputValues` y `calloutMessages`. Por eso los 10 ejemplos del spec (SE_Payment_BPartner, SE_PaymentMethod_FinAccount, SL_Product_Type, etc.) funcionan tal cual: la lógica vive en el backend clásico.
> En el cliente, `useCallout` (formulario) y `useInlineCallout` (edición inline de grilla) hacen la llamada; `BaseSelector` decide *cuándo* disparar; `GlobalCalloutManager` (`services/callouts.ts`) ordena/encola/suprime; `BaseSelector.applyColumnValues` aplica los valores devueltos.

**Estimación global de la sección: ~95% de cobertura efectiva.** El mecanismo de callouts está implementado de extremo a extremo y cubre la inmensa mayoría del checklist del spec (205 callouts activos sobre 335 columnas en la instancia). El único hueco con impacto real es que los **mensajes de callout no bloqueantes** (warning/info/success) no se muestran en formularios y grilla de ventana.

---

## Qué está completamente hecho

| Capacidad | Implementación en la nueva UI |
|-----------|-------------------------------|
| **Disparo del callout al cambiar el campo** | `BaseSelector` ejecuta `runCallout`: inmediato para selectores/combos/fechas (`isImmediateCalloutField`) y al perder el foco (`onBlurCapture`) para campos de texto, replicando el clásico. |
| **Ejecución server-side (toda la cadena)** | `useCallout` hace `POST` al FIC (`FormInitializationComponent`, `MODE=CHANGE`) con el payload completo del registro + `CHANGED_COLUMN`; el FIC clásico ejecuta los callouts y devuelve los cambios. Sin reimplementación de los 205 callouts. |
| **Auto-relleno de campos** | `applyColumnValues` aplica cada `columnValues[col].value` al campo correspondiente (resuelto por columna o por property-field), con su `identifier` de FK. |
| **Recálculo de derivados** | Misma vía: el callout devuelve los valores recalculados (importes, tasas de cambio, cantidades con conversión de UOM) y se aplican al formulario sin refrescar la página. |
| **Filtrado de combos relacionados** | Si el callout restringe opciones, devuelve `entries`; `applyColumnValues` las expone al selector (`{hqlName}$_entries`) para acotar el desplegable (ej. SE_PaymentMethod_FinAccount). |
| **No dispara en la carga del registro** | Guardas `isFormInitializing` / `isSettingInitialValues`; en modo `NEW` además exige que el campo esté *dirty*. Solo cambios iniciados por el usuario disparan callout. |
| **No dispara en cambios programáticos** | Al aplicar los valores devueltos se activa `globalCalloutManager.suppress()` + `isSettingFromCallout`, evitando que los `setValue` del propio callout reentren y disparen otros callouts. |
| **Orden correcto y cascada** | `GlobalCalloutManager` encola y serializa los callouts (queue + `waitForIdle`); la cascada (un callout que cambia otro campo con callout) la resuelve el FIC clásico dentro de la misma petición server-side. |
| **Funciona en vista formulario** | Vía `BaseSelector` para todos los tipos de campo. |
| **Funciona en edición inline de grilla** | `useInlineCallout` replica la misma llamada al FIC con los datos de la fila en edición y aplica los `columnValues` a la celda/fila. |
| **Funciona con selectores y date pickers** | El disparo inmediato cubre la selección desde popup de selector y la elección de fecha (se ejecuta tras confirmar el valor). |
| **Errores bloqueantes del callout** | Si el FIC responde `status: -1`, `useCallout`/`useInlineCallout` muestran el mensaje de error (`toast.error`) y abortan la aplicación de valores. |
| **Referencias `@Columna@` en defaultValue** | `useDefaultValueReaction` propaga reactivamente valores entre campos enlazados por `defaultValue=@Col@` (complementa, sin solaparse con, la lógica de callouts). |
| **Sin congelamiento de UI** | Llamada asíncrona con *debounce* (300 ms) en campos de texto y cola no bloqueante; el formulario sigue respondiendo durante el callout. |

---

## Qué está parcialmente hecho

- **Mensajes de callout no bloqueantes (warning / info / success):** el FIC clásico devuelve un arreglo `calloutMessages` (cada uno con `text` + `severity`: `TYPE_INFO`/`TYPE_WARNING`/`TYPE_ERROR`/`TYPE_SUCCESS`) cuando un callout emite un mensaje (`MESSAGE`/`INFO`/`WARNING`/`ERROR`). En la nueva UI, **el path de formulario y de grilla de ventana no lee `calloutMessages`**: solo se maneja el error bloqueante `status: -1`. Por lo tanto, un callout que avisa al usuario de forma no bloqueante (p. ej. "se ajustó el método de pago", "precio por debajo del costo") **queda silencioso**. El componente para mostrarlos ya existe pero está cableado solo al modal de proceso (`messageBarStore`), no al formulario de ventana. → **Tarea 1**.

---

## Qué no está hecho

- **Resaltado visual breve del campo modificado por el callout:** el spec menciona distinguir visualmente (highlight momentáneo) los campos que un callout acaba de cambiar. La nueva UI actualiza el valor pero **no aplica un resaltado transitorio**. Es una paridad cosmética de baja prioridad (no afecta la corrección del dato). → **Tarea 2**.

---

## Resumen de lo que queda por hacer

El comportamiento de callouts está prácticamente completo: se disparan en el momento correcto (cambio de campo, no en carga, no en cambios programáticos), se ejecutan server-side reutilizando el FIC clásico (auto-relleno, recálculo, validación y filtrado de combos), respetan orden y cascada, y funcionan tanto en formulario como en edición inline de grilla, con selectores y date pickers. Quedan dos ajustes: **mostrar los mensajes de callout no bloqueantes** (`calloutMessages`) en formularios y grilla de ventana (**Tarea 1**, impacto medio y la única brecha funcional) y **añadir el resaltado visual breve** del campo modificado por un callout (**Tarea 2**, cosmética, baja prioridad).

---

## Tareas

### Tarea 1 — Mostrar los mensajes de callout no bloqueantes en formulario y grilla

**Descripción:** cuando un callout emite un mensaje (información, advertencia o éxito) el FIC lo devuelve en el arreglo `calloutMessages` de la respuesta de cambio, pero la nueva UI solo procesa el error bloqueante (`status: -1`) y descarta el resto. Como resultado, los avisos no bloqueantes que el usuario vería en el clásico no aparecen al editar en ventana (ni en formulario ni en edición inline de grilla).

**Solución propuesta:** leer los mensajes que el callout devuelve en la respuesta de cambio y presentarlos al usuario con la severidad correspondiente (info/advertencia/éxito como notificación no bloqueante y error como bloqueante), reutilizando el mismo mecanismo de mensajería ya disponible para el modal de proceso. Debe aplicarse tanto en el path de formulario como en el de edición inline de grilla, sin alterar la aplicación de los valores que el callout también devuelve.

**Test cases:**
- Un callout que emite una advertencia muestra el aviso no bloqueante y permite continuar la edición.
- Un callout informativo/de éxito muestra el mensaje con la severidad correcta.
- Un mensaje de error de callout sigue mostrándose como bloqueante (sin regresión respecto a `status: -1`).
- Los mensajes aparecen tanto editando en formulario como en edición inline de grilla.
- Múltiples mensajes en una sola respuesta de callout se muestran todos.
- No se muestran mensajes en la carga del registro ni en cambios programáticos.

**Resultado:** los avisos de callout (no bloqueantes y bloqueantes) se comunican al usuario en ventana igual que en el clásico, cerrando la única brecha funcional de la sección.

### Tarea 2 — Resaltar brevemente los campos modificados por un callout

**Descripción:** tras ejecutarse un callout, los campos que cambia de forma automática se actualizan pero sin ninguna señal visual; en el clásico el usuario percibe un resaltado momentáneo que le indica qué campos tocó el callout. Es una mejora de paridad/UX, no un defecto de datos.

**Solución propuesta:** al aplicar los valores devueltos por un callout, marcar transitoriamente los campos efectivamente modificados con un resaltado breve que se desvanezca, reutilizando la información de qué columnas devolvió la respuesta para no resaltar campos que no cambiaron. Aplicable a formulario y, si es viable, a la grilla.

**Test cases:**
- Al disparar un callout que auto-rellena campos, esos campos muestran un resaltado breve y luego vuelven al estado normal.
- Los campos no modificados por el callout no se resaltan.
- El resaltado no interfiere con la edición posterior ni con el foco.
- Sin impacto perceptible de rendimiento al aplicar muchos valores a la vez.

**Resultado:** el usuario identifica visualmente qué campos cambió un callout, igualando la experiencia del clásico.
