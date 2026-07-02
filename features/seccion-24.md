# Sección 24 — Form Layout System

Análisis de completitud de la nueva UI (`/client`) frente a la fuente de verdad `all-features.md` § Section 24. Cubre el **sistema de layout de formularios**: el orden de los campos (`seqno`), los saltos de fila/línea (`startnewline`/`startinoddcolumn`), el ancho de columna (`numcolumn`/colspan), el ancho completo de campos de texto largo, la grilla multi-columna, la visibilidad de campos en grid (`showingridview`), el foco inicial (`isfirstfocusedfield`), el orden de columnas de la grilla (`seqno_grid`) y los flags de columna que afectan la UI (`isupdateable`, `isparent`, `isencrypted`, `isidentifier`, `isselectioncolumn`).

> **Clave de arquitectura:** la nueva UI **reimplementa el layout de forma nativa** (no delega al render clásico). El adapter (`com.etendoerp.metadata`) serializa cada campo (`FieldBuilder`/`TabProcessor`) preservando el orden de `tab.getADFieldList()`; ese orden es **por `seqno`** porque el DAL de Etendo marca automáticamente como propiedad de ordenamiento toda columna llamada `line`/`seqno`/`lineno` ([`Property.java:209`](../erp/src/org/openbravo/base/model/Property.java#L209)) y jettison 1.3 usa `LinkedHashMap` (preserva el orden de inserción). El cliente arma el formulario con `useFormFields` (buckets + agrupación) y lo renderiza en una **grilla CSS de 3 columnas fija** (`FormFieldsContent`, `grid-cols-3`); `computeFieldLayout` traduce `startnewline`/`startinoddcolumn` a `col-start` y `obuiappColspan`/`obuiappRowspan` a `col-span`/`row-span` en `BaseSelector`. La grilla de datos se construye con `parseColumns` sobre los mismos campos, respetando `showInGridView` para la visibilidad inicial e `isSelectionColumn` para la fila de filtros rápidos.

> **Nota sobre el esquema real (importante).** La tabla 24.2/24.5 de la fuente nombra `startrow`, `numcolumn` y `showingridview`, pero en el entorno representativo (`etendodev`) **esas columnas no existen** en `ad_field`. Los flags reales son: `startnewline` (salto de fila/línea; no hay `startrow` separado), `em_obuiapp_colspan`/`em_obuiapp_rowspan` (span, extensión OBUIAPP) y `showinrelation` (visibilidad en grid). El análisis se hace sobre los flags reales; la diferencia es de nomenclatura del documento fuente, no de la implementación.

**Estimación global de la sección: ~85% de cobertura efectiva.** El núcleo del layout está **completo y es fiel**: los campos se renderizan en orden `seqno`, se respetan los saltos de fila/columna, el span por metadata, la visibilidad en grid, la fila de filtros por `isselectioncolumn`, el read-only por `isupdateable`, el enmascarado por `isencrypted`, los campos padre y los identificadores para las referencias FK. Los huecos son acotados: la grilla de datos **no ordena las columnas por `seqno_grid`** (usa el orden del formulario), **no se aplica el foco inicial** (`isfirstfocusedfield`) al abrir el formulario, y los campos de **texto largo/memo/rich text** se expanden en alto pero **no ocupan el ancho completo** salvo `colspan` explícito.

---

## Qué está completamente hecho

| Comportamiento (checklist 24.5) | Implementación en la nueva UI |
|---------------------------------|-------------------------------|
| **Los campos se renderizan en orden `seqno`** | El adapter emite los campos en el orden de `tab.getADFieldList()`, que el DAL ordena por `seqno` ([`Property.java:209`](../erp/src/org/openbravo/base/model/Property.java#L209)); jettison (`LinkedHashMap`) y `JSON.parse` preservan ese orden, y el cliente lo respeta al iterar `tab.fields` (no re-ordena campos individuales; solo ordena las secciones por su `seqno` mínimo). |
| **`startnewline='Y'` fuerza nueva fila/línea** | `computeFieldLayout` asigna `colStart: 1` a los campos con `startnewline` y `BaseSelector` aplica `col-start-1`, empujándolos al inicio de una fila nueva en la grilla de 3 columnas. (En este esquema `startrow` y `startnewline` son el mismo flag: solo existe `startnewline`.) |
| **Campos con `colspan` grande abarcan varias columnas** | `BaseSelector` mapea `field.obuiappColspan` a `col-span-{1,2,3}`; `computeFieldLayout` avanza el cursor según el colspan. Verificado en DB: `em_obuiapp_colspan` está seteado en pocos campos (valores 1/2/4), y la nueva UI los honra. |
| **`startinoddcolumn='Y']` (arranque en columna impar)** | `computeFieldLayout` lleva un cursor por la grilla y, para `startinoddcolumn`, fuerza `col-start-3` cuando corresponde. (7 campos en DB.) |
| **`showingridview='N'` oculta el campo de la grilla** | El flag real `showinrelation` se emite como `showInGridView`; `useTableData` construye la visibilidad inicial de columnas (`initialVisibility[field.name] = field.showInGridView`), de modo que los campos con `N` arrancan ocultos pero pueden mostrarse desde el menú de columnas (`enableHiding`). Coincide con el clásico (oculto por defecto, no eliminado). |
| **`isupdateable='N'` siempre read-only** | `BaseSelector` marca read-only cuando `!field.isUpdatable` en modo distinto de NEW; en alta (NEW) el campo es editable, igual que el clásico (columnas no actualizables sí se setean al insertar). |
| **`isparent` autopoblado con la FK del padre y oculto** | El adapter emite `isParentRecordProperty` y las propiedades de padre (`column.propertyPath`) se fuerzan read-only en `BaseSelector`; la FK al padre se resuelve desde el contexto de la pestaña padre y normalmente no se muestra (`isdisplayed='N'`). |
| **`isencrypted` muestra el valor enmascarado** | El adapter emite `displayEncription`; el cliente renderiza esos campos con `EncryptedSelector` (valor enmascarado). Verificado en DB: 11 columnas `isencrypted='Y'`. |
| **Los campos identificadores componen el string de la FK** | Los campos `isidentifier` (1.475 en DB) se usan para armar el `_identifier` que se muestra en referencias/dropdowns; `useTableData` ordena los identificadores por `seqno` y toma el principal para el display. |
| **`isselectioncolumn` aparece en la fila de filtros de la grilla** | El adapter emite `isSelectionColumn` y la tabla arma los filtros rápidos filtrando `col.isSelectionColumn`. Verificado en DB: 247 columnas. |

---

## Qué está parcialmente hecho

- **Ancho completo de campos de texto largo / memo / rich text.** El checklist indica que Text/Memo/Rich Text "típicamente ocupan el ancho completo". La nueva UI los detecta por tipo de referencia (`isExpandedField`: Text Long, Memo, Image, Rich Text, Multi-selector) y les da **expansión vertical** (`row-span-4`, campo más alto), pero **no** ancho horizontal completo: siguen ocupando 1 de las 3 columnas salvo que tengan `em_obuiapp_colspan` explícito (muy pocos campos lo definen). La funcionalidad del campo es plena (área de texto amplia); la diferencia es de disposición horizontal. → **Tarea 3** (baja prioridad).
- **Grilla de 3 columnas fija (no configurable/responsive).** El clásico describe un layout de 2 columnas por defecto; la nueva UI usa una grilla **fija de 3 columnas** (`grid-cols-3`) sobre la que operan `col-start`/`col-span`. Es una **decisión de diseño** (más densidad de información); el posicionamiento por metadata (`startnewline`, `colspan`) se respeta dentro de ese esquema. → Se documenta, sin tarea.

---

## Qué no está hecho

- **Orden de columnas de la grilla por `seqno_grid` (independiente del orden del formulario).** El clásico permite que el orden de columnas en la grilla difiera del orden de campos del formulario (`ad_field.grid_seqno`). El adapter **no emite `grid_seqno`** para los campos regulares (solo asigna `gridPosition` a los campos de auditoría sintéticos), y la grilla de ventana (`parseColumns` sobre `Object.values(tab.fields)`) **no re-ordena** por ese valor: muestra las columnas en el **orden `seqno` del formulario**. Impacto real: en DB hay 6.251 campos con `grid_seqno` seteado y **2.988** con `grid_seqno` distinto de `seqno`, por lo que en esas pestañas el orden de columnas de la grilla no coincide con el configurado en el clásico. (El ordenamiento por `gridPosition` sí existe, pero solo en los grids de proceso `WindowReferenceGrid`, no en la grilla de ventana.) → **Tarea 1**.
- **Foco inicial en el campo `isfirstfocusedfield='Y'` al abrir/crear.** El adapter emite `isFirstFocusedField`, pero el cliente **no lo usa** para enfocar ningún campo al montar el formulario (solo aparece como valor por defecto `false` en campos de auditoría; no hay lógica de auto-foco). En el clásico, ese campo recibe el foco al abrir el formulario o crear un registro. Verificado en DB: 382 campos con el flag en `Y`. → **Tarea 2**.

---

## Resumen de lo que queda por hacer

El sistema de layout está **implementado de forma nativa y su núcleo es fiel** al clásico: orden por `seqno`, saltos de fila/columna, span por metadata, visibilidad en grid, filtros por `isselectioncolumn`, read-only por `isupdateable`, enmascarado por `isencrypted`, campos padre e identificadores. Lo pendiente es acotado:

1. **(Tarea 1)** Ordenar las columnas de la grilla de ventana por `grid_seqno` (independiente del orden del formulario), para paridad con las pestañas que configuran un orden de grilla distinto (2.988 campos afectados). Requiere que el adapter exponga ese dato y que la grilla lo use.
2. **(Tarea 2)** Aplicar el foco inicial al campo `isfirstfocusedfield` al abrir/crear un registro, para eficiencia de tecleo y accesibilidad.
3. **(Tarea 3, baja prioridad)** Dar ancho completo a los campos de texto largo/memo/rich text (hoy solo se expanden en alto).

Se documenta como **decisión de diseño** (sin tarea) el uso de una grilla fija de 3 columnas en lugar de las 2 del clásico; el posicionamiento por metadata se respeta dentro de ese esquema.

---

## Tareas

### Tarea 1 — Orden de columnas de la grilla según `seqno_grid` (independiente del formulario)

**Descripción.** En el clásico, el orden de las columnas de la grilla puede diferir del orden de los campos del formulario mediante `ad_field.grid_seqno`. La nueva UI muestra las columnas de la grilla de ventana en el mismo orden que el formulario (`seqno`), ignorando el orden de grilla configurado. En el entorno representativo hay 2.988 campos con `grid_seqno` distinto de `seqno`, por lo que en esas pestañas las columnas aparecen en un orden diferente al del clásico.

**Solución propuesta.** Exponer el número de secuencia de grilla de cada campo desde el adapter (hoy no se emite para campos regulares) y ordenar las columnas de la grilla de ventana por ese valor, con fallback al `seqno` del formulario cuando no esté definido. El ordenamiento debe aplicarse solo a la grilla de datos (no al formulario) y convivir con la visibilidad por `showingridview`, los filtros rápidos y el reordenamiento manual de columnas por el usuario.

**Test cases.**
- En una pestaña con `grid_seqno` distinto del `seqno` del formulario, las columnas de la grilla aparecen en el orden de grilla, no en el del formulario.
- El formulario mantiene el orden `seqno` de sus campos sin verse afectado por el cambio.
- Los campos sin `grid_seqno` definido caen al orden por `seqno` (fallback), sin quedar fuera de lugar.
- La visibilidad inicial por `showingridview` y la fila de filtros rápidos siguen funcionando tras el reordenamiento.
- El reordenamiento/ocultamiento manual de columnas por el usuario sigue operando sin regresiones.

**Resultado.** La grilla de datos muestra las columnas en el orden configurado en el clásico, con paridad para las pestañas que definen un orden de grilla propio.

---

### Tarea 2 — Foco inicial en el campo `isfirstfocusedfield` al abrir/crear

**Descripción.** El clásico coloca el foco en el campo marcado con `isfirstfocusedfield='Y'` al abrir un formulario o crear un registro nuevo, agilizando la carga de datos por teclado. La nueva UI recibe ese flag desde el adapter pero no lo utiliza: al abrir el formulario no se enfoca ningún campo en particular. Hay 382 campos con el flag configurado en el entorno representativo.

**Solución propuesta.** Al montar el formulario (y al crear un registro nuevo), enfocar el primer campo visible y editable marcado con `isfirstfocusedfield`; si no hay ninguno, mantener el comportamiento actual. El foco debe respetar la visibilidad y el estado read-only del campo (no enfocar campos ocultos ni no editables) y no interferir con el foco que el usuario mueva manualmente después.

**Test cases.**
- Al abrir un formulario cuya pestaña tiene un campo `isfirstfocusedfield='Y'` visible y editable, ese campo recibe el foco.
- Al crear un registro nuevo, el campo de foco inicial queda enfocado y listo para escribir.
- Si el campo marcado está oculto o es read-only, no se le da foco y no se produce error.
- Si la pestaña no define campo de foco inicial, el comportamiento actual no cambia.
- El foco automático no vuelve a dispararse cuando el usuario ya movió el foco manualmente dentro del formulario.

**Resultado.** El formulario enfoca automáticamente el campo configurado al abrirse/crearse, con paridad de eficiencia y accesibilidad respecto del clásico.

---

### Tarea 3 — Ancho completo para campos de texto largo / memo / rich text

> **⚠️ Baja prioridad.** Es un ajuste de disposición visual. Los campos de texto largo ya son plenamente funcionales y se expanden en alto (`row-span`); lo que falta es que ocupen el ancho completo de la fila.

**Descripción.** Los campos de texto largo, memo y rich text del clásico suelen ocupar el ancho completo del formulario. En la nueva UI estos campos se expanden verticalmente (más altos) pero mantienen el ancho de una sola columna dentro de la grilla de 3 columnas, salvo que tengan un `colspan` explícito por metadata (que casi ningún campo define). Esto puede dejar áreas de texto angostas para contenidos largos.

**Solución propuesta.** Hacer que los campos de tipo texto largo/memo/rich text (y similares "expandidos") ocupen por defecto el ancho completo de la fila del formulario, salvo que la metadata indique explícitamente un `colspan` menor. Debe convivir con el posicionamiento por `startnewline`/`startinoddcolumn` y con la expansión vertical ya existente, sin romper la grilla de los demás campos.

**Test cases.**
- Un campo de texto largo/memo/rich text sin `colspan` explícito ocupa el ancho completo de la fila.
- Un campo de esos tipos con `colspan` explícito respeta ese valor en lugar del ancho completo.
- La expansión vertical (alto) de esos campos se mantiene.
- Los campos vecinos y los saltos de fila/columna del resto del formulario no se ven afectados.

**Resultado.** Los campos de texto extenso ofrecen un área de edición amplia y coherente con el clásico, sin afectar el resto del layout.

---

> **Nota sobre el entorno representativo.** En `etendodev` (17.450 campos): `startnewline='Y']` en 221, `issameline='Y'` en 2.322, `startinoddcolumn='Y'` en 7, `isfirstfocusedfield='Y'` en 382, `isdisplayed='N'` en 6.974, `showinrelation='Y'` en 7.698, `em_obuiapp_colspan` seteado en 15 campos, `grid_seqno` seteado en 6.251 (distinto de `seqno` en 2.988). A nivel columna: `isupdateable='N'` 6.255, `isparent='Y'` 621, `isselectioncolumn='Y'` 247, `isencrypted='Y'` 11, `isidentifier='Y'` 1.475, `issecondarykey='Y'` 8. Los flags de columna coinciden con la fuente; las diferencias están en los nombres de columna a nivel `ad_field` (`startnewline`/`em_obuiapp_colspan`/`showinrelation` en lugar de `startrow`/`numcolumn`/`showingridview`), no en la funcionalidad.
