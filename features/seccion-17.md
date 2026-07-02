# Sección 17 — Toolbar Buttons (Complete Reference)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 17. Cubre la barra de acciones superior de cada ventana estándar: los **botones estándar** (17.1), los **generados por plantilla/ventana** (Clone, Print, Email, Audit, botones de proceso — 17.2), los de **personalización y gestión de vistas** (17.3), los de **importación por pestaña** (17.4), los **registrados por módulos** (17.5), los **overrides de comportamiento** (monkey-patching — 17.6) y la **gestión de estado de los botones** (17.7).

> **Clave de arquitectura:** el clásico construye la toolbar en `ob-toolbar.js` y la puebla vía `OB.ToolbarRegistry`, con botones registrados por JS de cada módulo y ordenados por `sortPosition`; los módulos añaden botones con `registerButton()` y modifican comportamiento con `isc.addProperties()` (monkey-patching). La nueva UI reemplaza esto por un **registro de toolbar dirigido por datos**: una tabla propia del adapter (`etmeta_toolbar_button`) + una tabla de **alcance por ventana** (`etmeta_toolbar_button_window`), servida por `ToolbarBuilder.toJSON()` (`com.etendoerp.metadata`) y consumida por `Metadata.getToolbar()`. Cada botón trae `action`, `seqno`, `section` (`left`/`center`/`right`), `buttonType`, `icon`, `module` y `windows[]`. En el cliente, `useToolbar` filtra por ventana, `getToolbarSections` organiza por sección + `seqno` y `createButtonByType` genera cada botón; el **despacho de acciones** (`useToolbarConfig.actionHandlers`) es un **mapa fijo en el cliente** keyed por el string `action`. Los botones de proceso (gear/cog) se resuelven aparte, desde los `actionFields` de la pestaña, hacia el `ProcessMenu` (ver Secciones 2 y 4).

**Estimación global de la sección: ~70% de cobertura efectiva.** Los botones **estándar** de uso diario (New, Save, Delete, Refresh, Export, Attachments, Link) están **completos**, con una **gestión de estado robusta** (habilitación por modo vista/formulario, selección, estado de documento, formulario sucio, `UIPattern` de permisos, registro nuevo). Los generados por ventana **Clone/Print/Email** y los **botones de proceso** están hechos, y existe un **mecanismo de registro declarativo con alcance por ventana** que sustituye conceptualmente a `OB.ToolbarRegistry` (Copilot e *Init RX Services* ya lo usan). Los huecos se concentran en: **Audit Trail**, **Personalize Form**, los **botones de importación por pestaña** (17.4), varios **botones de módulos** aún no portados (Config Middleware, BoostedUI Grid&Form, herramientas de debug, Profitability), la ausencia de una **API de plugins genérica** (el despacho de acciones es un mapa fijo; no se consume `etmetaActionHandler` de forma genérica ni hay hooks de override tipo `beforeDelete`) y la falta de **overflow responsive** de la toolbar.

---

## Qué está completamente hecho

| Requisito (checklist 17.x) | Implementación en la nueva UI |
|----------------------------|-------------------------------|
| **17.1 New Document** (`NEW`) | Botón `NEW` (sección `left`); en form view abre nuevo registro, respeta `UIPattern` (oculto en `READ_ONLY`/`EDIT_ONLY`). Atajo `Ctrl+N` en formulario. |
| **17.1 Save** (`SAVE`) | Botón `SAVE` (sección `left`); habilitado solo con cambios (`hasFormChanges`), deshabilitado durante guardado (`isSaving`) y proceso de documento. Atajo `Ctrl+S`. |
| **17.1 Delete** (`eliminate` → `DELETE`) | Botón `DELETE` con confirmación (`ConfirmModal`), soporta **borrado múltiple** desde selección de grilla; deshabilitado sin selección o por patrón/estado de documento. |
| **17.1 Refresh** (`REFRESH`) | Botón `REFRESH`; recarga grilla/formulario, incluye refresco de tabs hijos y limpieza de caché de toolbar. |
| **17.1 Export** (`EXPORT_CSV`) | Botón de exportación a hoja de cálculo (delega al datasource; ver Sección 15 sobre su indicador de carga). |
| **17.1 Attachments** (`ATTACHMENT`) | Botón con **badge de cantidad** (`session._attachmentCount`); abre gestión de adjuntos; deshabilitado sin registro seleccionado. |
| **17.1 Link / Direct Link** (`SHARE_LINK`) | Botón que copia la URL directa al portapapeles, con tooltip de confirmación. |
| **17.2 Clone** (`COPY_RECORD`) | Presente y **condicionado** a `tab.obuiappShowCloneButton`; soporta clonado **simple** y **con hijos** (`obuiappCloneChildren`) vía modal de acción. Deshabilitado en nuevo registro / patrón RO. |
| **17.2 Print** (`PRINT_RECORD`) | Botón de impresión del documento; se oculta en ventanas de proceso "Print" para evitar duplicidad. |
| **17.2 Email** (`SEND_MAIL`) | Modal *Send Mail* (destinatarios, plantilla, adjuntos del registro + archivos) contra `/meta/email/config`, `/meta/email/send`, `/meta/email/attachments` del adapter. |
| **17.2 Process Buttons** | Un ítem por columna Button de la pestaña; se listan en `ProcessMenu` desde los `actionFields`, con **evaluación de display logic** (incluye `context.*` vía aux inputs) y soporte multi-registro según `isMultiRecord`. |
| **17.3 Manage Views** (equivalente) | `SAVE_VIEW` + `SaveViewMenu`: guardar/aplicar/eliminar vistas y **aplicación automática de la vista por defecto** (`useAutoApplyDefaultView`). |
| **17.5 Copilot** (`COPILOT`) | Condicionado a `isCopilotInstalled`; despacha evento `openCopilotWithContext` con **contexto** (registros seleccionados, ítems, flag de contexto). |
| **17.5 Init RX Services** (`INITIALIZE_RX_SERVICES`) | Botón **con alcance por ventana** (tabla `etmeta_toolbar_button_window`, ventana RX Config); invoca el ActionHandler del kernel y reporta resultado por toast. Demuestra el patrón de botón de módulo con scope. |
| **17.7 Button State Management** | `getDisableConfig` + `isVisibleButton` + `getPressedConfig` evalúan: modo grid/form, cantidad de selección, estado de documento (`isDocumentProcessing`), formulario sucio (`hasFormChanges`), permisos (`UIPattern` `READ_ONLY`/`EDIT_ONLY`/`EDIT_AND_DELETE_ONLY`), registro nuevo (`hasParentRecordSelected`) y estado *toggle* (filtros con `isPressed`). |
| **Orden y secciones** | Orden por `seqno` y agrupación en `left`/`center`/`right` (equivalente declarativo al `sortPosition`); filtrado por ventana vía `windows[]`. |

---

## Qué está parcialmente hecho

- **17.1 Variantes de botones estándar (New Row / Save & Close / Undo).** La nueva UI expone un único botón **New** (abre alta en formulario) y `CANCEL` (volver/descartar); la creación **inline** de filas en grilla existe a nivel de tabla (`createEmptyRowData`/`insertNewRowAtTop`) pero **no como botón "New Row" diferenciado**. No hay botón dedicado **Save & Close** ni **Undo** independiente (se cubre con guardado + navegación y `Escape`). Los registros se crean/guardan/descartan, pero no hay paridad 1:1 de estos botones. → nota, no bloqueante.
- **17.1 Atajos de teclado.** Existen `Ctrl+S` (guardar), `Ctrl+N` (nuevo) y `Escape` (guardar+volver) en el formulario, pero **no** el set completo del clásico (`ToolBar_Save`, `ToolBar_Refresh`, `ToolBar_Eliminate`, etc.) ni atajos a nivel de grilla. → **Tarea 4** (englobado como robustez de la toolbar) / nota.
- **17.5 Botones de módulos.** El **mecanismo** de registro declarativo con alcance por ventana existe y funciona (Copilot, Init RX Services), pero **el despacho de la acción es un mapa fijo** en `useToolbarConfig` (no se consume `etmetaActionHandler` de forma genérica; `buttonType` `DROPDOWN`/`MODAL`/`TOGGLE`/`CUSTOM` emiten acciones sin handler genérico). Por ello, agregar un botón de módulo con **comportamiento nuevo** hoy requiere tocar el core del cliente. → **Tarea 4**.
- **17.6 Overrides de comportamiento.** La `all-features.md` recomienda reemplazar el monkey-patching por un sistema de hooks (`beforeDelete(tabId, records)`). La nueva UI **no** tiene aún ese sistema de hooks/middleware; los overrides específicos (Delete en Remittance/Picking) **no** están portados. El registro declarativo es una base mejor que el monkey-patching, pero **no** ofrece todavía el punto de extensión de comportamiento. → **Tarea 4**.

---

## Qué no está hecho

- **17.2 Audit** — No existe botón/visor de **Audit Trail** (historial de cambios del registro). → **Tarea 1**.
- **17.3 Personalize Form / Edit Personalization** — No existe el editor de **layout de formulario** (reordenar/ocultar campos por usuario/rol). → **Tarea 2**.
- **17.4 Botones de importación por pestaña** — *Import Products in Discount*, *Import BP in BP Set*, *Import BP in BP Set Line* no están registrados en la toolbar de la nueva UI. → dependen de **Tarea 4** (una vez exista API de plugins genérica) + su handler específico.
- **17.5 Botones de módulos no portados** — *Config Middleware* (EtendoRX), *Grid & Form* (BoostedUI split view), herramientas de **debug** (`rmFilters`, `showFields`, `showGridId`, gateadas por `SMFSCDT_EnableDebug`), *Profitability Report* (JIRA). No están en el registro. → dependen de **Tarea 4**.
- **Checklist — Toolbar responsive / overflow** — Las secciones renderizan los botones en fila (flex) **sin manejo de desborde** (no hay menú "más…" ni scroll) cuando no caben en pantalla. → **Tarea 3**.

---

## Resumen de lo que queda por hacer

El núcleo transaccional de la toolbar está **completo y con buena gestión de estado**, y la arquitectura declarativa (registro dirigido por datos + alcance por ventana) es una base sólida y superior al monkey-patching. Lo pendiente:

1. **(Tarea 1)** Botón/visor de **Audit Trail** (historial de cambios del registro).
2. **(Tarea 2)** Botón de **Personalize Form** (editor de layout de formulario por usuario/rol).
3. **(Tarea 3)** **Overflow responsive** de la toolbar cuando hay más botones que ancho disponible.
4. **(Tarea 4)** **API de plugins genérica** para módulos: despacho de acciones por `etmetaActionHandler` (sin tocar el core) + tipos `DROPDOWN`/`MODAL`/`TOGGLE`/`CUSTOM` funcionales + **hooks de override** tipo `beforeDelete`. Habilita portar los botones de import (17.4), Config Middleware, BoostedUI, debug tools, Profitability y los overrides de Delete (Remittance/Picking) sin monkey-patching.

Los botones estándar, Clone/Print/Email, los de proceso, Save View, Copilot e Init RX Services no requieren tareas.

---

## Tareas

### Tarea 1 — Botón y visor de Audit Trail en la toolbar

**Descripción.** El clásico ofrece un botón **Audit** que abre el historial de cambios del registro actual (quién, cuándo y qué cambió) cuando el audit trail está habilitado. La nueva UI no expone este botón ni una vista equivalente.

**Solución propuesta.** Incorporar al registro de toolbar un botón de auditoría, visible solo cuando el registro tiene auditoría habilitada y hay un registro guardado seleccionado, que abra una vista/diálogo con el historial de cambios obtenido del backend. Debe respetar permisos y deshabilitarse en registros nuevos no guardados.

**Test cases.**
- En una ventana con audit trail habilitado y un registro seleccionado, el botón aparece y abre el historial.
- El historial muestra los cambios (campo, valor anterior/nuevo, usuario, fecha) del registro.
- En un registro nuevo no guardado el botón está deshabilitado.
- En ventanas sin auditoría habilitada el botón no aparece.

**Resultado.** El usuario puede consultar el historial de cambios de un registro desde la toolbar, con paridad respecto del botón Audit del clásico.

---

### Tarea 2 — Botón Personalize Form (editor de layout de formulario)

**Descripción.** El clásico permite personalizar el formulario (reordenar/ocultar campos, agrupar) mediante el botón **Personalize Form**, con persistencia por usuario/rol. La nueva UI no ofrece este editor desde la toolbar.

**Solución propuesta.** Añadir un botón de personalización que abra un gestor de layout del formulario donde el usuario pueda mostrar/ocultar y reordenar campos, guardando la configuración por usuario/rol y aplicándola al render del formulario. La solución debe apoyarse en el mecanismo de personalización de Etendo (backend) y reflejarse en la nueva UI de forma consistente.

**Test cases.**
- El botón abre el editor de layout con los campos del formulario actual.
- Ocultar/reordenar campos y guardar persiste la configuración para el usuario/rol.
- Al reabrir la ventana, el formulario respeta la personalización guardada.
- Restaurar la vista por defecto vuelve al layout original.

**Resultado.** El usuario puede personalizar la disposición del formulario y la nueva UI la respeta, con paridad respecto de la personalización del clásico.

---

### Tarea 3 — Overflow responsive de la toolbar

**Descripción.** Cuando el número de botones supera el ancho disponible (pantallas angostas o ventanas con muchos botones de módulo/proceso), la toolbar los renderiza en fila sin manejar el desborde, pudiendo recortarse o desbordar el layout.

**Solución propuesta.** Introducir un comportamiento responsive que, al no caber todos los botones, agrupe los excedentes en un menú de desborde ("más…") o habilite un desplazamiento controlado, preservando la prioridad/orden de los botones y su accesibilidad. Debe mantener consistente la agrupación por secciones.

**Test cases.**
- En una ventana con muchos botones y viewport angosto, los excedentes se agrupan en un menú de desborde accesible.
- Todos los botones siguen siendo alcanzables y ejecutables desde el desborde.
- Al ensanchar la ventana, los botones vuelven a mostrarse en línea sin duplicarse.
- El orden/prioridad de los botones se respeta al mover unos al desborde.

**Resultado.** La toolbar se adapta a cualquier ancho sin recortar acciones, manteniendo todas las acciones accesibles.

---

### Tarea 4 — API de plugins genérica para botones de módulos (sin monkey-patching)

**Descripción.** El registro de toolbar es declarativo y soporta alcance por ventana, pero el **despacho de la acción es un mapa fijo** en el cliente: los tipos `DROPDOWN`/`MODAL`/`TOGGLE`/`CUSTOM` no tienen handler genérico y el campo `etmetaActionHandler` no se consume de forma general. Además no existe un sistema de **hooks de override** para reemplazar el monkey-patching del clásico (p. ej. el Delete personalizado de Remittance/Picking). Por eso, botones de módulo con comportamiento propio (import por pestaña, Config Middleware, BoostedUI Grid&Form, debug tools, Profitability) requieren cambios en el core del cliente.

**Solución propuesta.** Definir un punto de extensión genérico donde un módulo registre un botón (con su alcance por ventana/pestaña, condición de visibilidad por preferencia y tipo) y su comportamiento se resuelva sin tocar el core: despacho por `etmetaActionHandler` (invocación al backend) y/o handlers de acción declarados por el módulo para los tipos `DROPDOWN`/`MODAL`/`TOGGLE`/`CUSTOM`. Complementariamente, proveer **hooks** de comportamiento (p. ej. `beforeDelete(tabId, records)`) que los módulos puedan registrar para alterar acciones estándar sin monkey-patching. Con esta base se pueden portar los botones pendientes (17.4 import, Config Middleware, BoostedUI, debug tools condicionados por preferencia, Profitability) y los overrides de Delete.

**Test cases.**
- Un módulo registra un botón nuevo con acción propia y funciona sin modificar el core del cliente.
- Un botón con `etmetaActionHandler` invoca el handler del backend y muestra su resultado.
- Un botón condicionado por preferencia (p. ej. debug) solo aparece cuando la preferencia está activa.
- Un hook `beforeDelete` registrado por un módulo intercepta el Delete en su pestaña objetivo y deja intacto el Delete estándar en el resto.
- Los tipos `DROPDOWN`/`MODAL`/`TOGGLE` ejecutan su interacción esperada.

**Resultado.** Los módulos pueden extender la toolbar (botones y overrides de comportamiento) de forma declarativa y sin monkey-patching, habilitando la portación de los botones de módulo pendientes.
