# Sección 35 — View States (Form/Grid Layout)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 35. Cubre los **estados de layout de una ventana estándar**: la relación entre la **grilla** (lista de registros) y el **formulario** (detalle de un registro), y las cuatro situaciones que el clásico modela como `TOP_MAX` (grilla maximizada, form oculto), `BOTTOM_MAX` (form maximizado, grilla oculta), `MID` (vista partida con grilla y form visibles simultáneamente, separados por un **divisor arrastrable**) y `MIN` (minimizado, según contexto); más las transiciones (doble clic en fila → form; botón/atajo Maximizar; Cerrar/Escape → grilla; Nuevo documento; Guardar y cerrar; y arrastrar el divisor para ajustar la proporción).

> **Clave de arquitectura:** §35 describe comportamiento **100% de cliente en tiempo de ejecución**. No hay metadata, ni tabla, ni endpoint del adapter (`com.etendoerp.metadata`) que gobierne estos estados — ni en el clásico ni en la nueva UI (el clásico también los resuelve como estado transitorio del `View` SmartClient). Por tanto §35 se evalúa **enteramente sobre el código del cliente**, sin nada que consultar en la base de datos ni que delegar al servidor.

> **Clave de paradigma:** la nueva UI **no replica el modelo de 4 estados con divisor arrastrable**; adopta deliberadamente un modelo **binario por pestaña**: `TAB_MODES = { TABLE, FORM }` ([constants.ts:33](../client/packages/MainUI/utils/url/constants.ts#L33)). Cada tab muestra **o la grilla o el formulario a pantalla completa**, nunca ambos partidos por un divisor grilla/form. Cuando se muestra el form, la grilla se oculta por completo ([Tab.tsx:1230](../client/packages/MainUI/components/window/Tab.tsx#L1230), condicional `shouldShowForm` en [Tab.tsx:1260](../client/packages/MainUI/components/window/Tab.tsx#L1260)). Esto **cubre plenamente los dos estados extremos** (`TOP_MAX` y `BOTTOM_MAX`) y sus transiciones esenciales, pero **omite el estado `MID`** (grilla+form simultáneos con divisor arrastrable). Es una **decisión de diseño**, no un defecto per se: la vista partida de un mismo tab es lo único ausente.

**Estimación global de la sección: ~70% de cobertura efectiva.** Los estados de grilla-completa y form-completo, el doble clic para abrir el form, el cierre/Escape para volver a la grilla, la barra de estado con navegación entre registros en el form, la creación de nuevo registro (form vacío) y el guardado están **implementados**. Lo genuinamente ausente respecto de §35 es el **estado partido `MID`** (grilla y form a la vez con un **divisor arrastrable** entre ellos), el **toggle Maximizar/Restaurar** asociado y la **persistencia de la proporción del split** — todo ello consecuencia del paradigma binario elegido → **Tarea 1** (paridad de vista partida, de prioridad media/baja y sujeta a decisión de producto).

---

## Qué está completamente hecho

| Ítem del checklist 35.3 | Cómo queda cubierto |
|--------------------------|---------------------|
| **Grid-only view (`TOP_MAX`) muestra grilla a altura completa** | Modo `TABLE`: la grilla ocupa `flex-1 h-full` ([Tab.tsx:1244-1259](../client/packages/MainUI/components/window/Tab.tsx#L1244)). |
| **Form-only view (`BOTTOM_MAX`) muestra form a altura completa** | Modo `FORM`: el `FormView` ocupa todo el alto ([Tab.tsx:1260-1276](../client/packages/MainUI/components/window/Tab.tsx#L1260)). |
| **Grid-only oculta el form por completo (sin espacio en blanco)** | El `FormView` se renderiza **condicionalmente** (`{shouldShowForm && ...}`), no queda hueco vacío. |
| **Doble clic en fila abre el form de ese registro** | `onDoubleClick` → `setRecordId(record.id)` conmuta a modo form ([Table/index.tsx:2746](../client/packages/MainUI/components/Table/index.tsx#L2746)). |
| **Cerrar vuelve a la vista de grilla** | Escape/botón Cerrar → `handleBack()` limpia el estado de form y regresa a la grilla ([FormActions.tsx:213](../client/packages/MainUI/components/Form/FormView/FormActions.tsx#L213), StatusBar close). |
| **Form-only mantiene barra de estado con navegación** | La barra de estado muestra indicador `X / N` y botones Anterior/Siguiente ([RecordNavigationControls.tsx](../client/packages/MainUI/components/Form/FormView/RecordNavigationControls.tsx)) más tags de estado del documento. |

También están las acciones que §35.2 asocia a los estados: **Nuevo** (abre form vacío en modo `NEW`, `ctrl+n`) y **Guardar** (`ctrl+s`), con botones equivalentes en el toolbar.

---

## Qué está parcialmente hecho

- **Atajos de teclado y toggle Maximizar/Restaurar.** La nueva UI implementa sus **propios** atajos (`ctrl+s` guardar, `ctrl+n` nuevo, `Escape` guardar-si-hay-cambios y volver a grilla — [FormActions.tsx:222](../client/packages/MainUI/components/Form/FormView/FormActions.tsx#L222)), que cubren funcionalmente Nuevo, Guardar y Cerrar. Pero **no** existen los atajos exactos del clásico (`Alt+Shift+Enter`, `Ctrl+D`, `Ctrl+Shift+X`) ni un **botón/atajo de Maximizar-Restaurar** de la barra de estado (que en el clásico alterna `MID`↔`BOTTOM_MAX`); al no haber estado `MID`, ese toggle no tiene sentido en el paradigma actual. Semánticamente equivalente en lo esencial, distinto en atajos y sin toggle de maximizar.
- **Divisor arrastrable (existe, pero no entre grilla y form).** La nueva UI **sí tiene** un componente de divisor arrastrable ([ResizeHandle](../client/packages/ComponentLibrary/src/components/ResizeHandle/)), pero se aplica al **split vertical entre la pestaña padre y las pestañas hijas** ([Tabs.tsx](../client/packages/MainUI/components/window/Tabs.tsx)), que es el layout header/líneas — no al split grilla/form de un mismo tab. La capacidad de "arrastrar para redimensionar" existe en el producto, pero no en el eje que pide §35.
- **Vista lado a lado grilla+form (solo en modo árbol, proporción fija).** Cuando un tab tiene columna de árbol y se activa el modo árbol, grilla (35%) y form (65%) se muestran lado a lado ([Tab.tsx:1222-1244](../client/packages/MainUI/components/window/Tab.tsx#L1222)), pero con **proporción fija (no arrastrable)** y atada a la funcionalidad de árbol; no es el estado `MID` genérico de §35.

---

## Qué no está hecho

- **Estado `MID` (vista partida grilla + form simultáneos).** Para un tab estándar (sin árbol), no existe un modo en que la grilla y el formulario se vean **a la vez**; es siempre uno u otro.
- **Divisor arrastrable entre grilla y form** para ajustar la proporción del split. No existe (el `ResizeHandle` sirve al split padre/hijo, no a grilla/form).
- **Toggle Maximizar/Restaurar** de la barra de estado que alterne entre vista partida y form maximizado (`Alt+Shift+Enter`). No existe (no hay `MID` que restaurar).
- **Persistencia de la proporción del split** dentro de la sesión o por vista guardada. No aplica: al no haber split grilla/form, no hay proporción que persistir (el toggle de modo árbol es estado local del componente, no se persiste).

---

## Fuera de alcance / consideraciones (no son huecos de cliente en sentido estricto)

- **Nada que delegar ni consultar.** §35 es estado de UI en runtime: no hay metadata, tabla ni endpoint del adapter involucrados. La ausencia del estado `MID` **no** proviene de una limitación del servidor.
- **Elección de paradigma.** El modelo binario grilla↔form (con lado-a-lado solo para árbol) es una **decisión de diseño legítima** de la nueva UI, no un fallo de implementación. Que constituya "hueco" depende de si producto exige paridad estricta con la vista partida del clásico. Se documenta como tarea, pero con esa salvedad explícita.

---

## Resumen de lo que queda por hacer

Los estados de layout esenciales de §35 están **cubiertos**: grilla a pantalla completa (`TOP_MAX`), formulario a pantalla completa (`BOTTOM_MAX`), doble clic en fila para abrir el form, Escape/Cerrar para volver a la grilla, barra de estado con navegación entre registros en el form, y las acciones Nuevo (form vacío) y Guardar. La nueva UI resuelve esto con un **paradigma binario por pestaña** (grilla **o** form), distinto del modelo de 4 estados del clásico.

Lo que falta es exclusivamente lo asociado al **estado partido `MID`**: ver grilla y formulario **simultáneamente** separados por un **divisor arrastrable**, con su **toggle Maximizar/Restaurar** y la **persistencia de la proporción**. Como es un cambio de paradigma —y la nueva UI ya dispone de un componente de divisor arrastrable reutilizable ([ResizeHandle](../client/packages/ComponentLibrary/src/components/ResizeHandle/), hoy usado en el split padre/hijo)—, la implementación es **factible**, pero debe **validarse con producto** si se desea esa paridad o si el modelo binario actual es el comportamiento deseado. Se encapsula en la **Tarea 1**, de prioridad media/baja.

---

## Tareas

### Tarea 1 — Vista partida grilla/form (`MID`) con divisor arrastrable

**Descripción.** La nueva UI muestra, en un tab estándar, o la grilla o el formulario a pantalla completa, pero no ambos a la vez. El clásico ofrece además un estado intermedio (`MID`) en el que grilla y formulario conviven en pantalla separados por un divisor que el usuario puede arrastrar para ajustar la proporción, con un botón/atajo para maximizar/restaurar el form y con la proporción recordada durante la sesión (o por vista guardada). Esa vista partida, su divisor arrastrable, el toggle de maximizar/restaurar y la persistencia de la proporción no existen hoy para el eje grilla/form (el único divisor arrastrable presente opera entre la pestaña padre y las hijas). Debe confirmarse con producto si se busca paridad con el clásico o si el paradigma binario actual es el comportamiento deseado.

**Solución propuesta.** Introducir, para la ventana estándar, un estado de vista partida en el que grilla y formulario se muestren simultáneamente separados por un divisor arrastrable, reutilizando el componente de divisor ya existente en el producto en lugar de crear uno nuevo. Añadir un control (botón en la barra de estado y su atajo de teclado) para alternar entre la vista partida y el formulario maximizado, y hacer que la proporción del split se conserve durante la sesión (y, si se decide, por vista guardada). Mantener intactos los estados ya soportados (grilla completa y form completo) y las transiciones actuales (doble clic, Escape/cerrar, nuevo, guardar). Dado que es un cambio de paradigma, priorizarlo por debajo de las brechas funcionales de ventanas/procesos y acordar con producto el alcance mínimo (por ejemplo, empezar por una vista partida con proporción no persistida).

**Test cases.**
- Existe un modo en que grilla y formulario se ven simultáneamente en un tab estándar (sin depender del modo árbol), con un divisor entre ambos.
- Arrastrar el divisor ajusta la proporción entre grilla y formulario y el contenido se re-dimensiona correctamente.
- El botón/atajo de Maximizar alterna entre la vista partida y el formulario a pantalla completa, y Restaurar regresa a la vista partida.
- Cerrar (Escape/botón) desde cualquier estado vuelve a la grilla, y el doble clic en una fila sigue abriendo el formulario del registro.
- La proporción del split se conserva al navegar entre registros dentro de la sesión (y, si se define, se restaura por vista guardada).
- La barra de estado con navegación entre registros sigue visible y operativa en la vista partida y en el formulario maximizado.

**Resultado.** El usuario puede trabajar con grilla y formulario a la vez en una vista partida, ajustar su proporción arrastrando el divisor, maximizar/restaurar el formulario y conservar la proporción durante la sesión, alcanzando paridad con el estado `MID` del clásico dentro del alcance acordado con producto, sin regresiones en los estados de grilla-completa y form-completo ya existentes.

---

> **Nota sobre el entorno representativo (`etendodev`).** §35 es **estado de UI en tiempo de ejecución**: no hay metadata, tabla ni endpoint del adapter (`com.etendoerp.metadata`) que consultar, por lo que no aplica verificación en base de datos. Se confirmó en el código del cliente: el modelo de vista es binario por pestaña (`TAB_MODES = { TABLE, FORM }`, [constants.ts:33](../client/packages/MainUI/utils/url/constants.ts#L33)); la grilla se oculta por completo al mostrar el form ([Tab.tsx:1230](../client/packages/MainUI/components/window/Tab.tsx#L1230)); el doble clic en fila abre el form ([Table/index.tsx:2746](../client/packages/MainUI/components/Table/index.tsx#L2746)); el form conserva barra de estado con navegación entre registros ([RecordNavigationControls.tsx](../client/packages/MainUI/components/Form/FormView/RecordNavigationControls.tsx)); Escape/cerrar vuelve a la grilla y `ctrl+n`/`ctrl+s` cubren Nuevo/Guardar ([FormActions.tsx:222](../client/packages/MainUI/components/Form/FormView/FormActions.tsx#L222)); existe un divisor arrastrable ([ResizeHandle](../client/packages/ComponentLibrary/src/components/ResizeHandle/)) pero aplicado al split pestaña padre/hijas, no al eje grilla/form; y no hay dependencia de split-pane (`react-resizable-panels`, `allotment`, etc.) para grilla/form. El único hueco frente a §35 es el estado partido `MID` con divisor arrastrable, su toggle de maximizar/restaurar y la persistencia de la proporción — consecuencia del paradigma binario adoptado.
