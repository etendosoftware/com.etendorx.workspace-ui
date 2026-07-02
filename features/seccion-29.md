# Sección 29 — Tree Views

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 29. Cubre las **vistas de árbol**: pestañas con `hastree='Y'` que permiten navegar registros con relación jerárquica padre-hijo (definida en `ad_tree`/`ad_treenode`), el reordenamiento por arrastrar-y-soltar, el respeto al acceso por organización, el tipo de campo **Tree Reference** (§2.42) y el árbol del **Menú**.

> **Clave de arquitectura.** El árbol es un componente **frontend nativo que delega los datos y la persistencia al backend clásico**. El detalle es doble: (1) el **adapter (`com.etendoerp.metadata`) SÍ expone la metadata de árbol** — `TabBuilder.addTreeProperties()` emite `hasTree`, `tableTreeId`, `treeStructure`, `isReadOnlyTree` y `showTreeNodeIcons` cuando la pestaña tiene `hastree='Y'`; y `FieldBuilder.addTreeSelectorInfo()` emite la configuración del selector Tree Reference (`treeReferenceId`, `TREE_DATASOURCE`, display/value fields). (2) La **lectura de nodos, el filtrado por padre y la persistencia de movimientos van al datasource kernel clásico** (`ADTreeDatasourceService` vía SWS): la nueva UI reenvía las peticiones a través de `app/api/datasource/[entity]/route.ts` (que para PUT de drag-and-drop usa deliberadamente el path kernel SWS, igual que el SmartClient clásico). Por eso la estructura del árbol, el orden de nodos y **el acceso por organización se resuelven en el servidor** (no son responsabilidad del cliente).

> **Divergencia de paradigma (decisión de diseño).** El clásico dibuja un **panel de árbol separado** al lado de la grilla. La nueva UI **unifica árbol y grilla**: cuando el toggle de árbol está activo, la propia grilla se renderiza como árbol de filas expandibles/indentadas (MRT `enableExpanding`, íconos de jerarquía, lazy-load de hijos). Seleccionar un nodo **es** seleccionar su registro (no "filtra otra grilla"; el nodo y el registro son la misma fila). Cuando además hay formulario abierto, se muestran **árbol + formulario lado a lado** (`isTreeSideBySide`). Es funcionalmente equivalente para navegación jerárquica y no constituye un defecto.

**Estimación global de la sección: ~80% de cobertura efectiva.** La infraestructura de árbol está **construida de forma completa y en su mayoría delega en el clásico**: detección de metadata de árbol, render en grilla con expandir/colapsar (ratón y teclado), carga perezosa de hijos por `parentId`, **drag-and-drop de reordenamiento/reparenting** persistido en el backend clásico (con prevención de ciclos y respeto a `canBeParentNode`/`showDropIcon`), selector **Tree Reference**, filtro de **Product Characteristics** y árbol de **Menú**. Los puntos abiertos son de **robustez y consistencia** de la capa de detección (heurísticas frágiles con datos simulados y IDs hardcodeados) y una **posible inconsistencia de cableado** en la condición que muestra el botón de alternar árbol, que conviene verificar. El universo real es pequeño (la DB confirma **una sola pestaña con `hastree='Y'`**: *User Defined Accounting Report Setup*), lo que acota el impacto.

---

## Qué está completamente hecho

| Comportamiento (checklist 29.4) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Nodos del árbol expanden/colapsan correctamente** | La grilla en modo árbol usa filas expandibles (`enableExpanding`) con ícono de jerarquía; expandir dispara la carga perezosa de hijos. Además hay atajos de teclado propios del árbol: `ArrowRight` expande y `ArrowLeft` colapsa/salta al padre (`handleTreeArrowRight`/`Left` en `Table/index.tsx`). |
| **Carga jerárquica de nodos (padre → hijos)** | En modo árbol, `useDatasource` añade el criterio `parentId equals <id\|-1>` y reenvía `tabId`, `windowId` y `referencedTableId`; los hijos se piden bajo demanda al datasource clásico (`loadChildNodes` en `useTableData`). El aplanado con nivel/indentación lo arma el cliente. |
| **Drag-and-drop de reordenamiento/reparenting** | `useTreeNodeDragDrop` implementa DnD HTML5 nativo con tres zonas por fila (antes / dentro-como-hijo / después), imagen de arrastre propia, **prevención de referencias circulares** (`isDescendant`), y respeto a `canBeParentNode`/`showDropIcon`. El movimiento se **persiste con un PUT al datasource kernel clásico** (`prevNodeId`/`nextNodeId`/`dropIndex`/`referencedTableId`) y se maneja el revert/errores devueltos por el backend (`ob-tree-view-grid.js`). Refresca el árbol al confirmar. |
| **El árbol respeta el acceso por organización** | Se resuelve **server-side**: la lectura y escritura de nodos pasa por el datasource clásico (`ADTreeDatasourceService`), que aplica el filtrado por organización/rol. No es lógica de cliente. |
| **Los campos Tree Reference (§2.42) renderizan su selector de árbol** | El adapter emite la config del selector de árbol; el cliente la consume en `TreeSelector.tsx` (popup con árbol indentado, búsqueda que preserva la cadena de ancestros, expandir/colapsar, nodos no seleccionables para categorías). DB: la referencia *Tree Reference* está en uso real. |
| **El árbol del Menú renderiza con su jerarquía** | El menú se sirve por `MenuBuilder`/`MenuService` (adapter) y se renderiza jerárquicamente en `ComponentLibrary/Menu` y el `Sidebar`, con búsqueda. |
| **Filtro de columna en árbol (Product Characteristics)** | Para referencias de árbol y características de producto, la columna usa `TreeColumnFilter` (dropdown de árbol) en lugar del filtro de texto plano (`buildTreeFromFilterOptions`). |

---

## Qué está parcialmente hecho

- **Detección de metadata de árbol frágil / con heurísticas.** El camino correcto y fiel existe y es el primario: `useTreeModeMetadata` llama a `Metadata.getTab(tab.id)` y activa el modo árbol cuando `hasTree === true` (lo que el adapter emite para la única pestaña real). **Pero** el hook conserva varias capas de respaldo poco fiables: detección por **patrones en el nombre** de entidad/tabla (`menu`, `org`, `okr`, `category`, `folder`, `node`, `tree`), detección por presencia de "campos jerárquicos", un **`simulateTreeQuery` con datos simulados y `setTimeout`** para tablas conocidas, y **IDs de tabla/entidad/árbol hardcodeados** (`ad_menu→155`, entidades OKR/Menu con UUIDs fijos, `adTreeId:"10"/"104"`). Esto introduce **riesgo de falsos positivos** (ofrecer árbol en pestañas que en el clásico no lo tienen) y fragilidad de mantenimiento. No es un defecto funcional observado en la pestaña real, pero sí un frente de robustez → **Tarea 1**.

- **Consistencia del disparador del botón "alternar árbol".** El botón de la barra que activa el modo árbol se muestra según `isTreeNodeView = tab?.tableTree ? true : undefined` (`Toolbar.tsx`), mientras que la **detección real** usa `hasTree`/`tableTreeId` (que es lo que el adapter emite). Hay dos condiciones distintas para "esta pestaña tiene árbol", y el campo `tableTree` (objeto/relación) podría no venir poblado en la metadata de ventana. Si así fuera, el botón no aparecería para la pestaña con `hastree='Y'` y el modo árbol quedaría inalcanzable por el usuario. **No pude confirmarlo en runtime**; se documenta como **inconsistencia a verificar**, incluida en la Tarea 1. |

- **Panel de árbol "alongside" vs árbol-en-grilla.** El checklist 29.4 menciona "el panel de árbol se renderiza junto a la grilla" y "seleccionar un nodo filtra la grilla". La nueva UI **no** dibuja un panel separado que filtre otra grilla: unifica árbol y grilla (y muestra árbol+formulario lado a lado cuando hay formulario). Es una **decisión de paradigma** funcionalmente equivalente para el único caso real → se documenta, **sin tarea**.

---

## Qué no está hecho

- **No se identifican huecos funcionales materiales** en el único escenario real (`hastree='Y'`): expandir/colapsar, carga jerárquica, drag-and-drop persistido, acceso por organización (server-side), Tree Reference y árbol de Menú están cubiertos. Lo pendiente es de **robustez/consistencia** (Tarea 1), no de funcionalidad ausente.

---

## Resumen de lo que queda por hacer

La sección está **efectivamente construida**: la nueva UI tiene una implementación de árbol nativa que **delega los datos y la persistencia al datasource clásico** (que también aplica el acceso por organización) y consume la metadata de árbol que el adapter **sí expone**. Expandir/colapsar, la carga perezosa de hijos, el **drag-and-drop de reordenamiento/reparenting** con prevención de ciclos, el selector **Tree Reference** y el árbol del **Menú** funcionan. La divergencia frente al clásico (árbol dentro de la grilla en vez de panel separado) es una decisión de diseño equivalente.

Lo recomendable es **endurecer y consolidar la capa de detección de árbol**: eliminar las heurísticas frágiles (patrones de nombre, consulta simulada, IDs hardcodeados) para que la activación dependa solo de la metadata autoritativa (`hasTree`/`tableTreeId`), y **unificar la condición** que muestra el botón de alternar árbol con esa misma metadata (hoy usa `tableTree`, que podría no venir poblado), verificando que el botón aparezca en la pestaña con `hastree='Y'`. Es prevención de falsos positivos y de un posible bloqueo de acceso, más que agregar comportamiento.

---

## Tareas

### Tarea 1 — Consolidar la detección de árbol sobre metadata autoritativa (robustez y consistencia)

> **⚠️ Prioridad media.** No corrige un defecto confirmado en la pestaña real, pero elimina fragilidad (falsos positivos) y una posible inconsistencia que podría dejar el modo árbol inalcanzable.

**Descripción.** La activación del modo árbol se apoya en un camino correcto (la metadata `hasTree`/`tableTreeId` que emite el adapter) pero arrastra varias capas de respaldo poco fiables: detección por patrones en el nombre de la entidad/tabla, una consulta simulada con datos y demoras artificiales, y mapeos de IDs hardcodeados. Esto puede ofrecer un árbol en pestañas que en el clásico no lo tienen. Además, la condición que muestra el botón de alternar árbol en la barra usa un campo distinto (`tableTree`) del que usa la detección (`hasTree`/`tableTreeId`), lo que podría impedir que el botón aparezca en la única pestaña que realmente tiene árbol.

**Solución propuesta.** Hacer que la habilitación del modo árbol dependa **exclusivamente de la metadata autoritativa** que provee el adapter (indicador de árbol e identificador de estructura de árbol de la pestaña), retirando las heurísticas por nombre, la consulta simulada y los identificadores fijos. Unificar en una única fuente de verdad tanto la detección interna como la condición de visibilidad del botón de alternar árbol, de modo que ambos coincidan. Verificar de punta a punta que la pestaña con `hastree='Y'` ofrece el botón, entra en modo árbol, carga jerarquía y permite arrastrar y soltar.

**Test cases.**
- La pestaña con `hastree='Y'` (*User Defined Accounting Report Setup*) muestra el botón de alternar árbol y, al activarlo, entra en modo árbol con la jerarquía cargada.
- Una pestaña sin árbol (nombre que casualmente contenga "org", "menu", "category", etc.) **no** ofrece el modo árbol.
- La condición de detección interna y la de visibilidad del botón coinciden para la misma pestaña (no hay caso donde una diga "tiene árbol" y la otra no).
- El drag-and-drop en la pestaña de árbol persiste el movimiento en el backend y refleja el nuevo orden tras refrescar; un movimiento inválido (crear ciclo) se impide en el cliente.
- Un campo Tree Reference sigue abriendo su selector de árbol correctamente (no se ve afectado por el cambio en la detección de árbol de la grilla).

**Resultado.** La activación del modo árbol queda determinada por la metadata real del clásico, sin falsos positivos ni identificadores frágiles, con el botón de alternar coherente con la detección, garantizando que la funcionalidad sea alcanzable donde corresponde y no aparezca donde no corresponde.

---

> **Nota sobre el entorno representativo (`etendodev`).** La DB confirma los datos de referencia de la sección: **una sola pestaña con `hastree='Y'`** (*User Defined Accounting Report Setup*) y los tipos de árbol de `ad_tree` esperados (`MM` Menú, `OO` Organización, `PR` Categoría de Producto, `BP` Grupo de Tercero, `PJ` Proyecto, `AR`/`EV` Cuentas, `SR` Región de Venta, `AY` Actividad, `CC` Centro de Costo, `MC` Campaña, `U1`/`U2` Dimensiones de Usuario, `TR` Grupo de Reporte de Impuestos, `PC` Característica de Producto, `AS` Grupo de Activos, más algunos adicionales de bundles). El tipo de campo **Tree Reference** existe y está en uso real (columna `M_Ch_Value_ID`). El árbol se usa además, fuera de pestañas, en el **Menú** y en los selectores/filtros de árbol — todos cubiertos por la nueva UI.
