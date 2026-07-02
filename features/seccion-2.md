# Sección 2 — Field / Column Reference Types

Análisis de completitud de la nueva UI (`/client`) frente a `all-features.md` § Section 2. Etendo define **46 tipos de referencia** en `ad_reference`; cada columna usa uno y eso determina cómo se renderiza y valida el campo. La sección 2.B (botones hardcodeados) se cubre al final.

> **Cómo decide la UI el componente de cada tipo:** el render se resuelve por el `reference` ID de la columna en tres dispatchers:
> - **Formulario:** `BaseSelector` → `GenericSelector` (`switch (reference)`), apoyado en el catálogo `FIELD_REFERENCE_CODES` (`utils/form/constants.ts`).
> - **Grilla/list view:** `getFieldReference()` (`utils/index.ts`) que mapea el `reference` a `FieldType`.
> - **Parámetros de proceso:** `ProcessParameterSelector` (`components/ProcessModal/selectors`).
> Los tipos sin caso explícito caen al `default` → `StringSelector` (input de texto plano).

**Estimación global de la sección: ~99% de cobertura efectiva sobre las columnas realmente visibles en ventanas** (verificado contra la BD del `/erp`). El **único tipo pendiente con impacto real es Absolute Time** (17 campos). El resto de tipos no implementados como campo de columna (Color, Binary, Masked String, Assignment, Upload File, Image-by-ID, Window Reference, Button List, etc.) no se usa como columna en ninguna ventana de esta instancia, y Button List / Window Reference (que no tienen sentido como columna) ya están implementados donde sí se usan (procesos y grids P&E).

---

## Qué está completamente hecho

Tipos con componente dedicado y comportamiento fiel (form + grilla + proceso):

| # | Tipo | Componente |
|---|------|-----------|
| 2.1 | String (10) | `StringSelector` (default) |
| 2.2 | Integer (11) | `NumericSelector` (entero, sin decimales) |
| 2.3 | Amount (12) | `NumericSelector` (2 decimales) |
| 2.4 | Number (22) | `QuantitySelector` / numérico |
| 2.5 | Quantity (29) | `QuantitySelector` |
| 2.6 | Price (800008) | `NumericSelector` decimal |
| 2.7 | General Quantity (800019) | `NumericSelector` (Rate, hasta 10 dec.) |
| 2.8 | Date (15) | `DateSelector` |
| 2.9 | DateTime (16) | `DatetimeSelector` |
| 2.10 | Absolute DateTime (4781…) | `DatetimeSelector` |
| 2.11 | Time (24) | `TimeSelector` |
| 2.13 | List (17) | `ListSelector` (dropdown de `ad_ref_list`) |
| 2.14 | Button List (FF80…F957…) | Botones de acción del proceso (`ProcessDefinitionModal.loadButtons`) |
| 2.15 | TableDir (19) | `TableDirSelector` |
| 2.16 | Table (18) | `TableDirSelector` |
| 2.17 | Search (30) | `SelectSelector` / `LocationSelector` / popup legacy |
| 2.18 | OBUISEL_Selector (95E2…) | `TableDirSelector` (typeahead) |
| 2.19 | OBUISEL_Multi Selector (87E6…) | `MultiRecordSelector` (chips) |
| 2.20 | OBUISEL_SelectorAsLink (80B1…) | `TableDirSelector` + label-enlace con zoom (`Label` → `useRedirect`) — validado manualmente |
| 2.21 | YesNo (20) | `BooleanSelector` (checkbox) |
| 2.22 | Button (28) | `ButtonSelector` |
| 2.23 | Text (14) | `TextLongSelector` (textarea) |
| 2.24 | Memo (34) | `TextLongSelector` |
| 2.25 | Rich Text Area (7CB3…) | `RichTextSelector` (WYSIWYG) |
| 2.27 | Image BLOB (4AA6…) | `ImageSelector` (preview + upload) |
| 2.28 | Link (800101) | `LinkSelector` (hipervínculo) |
| 2.29 | PAttribute (35) | `AttributeSetInstanceSelector` (popup) |
| 2.31 | Password decryptable (16EC…) | `EncryptedSelector` (vía `displayEncription`) |
| 2.32 | Password not decryptable (C5C2…) | `PasswordSelector` / `EncryptedSelector` |
| 2.40 | Product Characteristics (C632…) | `StringSelector` read-only |
| 2.42 | Tree Reference (8C57…) | `TreeSelector` (jerárquico) |
| 2.30 | ID (13) | Habitualmente oculto; los 11 campos visibles muestran el identificador vía fallback de `Select` (read-only) |

Notas de calidad ya cubiertas:
- **Precisión numérica:** `getNumericFormatOptions` respeta primero el `valueFormat` (patrón Java de la columna) y aplica defaults por tipo (Amount/Price = 2 dec., Quantity = 0–2, Integer = 0, Rate = 2–10).
- **Separador decimal por locale** vía `Intl.NumberFormat` en `NumericSelector`.
- **Read-only** uniforme: cada selector recibe `isReadOnly` y los campos `isUpdatable='N'` o con display logic se bloquean.

> **Sobre 2.30 ID (ref 13):** el catálogo lo etiqueta como `LIST_13` y lo enruta a `ListSelector`, pero **no produce error**: el `Select` subyacente, ante un valor sin opción coincidente, muestra el identificador del registro (`$_identifier`) o el UUID como fallback. Como las columnas ID son claves (`isupdatable='N'`), se renderizan read-only y el valor se ve correctamente. Mejora cosmética opcional (texto plano en vez de control select) y cleanup de código (renombrar la constante), pero **nada funcional pendiente**.

> **Sobre 2.14 Button List:** ninguna **columna** (`AD_Column`) usa esta referencia en esta instancia; su único uso real son los **parámetros de Procesos Definidos**, donde define el conjunto de botones de acción del proceso. Ese caso está implementado (`getListButtons` / `getDynamicButtons`). No tiene sentido implementar un renderer de campo de formulario para Button List, porque como referencia de columna no representa un widget con semántica válida y no existe ningún caso que lo ejecute. El clásico lo admite en columnas solo porque el catálogo `ad_reference` es compartido y no restringe la referencia por contexto.

> **Sobre 2.43 Window Reference:** mismo caso que Button List (verificado contra la BD). **Ninguna columna usa Window Reference como tipo base** (0) ni hay parámetros de proceso que la usen directamente. El único campo que aparentaba usarla (`FIN_Payment_Proposal.EM_APRM_Process_Proposal`) es en realidad un **Button (ref 28)** cuyo *reference_value* es un window reference: define el **grid P&E embebido** que abre ese botón. Tanto el Button como el grid P&E (`WindowReferenceGrid`) están implementados (ver Sección 1). No tiene sentido implementar Window Reference como widget de campo de columna.

---

## Qué está parcialmente hecho

> Verificado contra la BD del `/erp`: conteo de columnas, **campos mostrados en alguna ventana activa** (`AD_Field` displayed) y parámetros de proceso por cada referencia. Solo se consideran "con impacto" los tipos con al menos un campo mostrado.

- **Separadores de miles en campos numéricos de formulario:** el `NumericSelector` usa `useGrouping:false` en **todos** los estados (edición y display/read-only), por lo que el formulario **nunca** muestra separadores de miles; solo la grilla los agrupa. El clásico sí los muestra en el display del campo, y la spec lo lista como requisito (2.3 Amount). Gap cosmético → **Tarea 2**.

---

## Qué no está hecho

Tipos sin componente dedicado (caen a `StringSelector` de texto plano).

**Con impacto en pantallas reales (verificado: tienen campos mostrados):**
- **2.12 Absolute Time (20D7…):** sin widget time-only. **17 columnas mostradas** (rangos horarios por día en *Discounts and Promotions*) → único gap de tipo con impacto claro.

**Bajo o nulo impacto — verificado: SIN columnas mostradas en ninguna ventana (no aplica implementar):**
- **2.43 Window Reference (FF8081…32D8…):** 0 columnas de tipo base y 0 parámetros; su único uso real es como grid P&E lanzado desde un Button (ya implementado, ver nota arriba y Sección 1).
- **2.33 Binary (23):** 5 columnas (`AD_Image`, `obsched_*`), **0 mostradas en ventanas**.
- **2.36 Assignment (33):** 3 columnas, **0 mostradas**.
- **2.35 Color (27):** **0 columnas**.
- **2.37 Masked String (5252…):** **0 columnas**.
- **2.34 Upload File (715C…):** **0 columnas y 0 parámetros**. Existe `UploadFileSelector` por si se usa, pero ningún campo/parámetro lo referencia.
- **2.26 Image — AD_Image_ID (32):** **0 columnas** (distinto de Image BLOB 2.27, sí implementado).

**Bajo o nulo impacto — técnicos / auto-generados / no usados:**
- **2.38 Non Transactional Sequence (4148…):** 0 columnas. **2.39 Transactional Sequence (B82E…):** 6 campos mostrados pero son números de documento auto-generados en backend; el render como texto read-only es suficiente y fiel.
- **2.41 Search Vector (81FC…):** campo técnico de full-text, debe ir oculto.
- **2.44 DateTime_From (487A…)**, **2.45 DateTime_To (439F…)**, **2.46 OBKMO_Widget in Form (FF8080…):** `all-features.md` indica que **no los usa ninguna columna/parámetro en esta instancia**.

---

## Resumen de lo que queda por hacer

Tras verificar el uso real contra la BD, los tipos implementados cubren **prácticamente todas las columnas mostradas** en ventanas. Quedan **dos tareas**:

- **Absolute Time (2.12)** — 17 campos visibles → único tipo de referencia no implementado con impacto (Tarea 1).
- **Separadores de miles en campos numéricos de formulario** — gap cosmético transversal a Amount/Number (Tarea 2).

El resto de tipos no implementados (Color, Binary, Masked String, Assignment, Upload File, Image-by-ID, **Window Reference**, **Button List**, secuencias, Search Vector, DateTime_From/To, OBKMO Widget) **no se usan como columna en ninguna ventana de esta instancia** —y Button List / Window Reference no tienen sentido como tipo de columna; donde sí se usan (procesos/P&E) ya están implementados— por lo que no se abren tareas. Si en el futuro alguna columna adoptara uno de estos tipos, habría que añadir su widget.

---

## Tareas

### Tarea 1 — Widget time-only para Absolute Time (2.12)

**Descripción:** Falta un selector de hora (sin fecha ni conversión de zona horaria) para el tipo 2.12. Es el único tipo pendiente con impacto real: 17 columnas visibles (rangos horarios por día en *Discounts and Promotions*).

**Solución propuesta:** Reutilizar/extender el selector de tiempo existente para el `reference` de Absolute Time, sin componente de fecha y sin conversión TZ, y enrutarlo en el dispatcher.

**Test cases:**
- Renderiza solo selección de hora.
- No aplica conversión de zona horaria.
- El orden de comparación/ordenamiento es correcto.
- Read-only muestra la hora formateada.

**Resultado:** Los campos Absolute Time se editan como hora pura.

### Tarea 2 — Separadores de miles en campos numéricos de formulario

**Descripción:** Los campos numéricos del formulario no muestran separadores de miles en ningún estado (`useGrouping:false`), a diferencia del clásico, que los muestra en el display del campo. La spec lo lista como requisito (2.3 Amount, 2.4 Number). La grilla sí los agrupa correctamente. Es un gap cosmético, no funcional.

**Solución propuesta:** Activar el agrupado de miles en el `NumericSelector` cuando el campo **no está enfocado** (display/read-only), respetando el locale, y mantener el valor sin agrupar mientras se edita para no entorpecer la escritura/parseo.

**Test cases:**
- Un Amount/Number en display muestra separadores de miles según el locale.
- Al enfocar el campo, el valor pasa a formato editable (sin agrupar) y se puede tipear normalmente.
- Al perder el foco, se reformatea con separadores.
- Read-only muestra el valor agrupado.
- El valor guardado no cambia por el formato (solo presentación).

**Resultado:** Los campos numéricos del formulario muestran miles como en el clásico, sin afectar la edición ni el valor persistido.

---

## Sección 2.B — Botones hardcodeados (plantillas HTML especiales)

Las columnas botón especiales del clásico (**DocAction**, **Posted**, **CreateFrom**, **ChangeProjectStatus**, **PaymentRule** y demás procesos HTML hardcodeados) **están implementadas** mediante el subsistema de **procesos legacy** ya documentado y validado en la Sección 1: `LegacyProcessResolver.isLegacy()` decide el path de render (moderno vs. iframe legacy, punto 2.B.8) y `LegacyProcessServlet` + el protocolo `postMessage` ejecutan el proceso clásico embebido, incluyendo los estados de cada botón (`BUTTON<columnName>`).

Ver detalle y validación en [seccion-1.md](seccion-1.md) (sección Transaction) y `client/docs/process/legacy/manual-processes.md`. No se abren tareas adicionales para 2.B en esta sección.
