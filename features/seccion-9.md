# Sección 9 — Grid / List View Behaviors

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 9. Cubre el comportamiento de la **vista de grilla / lista**: ordenamiento, filtrado por columna, paginación, edición inline, configuración de columnas (mostrar/ocultar, reordenar, redimensionar), exportación, y el checklist 9.7 (estado vacío, datasets grandes, selección, doble-click, menú contextual, refresco tras proceso y totales por columna).

> **Clave de arquitectura:** la grilla está construida sobre **material-react-table (MRT)** (`components/Table/index.tsx`, `DynamicTable`) y **todas las operaciones de datos son server-side** contra el datasource clásico (vía el adapter `com.etendoerp.metadata` → `ForwarderServlet` → `DataSourceServlet`): el orden, los filtros y la paginación se envían como parámetros (`_sortBy`, `criteria`, `_startRow`/`_endRow`) y el backend resuelve. El estado de la grilla (orden, filtros, visibilidad, ancho y orden de columnas) se persiste **por ventana/tab en un store Zustand** (`useTableStatePersistenceTab`), sobreviviendo a cambios de tab y de modo grid/form dentro de la sesión.
> En lugar de paginación por páginas, la nueva UI usa **scroll infinito + virtualización de filas/columnas** (`enableRowVirtualization`/`enableColumnVirtualization`), cargando la siguiente página al llegar al final del scroll. La exportación reusa el export clásico del datasource (`exportToFile=true`).

**Estimación global de la sección: ~90% de cobertura efectiva.** La grilla está muy completa: ordenamiento server-side con indicadores, filtros por columna (texto, fecha, lista, booleano y FK/TableDir), búsqueda global, edición inline completa (incluyendo callouts y validación), configuración de columnas, scroll infinito con virtualización, exportación CSV de todos los registros respetando filtros/orden/visibilidad, estado vacío, selección, doble-click a formulario, menú contextual, refresco tras proceso y totales por columna. Los huecos son acotados: **conteo total exacto**, **filtros de rango numérico**, **persistencia duradera de columnas por usuario** y **limpiar todos los filtros**.

---

## Qué está completamente hecho

| Capacidad (checklist 9.x) | Implementación en la nueva UI |
|---------------------------|-------------------------------|
| **Orden por click en cabecera (asc/desc) + indicadores** | MRT con `enableSorting`; las flechas de orden las renderiza MRT en la cabecera. |
| **Ordenamiento server-side** | `manualSorting`; el orden se traduce a nombre HQL y se envía como `_sortBy` (`+`/`-`) al datasource (`useTableData`). |
| **Persistencia de orden en la sesión** | `tableColumnSorting` se guarda por ventana/tab en el store (`useTableStatePersistenceTab`) y se restaura al reabrir el tab. |
| **Filtro de columna de texto (contains)** | `TextFilter` (input con debounce); criterio `contains` enviado al datasource. |
| **Filtro de columna de fecha (rango)** | `DateSelector` para columnas date/datetime. |
| **Filtro de columna de lista (dropdown)** | `ColumnFilter` con `MultiSelect` para columnas de lista (refList). |
| **Filtro de columna booleana (YesNo)** | `ColumnFilter` con opciones true/false para columnas booleanas. |
| **Filtro de columna Selector/TableDir (buscar en el valor FK)** | Carga opciones desde el datasource con búsqueda + paginación (`columnFilterHelpers.fetchFilterOptions`). |
| **Búsqueda global / barra de búsqueda** | `useSearch` + `SearchUtils.createSearchCriteria` arma criterios sobre múltiples columnas y los envía al datasource. |
| **Persistencia de filtros en la sesión** | `tableColumnFilters` persistido por ventana/tab en el store. |
| **Filtros enviados como criteria** | `LegacyColumnFilterUtils.createColumnFilterCriteria` + criterios de búsqueda + filtro implícito padre→hijo se combinan en `criteria` del request. |
| **Scroll infinito + virtualización (datasets grandes)** | `enableRowVirtualization`/`enableColumnVirtualization`; `fetchMoreOnBottomReached` carga la siguiente página al llegar al fondo (sin congelar la UI con 1000+ filas). |
| **Edición inline (patrón ED y editables)** | `handleEditRow` habilita edición según `uIPattern` (bloqueada en `RO`); click en celda entra a modo edición (`DataColumnCell`/`EditableCellContent`). |
| **Tab entre celdas editables** | `keyboardNavigation` (`navigateToNextCell`/`navigateToPreviousCell`) recorre las celdas editables en orden fila→columna. |
| **Guardado de fila + validación al salir de celda** | `handleSaveRow` (con reintentos) valida y persiste; `validateFieldOnBlur`/`validateFieldValue` validan obligatorios y tipo al perder foco. |
| **Callouts en edición inline** | `useInlineCallout` ejecuta el callout server-side al cambiar el valor y aplica los `columnValues` a la fila (Sección 6). |
| **Mostrar/ocultar columnas** | `ColumnVisibilityMenu`; visibilidad persistida en el store. |
| **Reordenar columnas (drag)** | `enableColumnOrdering`; orden persistido en el store. |
| **Redimensionar ancho de columna** | `enableColumnResizing` (con `minSize`). |
| **Exportación a CSV (todos los registros)** | `handleExportCSV` (`Tab.tsx`) llama al datasource con `exportToFile=true`, `exportAs="csv"`; el export clásico devuelve **todos** los registros que matchean (no solo la página visible). |
| **Export respeta filtros, orden y visibilidad** | El request incluye `criteria` (filtros + filtro implícito), `_sortBy` (orden) y `viewState` con sólo los campos visibles. |
| **Estado vacío (0 registros)** | `EmptyState` muestra mensaje "No Records" y, según patrón, botón para crear registro. |
| **Resaltado de selección de fila** | `enableRowSelection`/`enableMultiRowSelection`; la selección se sincroniza con la URL. |
| **Doble-click abre el formulario** | Handler `onDoubleClick` → `setRecordId` abre la vista formulario (respeta edición en curso y selección de padre). |
| **Menú contextual (click derecho)** | `CellContextMenu`: Editar fila, Insertar fila, "Usar como filtro". |
| **Refresco tras ejecución de proceso/guardado** | `refetch()` tras guardar; `registerRefresh` permite a otros componentes disparar el refresco de la grilla. |
| **Totales / sumarios por columna (si están configurados)** | `SummaryRow` muestra los totales; soporta `min/max/count/sum/avg` (`HeaderContextMenu`). En la instancia hay **8 campos** con `summaryfn='sum'` configurados. |

---

## Qué está parcialmente hecho

- **Conteo total exacto de registros:** la grilla consulta con `_noCount` (para rendimiento con scroll infinito), por lo que el contador muestra los **registros cargados** y, si hay más, un indicador de "hay más" (`loaded + 1`) en lugar del **total exacto**. El checklist 9.3/9.7 pide "Total record count displayed and accurate". → **Tarea 1** (impacto bajo-medio).
- **Persistencia de la configuración de columnas por usuario:** la visibilidad, el orden y el ancho de columnas (y los filtros/orden) se persisten **sólo en memoria de la sesión** (store Zustand por ventana/tab); **no** se guardan de forma duradera por usuario (ni backend ni localStorage), por lo que se pierden al recargar la página o entre sesiones. La persistencia duradera por usuario corresponde en gran medida a las **Vistas Guardadas (Sección 33)**. → **Tarea 2** (impacto medio; ver cruce con Sección 33).
- **Filtros de rango para campos numéricos:** las columnas numéricas se filtran como texto (`contains`); no hay un filtro de **rango numérico** (mín./máx., operadores `>=`/`<=`) como contempla el checklist 9.7. → **Tarea 3** (impacto bajo-medio).
- **Multi-columna en el orden:** el estado de orden de MRT admite varias columnas, pero al datasource sólo se envía la **primera** (`tableColumnSorting[0]`), por lo que el orden por múltiples columnas no es efectivo server-side. El spec lo marca como opcional ("if supported"), por lo que es de baja prioridad. → mencionado en **Tarea 4** (baja prioridad).

---

## Qué no está hecho

- **Botón "limpiar todos los filtros":** los filtros se quitan de a uno por columna; no hay una acción global de "limpiar todos". Es una conveniencia de UX. → **Tarea 4** (prioridad baja, junto con multi-orden).
- **Exportación a Excel:** sólo hay exportación a CSV. El export estándar de grilla del clásico es **CSV** (el Excel vía exportadores Jasper pertenece al dominio de reportes, Sección 14), por lo que el impacto real es bajo. Se documenta como límite conocido, sin tarea dedicada (puede reevaluarse si se requiere paridad estricta).

> **No son brechas:**
> - **Selector de tamaño de página y botones primera/anterior/siguiente/última:** la nueva UI reemplaza la paginación por páginas con **scroll infinito + virtualización** (carga incremental al hacer scroll). Es un equivalente funcional, no un faltante.
> - **Constructor de filtro avanzado (AND/OR visual):** la grilla estándar del clásico tampoco expone un builder visual AND/OR; combina filtros por columna con AND, lo cual **sí** está implementado. No es una brecha real.

---

## Resumen de lo que queda por hacer

La vista de grilla está prácticamente completa porque reutiliza el datasource clásico para todas las operaciones de datos (orden, filtros, paginación, export) y aporta una capa de presentación rica con MRT: ordenamiento server-side con indicadores y persistencia de sesión; filtros por columna para texto, fecha, lista, booleano y FK/TableDir más búsqueda global; scroll infinito con virtualización para datasets grandes; edición inline completa (entrada por click, navegación con Tab, validación al salir de celda y callouts); configuración de columnas (mostrar/ocultar, reordenar, redimensionar); exportación CSV de todos los registros respetando filtros, orden y visibilidad; estado vacío, selección, doble-click a formulario, menú contextual, refresco tras proceso y totales por columna. Quedan cuatro ajustes: **conteo total exacto** (**Tarea 1**), **persistencia duradera de columnas por usuario** (**Tarea 2**, cruza con Sección 33), **filtros de rango numérico** (**Tarea 3**) y **limpiar todos los filtros + multi-orden server-side** (**Tarea 4**). La exportación a Excel queda como límite conocido de bajo impacto (el clásico exporta CSV en grilla).

---

## Tareas

### Tarea 1 — Mostrar el conteo total exacto de registros en la grilla

**Descripción:** la grilla consulta con `NOCOUNT` para optimizar el scroll infinito, de modo que el contador muestra los registros cargados (y un indicador de "hay más") en lugar del total exacto de registros que matchean los filtros actuales. El checklist pide un total visible y preciso.

**Solución propuesta:** obtener el total real de registros que cumplen los filtros vigentes (por ejemplo, mediante un conteo diferido/asincrónico que no bloquee la carga inicial) y mostrarlo en el contador de la grilla, manteniendo el scroll infinito y sin degradar el rendimiento de la primera carga.

**Test cases:**
- Una grilla con N registros filtrados muestra el total exacto N (no "cargados + 1").
- Al aplicar/quitar filtros, el total se actualiza al nuevo conjunto.
- El total refleja el filtro implícito padre→hijo en tabs hijo.
- La carga inicial y el scroll infinito siguen funcionando sin demoras perceptibles.

**Resultado:** el usuario ve el total real de registros del conjunto filtrado, alineado con el comportamiento esperado del checklist.

### Tarea 2 — Persistencia duradera de la configuración de columnas por usuario

**Descripción:** la visibilidad, el orden y el ancho de columnas (y filtros/orden) se conservan sólo durante la sesión (en memoria), por lo que se pierden al recargar la página o entre sesiones. En el clásico la configuración de grilla persiste por usuario.

**Solución propuesta:** persistir la configuración de columnas del usuario de forma duradera (no sólo en memoria de sesión) y restaurarla al reabrir la ventana, integrándola con el mecanismo de **Vistas Guardadas / personalización (Sección 33)** para no duplicar funcionalidad. Mantener la persistencia de sesión actual como comportamiento por defecto.

**Test cases:**
- Cambiar visibilidad/orden/ancho de columnas y recargar la página conserva la configuración.
- La configuración es por usuario y por ventana/tab.
- Restablecer a la configuración por defecto funciona.
- No hay regresión en la persistencia de sesión existente (cambios de tab/modo grid-form).

**Resultado:** la configuración de columnas de cada usuario persiste entre sesiones, igualando la paridad con el clásico.

### Tarea 3 — Filtros de rango para campos numéricos

**Descripción:** las columnas numéricas se filtran como texto (`contains`); no existe un filtro de rango numérico con operadores (mín./máx., `>=`/`<=`), que el checklist contempla para campos numéricos.

**Solución propuesta:** ofrecer, para columnas numéricas, un filtro de rango (valor mínimo y/o máximo, u operadores de comparación) que se traduzca a los criterios correspondientes del datasource, manteniendo la persistencia de filtros y la combinación con otros filtros de columna.

**Test cases:**
- Filtrar una columna numérica por rango devuelve sólo los registros dentro del rango.
- Filtrar con sólo mínimo o sólo máximo funciona.
- El filtro numérico combina (AND) con otros filtros de columna.
- El filtro persiste en la sesión y se envía server-side (sin filtrado en cliente).

**Resultado:** las columnas numéricas se pueden filtrar por rango, cubriendo el ítem del checklist.

### Tarea 4 — Limpiar todos los filtros y ordenamiento por múltiples columnas

**Descripción:** (a) no hay una acción global para limpiar todos los filtros de la grilla a la vez; (b) el estado de orden admite varias columnas pero sólo se envía la primera al datasource, por lo que el orden multi-columna (shift+click, opcional en el spec) no es efectivo.

**Solución propuesta:** (a) agregar una acción de "limpiar todos los filtros" que reinicie los filtros de columna y la búsqueda y recargue la grilla; (b) enviar al datasource la lista completa de columnas de orden para soportar orden por múltiples columnas, respetando la precedencia. Ambas reutilizan el manejo de estado y el envío de parámetros ya existentes.

**Test cases:**
- "Limpiar todos los filtros" elimina filtros de columna y búsqueda, y la grilla muestra el conjunto sin filtrar.
- Tras limpiar, no quedan criterios residuales en el request.
- Ordenar por dos columnas (shift+click) ordena por la primera y desempata por la segunda, server-side.
- Sin regresión en el orden por una sola columna ni en la persistencia de sesión.

**Resultado:** el usuario puede limpiar todos los filtros de una vez y ordenar por múltiples columnas, completando los ítems restantes del checklist.
