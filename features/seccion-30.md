# Sección 30 — Grouping in Grid View

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 30. Cubre el **agrupamiento de la grilla**: hacer clic derecho en un encabezado de columna → "Group by this field", reorganizar la grilla en **secciones colapsables** por los valores únicos de esa columna, mostrar en cada cabecera de grupo el **valor + conteo** de registros, expandir/colapsar grupos, "Ungroup" para volver a la vista plana, respetar los filtros activos y el límite de rendimiento `OBUIAPP_GroupingMaxRecords`.

> **Clave de arquitectura:** el agrupamiento en el clásico es una funcionalidad **100% de cliente** (el `ListGrid` de SmartClient agrupa los registros ya traídos, en el navegador; por eso existe el tope `OBUIAPP_GroupingMaxRecords`, para no agrupar demasiadas filas). **No hay componente de servidor ni de adapter (`com.etendoerp.metadata`) que delegar**: la metadata no participa y no existe endpoint clásico específico de agrupamiento. En consecuencia, la nueva UI tendría que **reimplementarlo de forma nativa** sobre su tabla. La tabla de la nueva UI usa **Material React Table** ([Table/index.tsx](../client/packages/MainUI/components/Table/index.tsx)), que soporta agrupamiento nativo (`enableGrouping`), por lo que la funcionalidad es **factible**, pero hoy **no está activada ni construida**.

**Estimación global de la sección: ~5% de cobertura efectiva.** El agrupamiento **no está implementado**: no existe la opción "Group by this field", ni grupos colapsables, ni cabeceras con valor+conteo, ni "Ungroup"; las preferences `OBUIAPP_GroupingEnabled` / `OBUIAPP_GroupingMaxRecords` **no se leen** en el cliente, y `enableGrouping` no se activa en la tabla. Lo único preexistente es **infraestructura reutilizable** (menú contextual al hacer clic derecho en el encabezado de columna) que hoy solo ofrece **funciones de resumen** (min/max/count/sum/avg) — una funcionalidad distinta del agrupamiento. Se documenta como un hueco funcional real (nada que delegar) → **Tarea 1**.

---

## Qué está completamente hecho

- **Nada específico del agrupamiento.** Ningún ítem del checklist 30.4 está cubierto.

*(Existe infraestructura adyacente reutilizable, no agrupamiento en sí — ver "parcialmente hecho".)*

---

## Qué está parcialmente hecho

- **Infraestructura de menú contextual en encabezado de columna (base para "Group by this field").** El clic derecho sobre un encabezado ya abre un menú ([HeaderContextMenu.tsx](../client/packages/MainUI/components/Table/HeaderContextMenu.tsx)), pero **solo ofrece funciones de resumen** (min/max/count/sum/avg), que son una **funcionalidad distinta** (agregados de columna). Es el punto de anclaje natural donde debería vivir "Group by this field"/"Ungroup", pero esas opciones **no existen**. → base para la Tarea 1, no cobertura del agrupamiento.
- **Formato de viewState con hueco de `group` siempre vacío.** Al serializar el estado de vista hacia el datasource clásico, la nueva UI emite `group:{groupByFields:"",groupingModes:{}}` **hardcodeado a vacío** ([Tab.tsx:733](../client/packages/MainUI/components/window/Tab.tsx#L733)). Es solo compatibilidad de formato SmartClient; **nunca se puebla** con un campo de agrupamiento. No representa funcionalidad activa.

---

## Qué no está hecho

- **Opción "Group by this field" en el menú contextual del encabezado** (checklist: *Group by column available in context menu cuando `OBUIAPP_GroupingEnabled`*). No existe.
- **Reorganización de la grilla en secciones colapsables** por los valores de la columna. No existe (`enableGrouping` de Material React Table nunca se activa).
- **Cabeceras de grupo con valor + conteo de registros.** No existen.
- **Expandir/colapsar grupos.** No existe.
- **"Ungroup" para restaurar la vista plana.** No existe.
- **Respeto de los filtros activos** al agrupar (agrupar solo sobre los datos filtrados). No aplica: no hay agrupamiento.
- **Respeto del límite `OBUIAPP_GroupingMaxRecords`** y de `OBUIAPP_GroupingEnabled`. Las preferences **no se leen** en el cliente (confirmado: sin referencias en `/client`), pese a estar configuradas en el entorno representativo.
- **Ordenamiento dentro de los grupos.** No aplica: no hay agrupamiento.

---

## Resumen de lo que queda por hacer

El agrupamiento de grilla es una funcionalidad **de presentación puramente de cliente** (no hay backend ni adapter que delegar) y **no está implementada** en la nueva UI. Como la tabla se basa en Material React Table —que soporta agrupamiento nativo—, y ya existe el menú contextual de encabezado como punto de anclaje, la implementación es **factible reutilizando infraestructura existente**, pero debe construirse por completo: la acción "Group by this field"/"Ungroup" en el menú, el render de grupos colapsables con valor+conteo, la lectura de las preferences `OBUIAPP_GroupingEnabled` (para mostrar la opción) y `OBUIAPP_GroupingMaxRecords` (para evitar agrupar más filas de las permitidas), y la coherencia con filtros y ordenamiento activos. Es un único frente de trabajo, encapsulado en la **Tarea 1**.

---

## Tareas

### Tarea 1 — Agrupamiento de columnas en la grilla (Group by / Ungroup)

**Descripción.** La grilla no permite agrupar por una columna. Falta todo el ciclo: ofrecer "Group by this field" al hacer clic derecho en un encabezado (solo cuando la preference `OBUIAPP_GroupingEnabled` está activa), reorganizar la grilla en secciones colapsables por los valores únicos de esa columna, mostrar en cada cabecera de grupo el valor y el conteo de registros, permitir expandir/colapsar, ofrecer "Ungroup" para volver a la vista plana, y respetar tanto los filtros activos (agrupar solo sobre los datos filtrados) como el tope de rendimiento `OBUIAPP_GroupingMaxRecords`. Las dos preferences que gobiernan la función existen y están configuradas en el entorno representativo, pero hoy el cliente no las lee.

**Solución propuesta.** Activar y exponer la capacidad de agrupamiento nativa de la tabla, integrándola en el menú contextual de encabezado ya existente (donde hoy viven las funciones de resumen): añadir las acciones "Agrupar por este campo" y "Desagrupar", condicionando la disponibilidad a la preference de habilitación y limitando la operación según la preference de máximo de registros (con un aviso claro cuando se supere el límite). Las secciones agrupadas deben ser colapsables y mostrar el valor del grupo junto con el número de registros, manteniéndose coherentes con los filtros y el orden vigentes. Reutilizar en lo posible la infraestructura de menú contextual y de estado de grilla ya presente, sin introducir un componente de servidor (la operación es de cliente, igual que en el clásico).

**Test cases.**
- Con `OBUIAPP_GroupingEnabled` activa, el menú contextual del encabezado ofrece "Agrupar por este campo"; con la preference desactivada, la opción no aparece.
- Al agrupar por una columna, la grilla se reorganiza en secciones por valores únicos y cada cabecera muestra el valor y el conteo de registros.
- Expandir y colapsar un grupo funciona y conserva la selección/estado del resto.
- "Desagrupar" restaura la vista plana sin perder filtros ni orden.
- Con filtros activos, el agrupamiento se calcula solo sobre los registros filtrados.
- Si el número de registros supera `OBUIAPP_GroupingMaxRecords`, no se agrupa (o se informa el motivo) en lugar de degradar el rendimiento.
- El ordenamiento aplicado se respeta dentro de cada grupo.

**Resultado.** El usuario puede agrupar la grilla por cualquier columna desde el menú contextual del encabezado, ver secciones colapsables con valor y conteo, y volver a la vista plana, con paridad funcional respecto del clásico y respetando las preferences de habilitación y de límite de registros.

---

> **Nota sobre el entorno representativo (`etendodev`).** Ambas preferences que gobiernan la funcionalidad existen y están configuradas: `OBUIAPP_GroupingEnabled = Y` y `OBUIAPP_GroupingMaxRecords = 1000`. Esto confirma que el agrupamiento es una funcionalidad **real y habilitada** en el clásico dentro de este entorno, y que su ausencia en la nueva UI es un hueco funcional efectivo (no una capacidad deshabilitada por configuración). Al ser una funcionalidad puramente de cliente, no hay metadata ni endpoint del adapter (`com.etendoerp.metadata`) involucrado.
