# Sección 8 — Selectors and FK Fields

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 8. Cubre los **campos de clave foránea (FK) y sus widgets de selección**: TableDir, Table, Search, Selector (OBUISEL), Multi Selector y SelectorAsLink; su filtrado (organización, activos, reglas de validación, where HQL), el manejo de registros inactivos, los selectores en cascada y la navegación (zoom) al registro referenciado.

> **Clave de arquitectura:** la resolución de opciones de FK **no se reimplementa** en la nueva UI. El backend (`/erp`, adapter `com.etendoerp.metadata`) serializa la metadata del campo (`reference`, `referencedEntity`/`referencedWindowId`/`referencedTabId`, `_selectorDefinitionId`, `datasourceName`, `displayField`/`valueField`, `gridColumns`, `extraSearchFields`, `outFields`, `textMatchStyle`) y **reutiliza el datasource clásico** (`org.openbravo.service.datasource.DataSourceServlet` vía `ForwarderServlet`, con `SelectorDataSourceFilter`/`ComboTableDatasourceService`). El where HQL del selector, la regla de validación (`ad_val_rule`), el filtro de organización/cliente, el filtro de activos y la sustitución de parámetros dinámicos (`@current_org@`, `@ad_client_id@`, `@columna@`) se aplican **server-side** a la hora de consultar.
> En el cliente, `GenericSelector` enruta por `reference` al componente adecuado; `TableDirSelector` (combos y OBUISEL), `SelectSelector` (listas), `SelectorModal` (popup de búsqueda nativo) y `MultiRecordSelector` (chips) renderizan; `useTableDirDatasource` arma el request con el contexto del tab/formulario; `BaseSelector` aplica los `outFields` y dispara el callout; `Label` convierte la etiqueta del FK en un link de navegación al registro referenciado.

**Estimación global de la sección: ~96% de cobertura efectiva.** Los seis tipos de widget están implementados y el filtrado, el manejo de inactivos (display del valor), la cascada y la navegación (zoom) al registro referenciado funcionan reutilizando el motor clásico. Los huecos detectados son cosméticos o de muy baja incidencia: la **distinción visual de un FK inactivo ya seleccionado** y el **umbral mínimo de caracteres del typeahead**.

---

## Qué está completamente hecho

| Capacidad (checklist 8.x) | Implementación en la nueva UI |
|---------------------------|-------------------------------|
| **TableDir (ref 19)** | `GenericSelector` enruta a `TableDirSelector`; `useTableDirDatasource` consulta el `ComboTableDatasourceService` clásico. El más usado de la instancia (**4230 campos**). |
| **Table (ref 18)** | Mismo componente y datasource que TableDir (la distinción Table/TableDir es solo backend); 723 campos. |
| **Search (ref 30)** | Campo con buscador + **popup nativo** (`SelectorModal`, MUI `Dialog`, no iframe) con criterios, orden y paginación; el backend resuelve el datasource y, donde aplica, el `legacySearchUrl`. 1030 campos. |
| **Selector OBUISEL (ref 95…)** | Typeahead enrutado a `TableDirSelector`; el cliente reenvía `_selectorDefinitionId` y el `SelectorDataSourceFilter` clásico aplica el HQL where del selector. **539 columnas**. |
| **Columnas custom en el desplegable** | El backend emite `gridColumns` (campos del selector con `isShowingrid`) y `extraSearchFields`; `SelectorModal` los muestra como columnas y campos de búsqueda. |
| **Multi Selector** | `MultiRecordSelector` renderiza chips/tags, almacena CSV de ids + CSV de identificadores y abre `SelectorModal` en modo multiselección (agregar/quitar tags, persistir todos los valores). |
| **SelectorAsLink** | Renderiza como selector en edición y su etiqueta es un link de navegación al registro referenciado (ver zoom). Único caso de la instancia: campo *Triggered by Group* (ventana *Process Request*). |
| **Filtro por organización (TableDir/Table)** | `useTableDirDatasource` envía `_org` (desde `inpadOrgId` del formulario/padre) + `tabId`/`inpTableId`/`windowId`; el datasource clásico filtra por el árbol de organización. |
| **Solo registros activos** | El datasource clásico excluye inactivos por defecto; el desplegable no los lista. |
| **Reglas de validación (`ad_val_rule`)** | Se aplican server-side: el cliente envía el contexto completo (tab, tabla, ventana, valores del formulario y `_selectorDefinitionId`), y `SelectorDataSourceFilter`/combo aplican el where de la regla. 798 columnas / 1253 campos las usan. |
| **HQL where + parámetros dinámicos del selector** | `@current_org@`, `@ad_client_id@`, `@columna@` y `filterExpression` los resuelve el filtro clásico al consultar, con el contexto que envía el cliente. |
| **Selección popula el campo + dispara callout** | El backend emite `outFields` (tipo `field` → otro `AD_Field`, tipo `calloutInput` → sufijo); `BaseSelector` aplica los out-fields al seleccionar y ejecuta el callout (Sección 6). |
| **Selectores en cascada** | Al cambiar el padre, el callout/property-fields y el reenvío de los valores del formulario hacen que el selector hijo se re-consulte con el contexto actualizado (los `@param@` del HQL resuelven al nuevo valor). |
| **Typeahead con debounce y paginación** | Búsqueda con *debounce* (300 ms), `NOCOUNT`, mezcla de resultados paginados y `textMatchStyle` (`startsWith`/`substring`) enviado por el backend. |
| **Inactivo ya seleccionado se sigue mostrando** | El valor seleccionado no desaparece: su identificador se resuelve desde el registro (no desde la lista del desplegable), aunque el registro esté inactivo. |
| **Zoom / navegación al registro referenciado** | La etiqueta del FK es un link (`Label.tsx`): resuelve la ventana/tab destino con el endpoint clásico `ReferencedLink.html` (misma desambiguación Sales/Purchase del clásico) y abre el registro en su ventana en modo formulario. Gateado por accesibilidad (`isReferencedWindowAccessible`). También navega desde la grilla (por `clientclass`). Cubre TableDir/Table/Search/Selector y SelectorAsLink. |
| **Limpiar selección** | Los selectores permiten vaciar el valor (y el callout se reejecuta con el campo vacío). |

---

## Qué está parcialmente hecho

- **Distinción visual del FK inactivo ya seleccionado:** cuando el valor seleccionado de un FK corresponde a un registro inactivo, la nueva UI **lo muestra correctamente (no queda en blanco)** pero **sin un estilo diferenciado** (tachado / atenuado) que indique que está inactivo, como sugiere el spec ("typically shown in a different style: strikethrough or grayed out"). Es una mejora de paridad/UX, no un defecto de datos. → **Tarea 1** (cosmético, impacto bajo).

---

## Qué no está hecho

- **Umbral mínimo de caracteres antes de disparar el typeahead:** el selector consulta tras el *debounce* (300 ms) **con cualquier cantidad de caracteres**, sin exigir un mínimo (p. ej. 2–3). El checklist 8.4 lo menciona ("Typeahead triggers after min characters"). El impacto es bajo (los resultados están paginados y la consulta va con *debounce*), pero en datasets grandes evitaría consultas innecesarias con 1 carácter. → **Tarea 2** (UX/rendimiento, prioridad baja).

> **No son brechas (verificado en la instancia representativa):**
> - **Multi Selector** está implementado (`MultiRecordSelector`), aunque **0 columnas y 0 parámetros de proceso** de la instancia lo usan como widget de campo estándar (las 15 definiciones existen pero no se referencian desde metadata de ventana/proceso). No se crea tarea.
> - **SelectorAsLink** tiene **1 solo uso** en toda la instancia y queda cubierto por la navegación de la etiqueta.
> - El **where HQL** y las **reglas de validación** no viajan en el JSON, pero eso es por diseño: el adapter reutiliza el datasource clásico que los evalúa server-side con el contexto que envía el cliente; no es un faltante.

---

## Resumen de lo que queda por hacer

Los campos FK y sus selectores están prácticamente completos porque reutilizan el datasource y los filtros clásicos: los seis tipos de widget se renderizan (TableDir, Table, Search con popup nativo, OBUISEL con columnas HQL custom, Multi Selector con chips y SelectorAsLink), el filtrado por organización/activos/reglas de validación/where HQL y parámetros dinámicos se aplica server-side, la selección popula el campo y dispara el callout (incl. out-fields), los selectores en cascada reaccionan al padre, el valor inactivo seleccionado se sigue mostrando y la navegación (zoom) al registro referenciado funciona desde formulario y grilla con la desambiguación del clásico. Quedan dos ajustes menores: **diferenciar visualmente un FK inactivo ya seleccionado** (**Tarea 1**, cosmético) y **añadir un umbral mínimo de caracteres al typeahead** (**Tarea 2**, baja prioridad).

---

## Tareas

### Tarea 1 — Diferenciar visualmente los valores de FK inactivos ya seleccionados

**Descripción:** cuando un campo FK tiene seleccionado un registro que está inactivo, la nueva UI muestra su identificador (no queda en blanco) pero sin ninguna señal visual de que el registro está inactivo. En el clásico estos valores se distinguen (tachado o atenuado), lo que ayuda al usuario a advertir que la referencia ya no está vigente.

**Solución propuesta:** detectar que el valor seleccionado de un FK corresponde a un registro inactivo y representarlo con un estilo diferenciado (atenuado o tachado), tanto en vista formulario como en grilla, sin alterar la resolución del identificador ni excluirlo (debe seguir mostrándose). Reutilizar la información de estado del registro que ya devuelve el datasource al resolver el valor.

**Test cases:**
- Un FK con un registro seleccionado inactivo muestra el valor con estilo diferenciado (no en blanco, no como activo).
- Un FK con registro activo se muestra con el estilo normal (sin regresión).
- El desplegable sigue **sin** listar inactivos al buscar nuevas opciones.
- Aplica en vista formulario y en grilla.
- Cambiar el valor a un registro activo quita la distinción visual.

**Resultado:** los valores de FK inactivos ya seleccionados se distinguen visualmente, igualando la pista visual del clásico sin perder la visibilidad del dato.

### Tarea 2 — Umbral mínimo de caracteres para el typeahead del selector

**Descripción:** los selectores con búsqueda (OBUISEL/Search) consultan al backend tras el *debounce* con cualquier cantidad de caracteres, incluso con uno solo. El checklist del spec contempla disparar la búsqueda recién a partir de un mínimo de caracteres, lo que evita consultas poco selectivas en tablas grandes.

**Solución propuesta:** introducir un umbral mínimo de caracteres configurable (con un valor por defecto razonable, p. ej. 2–3) por debajo del cual el typeahead no dispara la consulta, manteniendo el *debounce* y la paginación actuales. Permitir abrir el popup de búsqueda completo para casos en que el usuario quiera explorar sin escribir.

**Test cases:**
- Escribir menos del mínimo de caracteres no dispara la consulta al backend.
- Alcanzar el mínimo dispara la consulta (con el *debounce* vigente).
- El popup de búsqueda sigue permitiendo listar/paginar sin escribir.
- Borrar por debajo del mínimo no deja resultados obsoletos visibles.
- Sin regresión en selectores que hoy funcionan (la selección y el callout siguen igual).

**Resultado:** el typeahead consulta solo cuando el término es suficientemente selectivo, reduciendo carga innecesaria y alineándose con el comportamiento esperado del checklist.
