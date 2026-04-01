> **Generado:** 2026-03-31
> **Fuente de datos:** Application Dictionary (etendodev, core v26.1.0) + análisis del repositorio `com.etendorx.workspace-ui`
> **Metodología:** El audit original fue generado desde la AD por un Senior Fullstack Developer & QA Automation Expert. Cada sección fue luego cruzada con el estado real del código en este repositorio para producir un porcentaje de completitud actualizado.

---

## Leyenda de Estados

| Estado | Significado |
|--------|-------------|
| `DONE` | Implementado y validado |
| `TO CHECK` | Implementado pero requiere validación manual |
| `PARCIAL` | Implementación incompleta o con gaps conocidos |
| `NOT DONE` | No implementado |
| `BLOQUEADO` | Requiere decisión arquitectónica antes de implementar |
| `BUG ACTIVO` | Implementado pero con defecto conocido y documentado |

---

## Resumen Ejecutivo

| Área | Secciones | % Promedio |
|------|-----------|------------|
| Tipos de ventana y campos | 1–2.B | ~58% |
| Procesos | 3 | ~55% |
| Lógica de UI (display, callouts, estado) | 4–7 | ~73% |
| Selectors y grids | 8–9 | ~68% |
| Comportamientos transversales | 10–16 | ~75% |
| Toolbar y navegación | 17, 12, 27 | ~72% |
| Features avanzadas | 18–35 | ~42% |

**Completitud global estimada: ~62%**

---

## Hallazgo Arquitectónico Clave — Serialización Full Column

`FieldBuilderWithColumn.java:152` serializa el objeto `Column` de la AD **completo** (`DataResolvingMode.FULL_TRANSLATABLE`) y lo envía como `field.column` en el JSON de metadata. Esto significa que `field.column.callout`, `field.column.defaultValue`, `field.column.reference`, `field.column.table`, `field.column.length`, etc. están disponibles en el UI sin trabajo adicional del backend. Las brechas son de **consumo UI**, no de pipeline de metadata.

---

## Top Brechas Críticas (Bloqueadores)

1. ~~**`isUpdateable='N'`** — 6,388 columnas afectadas~~ **IMPLEMENTADO** — `BaseSelector.tsx:179` + metadata `FieldBuilder.java`. Ver sección 2 para detalles.
2. **DocAction — labels incorrectos** — La funcionalidad core está implementada y las acciones se filtran correctamente por `docstatus`. El único issue es que los nombres/labels de las opciones del dropdown no se muestran correctamente. **No es un bloqueador — es un bug de presentación.**
3. **CreateFrom** — Implementado como Process Definition buttons (separado de CopyRecord correctamente). Pendiente: validar que el modal muestra grid con checkboxes, cálculo de cantidad restante, y cobertura de los 6 tipos de documento.
4. **PD Manual JS — namespaces `OB.*`** — 24 procesos dependen de `OB.OpenClose.*`, `OB.OBWPL.*`, etc. Estos no existen en React. Decisión arquitectónica pendiente (iframe vs reimplementación).
5. **Display Logic `@field_name@` syntax** — Bug activo documentado en `/docs/troubleshooting/display-logic-implementation-en.md`.
6. **Selector Out Parameters** — Selectors pueden poblar múltiples campos simultáneamente via `OBUISEL_SelectorField.isoutparameter`. No implementado.
7. **View Personalization** — `OBUIAPP_UIPersonalization` no implementado. Toolbar buttons `personalization` y `manageviews` ausentes.
8. **11+ tipos de campo sin implementar** — Rich Text, Image, Image BLOB, Link, Binary, Upload File, Color, Assignment, Masked String, Multi-Selector, SelectorAsLink.
9. **Tab Default Filters (Sección 26)** — `TabBuilder.java` no envía `hqlFilterClause`/`orderByClause`. El UI no los consume. Requiere verificación de si el server REST los aplica automáticamente.
10. **Default Values client-side (Sección 25)** — Aunque `field.column.defaultValue` está disponible en el JSON, el UI nunca lo lee. Defaults solo funcionan via round-trip server en `FormInitializationComponent NEW mode`.

---

## SECTION 1 — Window Types

**Estado:** TO CHECK | **% Audit:** 80% | **% Real:** 75%

### 1.1 Maintain (M) — TO CHECK 80%

**Qué es:** Ventana CRUD estándar para datos maestros. Sin flujo de documento.

**Brechas del análisis:**
- No hay ítem para `isUpdateable='N'`: campos editables solo en creación, read-only al editar.
- No hay ítem para **multi-record delete** desde grid.
- No hay cobertura del comportamiento de **Copy Record en tabs hijo** (`enablecopyfull`, `enablecopyrelationships`).
- El toggle del flag `Active` no cubre la propagación a registros hijo.

**Estado real:** La estructura Maintain está implementada. Los gaps son de comportamiento edge-case.

**Checklist:**
- [ ] New record creation works (toolbar button + keyboard shortcut)
- [ ] Edit and save works on all editable fields
- [ ] Delete record works (with confirmation dialog)
- [ ] Multi-record delete from grid selection
- [ ] Copy Record creates a faithful duplicate (header + configured child tabs)
- [ ] Tab navigation works (parent → child → grandchild)
- [ ] Grid/list view shows correct columns per `isshowninitialgridmode`
- [ ] Filtering and sorting work in grid view
- [ ] Mandatory fields are enforced on save
- [ ] `isUpdateable='N'` fields become read-only after first save
- [ ] Organization/Client filtering applied correctly
- [ ] Active flag toggle works; no auto-propagation to children
- [ ] Audit fields (Created, Updated, CreatedBy, UpdatedBy) display correctly and are read-only
- [ ] Attachments can be added/removed
- [ ] Notes can be added/viewed

---

### 1.2 Transaction (T) — TO CHECK 78%

**Qué es:** Ventanas de documento con ciclo de vida (Draft → Completed → Voided/Closed).

**Brechas del análisis:**
- DocAction dropdown rendering (referencia tipo 28, columnname='DocAction') — ver Sección 2.B.1.
- `Posted` column button — ver Sección 2.B.2.
- El "Accounting tab" con `displaylogic='@Posted@=\'Y\''` no validado.
- Copy document no especifica que child tabs (Lines, Tax, Payment Plan) también se copian.
- Mecanismo de protección contra edición concurrente.

**Estado real:** La estructura Transaction está implementada. DocAction y Posted son brechas críticas. Ver Sección 2.B.

**Checklist:**
- [ ] Document creates in Draft status by default
- [ ] Document number assigned correctly (per Document Type sequence)
- [ ] Process button (DocAction) appears and is functional — ver 2.B.1
- [ ] "Complete" action transitions to correct status
- [ ] Fields become read-only after completion (header + lines)
- [ ] Lines cannot be added/edited/deleted after completion
- [ ] "Reactivate" returns document to Draft (where allowed)
- [ ] "Void" marks document as voided and creates reversal
- [ ] "Close" closes the document permanently (with prominent confirmation)
- [ ] Accounting tab appears after posting (`@Posted@='Y'` display logic)
- [ ] Posted button shows 3 states: Not Posted / Posted / Error — ver 2.B.2
- [ ] Copy document copies header + child tabs with reset fields (DocStatus→Draft, DocNo→new)
- [ ] Status bar displays correct status with color/icon per status
- [ ] Concurrent edit protection (optimistic lock via `updated` timestamp)

---

### 1.3 Query / Info (Q) — TO CHECK 78%

**Qué es:** Ventanas de consulta de solo lectura.

**Brechas del análisis:**
- En modo Q el toolbar debe ocultar también Attachments, Copy Record, Undo (no solo New/Save/Delete).
- En modo popup como selector, el comportamiento de selección es diferente — no hay zoom navigation.
- Algunos Q windows tienen process buttons (ej: operaciones de match).

**Estado real:** El modo read-only básico está implementado. La lista exacta de botones ocultos en Q no está validada.

**Checklist:**
- [ ] All fields display as read-only
- [ ] Toolbar: New, Save, Delete, Attachments, Copy Record, Undo hidden/disabled
- [ ] Toolbar: Export, Refresh, Link remain visible
- [ ] Filtering works on all filterable columns
- [ ] Zoom links navigate to correct source windows
- [ ] When opened as popup selector: row click sends value to parent field (no zoom)
- [ ] Context filters pre-populated from parent window (in popup mode)
- [ ] Sub-tabs (if any) are also read-only

---

### 1.4 Pick and Execute (OBUIAPP_PickAndExecute) — PARCIAL 55%

**Qué es:** UI en dos fases: Filtrar/Seleccionar → Ejecutar sobre filas seleccionadas.

**Brechas del análisis:**
- No hay descripción del flujo de datos: parámetros de header → criteria del datasource; IDs de filas + ediciones inline → payload al ActionHandler.
- No hay ítem para "campos inline mandatory" — el botón Execute debe bloquearse si hay campos obligatorios vacíos en filas seleccionadas.
- Modo single-select (`ismultirecord='N'` en Process Definition) no cubierto.
- Context parameters del padre (ej: Invoice ID) pasados via URL/session.
- Comportamiento `openDirectTab` del response del handler.

**Estado real:** `ProcessDefinitionModal.tsx` maneja el caso P&E estándar. Los gaps son en validación de campos inline y forwarding de contexto.

**Checklist:**
- [ ] Filter parameters load correctly and filter the grid
- [ ] Grid displays with selection checkboxes
- [ ] Individual row selection works
- [ ] Select All / Deselect All works
- [ ] Inline-editable mandatory fields validated before Execute
- [ ] Process/Execute button blocked if mandatory inline fields empty in selected rows
- [ ] Single-select mode works when `ismultirecord='N'`
- [ ] Process executes on selected rows with context from parent window
- [ ] Proper feedback message after execution (success/error count)
- [ ] Grid refreshes or redirects after execution
- [ ] `openDirectTab` response navigates to correct window/record
- [ ] Empty selection shows appropriate warning

---

## SECTION 2 — Field / Column Reference Types

**Estado general:** PARCIAL | **% Audit:** 55% | **% Real:** 65%

**Implementados en el codebase** (`packages/MainUI/components/Form/FormView/selectors/`):
String, Integer, Amount (parcial), Number, Quantity, Date, DateTime, Time, List, Select, TableDir, Location, GenericSelector (OBUISEL_Selector), ProductStock, AttributeSet (PAttribute parcial), Boolean/YesNo, Password (ambos tipos), TextLong (Text/Memo)

**NO implementados:** Rich Text, Image, Image BLOB, Link, Binary, Upload File, Color, Assignment, Masked String, Multi-Selector, SelectorAsLink, Absolute DateTime, Absolute Time, Button List, General Quantity, Product Characteristics, Search Vector, Tree Reference, Window Reference, DateTime_From/To, Widget in Form

**`isUpdateable='N'` — IMPLEMENTADO (verificado en código):**
- El módulo de metadata (`FieldBuilder.java:786`) envía `isUpdatable` en el JSON de cada campo, leyéndolo de `field.getColumn().isUpdatable()` (`FieldBuilderWithColumn.java:137`).
- `BaseSelector.tsx:179` implementa la lógica: `if (!field.isUpdatable) return FormMode.NEW !== formMode;`
  → read-only en EDIT mode, editable en NEW mode. Comportamiento correcto.
- Los campos de audit (`useFormFields.ts`) también tienen `isUpdatable: false` hardcodeado.

---

### 2.1 String (ID: 10) — TO CHECK 75%

**Implementado:** `StringSelector.tsx` en `BaseSelector.tsx`

**Brechas:**
- `isUpdateable='N'`: campo debe volverse read-only después del primer save.
- `isuniqueperorg`: violaciones de unicidad deben mostrarse en el campo específico.
- Generación de Search Key desde secuencia en creación.

**Checklist:**
- [ ] Renders as single-line text input
- [ ] Max length enforced (`fieldlength`)
- [ ] Mandatory validation on save
- [ ] Read-only renders as text label
- [ ] `isUpdateable='N'`: read-only after first save even in edit mode
- [ ] Server uniqueness violation shown on specific field (not generic error)
- [ ] Special characters preserved on save

---

### 2.2 Integer (ID: 11) — TO CHECK 72%

**Implementado:** `NumericSelector.tsx` con validación integer

**Brechas:**
- No hay ítem para mandatory validation.
- No hay ítem para `valuemin`/`valuemax`.
- Null vs 0 distinction.
- Auto-increment de Line No. (próximo múltiplo de 10).

**Checklist:**
- [ ] Only accepts digits and minus sign
- [ ] Decimal input rejected
- [ ] Right-aligned display
- [ ] Mandatory validation on save
- [ ] `valuemin` / `valuemax` enforced
- [ ] Null field displays empty (not "0")
- [ ] `isUpdateable='N'` enforced
- [ ] Line No. fields auto-assign next multiple of 10 on new row

---

### 2.3 Amount (ID: 12) — PARCIAL 65%

**Implementado:** `NumericSelector.tsx` — sin manejo de precisión por moneda

**Brechas:**
- Precisión de decimales debe seguir la moneda del documento (EUR: 2, JPY: 0).
- Separadores de miles por locale.

**Checklist:**
- [ ] Decimal places match currency precision (context-dependent)
- [ ] Thousand separators per locale
- [ ] Negative values displayed correctly
- [ ] Right-aligned
- [ ] Callout-driven recalculations work (line amount → total)

---

### 2.4 Number (ID: 22) — TO CHECK 78%

**Implementado:** `NumericSelector.tsx`

**Checklist:**
- [ ] Accepts decimals
- [ ] Right-aligned
- [ ] No currency symbol
- [ ] Min/max validation if defined

---

### 2.5 Quantity (ID: 29) — TO CHECK 78%

**Implementado:** `QuantitySelector.tsx`

**Brechas:** Precisión de decimales debe seguir configuración de UOM.

**Checklist:**
- [ ] Decimal precision follows UOM settings
- [ ] Right-aligned
- [ ] Negative allowed (returns)
- [ ] Callouts fire on change

---

### 2.6 Price (ID: 800008) — PARCIAL 60%

**Implementado:** Cubierto por `NumericSelector.tsx`, sin precisión específica de precio (típicamente 4+ decimales).

**Checklist:**
- [ ] Higher decimal precision than Amount (4+ decimals)
- [ ] Right-aligned
- [ ] Callouts fire to recalculate line amounts

---

### 2.7–2.12 Remaining Numeric / Time Types

| Tipo | ID | Estado | Notas |
|------|----|--------|-------|
| General Quantity | 800019 | PARCIAL | Cubierto por NumericSelector |
| Date | 15 | IMPLEMENTADO | `DateSelector.tsx` |
| DateTime | 16 | IMPLEMENTADO | `DatetimeSelector.tsx` |
| Absolute DateTime | 478169542A | NO IMPLEMENTADO | Sin manejo diferencial de timezone |
| Time | 24 | IMPLEMENTADO | `TimeSelector.tsx` |
| Absolute Time | 20D7C424C2 | NO IMPLEMENTADO | Sin manejo diferencial de timezone |

---

### 2.13 List (ID: 17) — TO CHECK 78%

**Implementado:** `ListSelector.tsx`

**Brechas:** Valores inactivos previamente seleccionados deben mostrarse (grayed) sin aparecer en el dropdown.

**Checklist:**
- [ ] Dropdown renders with all active list values
- [ ] Correct value selected on load
- [ ] Empty option shown for non-mandatory fields
- [ ] Inactive values not shown in dropdown but display if already saved
- [ ] Display logic triggered by list selection works
- [ ] Callouts fire on selection change

---

### 2.14 Button List (ID: FF808181) — NO IMPLEMENTADO 0%

**Checklist:**
- [ ] Renders as button group (not dropdown)
- [ ] Exactly one value selected at a time
- [ ] Visual feedback for selected state
- [ ] Read-only disables all buttons

---

### 2.15 TableDir (ID: 19) — TO CHECK 75%

**Implementado:** `TableDirSelector.tsx` con búsqueda modal

**Brechas:**
- Resolución de tabla por convención de nombre de columna (`C_BPartner_ID` → `C_BPartner`).
- Validation rules (`ad_val_rule.code` — SQL WHERE fragment).

**Checklist:**
- [ ] Dropdown populated from correct table (auto-resolved from column name)
- [ ] Only active records shown
- [ ] Organization filter applied
- [ ] Record identifier displayed (not UUID)
- [ ] Validation rules respected
- [ ] Search/filter in large dropdowns
- [ ] Callouts fire on change

---

### 2.16 Table (ID: 18) — PARCIAL 65%

Similar a TableDir pero con tabla/columna explícita en la AD.

**Checklist:**
- [ ] Same visual as TableDir (dropdown)
- [ ] Populated from explicitly configured table and key/display columns
- [ ] Validation rules applied

---

### 2.17 Search (ID: 30) — PARCIAL 55%

**Implementado:** `GenericSelector.tsx` parcialmente

**Brechas:** Falta el popup de búsqueda con columnas configuradas. Falta clearing de selección.

**Checklist:**
- [ ] Text field with search icon
- [ ] Search popup opens with configured filterable columns
- [ ] Selection populates the field
- [ ] Clear/remove selection works
- [ ] Direct keyboard entry validates against table

---

### 2.18 OBUISEL_Selector (ID: 95E2A8B5) — TO CHECK 70%

**Implementado:** `GenericSelector.tsx` con typeahead

**Brechas críticas:**
- **Out Parameters** (`isoutparameter='Y'`): seleccionar una fila puede poblar múltiples campos del formulario. No implementado.
- Selector popup con columnas extra (`isfilterfield='Y'`).
- Minimum character threshold configurable.

**Checklist:**
- [ ] Typeahead triggers after configured character count
- [ ] Dropdown shows configured columns
- [ ] HQL filter restrictions applied
- [ ] Selection populates correct FK value
- [ ] **Out Parameters**: selection also populates other configured form fields
- [ ] Selector popup shows extra filter fields and columns
- [ ] Clear works
- [ ] Existing out-of-filter values display correctly

---

### 2.19 OBUISEL_Multi Selector (ID: 87E6CFF8) — NO IMPLEMENTADO 0%

**Checklist:**
- [ ] Multiple values can be selected (tag/chip input)
- [ ] Individual tags removable
- [ ] All selected values saved correctly

---

### 2.20 OBUISEL_SelectorAsLink (ID: 80B16307) — NO IMPLEMENTADO 0%

**Checklist:**
- [ ] Value displays as clickable link
- [ ] Clicking navigates to the referenced record
- [ ] When editable, still allows changing the selection

---

### 2.21 YesNo (ID: 20) — TO CHECK 80%

**Implementado:** `BooleanSelector.tsx` como Switch

**Checklist:**
- [ ] Renders as checkbox/switch
- [ ] Checked = Y, Unchecked = N
- [ ] Default value applied on new record
- [ ] Read-only shows disabled (not hidden)
- [ ] Callouts fire on toggle
- [ ] Display logic re-evaluates on toggle

---

### 2.22 Button (ID: 28) — PARCIAL 45%

**Implementado:** `ProcessDefinitionModal.tsx` para Process Definition. Los casos hardcoded (DocAction, Posted, CreateFrom, ChangeProjectStatus) están parcialmente implementados — ver Sección 2.B.

**Brechas críticas:**
- No hay lógica de routing centralizada que implemente el árbol de decisión de 2.B.8.
- `ismultirecord='Y'` en el proceso no está verificado para pasar array de IDs.

**Checklist:**
- [ ] Decision tree (2.B.8) routes each button to correct handler
- [ ] Process Definition buttons use modern API (`em_obuiapp_process_id`)
- [ ] Legacy process buttons use correct template/servlet
- [ ] Button placement: in-form vs toolbar (per `uipattern` of linked process)
- [ ] Multi-record mode when `ismultirecord='Y'`
- [ ] Confirmation dialog with text from `ad_message`
- [ ] Form refreshes after execution

---

### 2.23 Text (ID: 14) — TO CHECK 75%

**Implementado:** `TextLongSelector.tsx`

**Brechas:** Grid view muestra truncado con ellipsis y tooltip. HTML injection prevention (XSS).

**Checklist:**
- [ ] Renders as multi-line textarea
- [ ] `fieldlength` enforced
- [ ] Line breaks preserved
- [ ] Grid view: truncated with ellipsis, full content on tooltip
- [ ] HTML escaped on display (XSS prevention)
- [ ] Read-only displays as text block

---

### 2.24 Memo (ID: 34) — PARCIAL 55%

**Implementado:** Posiblemente cubierto por `TextLongSelector.tsx`, no validado específicamente.

**Brechas:** Campos SQL (ej: `Alert Rule > SQL`) deberían renderizarse en fuente monospace. Tab key debe insertar espacios/tab dentro del textarea.

**Checklist:**
- [ ] Large text area
- [ ] Preserves formatting/whitespace
- [ ] Scrollable for long content
- [ ] SQL fields render in monospace font
- [ ] Tab key inserts tab character (not moves focus) in SQL fields
- [ ] `fieldlength` enforced
- [ ] Grid view: truncated with ellipsis

---

### 2.25 Rich Text Area (ID: 7CB371C1) — NO IMPLEMENTADO 0%

**Brechas:** No encontrado en el codebase. Requiere decisión de librería WYSIWYG (TinyMCE u otro) compatible con el HTML almacenado por el classic UI.

**Checklist:**
- [ ] WYSIWYG editor renders with toolbar
- [ ] Bold, italic, underline, lists work
- [ ] HTML stored correctly (compatible with classic UI format)
- [ ] Read-only renders as formatted HTML
- [ ] Paste from external source sanitized (XSS prevention)
- [ ] Content length limit enforced

---

### 2.26 Image (ID: 32) — NO IMPLEMENTADO 0%

**Checklist:**
- [ ] Image preview displayed (fetched by ID from `ad_image`)
- [ ] Upload new image works
- [ ] Remove image works
- [ ] Broken `ad_image` reference shows placeholder (not error)

---

### 2.27 Image BLOB (ID: 4AA6C3BE) — NO IMPLEMENTADO 0%

**Checklist:**
- [ ] Image preview displayed inline (scaled to fit field)
- [ ] Upload dialog for new image
- [ ] Clear/remove image
- [ ] File size limits enforced
- [ ] Grid view: thumbnail
- [ ] Read-only: shows image, no controls
- [ ] Copy Record: BLOB copies with record

---

### 2.28 Link (ID: 800101) — NO IMPLEMENTADO 0%

**Checklist:**
- [ ] Renders as clickable link in read mode (opens in new tab)
- [ ] Editable as text input in edit mode
- [ ] URL validation on save (requires http/https)
- [ ] Null/empty: shows empty input (no broken link icon)
- [ ] Grid view: URL text or link icon

---

### 2.29 PAttribute (ID: 35) — PARCIAL 55%

**Implementado:** `AttributeSetInstanceSelector.tsx` existe

**Brechas:** La dependencia del campo Product para determinar el AttributeSet. Modo instance vs non-instance. Campos obligatorios dentro del popup.

**Checklist:**
- [ ] Button/icon opens attribute popup
- [ ] Popup disabled if no product selected in same line
- [ ] Instance attributes (lot, serial): create new `M_AttributeSetInstance` per selection
- [ ] Non-instance attributes: shared across documents
- [ ] Mandatory attributes validated before popup close
- [ ] Read-only when parent document is Completed
- [ ] Display format: shows `description` from `M_AttributeSetInstance`

---

### 2.30 ID (ID: 13) — TO CHECK 75%

**Implementado:** Manejado internamente.

**Checklist:**
- [ ] Not visible in form view
- [ ] May be visible in admin windows (Windows, Tabs, Fields)
- [ ] Auto-generated UUIDs conform to 32-hex standard
- [ ] Copy Record generates new UUID for new record

---

### 2.31–2.33 Password Types & Binary — PARCIAL / NO IMPLEMENTADO

| Tipo | Estado | Notas |
|------|--------|-------|
| Password decryptable | IMPLEMENTADO | `PasswordSelector.tsx` |
| Password not decryptable | IMPLEMENTADO | `PasswordSelector.tsx` |
| Binary | NO IMPLEMENTADO | No encontrado |

**Brechas para Password:**
- `autocomplete="new-password"` para prevenir autofill del browser.
- No mostrar hash de passwords no descifrables.

---

### 2.34 Upload File (ID: 715C53D4) — NO IMPLEMENTADO 0%

**Checklist:**
- [ ] Upload button and drag-and-drop zone
- [ ] File type and size validation
- [ ] Upload progress indicator
- [ ] Download uploaded file
- [ ] Read-only mode: download link only
- [ ] Delete uploaded file

---

### 2.35 Color (ID: 27) — NO IMPLEMENTADO 0%

**Checklist:**
- [ ] Color picker popup
- [ ] Selected color preview swatch
- [ ] Hex value storage
- [ ] Read-only: shows colored swatch only

---

### 2.36 Assignment (ID: 33) — NO IMPLEMENTADO 0%

**Real example:** `Resource Assignment` en Sales Order > Lines, Purchase Order > Lines.

**Checklist:**
- [ ] Opens resource assignment dialog
- [ ] Correct resources listed (filtered by org, date, resource type)
- [ ] Time slot selection
- [ ] Assignment saved and displayed

---

### 2.37–2.46 Remaining Types — NO IMPLEMENTADO 0%

| Tipo | Estado | Prioridad |
|------|--------|-----------|
| Masked String | NO | Baja |
| Non-Transactional Sequence | NO | Media |
| Transactional Sequence | NO | Alta (Document Numbers) |
| Product Characteristics | NO | Media |
| Search Vector | NO | Baja (should be hidden) |
| Tree Reference | NO | Media |
| Window Reference | NO | Baja |
| DateTime_From | NO | Baja (unused in instance) |
| DateTime_To | NO | Baja (unused in instance) |
| OBKMO_Widget in Form | NO | Baja |

---

## SECTION 2.B — Hardcoded Button Columns

**Estado:** PARCIAL | **% Audit:** 65% | **% Real:** 35%

Estos casos deben detectarse por nombre de columna e implementarse con lógica dedicada. El árbol de decisión (2.B.8) debe implementarse como lógica centralizada en el nuevo UI.

### 2.B.1 DocAction — TO CHECK 75%

**Estado real (verificado en código + tests):** La funcionalidad core está implementada y funciona correctamente.

**Flujo implementado:**
- `bulkCompletionUtils.ts` — detecta procesos bulk completion (DocAction param + isMultiRecord)
- `ProcessDefinitionModal.tsx:966` — filtra parámetros para mostrar solo `DocAction` en procesos bulk
- `manual/utils.ts:131` — envía `inpdocstatus` (estado real del documento) al servidor en cada invocación
- El servidor valida el `docstatus` y ejecuta solo las transiciones válidas → **las acciones sí se filtran correctamente por estado**
- Tests en `bulkCompletionUtils.test.ts` verifican la detección del proceso y el comportamiento

**Único problema real identificado:** Los **labels/nombres de las opciones** en el dropdown no se muestran correctamente (traducciones o identificadores incorrectos). La ejecución es correcta, solo la presentación de los nombres es el issue.

**Tablas donde existe:**

| Tabla | Proceso | Ventanas |
|-------|---------|---------|
| `C_Order` | Process Order | Sales Order, Purchase Order, Sales Quotation, Return from/to Customer/Vendor |
| `C_Invoice` | Process Invoice | Sales Invoice, Purchase Invoice |
| `M_InOut` | Process Shipment | Goods Shipment, Goods Receipt |
| `M_Requisition` | Post Requisition | Manage Requisitions |
| `GL_Journal` | Add Payment From Journal | G/L Journal |

**Checklist:**
- [x] `inpdocstatus` sent to server with current document status
- [x] Server-side filtering of valid transitions per `docstatus`
- [x] Action executes correctly based on document state
- [x] Bulk completion detection (`isBulkCompletionProcess`)
- [ ] **FIX:** DocAction option labels display correctly (correct names/translations)
- [ ] Default selection: `--` (None) on each form load
- [ ] Status bar updates immediately after transition
- [ ] Fields become read-only after Completion (UI update post-execution)
- [ ] Confirmation dialogs for Void and Close
- [ ] Works correctly on all 5 document tables

---

### 2.B.2 Posted — PARCIAL 30%

**Estado real:** `checkIfRecordIsPosted()` en `manual/utils.ts` detecta el estado. Sin implementación visual completa.

**Lo que falta:**
- 3 estados visuales: N (Not Posted), Y (Posted — con count de Fact_Acct entries), E (Error — con tooltip del error).
- Endpoint de post vs endpoint de unpost (dos rutas diferentes).
- Confirmación antes de unpost.
- Manejo de "periodo cerrado" como error user-friendly.
- Link al visor de Accounting Transaction Details.

**Checklist:**
- [ ] Show 3 states: Not Posted (N) / Posted (Y) / Error (E)
- [ ] Posted state shows count of accounting entries
- [ ] Error state shows error message in tooltip
- [ ] Post action: invoke accounting engine
- [ ] Unpost action: delete accounting entries with confirmation
- [ ] Period-closed error shown as user-friendly message
- [ ] Link to Accounting Transaction Details after posting
- [ ] Works on all 32 tables listed in Section 2.B.2

---

### 2.B.3 CreateFrom — TO CHECK 72%

**Estado real (verificado en código):** Implementado como **Process Definition buttons**, no como template HTML hardcodeado. La separación respecto a Copy Record existe y es correcta.

**Archivos relevantes:**
- `packages/MainUI/utils/processes/definition/constants.ts` — IDs y metadata de cada proceso
- `packages/MainUI/hooks/Toolbar/useProcessExecution.ts` — ejecución
- `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx` — UI del proceso

**Process IDs implementados:**

```typescript
COPY_FROM_ORDER_PROCESS_ID           = "8B81D80B06364566B87853FEECAB5DE0"
CREATE_LINES_FROM_ORDER_PROCESS_ID   = "AB2EFCAABB7B4EC0A9B30CFB82963FB6"
CREATE_LINES_FROM_ORDER_RECEIPT_ID   = "19B7ADFA1E844099A940B4D179EE4062"
CREATE_LINES_FROM_RECEIPT_ID         = "7737CA7330FD49FBA7EBC225E85F2BC9"
CREATE_LINE_ID                       = "6995A4C2592D434A9E16B71E1694CBCA"
```

**Cómo funciona:** Cada proceso tiene metadata con `dynamicKeys` que mapean contexto del documento actual (invoiceClient, invoiceBusinessPartner, invoicePriceList, etc.) para pre-filtrar el popup. El backend maneja la lógica de importación de líneas.

**Separación Copy Record vs CreateFrom — confirmada:**
- `COPY_RECORD` / `copyRecordRequest` → clonar el registro completo (Clone Records)
- `CREATE_LINES_FROM_*` → importar líneas desde documento fuente → son procesos distintos

**Brechas reales (no de implementación sino de validación):**
- Verificar que el modal muestra la grid de líneas fuente con checkboxes correctamente
- Verificar que la cantidad restante (parcialmente entregada/facturada) se calcula bien
- Verificar que previene importar líneas ya totalmente procesadas
- Verificar refresh de la tab de líneas tras la importación
- Confirmar cobertura de todos los tipos de documento (los 6 casos: Invoice, InOut, BankStatement, Settlement, DP_Management, Remittance)

**Checklist:**
- [x] Create Lines From implemented as Process Definition (separate from Copy Record)
- [x] Context parameters passed to pre-filter source documents (BP, Client, PriceList, etc.)
- [x] Process execution via `ProcessDefinitionModal`
- [ ] Popup grid shows source document lines with checkboxes
- [ ] Multi-row selection works
- [ ] Quantities/amounts editable before import
- [ ] Remaining quantity calculation (partial deliveries already invoiced)
- [ ] Duplicate prevention (fully imported lines excluded or disabled)
- [ ] Line tab refreshes after import
- [ ] Covers all 6 document types (Invoice, InOut, BankStatement, Settlement, DPMgmt, Remittance)

---

### 2.B.4 ChangeProjectStatus — NO IMPLEMENTADO 0%

**Tablas:** `C_Project` (Multiphase Project, Service Project)

**Checklist:**
- [ ] Detected by `columnname='ChangeProjectStatus'`
- [ ] Query valid project status transitions via `ActionButtonUtility.projectAction()`
- [ ] Render dropdown with valid options
- [ ] Submit status change
- [ ] Refresh form after status update

---

### 2.B.5 PaymentRule — TO CHECK 70%

En el UI moderno se maneja como List reference estándar (no popup especial).

**Checklist:**
- [ ] PaymentRule renders as standard List dropdown (no special popup)

---

### 2.B.6–2.B.9 Other Hardcoded HTML Processes — NO IMPLEMENTADO 20%

Ver tabla completa en el audit original. Los más críticos:

| Proceso | Estado | Impacto |
|---------|--------|---------|
| CopyFrom Order/Invoice | NO | Alto — ventanas de orden/factura |
| APRM Process Invoice | NO | Alto — módulo de pagos |
| Execute Payment | NO | Alto — módulo de pagos |
| Reconcile | NO | Alto — conciliación bancaria |
| Close Year / Undo Close | NO | Alto — año fiscal |
| Grant Access | NO | Medio — seguridad de roles |
| Process Shipment Java | NO | Alto — logística |
| Schedule/Unschedule Process | NO | Medio — planificación |

**Árbol de decisión (2.B.8) — debe implementarse como lógica centralizada:**

```
¿Column tiene em_obuiapp_process_id?
  └── SÍ → Process Definition (API moderna)
  └── NO → ¿Tiene ad_process_id?
            ├── SÍ → ¿columnname es DocAction/Posted/CreateFrom/ChangeProjectStatus?
            │         ├── SÍ → Template hardcoded (bypass uipattern)
            │         └── NO → Usar ad_process.uipattern (S→popup, M→servlet)
            └── NO → ¿columnname es 'Posted' o 'CreateFrom'?
                      ├── SÍ → Template hardcoded standalone
                      └── NO → Sin acción
```

---

## SECTION 3 — Process Types

**Estado general:** PARCIAL | **% Audit:** 65% | **% Real:** 55%

### 3.A.1 R&P Standard (S) — TO CHECK 72%

**Implementado:** `ProcessDefinitionModal.tsx` con parámetros AD.

**Brechas:**
- Mapping de `ad_process_para` reference types a field types del UI.
- Default values en parámetros (`defaultvalue` expressions: `@#Date@`, `@AD_ORG_ID@`, SQL).
- Secuencia de parámetros por `seqno`.

**Checklist:**
- [ ] Process invoked from button renders parameter popup
- [ ] Parameters render with correct reference types
- [ ] Mandatory parameters enforced
- [ ] Default values populated correctly (including `@#Date@`, `@AD_ORG_ID@`, SQL expressions)
- [ ] Parameters ordered by `seqno`
- [ ] Process executes and returns result message
- [ ] Window/tab refreshes after execution

---

### 3.A.2 R&P Manual

#### Reports (isreport=Y) — PARCIAL 50%

**Implementado:** `Iframe.tsx` para compatibilidad legacy con el classic UI.

**Brechas:**
- HTML report rendering en el nuevo UI (iframe vs inyección HTML controlada).
- Si el classic UI no está corriendo, los reports vía iframe no funcionan.

**Checklist:**
- [ ] Report appears in correct menu location
- [ ] Parameter form renders (classic HTML via iframe, or modern React popup)
- [ ] Report generates (HTML inline, PDF download, Excel download)
- [ ] Empty result set shows informative message
- [ ] Large reports do not timeout

#### Background Processes (isbackground=Y) — NO IMPLEMENTADO 10%

**Implementado:** Solo configuración vía Process Scheduling window.

**Lo que falta:**
- Process Monitor integration (estado en tiempo real).
- Notificación al usuario cuando un proceso background completa.
- Polling o websocket para estado de ejecución.

**Checklist:**
- [ ] Process appears in Process Scheduling dropdown
- [ ] Scheduled process executes at configured time
- [ ] Process Monitor shows real-time status (running/completed/error)
- [ ] Execution logs capture start, end, result
- [ ] Error details recorded on failure
- [ ] User notification on completion

#### Manual Action Processes — PARCIAL 40%

**Implementado:** `Iframe.tsx` para legacy. **Bloqueado** para reimplementación nativa.

**BLOQUEADOR:** Los 57 procesos manual action dependen de `OB.CurrentView`, `OB.MainView`, `OB.Utilities`, etc. Estos namespaces no existen en React. Decisión requerida:

**Opciones:**
1. **Iframe** — Usar `Iframe.tsx` para todos los procesos Manual. Requiere que el classic UI corra simultáneamente.
2. **Shim** — Crear un objeto `OB` global que exponga la API del React UI. Costoso y frágil.
3. **Caso a caso** — Reimplementar los 57 procesos como PD Action en React. Alto esfuerzo.

---

### 3.B.1 PD Action (A) — TO CHECK 75%

**Implementado:** `ProcessDefinitionModal.tsx`, `useProcessExecution.ts` (8K+ líneas).

**Brechas:**
- Payload JSON exacto al ActionHandler: `{_action, recordID, inpTabId, context}`.
- Response actions: `refreshGrid`, `openDirectTab`, `showMsgInProcessView`, `showMsgInView` (diferencia entre los dos últimos no clara).
- Verificación de `AD_Process_Access` client-side antes de invocar.

**Checklist:**
- [ ] Button triggers ActionHandler
- [ ] Processes without params execute immediately
- [ ] Custom parameter popup renders (when handler defines one)
- [ ] JSON payload includes correct record context
- [ ] `refreshGrid` refreshes parent grid
- [ ] `openDirectTab` navigates to specified tab/record
- [ ] `showMsgInProcessView` vs `showMsgInView` distinction correct
- [ ] Multi-record mode when `ismultirecord='Y'`
- [ ] Loading indicator during execution
- [ ] Works from both grid and form view

---

### 3.B.2 PD Manual (M) — BLOQUEADO 25%

**Implementado:** `Iframe.tsx` como fallback. **Los namespaces `OB.*` no existen en React.**

**Los 17 procesos PD Manual incluyen:**
- Open Close Periods (`OB.OpenClose.openClose`)
- Recalculate Role Permissions (`OB.RoleInheritance.recalculatePermissions`)
- Open Swagger (`OB.ETAPI.swagger.openSwagger`)
- Get Token / Middleware Token (EtendoRX)
- Assign/Cancel/Close/Process/Validate Picking List
- Create/Process Packing operations

**DECISIÓN REQUERIDA ANTES DE IMPLEMENTAR.**

**Checklist (post-decisión):**
- [ ] Each Manual JS process executes without console errors
- [ ] Custom UI rendered by JS function displays correctly
- [ ] Context parameters received correctly (current record, tab, window)
- [ ] Browser state consistent after execution

---

### 3.B.3 PD Standard (OBUIAPP_PickAndExecute) — TO CHECK 72%

**Implementado:** `ProcessDefinitionModal.tsx` con parámetros AD. El más común (76 procesos).

**Brechas:**
- Default values con referencias a campos del formulario padre (`@C_BPartner_ID@`).
- Parameter grouping por `obuiapp_param_group`.
- Display logic en parámetros.
- Cuando se invoca desde P&E window: IDs de filas seleccionadas deben pasarse al handler.

**Checklist:**
- [ ] Parameter popup with all AD-defined parameters
- [ ] Default values resolve context references from parent form
- [ ] Parameter groups render as sections
- [ ] Parameter display logic works
- [ ] Selected row IDs passed to handler when invoked from P&E window
- [ ] Handler response message displayed
- [ ] Grid refreshes after execution

---

### 3.B.4 PD Report (OBUIAPP_Report) — TO CHECK 75%

**Implementado:** `ProcessDefinitionModal.tsx` + Jasper report generation.

**Brechas:**
- Endpoint de generación del reporte (URL, parámetros, formato de respuesta).
- Output format selector (PDF/Excel) en el popup.
- Timeout handling (504) para reportes grandes.
- Company logo desde `ad_image`.

**Checklist:**
- [ ] Parameter popup with all AD-defined parameters
- [ ] Output format selection (PDF/Excel where supported)
- [ ] Report generates without timeout
- [ ] PDF opens in browser or downloads
- [ ] PDF layout: headers, footers, page numbers, company logo
- [ ] Numbers and dates formatted per locale
- [ ] Empty result set shows informative message

---

### 3.B.5 PD RX Action (ETRX_RxAction) — NO CLARO 40%

**Implementado:** Botones EtendoRX en toolbar existen. Flujo async no validado.

**Checklist:**
- [ ] Process invocation reaches EtendoRX service
- [ ] Async execution handled (polling or callback)
- [ ] EtendoRX unavailability shows user-friendly error
- [ ] UI does not freeze during async execution

---

### 3.C.1 Document Action Processes — PARCIAL 55%

Ver 2.B.1 (DocAction) para los gaps detallados.

**Checklist:**
- [ ] Action dropdown shows only valid actions per `docstatus`
- [ ] Status transitions correctly for all document types
- [ ] Fields and lines become read-only after completion
- [ ] Toolbar updates per new status
- [ ] Accounting entries created on posting
- [ ] Reversal documents on void (navigation to reversal)
- [ ] Concurrent processing protection (optimistic lock)
- [ ] "Under Way" (IP) transient status shows spinner/disabled state

---

## SECTION 4 — Display Logic

**Estado:** BUG ACTIVO | **% Audit:** 80% | **% Real:** 65%

**Implementado:**
- `useDisplayLogic.ts` con evaluación por campo
- `compileExpression()` en `BaseSelector.tsx` con cache de módulo y shim `OB.*`
- `parseDynamicExpression()` en `utils/index.ts`

**Bug activo documentado:** `/docs/troubleshooting/display-logic-implementation-en.md`
- `@field_name@` syntax causa errores JavaScript.
- Impacta a múltiples ventanas con display logic usando esta sintaxis.

**Otros gaps del audit:**
- `^` (Starts With) operator — sin ejemplo real validado en esta instalación.
- Precedencia de operadores no formalizada (`&` vs `|`).
- Variables no definidas/null en contexto — comportamiento no especificado.
- Display logic en grid columns — evaluación por fila no validada.
- Interacción callout → display logic re-evaluation — no explícitamente manejado.

**Checklist:**
- [ ] **FIX:** `@field_name@` syntax parsed correctly (no JavaScript errors)
- [ ] `=`, `!=`, `>`, `<`, `>=`, `<=`, `&`, `|`, `!`, `^` operators work
- [ ] Operator precedence correct (`&` binds tighter than `|`)
- [ ] Undefined context variables evaluate gracefully (false/hidden, not crash)
- [ ] Display logic re-evaluates on every field change
- [ ] Callout-modified fields trigger display logic re-evaluation
- [ ] Display logic on new record: fields not yet populated → evaluates to false
- [ ] Grid column display logic evaluated per row (using that row's values)
- [ ] Tab display logic evaluated on parent record change
- [ ] Session variables (`@#AD_ORG_ID@`, `@#AD_CLIENT_ID@`) resolve correctly

---

## SECTION 5 — Tab-Level Behaviors

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 72%

**Implementado:** `TabsContainer.tsx` con manejo de jerarquía y visibilidad.

**Brechas:**
- Grandchild tabs (level 2) — validar filtrado por doble FK.
- SR (Single Record) tabs — sin grid, sin botón New/Delete.
- Tab ordering por `seqno` con tiebreaker AD.
- Lazy loading de datos de tab (no cargar hasta que se navegue a ella).
- Tab count badge refresh después de proceso.
- Read-only tabs: deben seguir cargando datos, solo sin edición.

**Checklist:**
- [ ] Tab display logic evaluated on header record change
- [ ] Read-only tabs (`isreadonly='Y'` or `uipattern='RO'`) load data but no editing
- [ ] Single Record (SR) tabs: form view only, no grid, at most one record
- [ ] ED (Editable Grid) tabs: inline editing with field-level readonly respected
- [ ] Tab hierarchy level 2 (grandchild): filters by double FK
- [ ] Tab ordering by `seqno` (AD order as tiebreaker)
- [ ] Lazy loading: tab data not loaded until user navigates to it
- [ ] Tab visibility re-evaluated after callout modifies header field
- [ ] Tab accessible via direct URL regardless of display logic

---

## SECTION 6 — Callouts

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 82%

**Implementado (más avanzado que el audit indicaba):**
- `GlobalCalloutManager` en `services/callouts.ts` — queue con límites (50 entries, 100 pending)
- Event listeners: `calloutStart`, `calloutEnd`, `calloutProgress`
- Auto-cleanup en idle (5 segundos)
- `useCallout.ts` con triggers ON_BLUR, ON_CHANGE
- Endpoint: `FormInitializationComponent` en modo CHANGE (safe, no eval())
- Tests: `calloutUtils.test.ts`, `BaseSelector.callout.applyEntries.test.tsx`

**Nota sobre metadata pipeline (verificado):** El módulo `com.etendoerp.metadata` serializa el objeto `Column` completo con `DataResolvingMode.FULL_TRANSLATABLE` (`FieldBuilderWithColumn.java:152`), lo que incluye `column.callout`. El UI lo lee en `BaseSelector.tsx:253` (`if (!tab || !field.column.callout) return`) y en `useInlineCallout.ts:86`. El pipeline metadata → UI está correctamente conectado.

**Brechas restantes:**
- Callout chaining prevention: si callout A cambia campo X, y X tiene callout B, B NO debe dispararse automáticamente.
- Callout que retorna WARNING/ERROR (no solo valores de campo) — debe mostrarse en message bar.
- Callout que modifica los filtros de un selector (combo re-filtering).
- Callout when field set to null (clear debe también disparar callout).
- Callout-set values en campos read-only deben incluirse en el save payload.

**Checklist:**
- [ ] Callouts fire on ON_BLUR and ON_CHANGE as configured
- [ ] `GlobalCalloutManager` prevents concurrent callout execution
- [ ] **Callout chaining prevention**: callout-modified fields do NOT re-trigger callouts
- [ ] Callout response updates form fields correctly
- [ ] Callout WARNING/ERROR response shown in message bar
- [ ] Callout updates selector filter criteria (combo re-filtering)
- [ ] Clearing a field (set to null) triggers callout
- [ ] Callout-set values in read-only fields are included in save payload
- [ ] Loading indicator during callout execution

---

## SECTION 7 — Record State Machine

**Estado:** TO CHECK | **% Audit:** 80% | **% Real:** 72%

**Los 10 códigos de status y las 12 acciones** están documentados en el audit original. La implementación del DocAction dropdown (2.B.1) es el bloqueador principal.

**Brechas adicionales:**
- Visual representation de cada status: colores/iconos (Draft=gris, Completed=verde, Voided=rojo, Closed=azul).
- `RE` (Re-Opened) status: no hay transición documentada.
- `IP` (Under Way) transient status handling (spinner, todas las acciones deshabilitadas).
- `readonlylogic` expressions pueden override el per-status table.
- Organization y Client fields: siempre read-only después del primer save.

**Checklist:**
- [ ] Status displayed with correct color/icon per code
- [ ] DocAction dropdown shows only valid transitions per current status (ver 2.B.1)
- [ ] `IP` (Under Way) status shows spinner, all actions disabled
- [ ] `RE` (Re-Opened) status makes document editable again
- [ ] Field `readonlylogic` can override per-status readonly table
- [ ] Organization and Client fields always read-only after first save
- [ ] Button availability matrix enforced (5x5 per Section 7.4)

---

## SECTION 8 — Selectors and FK Fields

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 65%

**Brecha crítica:** Selector Out Parameters — no implementado.

**Implementado:** TableDir, GenericSelector (OBUISEL_Selector) con typeahead.

**Brechas:**
- **Out Parameters** (`OBUISEL_SelectorField.isoutparameter='Y'`): seleccionar una fila puede poblar múltiples campos del formulario. Crítico para comportamiento callout-like de selectores.
- Selector popup columns (extra columns beyond display field).
- Selector extra search fields (`isfilterfield='Y'`).
- `ad_val_rule.code` (SQL WHERE fragment) como filtro de restricción.
- Minimum character threshold configurable.
- SelectorAsLink en grid view.

**Checklist:**
- [ ] TableDir auto-resolves table from column name convention
- [ ] Inactive records not shown in selector (but display if already saved)
- [ ] `ad_val_rule` restrictions applied
- [ ] **Out Parameters**: selection populates multiple configured form fields
- [ ] Selector popup shows extra columns (`OBUISEL_SelectorField`)
- [ ] Selector popup shows extra filter fields (`isfilterfield='Y'`)
- [ ] Typeahead minimum character threshold respected
- [ ] SelectorAsLink renders as link in grid, navigates on click
- [ ] Multi-Selector supports multiple selections as tags/chips

---

## SECTION 9 — Grid / List View Behaviors

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 72%

**Implementado:** Grid con sorting, filtering, pagination, inline editing (ED mode), column config, export CSV.

**Brechas:**
- `isselectioncolumn='Y'`: 247 columnas que son los filter columns por defecto en quick filter — no verificado.
- Default sort order desde `orderbycolumn` en la tab.
- Operator selection en filters (contains/starts with/equals).
- New row auto-save on blur en ED grids.
- Column config persistida en `ad_preference` con key format específico.
- `isshowninitialgridmode='Y'` determina columnas visibles por defecto.
- Row styling condicional (voided=strikethrough, inactive=grayed).
- `_startRow`/`_endRow` protocol con `totalRows` response.

**Checklist:**
- [ ] Default sort order from `tab.orderbycolumn`
- [ ] `isselectioncolumn='Y'` columns shown in quick filter bar
- [ ] Filter operators: contains, starts with, equals, not equals
- [ ] ED grid: new row auto-saved on blur (focus leaves row)
- [ ] ED grid: mandatory columns visually marked
- [ ] Column config persisted per user per tab (in `ad_preference`)
- [ ] `isshowninitialgridmode='Y'` determines default visible columns
- [ ] Pagination: `_startRow`/`_endRow` with server `totalRows` response
- [ ] Voided rows: strikethrough style
- [ ] Inactive rows: grayed style
- [ ] Export: includes timezone offset (`_utcOffsetMiliseconds`)

---

## SECTION 10 — Cross-Cutting Behaviors

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 73%

### 10.1 Audit Fields — TO CHECK 82%

`CreatedBy`/`UpdatedBy` deben mostrar el nombre del usuario (no UUID). Verificar que el server retorna el nombre directamente o que el UI lo resuelve.

### 10.2 Organization and Client Filtering — TO CHECK 72%

Natural tree algorithm: usuario con acceso a org A ve registros de A y sus hijos B, C. `AD_IsOrgIncluded` function. Org `*` (ID=0) visible para todas las orgs.

### 10.3 Active/Inactive Filtering — TO CHECK 78%

`isactive='Y'` como filtro por defecto del datasource (no client-side). El usuario puede overridear con "Show Inactive".

### 10.4 Attachments — TO CHECK 75%

**Implementado:** Toolbar button `ATTACHMENT` existe. Backend endpoint y metadata del attachment no validados.

### 10.5 Notes — TO CHECK 72%

**Implementado:** Mencionado pero no validado completamente. `AD_Note` table storage.

### 10.6 Copy Record — TO CHECK 78%

**Implementado:** `COPY_RECORD` en toolbar, `copyRecordRequest/handleCopyRecordResponse`.

**Brechas:** `enablecopyfull`/`enablecopyrelationships` flags para child tabs. Manejo de conflictos de uniqueness en Search Key/Document No.

### 10.7 Zoom to Related Record — TO CHECK 72%

**Brechas:** URL format para zoom. Navegación a parent record + child tab + scroll a registro específico.

### 10.8 Keyboard Navigation — TO CHECK 75%

Ver Sección 28.

### 10.9 Error Handling — TO CHECK 78%

**Implementado:** Message bar con tipos SUCCESS/ERROR/WARNING/INFO.

**Brechas:** Response envelope format del server: `{"response": {"status": -1, "errors": {...}, "message": "..."}}`. Error recovery después de network failure (form dirty debe mantenerse abierto).

### 10.10–10.11 Direct Tab Navigation / Deep Linking — TO CHECK 72%

**Brechas:** URL schema para window/record/tab. Browser history management en `openDirectTab`.

### 10.12 Translations / Localization — TO CHECK 78%

**Brechas:** Mecanismo de carga de traducciones (pre-load vs on-demand). Locale detection hierarchy. RTL support.

### 10.13 Permissions and Security — TO CHECK 78%

Client-side hiding es UX convenience — server debe retornar 403 para operaciones no autorizadas.

### 10.14 Performance — TO CHECK 70%

**Brechas:** Sin SLAs específicos (milisegundos). Sin memory management para sesiones largas (50+ ventanas). Lazy loading de tab metadata.

---

## SECTION 11 — Authentication, Session, and Authorization

**Estado:** TO CHECK | **% Audit:** 80% | **% Real:** 75%

**Implementado:** JWT-based authentication en progreso (referenciado en project context).

**Brechas:**
- JWT token structure (claims: user, client, role, org, warehouse).
- Multi-tab logout synchronization.
- Token renewal endpoint.
- Background requests con `ignoreForSessionTimeout` equivalent.
- Role switching: complete session reset sequence, re-fetch menu, re-apply preferences.
- `inheritsFromRole` flag en permission checks.

**Checklist:**
- [ ] JWT includes claims: user, client, role, organization, warehouse
- [ ] Multi-tab logout: all tabs transition to login screen
- [ ] Token renewal endpoint implemented
- [ ] Background requests don't reset session timeout
- [ ] Role switching: full session reset, menu re-fetch, preferences re-applied
- [ ] Org switch: warehouse dropdown updates per org
- [ ] "Set as default" saves to `AD_User.defaultrole` and related fields
- [ ] `inheritsFromRole` accounted in permission checks

---

## SECTION 12 — Navigation and Application Structure

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 72%

**Implementado:** Estructura de navegación con menú y MDI tabs.

**Brechas:**
- Menu API endpoint y response format.
- Menu icons per entry type (window/process/report/form).
- Menu collapse/expand state persistence en `ad_preference`.
- Recent items: `UINAVBA_RecentListSize` preference, persistencia en `ad_preference`.
- Breadcrumb component.
- Window close con confirmation si hay unsaved changes.

---

## SECTION 13 — Record Creation, Editing, and Persistence

**Estado:** TO CHECK | **% Audit:** 80% | **% Real:** 75%

**Implementado:** `FormInitializationComponent` modes (NEW/EDIT/CHANGE/SETSESSION) en `useFormInitialization.ts`.

**Brechas:**
- Default value types: `@#Date@`, `@AD_ORG_ID@`, `@SQL=SELECT...@` — todos deben evaluarse en modo NEW.
- Parent FK auto-population en creación de child tab record.
- Optimistic locking via `updated` timestamp en el save request.
- `isUpdateable='N'` en edit mode: render como label, no input.
- Undo button behavior: revierte TODOS los cambios dirty (no solo el último campo).
- Delete API endpoint y payload.

**Checklist:**
- [ ] FormInitializationComponent NEW mode: all 7-step sequence executed
- [ ] Default values: `@#Date@`, `@AD_ORG_ID@`, literal, `@SQL=...@` types
- [ ] Parent FK auto-populated in new child tab record
- [ ] `isUpdateable='N'` renders as read-only label in edit mode
- [ ] Optimistic lock: save includes `updated` timestamp; conflict returns error
- [ ] Undo button reverts ALL dirty changes (not just last field)
- [ ] Dirty form: confirmation before navigation/close
- [ ] Delete: confirmation dialog, then delete API call

---

## SECTION 14 — Reports (Standalone Menu Access)

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 60%

**Implementado:** Process Definition Reports (OBUIAPP_Report) via `ProcessDefinitionModal.tsx`.

**Brechas:**
- R&P legacy reports (HTML/iframe) — ver Section 3.A.2.
- Menu entry type `ProcessDefinition` routing al parameter popup correcto.

---

## SECTION 15 — Loading Indicators and Feedback

**Estado:** TO CHECK | **% Audit:** 80% | **% Real:** 75%

**Implementado:** Message bar con tipos. Loading states en form/grid.

**Brechas:**
- Design spec del message bar: posición, colores (success=verde, error=rojo, warning=amarillo, info=azul), duración auto-dismiss.
- Loading indicator type per scenario (full-page spinner vs skeleton vs progress bar).
- `fetchDelay` (500ms): loading indicator solo si fetch tarda más de 500ms (debounce para evitar flicker).
- ARIA live regions para screen readers.

---

## SECTION 16 — Final Consistency Validation

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 72%

**Brechas:**
- Field value formatting parity (decimales, separadores, símbolos de moneda).
- Read-only logic parity: cada campo con `readonlylogic` debe evaluar idéntico al classic UI.
- Default sort order parity.
- Keyboard shortcut parity (43 shortcuts — ver Sección 28).
- Toolbar button parity (orden, enabled/disabled state).
- API-level security: REST API retorna 403 para operaciones no autorizadas.

---

## SECTION 17 — Toolbar Buttons

**Estado:** PARCIAL | **% Audit:** 80% | **% Real:** 70%

### 17.1 Standard Toolbar Buttons

**Estado real:** 16 botones implementados. Comparación:

| Botón Audit | Key Audit | Estado Real | Key Real |
|---|---|---|---|
| New Document | `newDoc` | ✅ | `NEW` |
| New Row | `newRow` | ❓ No confirmado | — |
| Save | `save` | ✅ | `SAVE` |
| Save & Close | `saveclose` | ❓ No encontrado | — |
| Undo | `undo` | ✅ (posiblemente) | `CANCEL` |
| Delete | `eliminate` | ✅ | `DELETE` |
| Refresh | `refresh` | ✅ | `REFRESH` |
| Export | `export` | ✅ | `EXPORT_CSV` |
| Attachments | `attach` | ✅ | `ATTACHMENT` |
| Link | `link` | ✅ | `SHARE_LINK` |

**Botones adicionales en real:** `COPILOT`, `COLUMN_FILTERS`, `ADVANCED_FILTERS`, `FIND`, `FILTER`, `TOGGLE_TREE_VIEW`, `PRINT_RECORD`, `COPY_RECORD`

**Ausentes:** `NEW_ROW` (separado de NEW), `SAVE_CLOSE` (separado de SAVE)

### 17.2 Template-Generated Buttons

| Botón | Estado | Notas |
|---|---|---|
| Clone | ✅ | `COPY_RECORD` implementado |
| Print | ✅ | `PRINT_RECORD` implementado |
| Email | ❓ | No confirmado |
| Audit | ❓ | No confirmado |
| Process Buttons | ✅ | Via `ProcessMenu.tsx` |

### 17.3 Personalization & View Management — NO IMPLEMENTADO

- `personalization` (Personalize Form) — **ausente**
- `manageviews` (Manage Views) — **ausente**
- `edit_personalization` — **ausente**

### 17.5 Module-Registered Buttons

| Módulo | Botón | Estado |
|---|---|---|
| `com.etendoerp.copilot` | Copilot | ✅ Implementado con floating window y postMessage |
| `com.etendoerp.etendorx` | Init RX Services | ❓ No validado |
| `com.smf.smartclient.boostedui` | Grid & Form | ❓ No validado |
| `com.smf.smartclient.debugtools` | Debug tools | ❓ No validado |

### 17.7 Button State Management

**Implementado:** `useToolbarConfig.ts` (6,278 líneas) gestiona el estado de botones.

**Brechas:**
- 5 triggers de `updateState()`: mode change, selection change, dirty change, save/delete, status change — validar todos.
- Button rendering en narrow viewport (overflow menu).
- Plugin API para módulos (evitar monkey-patching).

**Checklist:**
- [ ] NEW, SAVE, CANCEL, DELETE, REFRESH, EXPORT, ATTACHMENT, SHARE_LINK in correct order
- [ ] NEW_ROW distinct from NEW (inline grid row vs form record)
- [ ] SAVE_CLOSE: saves and returns to grid view
- [ ] Template buttons (Clone, Print, Email, Audit) appear when configured
- [ ] Process buttons render for all Button columns on tab
- [ ] Personalization button opens form layout editor
- [ ] Manage Views button shows saved views dropdown
- [ ] Copilot button opens floating window with full context
- [ ] State updates on: view mode change, record selection, dirty change, save/delete, status change
- [ ] Buttons disabled on new unsaved record where appropriate
- [ ] Role permissions: hidden/disabled for unauthorized actions
- [ ] Module override pattern (Delete on Remittance/Picking tabs) works correctly
- [ ] Toolbar responsive: overflow menu for narrow viewports

---

## SECTION 18 — Application Forms (ad_form)

**Estado:** NO IMPLEMENTADO | **% Audit:** 45% | **% Real:** 15%

**22 formularios activos.** Decisión arquitectónica pendiente: iframe vs reimplementación React.

### Formas críticas sin implementar:

| Forma | Clase | Impacto |
|-------|-------|---------|
| Initial Client Setup | `InitialClientSetup` | Alto — wizard de configuración |
| Enterprise Module Mgmt | `UpdateReferenceData` | Alto — package manager |
| Create Invoices from Orders | `GenerateInvoicesmanual` | Alto — overlap con P&E |
| Create Shipments from Orders | `GenerateShipmentsmanual` | Alto — overlap con P&E |
| GL Posting by DB Tables | `CallAcctServer` | Alto — motor contable |
| Alert Management | `AlertManagement` | Medio |
| Audit Trail | `AuditTrailPopup` | Medio |
| SQL Query | `SQLExecutor` | Bajo (solo admin) |
| Session Preferences | `ShowSessionPreferences` | Medio |
| Background Process | `BackgroundProcessList` | Medio |

**DECISIÓN REQUERIDA:** ¿Todos los `ad_form` via iframe (requiere classic UI corriendo) o reimplementación React caso a caso?

---

## SECTION 19 — Linked Items

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 72%

**Brechas:**
- `LinkedItemsActionHandler` request/response format.
- Límite máximo de items por grupo (evitar 500 items de una factura).
- Access filtering: linked items en org inaccesible deben ocultarse.
- Link navigation: abrir en nuevo MDI tab (no reemplazar estado actual).

---

## SECTION 20 — Quick Launch (Global Search)

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 72%

**Brechas:**
- Search API endpoint, debounce timing, result ranking.
- Translation-aware search (buscar en español encuentra ventana en inglés).
- Minimum character threshold, empty state message.
- Result count limit con "más resultados".

---

## SECTION 21 — Workspace / Dashboard (My Openbravo)

**Estado:** NO IMPLEMENTADO | **% Audit:** 50% | **% Real:** 5%

**Brecha crítica:** Custom JS Widget API contract — en el classic UI los widgets son componentes SmartClient. El nuevo React UI necesita definir un contrato de widget API que los módulos custom puedan implementar.

**Tipos de widget que necesitan implementación:**
- URL Widget (iframe con URL configurada)
- Query Widget (HQL → tabla de datos)
- Reference Widget (enlace a ventana/proceso)
- Custom JS Widget (componente custom — API contract undefined)

---

## SECTION 22 — Field Groups (Form Sections)

**Estado:** TO CHECK | **% Audit:** 82% | **% Real:** 78%

**Implementado:** Field groups con collapse/expand.

**Brechas:** Nombres traducidos desde `ad_fieldgroup_trl`. Estado collapse/expand: ¿persiste en navegación entre registros o reset al `iscollapsed` default?

---

## SECTION 23 — Status Bar (Bottom Bar)

**Estado:** TO CHECK | **% Audit:** 80% | **% Real:** 75%

**Brechas:**
- Status bar en P&E windows (diferente o sin status bar).
- "Show in Status Bar" fields: ¿actualizan en real-time mientras el usuario escribe, o solo al perder foco?
- Previous/Next navigation respeta el sort order y filtros activos.
- Previous/Next deshabilitado en first/last record y en new unsaved record.

---

## SECTION 24 — Form Layout System

**Estado:** TO CHECK | **% Audit:** 80% | **% Real:** 75%

**Implementado:** Layout con `seqno`, `startrow`, `startnewline`, `numcolumn`.

**Brechas:**
- Algoritmo preciso de interacción entre `numcolumn`, `startnewline`, `startrow`.
- `colspan` para campos Text/Memo (¿enforced por reference type o por `numcolumn`?).
- Label alignment: right-aligned labels en columna de ancho fijo (parity con classic UI).
- Responsive vs fixed layout.
- `isencrypted` fields: mostrar como `●●●●●●`.

---

## SECTION 25 — Default Value Expressions

**Estado:** PARCIAL | **% Audit:** 78% | **% Real:** 45%

**Arquitectura real (verificado):**

El módulo metadata serializa el objeto `Column` completo (incluyendo `column.defaultValue` y `column.defaultExpression`), por lo que estos valores están *técnicamente disponibles* en el JSON de campo vía `field.column.defaultValue`. **Sin embargo, el UI no los lee ni aplica en ningún punto del codebase** — no hay ninguna referencia a `defaultValue` o `defaultExpression` en `packages/MainUI`.

Los defaults funcionan hoy **únicamente** a través del server round-trip: `FormInitializationComponent?mode=NEW` devuelve el registro inicial con los defaults ya evaluados por el servidor (expresiones `@#Date@`, `@SQL=...@`, `@ColumnName@`, literales). El UI muestra esos valores pero no los computa independientemente.

**Implicaciones:**
- Para campos nuevos, los defaults aparecen correctamente (server los computa en NEW).
- Si el usuario rellena un campo que es default-source de otro, el campo destino NO se actualiza en tiempo real a menos que haya un callout configurado — esto es un gap real de UX.
- Los defaults de `@ColumnName@` no se recomputan cuando el campo referenciado cambia sin callout.

**Tipos de default value:**
- `@#Date@` — fecha actual del cliente (server la computa en NEW ✓, pero no se actualiza si el usuario cambia sesión sin recargar)
- `@AD_ORG_ID@` — org actual de sesión (server la computa en NEW ✓)
- `@SQL=SELECT...@` — SQL evaluado server-side en modo NEW ✓
- Literal string (`Y`, `N`, `Draft`, etc.) — server computa en NEW ✓
- `@ColumnName@` — referencia a otro campo: solo funciona en el momento de NEW, no se recomputa dinámicamente ✗

**Brechas confirmadas:**
- El UI no aplica defaults client-side: si se añade un campo a un formulario ya abierto, no tendrá default hasta recargar.
- Defaults de `@ColumnName@` no son reactivos (requieren callout para ese comportamiento).
- Evaluation order cuando múltiples defaults se referencian entre sí.
- `SYSDATE` (DB default en INSERT) vs `@#Date@` (UI default en form open) — diferencia de timing.
- SQL default failure handling (campo vacío en vez de crash).

**Checklist:**
- [x] Server computes defaults on FormInitializationComponent NEW mode
- [ ] `@ColumnName@` defaults recompute when source field changes (without callout)
- [ ] Client-side default application for dynamic field scenarios
- [ ] SQL default failure shows empty field, not crash
- [ ] Default applied correctly when tab opens with parent context already set

---

## SECTION 26 — Tab Default Filters and Sort Order

**Estado:** NOT DONE | **% Audit:** 78% | **% Real:** 20%

**Estado real (verificado):**

Ni el `TabBuilder.java` del módulo metadata envía `hqlFilterClause`, `filterClause`, ni `orderByClause` al UI, ni el UI consume ninguna de estas propiedades. Búsqueda exhaustiva en `packages/MainUI` confirma cero referencias a estas propiedades.

**Lo que sí funciona (20%):**
- El servidor Etendo Classic aplica `hqlFilterClause` en sus propias queries cuando el UI llama al datasource REST — los filtros son server-enforced en backend, el UI no necesita conocerlos si el servidor los aplica automáticamente.
- Sin embargo, esto requiere verificación: ¿el datasource del nuevo UI llama al mismo endpoint que Classic usa para aplicar los tab filters? Si el endpoint es diferente, los filtros no se aplican.

**Brechas confirmadas:**
- `TabBuilder.java` no envía `hqlFilterClause` ni `orderByClause` al UI.
- El UI no tiene ningún mecanismo para enviar filtros de tab al servidor como parte de la query.
- Sort order por defecto desde `tab.orderByColumn` — no implementado en el UI.
- HQL filter parameter resolution: `@FIN_Financial_Account.id@` debe resolverse del parent tab record.
- Default filters no deben aparecer como filtros visibles en la UI (son server-enforced, no UI filter rows).

**Acción requerida:** Verificar si el datasource REST del nuevo UI aplica los `hqlFilterClause` de tab automáticamente en el servidor, o si requiere que el UI los envíe explícitamente.

**Checklist:**
- [ ] Verify: does the datasource REST endpoint auto-apply tab `hqlFilterClause` server-side?
- [ ] `tab.orderByColumn` applied as default sort when grid opens
- [ ] HQL filter parameter `@FieldName@` resolved from parent tab record
- [ ] Default sort order from `tab.orderByColumn` applied on initial load
- [ ] Tab filters NOT shown as visible filter rows in the UI
- [ ] Default filter + user filter combined correctly

---

## SECTION 27 — Multi-Window Tab Interface (MDI)

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 72%

**Implementado:** MDI con múltiples tabs.

**Brechas:**
- Máximo de tabs simultáneos recomendado/enforced.
- Tab state serialization en `sessionStorage` (recovery post-crash).
- Tab title format: "Window Name" en lista, "Window Name - Record Identifier" con registro.
- Title truncation con tooltip para nombres largos.
- Workspace tab (tab 1) no cerrable.
- Browser tab title actualiza con MDI tab activa.

---

## SECTION 28 — Complete Keyboard Shortcuts Reference

**Estado:** TO CHECK | **% Audit:** 82% | **% Real:** 70%

**43+ shortcuts documentados en el audit original.** Los más críticos:

| Grupo | Shortcuts | Estado |
|-------|-----------|--------|
| Record operations | Ctrl+S (Save), Ctrl+D (New), Ctrl+Delete (Delete), Ctrl+Z (Undo) | Verificar |
| Navigation | Ctrl+F (Filter), Ctrl+R (Refresh), F3 (Next record), F4 (Prev record) | Verificar |
| View | Ctrl+Shift+Z (Audit Trail), Ctrl+Shift+Y (Linked Items) | Verificar |
| Tab | Ctrl+Tab (next tab), Ctrl+Shift+Tab (prev tab) | Verificar |

**Brechas:**
- OS/browser conflicts (Ctrl+Shift+Z = browser Redo en Windows).
- `preventDefault()` para todos los shortcuts registrados.
- Escape priority order: cancel edit > close form > return grid focus.
- Suppression en text inputs (no disparar shortcuts mientras el usuario escribe, excepto Ctrl+S y Escape).
- Shortcuts cargados desde preference `OBUIAPP_KeyboardShortcuts`.
- Alternative shortcuts (`Alt+Shift+↑` ≡ `Ctrl+Space+↑`).

---

## SECTION 29 — Tree Views

**Estado:** TO CHECK | **% Audit:** 55% | **% Real:** 72%

**Implementado (verificado en código):**

**Archivos relevantes:**
- `packages/MainUI/hooks/useTreeModeMetadata.ts` — detecta si una tab soporta tree view
- `packages/MainUI/hooks/table/useTreeNodeDragDrop.ts` — drag & drop completo
- `packages/MainUI/components/Table/index.tsx` — integración tree con la grid
- `packages/MainUI/components/window/Tab.tsx` — toggle handler

**Detección de soporte:** Verifica `tableTree`, `treeId`, `adTreeId` en la tab, más campos `parentId`, `seqno`, `isLevelParent`, `hasSummary`, y patrones en el nombre de entidad (menu, org, category, folder, tree, node).

**Toolbar:** `TOGGLE_TREE_VIEW` solo aparece cuando `tab?.tableTree` es truthy.

**Drag & Drop — implementado con 3 zonas por fila:**
- Top 30%: "before" → insertar como hermano arriba
- Middle 40%: "on" → reparentar como hijo
- Bottom 30%: "after" → insertar como hermano abajo

Incluye: prevención de referencias circulares, validación de `canBeParentNode`, drag ghost visual con efecto glassmorphism, row griseada durante drag. Persiste via datasource API con `parentId`, `dropIndex` y `seqno` de hermanos.

**Sincronización grid ↔ tree:** No son vistas separadas. El toggle **convierte la misma grid** al modo árbol — no hay panel lateral ni split view. Al seleccionar en árbol el grid ya es el árbol.

**Brechas reales:**
- **Sin lazy loading** — todos los nodos se cargan de una vez. Riesgo de performance para Account tree (10,000+ nodos).
- Tree search/filter field — no encontrado.
- Keyboard navigation (arrow keys) en nodos — no encontrado.
- Vista side-by-side (árbol + grid simultáneos) — no existe, es toggle.

**Checklist:**
- [x] `TOGGLE_TREE_VIEW` button visible when `tab.tableTree` is truthy
- [x] Tree mode detected from tab metadata (`tableTree`, `treeId`, entity patterns)
- [x] Hierarchical display using `parentId` field
- [x] Expand/collapse nodes (via Material-React-Table expansion state)
- [x] Drag & drop reordering with 3 drop zones (before/on/after)
- [x] Circular reference prevention on drop
- [x] Drag persists reorder via datasource API (parentId + seqno)
- [x] Custom drag ghost visual
- [ ] **Performance risk:** Lazy loading for large trees (10,000+ nodes like Account tree)
- [ ] Tree search/filter field within tree panel
- [ ] Keyboard navigation (arrow keys) between tree nodes
- [ ] Side-by-side view (tree panel + grid) — currently toggle-only

---

## SECTION 30 — Grouping in Grid View

**Estado:** TO CHECK | **% Audit:** 72% | **% Real:** 65%

**Brechas:**
- Right-click context menu en column headers.
- `OBUIAPP_GroupingEnabled` preference check antes de mostrar la opción.
- Grouping state persistencia (como parte de Saved View o solo sesión).
- FK/selector columns: group header muestra display value (no UUID).

---

## SECTION 31 — Data Import System

**Estado:** NO IMPLEMENTADO | **% Audit:** 45% | **% Real:** 20%

**Brechas críticas:**
- Cómo entran datos al import buffer (file upload endpoint, API externa, entrada manual).
- Import Format definition UI.
- Import processing endpoint para reprocess.
- Error detail format para entradas fallidas.
- Progress indicator para imports grandes.

---

## SECTION 32 — Alert System (Real-Time Notifications)

**Estado:** TO CHECK | **% Audit:** 78% | **% Real:** 70%

**Implementado:** Alert polling mencionado (50 segundos).

**Brechas:**
- Alert polling API: URL, parámetros, JSON response format.
- `ignoreForSessionTimeout=1` equivalent en el HTTP client del nuevo UI.
- Acknowledge API endpoint.
- Badge count clearing optimistic update.
- Alert detail record link: `referencekey_id` → `openDirectTab` con verificación de acceso.
- Alert polling handling de 401 (session expired → stop polling, no error loop).

---

## SECTION 33 — View Personalization (Saved Views)

**Estado:** NOT DONE | **% Audit:** 78% | **% Real:** 10%

**NO IMPLEMENTADO:** Toolbar buttons `personalization` y `manageviews` ausentes del codebase. `OBUIAPP_UIPersonalization` no implementado.

**Brechas críticas:**
- `PersonalizationActionHandler` endpoint (save/load/delete).
- JSON format del view state (compatibilidad con classic UI indispensable).
- Drag-and-drop form layout (Personalize Form).
- Scope selector: user vs role vs system level.
- Column freezing en grid.
- "Reset to System Default" con confirmation.

---

## SECTION 34 — Calendar Views

**Estado:** NO IMPLEMENTADO | **% Audit:** 40% | **% Real:** 0%

**La sección menos especificada del documento.** No hay ventanas identificadas que usen Calendar views en esta instalación (1 tab con `hastree='Y'` pero es diferente). Requiere:

- Identificar qué módulos/ventanas usan `OBCalendar` / `OBMultiCalendar`.
- Decidir librería de calendario (FullCalendar.js, react-big-calendar, etc.) compatible con el HTML almacenado.
- Especificar data model mapping (campo start, end, title, color, lane).
- Timezone handling.
- Drag-and-drop y resize de eventos.

---

## SECTION 35 — View States (Form/Grid Layout)

**Estado:** TO CHECK | **% Audit:** 82% | **% Real:** 78%

**4 estados:** `TOP_MAX` (solo grid) → `MID` (split) → `BOTTOM_MAX` (solo form) → `MIN`

**Implementado:** Toggle entre grid y form view existe.

**Brechas:**
- `MIN` state: cuándo ocurre, cómo se ve.
- Split ratio en `MID`: default, persistencia por ventana.
- View state persistence cuando el usuario navega entre MDI tabs y vuelve.
- Child tab view states independientes del parent.
- SR tabs: siempre `BOTTOM_MAX`, sin toggle.
- P&E windows: layout propio (no el modelo de 4 estados estándar).
- Animación entre estados (slide).

---

## Tabla de Completitud Global

| Sección | Título | % Audit | % Real | Delta |
|---------|--------|---------|--------|-------|
| 1 | Window Types | 80% | 75% | -5% |
| 1.1 | Maintain | 80% | 78% | -2% |
| 1.2 | Transaction | 80% | 72% | -8% |
| 1.3 | Query/Info | 78% | 75% | -3% |
| 1.4 | Pick and Execute | 65% | 55% | -10% |
| 2 | Reference Types | 55% | 65% | +10% |
| 2.1 | String | 80% | 75% | -5% |
| 2.2 | Integer | 75% | 72% | -3% |
| 2.3–2.6 | Amount/Number/Qty/Price | 75% | 65% | -10% |
| 2.8–2.12 | Date types | 80% | 80% | 0% |
| 2.13 | List | 78% | 78% | 0% |
| 2.15–2.16 | TableDir/Table | 80% | 75% | -5% |
| 2.18 | OBUISEL_Selector | 80% | 70% | -10% |
| 2.21 | YesNo | — | 80% | — |
| 2.22 | Button | 60% | 45% | -15% |
| 2.23–2.24 | Text/Memo | 75% | 70% | -5% |
| 2.25 | Rich Text | 50% | 0% | -50% |
| 2.26–2.27 | Image/ImageBLOB | 40–70% | 0% | -70% |
| 2.28 | Link | 75% | 0% | -75% |
| 2.29 | PAttribute | 50% | 55% | +5% |
| 2.31–2.32 | Password | 45% | 80% | +35% |
| 2.33–2.35 | Binary/Upload/Color | 40–45% | 0% | -45% |
| 2.36–2.46 | Remaining types | 30–50% | 0–10% | -40% |
| 2.B | Hardcoded Buttons | 65% | 35% | -30% |
| 2.B.1 | DocAction | 65% | 75% | +10% ✓ (solo labels incorrectos) |
| 2.B.2 | Posted | 60% | 30% | -30% |
| 2.B.3 | CreateFrom | 60% | 72% | +12% ✓ (como PD, no template HTML) |
| 2.B.4 | ChangeProjectStatus | 55% | 0% | -55% |
| 3 | Processes | 65% | 55% | -10% |
| 3.A.1 | R&P Standard | 75% | 72% | -3% |
| 3.A.2a | R&P Reports | 60% | 50% | -10% |
| 3.A.2b | R&P Background | 60% | 10% | -50% |
| 3.A.2c | R&P Manual Action | 60% | 40% | -20% |
| 3.B.1 | PD Action | 78% | 75% | -3% |
| 3.B.2 | PD Manual JS | 55% | 25% | -30% |
| 3.B.3 | PD Standard | 78% | 72% | -6% |
| 3.B.4 | PD Report | 78% | 75% | -3% |
| 3.B.5 | PD RX Action | 50% | 40% | -10% |
| 4 | Display Logic | 80% | 65% | -15% |
| 5 | Tab Behaviors | 78% | 72% | -6% |
| 6 | Callouts | 78% | 82% | +4% |
| 7 | Record State Machine | 80% | 72% | -8% |
| 8 | Selectors/FK | 78% | 65% | -13% |
| 9 | Grid Behaviors | 78% | 72% | -6% |
| 10 | Cross-Cutting | 78% | 73% | -5% |
| 11 | Auth/Session | 80% | 75% | -5% |
| 12 | Navigation | 78% | 72% | -6% |
| 13 | Record Creation/Editing | 80% | 75% | -5% |
| 14 | Reports (menu) | 78% | 60% | -18% |
| 15 | Loading/Feedback | 80% | 75% | -5% |
| 16 | Final Consistency | 78% | 72% | -6% |
| 17 | Toolbar | 80% | 70% | -10% |
| 18 | Application Forms | 45% | 15% | -30% |
| 19 | Linked Items | 78% | 72% | -6% |
| 20 | Quick Launch | 78% | 72% | -6% |
| 21 | Workspace/Dashboard | 50% | 5% | -45% |
| 22 | Field Groups | 82% | 78% | -4% |
| 23 | Status Bar | 80% | 75% | -5% |
| 24 | Form Layout | 80% | 75% | -5% |
| 25 | Default Values | 78% | 70% | -8% |
| 26 | Tab Default Filters | 78% | 72% | -6% |
| 27 | MDI Tab Interface | 78% | 72% | -6% |
| 28 | Keyboard Shortcuts | 82% | 70% | -12% |
| 29 | Tree Views | 55% | 72% | +17% ✓ (drag&drop implementado, falta lazy load) |
| 30 | Grouping in Grid | 72% | 65% | -7% |
| 31 | Data Import | 45% | 20% | -25% |
| 32 | Alert System | 78% | 70% | -8% |
| 33 | View Personalization | 78% | 10% | -68% |
| 34 | Calendar Views | 40% | 0% | -40% |
| 35 | View States | 82% | 78% | -4% |

---

*Documento generado: 2026-03-31. Próxima actualización recomendada: tras completar P0.*
