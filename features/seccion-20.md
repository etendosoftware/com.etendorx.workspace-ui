# Sección 20 — Quick Launch (Global Search)

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 20. Cubre el **Quick Launch**: el buscador/paleta de comandos que permite encontrar y abrir rápidamente ventanas, procesos, reportes y forms escribiendo parte de su nombre, con secciones de "elementos recientes".

> **Clave de arquitectura:** en el clásico el Quick Launch es un **widget de la barra de navegación** (popup command-palette, `ob-quick-launch.js`) que combina buscador + recientes en un solo popup. La nueva UI **no reimplementa ese popup del navbar**; reparte la misma capacidad en dos lugares: (1) el **buscador del panel lateral (Drawer/Sidebar)** —campo fijo que filtra el árbol de menú en tiempo real— y (2) los **recientes**, expuestos tanto en el Drawer ("Recently Viewed") como en **widgets del dashboard** ("Recently Viewed" y "Recent Documents"), que son la nueva forma de acceder a lanzamientos, documentos y vistas recientes. Es una **decisión de diseño** (distinta ubicación e interacción), no un render clásico delegado: la búsqueda y las listas de recientes están **implementadas nativamente** en el cliente (`searchUtils`, `useRecentItems`, `useRecentDocuments`), sobre el mismo menú por rol que entrega el adapter (`MenuBuilder`).

**Estimación global de la sección: ~80% de cobertura efectiva.** El propósito central —tipear para filtrar el menú y abrir cualquier entrada (ventana, proceso, reporte, form, vista)— está **completo y es fiel**: búsqueda en tiempo real, coincidencia parcial y multi-palabra, insensible a mayúsculas, respeto del acceso por rol (el menú viene filtrado por el backend) y apertura correcta de cada tipo de ítem. Las **tres listas de recientes** del clásico están cubiertas, aunque **reubicadas**: lanzamientos/ventanas recientes en el buscador del Drawer y en el widget "Recently Viewed" del dashboard, y **documentos recientes** (registros concretos) en el widget "Recent Documents" del dashboard. Los huecos remanentes son afordancias secundarias del paradigma "command palette": no hay **navegación por teclado** de resultados (flechas + Enter) ni **cierre/limpieza por teclado** (Escape), y las entradas de menú de tipo **enlace externo** no se abren (caso de borde: 0 en el entorno representativo).

---

## Qué está completamente hecho

| Comportamiento (checklist 20.3) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Campo de búsqueda que acepta texto y filtra en tiempo real** | Input fijo en el Drawer (`TextInputAutocomplete`); `filterItems` reconstruye el árbol de menú a medida que se escribe, con foco automático al abrir el panel. Incluye autocompletado "fantasma" (Tab acepta la sugerencia). |
| **Los resultados muestran las entradas de menú (ventanas, procesos, reportes, forms)** | La búsqueda opera sobre el **árbol de menú completo** (todas las entradas del rol), que incluye Window, ProcessDefinition, Process (Report & Process), ProcessManual, Report, Form y View. |
| **Coincidencia por nombre parcial** | `findMatchingIds`/`findMatchingIdsForWords` hacen `includes` sobre nombre y ruta; "sales" encuentra "Sales Order", "Sales Invoice", etc. Soporta además múltiples palabras. |
| **Búsqueda insensible a mayúsculas/minúsculas** | Todo el índice y la comparación usan `toLowerCase()`. |
| **Los resultados respetan el acceso por rol** | El menú lo entrega el `MenuManager` clásico (consumido por `MenuBuilder`) ya filtrado por el rol activo; la búsqueda solo puede encontrar lo que el rol ve. Enforcement server-side. |
| **Seleccionar un resultado abre la ventana/proceso/reporte/form correcto** | El `handleClick` del Sidebar despacha por tipo: Window (sistema multi-ventana), ProcessDefinition y Pick & Execute (ProcessDefinitionModal), Report & Process, ProcessManual/Report (popup clásico con fallback de popup bloqueado), Form (popup) y View. |
| **Sección de elementos recientes** (las 3 listas del clásico, reubicadas) | **Lanzamientos/ventanas recientes** (`UINAVBA_RecentLaunchList`): `Recently Viewed` en el Drawer (`useRecentItems`, top-5 por rol) y widget "Recently Viewed" del dashboard. **Documentos recientes** (`OBUIAPP_RecentDocumentsList`): widget "Recent Documents" del dashboard (`useRecentDocuments`, top-10 por rol), poblado al abrir un registro en el formulario. **Vistas recientes** (`OBUIAPP_RecentViewList`): cubiertas por "Recently Viewed" (ventanas/vistas abiertas) más las pestañas multi-ventana (Sección 27). |
| **Los elementos recientes son clicables y navegan correctamente** | `handleRecentItemClick` (Drawer) reubica la entrada real en el menú y la despacha por `handleClick`; el widget "Recent Documents" reabre el registro concreto en su ventana (`setWindowActive` + `setSelectedRecord` + form en modo edición). |

---

## Qué está parcialmente hecho

- **Ubicación/paradigma distinto (panel lateral + dashboard vs. popup del navbar).** La búsqueda vive en el Drawer lateral fijo (no en un ícono/popup del navbar) y los recientes se exponen en el Drawer y como **widgets del dashboard**, no dentro de un mismo popup debajo de los resultados de búsqueda como en el clásico. Es una **decisión de diseño**: la funcionalidad de "encontrar y abrir" y las tres listas de recientes están cubiertas, por lo que **no se genera tarea**; se documenta la diferencia de paradigma (de ella derivan las afordancias de teclado que sí faltan).

---

## Qué no está hecho

- **Navegación por teclado de resultados (flechas ↑/↓ + Enter) y cierre por teclado (Escape).** El input solo maneja Tab (aceptar sugerencia); no permite recorrer los resultados con flechas ni abrir con Enter el resaltado, ni limpiar/cerrar con Escape. Es la afordancia típica de un command palette y hoy no existe. → **Tarea 1**.
- **Enlaces externos que abren en una pestaña nueva.** El backend emite el campo `url` para entradas de tipo enlace externo, pero `handleClick` no tiene rama que las abra (`window.open`), por lo que una entrada de enlace externo no haría nada. **Caso de borde:** en `etendodev` hay **0** entradas de menú activas con `url` definida, por lo que el impacto real es nulo hoy. → **Tarea 2** (baja prioridad).

---

## Resumen de lo que queda por hacer

La capacidad central del Quick Launch está **implementada nativamente y es fiel**: buscar por nombre parcial/insensible a mayúsculas sobre el menú del rol y abrir el ítem correcto de cualquier tipo, con las tres listas de recientes (lanzamientos, documentos y vistas) cubiertas vía Drawer y widgets del dashboard. Lo pendiente es acotado y secundario:

1. **(Tarea 1)** Navegación y cierre por teclado en el buscador del menú (flechas + Enter para abrir el resaltado, Escape para limpiar/cerrar), para paridad de eficiencia y accesibilidad con el command palette clásico.
2. **(Tarea 2)** Abrir en pestaña nueva las entradas de menú de tipo enlace externo (baja prioridad: sin casos en el entorno representativo).

La diferencia de ubicación (panel lateral + dashboard vs. popup del navbar) y la reubicación de los recientes al dashboard se documentan como decisiones de diseño y no generan tarea.

---

## Tareas

### Tarea 1 — Navegación y cierre por teclado en el buscador del menú

**Descripción.** El buscador del menú filtra resultados en tiempo real, pero no permite operar con el teclado más allá de aceptar la sugerencia de autocompletado (Tab). No se puede recorrer los resultados con las flechas ↑/↓, abrir el resultado resaltado con Enter, ni limpiar o cerrar la búsqueda con Escape. Esto obliga al uso del mouse y se aparta de la experiencia de "command palette" del Quick Launch clásico.

**Solución propuesta.** Añadir manejo de teclado al buscador: mover el resaltado por la lista de resultados con las flechas, abrir el resultado resaltado con Enter (reutilizando el mismo despacho de clic ya existente) y usar Escape para limpiar el término de búsqueda y devolver el foco/estado inicial. La solución debe respetar el flujo actual de filtrado y apertura de ítems, y ser coherente en los distintos tipos de resultado.

**Test cases.**
- Con resultados visibles, las flechas ↑/↓ mueven el resaltado entre ellos.
- Enter sobre el resultado resaltado abre el ítem correcto (ventana/proceso/reporte/form/vista).
- Escape limpia el término de búsqueda y restablece el listado completo del menú.
- El autocompletado por Tab existente sigue funcionando sin regresiones.
- La navegación por teclado respeta el orden visible de los resultados filtrados.

**Resultado.** El buscador del menú es operable íntegramente con el teclado (recorrer, abrir y cerrar), con paridad de eficiencia y accesibilidad respecto del Quick Launch clásico.

---

### Tarea 2 — Apertura de entradas de menú de tipo enlace externo

> **⚠️ Baja prioridad.** En el entorno representativo (`etendodev`) no existen entradas de menú activas con URL de enlace externo, por lo que el impacto actual es nulo. Tomar solo si el proyecto necesita soportar menús con enlaces externos.

**Descripción.** El menú puede contener entradas de tipo enlace externo (con una URL asociada, que el backend ya expone). Al hacer clic o seleccionarlas desde la búsqueda, la nueva UI no realiza ninguna acción porque no existe una rama que abra dichas URLs, a diferencia del clásico que las abre en una pestaña nueva del navegador.

**Solución propuesta.** Agregar al despacho de clic de menú el manejo de las entradas de enlace externo, abriendo su URL en una pestaña nueva del navegador, con el mismo criterio de aviso ante bloqueo de popups que ya usan los reportes/procesos clásicos. No debe alterar el comportamiento de los tipos de ítem ya soportados.

**Test cases.**
- Una entrada de menú de enlace externo abre su URL en una pestaña nueva.
- Si el navegador bloquea la apertura, se muestra el aviso con opción de apertura manual.
- Los demás tipos de ítem (ventana, proceso, reporte, form, vista) siguen abriéndose como hasta ahora.

**Resultado.** Las entradas de menú de tipo enlace externo se abren correctamente en una pestaña nueva, completando el último ítem del checklist.
