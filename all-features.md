> Generated from live Application Dictionary data (core + all installed modules).
> Use this checklist to validate that a new frontend interface behaves identically to the classic Etendo UI.

---

## SECTION 1 — Window Types

Etendo defines four window types in the Application Dictionary (`ad_window.windowtype`):

| Code | Name | Count in this instance |
|------|------|----------------------|
| `M` | Maintain | 288 |
| `T` | Transaction | 47 |
| `Q` | Query / Info | 12 |
| `OBUIAPP_PickAndExecute` | Pick and Execute | 59 |

### 1.1 Maintain (M)

**What it is:** The standard CRUD window for master data. No document workflow — records are simply created, edited, and deleted. This is by far the most common window type.

**When used:** Configuration, catalogs, master data (products, business partners, roles, etc.).

**Unique behaviors:**
- No document status bar or action buttons (Complete, Void, etc.)
- Records can be freely edited and deleted at any time (unless access rules restrict it)
- Tabs follow parent-child hierarchy; no document lifecycle constraints on child tabs
- Copy Record should work on header and child tabs

**Real examples:**
- **Business Partner** — multi-tab master data with Customer/Vendor/Employee sub-tabs
- **Product** — complex window with pricing, BOM, accounting sub-tabs
- **Role** — security configuration with access sub-tabs
- **Windows, Tabs, and Fields** — the AD meta-window itself

**Checklist:**
- [ ] New record creation works (toolbar button + keyboard shortcut)
- [ ] Edit and save works on all editable fields
- [ ] Delete record works (with confirmation dialog)
- [ ] Copy Record creates a faithful duplicate
- [ ] Tab navigation works (parent → child → grandchild)
- [ ] Grid/list view shows correct columns
- [ ] Filtering and sorting work in grid view
- [ ] Mandatory fields are enforced on save
- [ ] Organization/Client filtering applied correctly
- [ ] Active flag toggle works and filters correctly
- [ ] Audit fields (Created, Updated, CreatedBy, UpdatedBy) display correctly and are read-only
- [ ] Attachments can be added/removed
- [ ] Notes can be added/viewed

### 1.2 Transaction (T)

**What it is:** Document-driven windows with a lifecycle state machine (Draft → Booked/Completed → Voided/Closed). These represent business transactions.

**When used:** Orders, invoices, shipments, payments, journals — any document that goes through a process workflow.

**Unique behaviors:**
- **Document status bar** showing current status (Draft, Completed, etc.)
- **Process button** (gear icon or "Complete" button) to advance document state
- Fields become **read-only after processing** (Completed/Booked state)
- **Document numbering** via sequences (auto-assigned on save or completion)
- **Undo / Reactivate** may be available depending on document type
- Lines tab typically becomes read-only after header is processed
- **Accounting** tab appears after posting

**Real examples:**
- **Sales Order** — full lifecycle: Draft → Booked → Closed/Voided; 12 tabs including Lines, Tax, Payment Plan, Reserved Stock
- **Purchase Invoice** — Draft → Completed → Posted; includes payment plan
- **Goods Shipment** — Draft → Completed; generates inventory movements
- **Payment In / Payment Out** — financial transaction documents
- **G/L Journal** — accounting journal entries
- **Physical Inventory** — inventory count documents

**Checklist:**
- [ ] Document creates in Draft status by default
- [ ] Document number assigned correctly (per Document Type sequence)
- [ ] Process button appears and is functional
- [ ] "Complete" action transitions to correct status
- [ ] Fields become read-only after completion
- [ ] Lines cannot be added/edited/deleted after completion
- [ ] "Reactivate" returns document to Draft (where allowed)
- [ ] "Void" marks document as voided and creates reversal (where applicable)
- [ ] "Close" closes the document permanently
- [ ] Accounting tab appears after posting
- [ ] Undo posting works (where allowed)
- [ ] Document type selector works and affects numbering
- [ ] Copy document works (creates new draft copy)
- [ ] Status bar displays correct status with appropriate color/icon
- [ ] Button availability changes per document status (see Section 7)
- [ ] Print button generates the associated report/document

### 1.3 Query / Info (Q)

**What it is:** Read-only inquiry windows that display aggregated or cross-referenced data. Users cannot create, edit, or delete records.

**When used:** Lookup windows, transaction detail views, matching views, log viewers.

**Unique behaviors:**
- All fields are **read-only**
- No New/Save/Delete buttons in toolbar
- Often used as popup selectors or inquiry screens
- May have "zoom" links to navigate to the source transaction window
- Typically no child tabs (flat view)

**Real examples:**
- **Accounting Transaction Details** — shows posted accounting entries with dimension filters
- **Business Partner Info** — read-only view with sub-tabs: Partner Selection, Invoices, Orders, Shipments, Assets
- **Goods Transaction** — inventory movement history
- **Account Combination** — chart of accounts lookup
- **Matched Purchase Invoices / Orders** — matching views
- **Job Result** — async process execution results

**Checklist:**
- [ ] All fields display as read-only (no edit capability)
- [ ] New/Save/Delete toolbar buttons are hidden or disabled
- [ ] Filtering works correctly on all filterable columns
- [ ] Sorting works on all sortable columns
- [ ] Zoom links navigate to correct source windows
- [ ] Export to CSV/Excel works
- [ ] Pagination works for large datasets
- [ ] Sub-tabs (if any) are also read-only

### 1.4 Pick and Execute (OBUIAPP_PickAndExecute)

**What it is:** A specialized window type that presents a filterable grid of records from which the user selects one or more rows and then executes a process on the selection.

**When used:** Bulk operations — creating invoices from orders, adding payments, picking goods for shipment, matching transactions, etc.

**Unique behaviors:**
- **Two-phase UI**: Filter/Select phase → Execute phase
- Header section with filter parameters
- Grid with **checkboxes** for multi-row selection
- "Select All" / "Deselect All" functionality
- **Process button** (usually "Done" or "OK") executes the operation on selected rows
- Often opened from another window's toolbar or process button
- May have inline-editable fields in the grid (e.g., quantities to pick)
- Results refresh or redirect after execution

**Real examples:**
- **Create Invoices From Orders** — select orders → generate invoices
- **PickEditGoodsShipment** — select order lines → create shipment lines
- **Add Multiple Payments P&E** — add payments with multi-currency support
- **Match Statement P&E** — match bank statement lines to payments
- **Copy from Orders P&E** — copy order lines to invoice
- **Log Management** — select and purge log entries
- **Reservation Pick and Edit** — manage stock reservations
- **Sales Invoice** (P&E variant) — pick lines for invoicing

**Checklist:**
- [ ] Filter parameters load correctly and filter the grid
- [ ] Grid displays with selection checkboxes
- [ ] Individual row selection works
- [ ] Select All / Deselect All works
- [ ] Inline-editable fields (if any) can be modified
- [ ] Process/Execute button runs the action on selected rows
- [ ] Proper feedback message after execution (success/error count)
- [ ] Grid refreshes or window redirects after execution
- [ ] Empty selection shows appropriate warning
- [ ] Large datasets paginate correctly
- [ ] Filter persistence works within the session

---

## SECTION 2 — Field / Column Reference Types

Every column in the AD has a reference type that determines how it renders and validates. The following reference types exist in this installation (46 base types, queried from `ad_reference`):

### 2.1 String (ID: 10)

**UI behavior:** Single-line text input field. Length constrained by `fieldlength` on the column.

**Real example:** `Search Key` field in **Product** window, **Business Partner** window.

**Edge cases:**
- Empty value on mandatory String field must show validation error
- Max length enforcement (character count, not byte count)
- Leading/trailing whitespace handling
- Special characters (quotes, angle brackets, Unicode)
- Read-only mode shows as plain text label

**Checklist:**
- [ ] Renders as single-line text input
- [ ] Max length enforced (no typing beyond limit)
- [ ] Mandatory validation on save
- [ ] Read-only renders as text label
- [ ] Copy/paste works correctly
- [ ] Special characters preserved on save

### 2.2 Integer (ID: 11)

**UI behavior:** Numeric input accepting only whole numbers. No decimal separator. Right-aligned.

**Real example:** `Line No.` in **Sales Order** > Lines tab; `Sequence Number` in many tabs.

**Edge cases:**
- Negative values (allowed unless `valuemin` set)
- Zero vs empty (null)
- Very large numbers
- Non-numeric input rejected

**Checklist:**
- [ ] Only accepts digits and minus sign
- [ ] Decimal input rejected
- [ ] Right-aligned display
- [ ] Min/max validation if defined
- [ ] Null vs 0 distinction preserved

### 2.3 Amount (ID: 12)

**UI behavior:** Numeric input with decimal places formatted per currency precision. Right-aligned. Displays currency symbol when contextually relevant.

**Real example:** `Grand Total Amount` in **Sales Invoice**; `Credit Limit` in **Business Partner**; `Asset Value` in **Assets**.

**Edge cases:**
- Currency precision (2 decimals for EUR/USD, 0 for JPY, etc.)
- Negative amounts
- Rounding behavior
- Large amounts (millions) with thousand separators
- Empty vs zero

**Checklist:**
- [ ] Decimal places match currency precision
- [ ] Thousand separators display correctly per locale
- [ ] Negative values shown with minus or parentheses per config
- [ ] Right-aligned
- [ ] Read-only shows formatted value
- [ ] Callout-driven recalculations (e.g., line amount → total)

### 2.4 Number (ID: 22)

**UI behavior:** Generic numeric field with decimal support. No currency context. Right-aligned.

**Real example:** `Discount %` in Sales Order Lines; `Weight` in Product.

**Edge cases:**
- Precision varies (not tied to currency)
- Very small decimals (0.0001)
- Scientific notation not expected

**Checklist:**
- [ ] Accepts decimals
- [ ] Right-aligned
- [ ] No currency symbol
- [ ] Min/max validation if defined

### 2.5 Quantity (ID: 29)

**UI behavior:** Numeric input for quantities. Decimal places per UOM precision. Right-aligned.

**Real example:** `Ordered Quantity` in **Sales Order** > Lines; `Movement Quantity` in **Goods Shipment** > Lines.

**Edge cases:**
- UOM-specific precision (kg: 3 decimals, units: 0)
- Negative quantities (returns)
- Zero quantity validation

**Checklist:**
- [ ] Decimal precision follows UOM settings
- [ ] Right-aligned
- [ ] Negative allowed for returns
- [ ] Callouts fire on change (recalculate totals)

### 2.6 Price (ID: 800008)

**UI behavior:** Numeric input for prices. Higher precision than Amount (typically 4+ decimals). Right-aligned.

**Real example:** `Unit Price` in **Sales Order** > Lines; `List Price` in **Price List**.

**Checklist:**
- [ ] Higher decimal precision than Amount
- [ ] Right-aligned
- [ ] Callouts fire to recalculate line amounts

### 2.7 General Quantity (ID: 800019)

**UI behavior:** Like Quantity but with standard precision. Used for non-UOM quantities.

**Real example:** Various computed quantity fields.

**Checklist:**
- [ ] Numeric with decimals
- [ ] Right-aligned

### 2.8 Date (ID: 15)

**UI behavior:** Date picker widget. Displays in user's date format (dd/MM/yyyy, MM/dd/yyyy, etc.). No time component.

**Real example:** `Order Date` in **Sales Order**; `Invoice Date` in **Purchase Invoice**.

**Edge cases:**
- Date format per user locale
- Calendar popup navigation (month/year switching)
- Manual keyboard entry
- Invalid dates (Feb 30)
- Empty date on mandatory field

**Checklist:**
- [ ] Date picker popup opens on click/icon
- [ ] Format matches user locale setting
- [ ] Manual entry accepted and parsed correctly
- [ ] Today button works
- [ ] Calendar navigation (month/year) works
- [ ] Read-only displays formatted date text
- [ ] Date range filters work in grid view

### 2.9 DateTime (ID: 16)

**UI behavior:** Date picker with time component (HH:mm:ss). Stores with timezone.

**Real example:** `Creation Date` audit field on all records; `Updated` audit field.

**Edge cases:**
- Timezone conversion (server vs client)
- Seconds precision
- Sorting by datetime

**Checklist:**
- [ ] Date picker includes time selector
- [ ] Time component displays correctly
- [ ] Timezone handling consistent
- [ ] Sorting works chronologically

### 2.10 Absolute DateTime (ID: 478169542A...)

**UI behavior:** DateTime stored without timezone conversion. Displayed as-is regardless of user timezone.

**Real example:** `Creation Date` in **Create Invoice Lines From Order Lines** P&E; `Document date` in **Inventory Amount Update**.

**Checklist:**
- [ ] No timezone conversion applied
- [ ] Displays identically for all users regardless of timezone

### 2.11 Time (ID: 24)

**UI behavior:** Time-only input (HH:mm:ss), no date component.

**Real example:** Time fields in scheduling contexts.

**Checklist:**
- [ ] Time picker or input
- [ ] No date component shown

### 2.12 Absolute Time (ID: 20D7C424C2...)

**UI behavior:** Time-only field without timezone conversion.

**Real example:** `Startingtime` / `Endingtime` fields in **Discounts and Promotions** (per-day time ranges: Monday start/end, Tuesday start/end, etc.).

**Checklist:**
- [ ] Time-only display
- [ ] No timezone conversion
- [ ] Correct sort order

### 2.13 List (ID: 17)

**UI behavior:** Dropdown selector populated from `ad_ref_list` values associated with a sub-reference. Single selection.

**Real example:** `Payment Rule` in **Sales Order** (Cash, Credit, Wire Transfer, etc.); `Document Status` (Draft, Completed, Voided).

**Edge cases:**
- Empty/blank option if not mandatory
- Inactive list values hidden
- Display value vs stored value
- Translation of list values

**Checklist:**
- [ ] Dropdown renders with all active list values
- [ ] Correct value selected on load
- [ ] Empty option shown for non-mandatory fields
- [ ] Inactive values not shown in dropdown
- [ ] Previously-selected now-inactive values display correctly (show but grayed)
- [ ] Display logic triggered by list selection works
- [ ] Callouts fire on selection change

### 2.14 Button List (ID: FF808181...)

**UI behavior:** Renders as a row of buttons/toggle group instead of a dropdown. Same data source as List (ad_ref_list) but different visual representation.

**Real example:** Toggle-style selectors for mode selection.

**Checklist:**
- [ ] Renders as button group, not dropdown
- [ ] Exactly one value selected at a time
- [ ] Visual feedback for selected state
- [ ] Read-only disables all buttons

### 2.15 TableDir (ID: 19)

**UI behavior:** Dropdown selector auto-populated from a referenced table. The column name convention determines the table (e.g., `C_BPartner_ID` references `C_BPartner`). Shows the record identifier.

**Real example:** `Organization` dropdown on virtually every record; `Warehouse` in **Sales Order**; `Currency` in **Price List**.

**Edge cases:**
- Large datasets need filtering/search within dropdown
- Inactive records filtered out
- Organization-filtered subset
- Null option for non-mandatory
- Validation rule further restricts options

**Checklist:**
- [ ] Dropdown populated from correct table
- [ ] Only active records shown
- [ ] Organization filter applied
- [ ] Record identifier displayed (not UUID)
- [ ] Validation rules respected (if defined)
- [ ] Search/filter within large dropdowns
- [ ] Callouts fire on change

### 2.16 Table (ID: 18)

**UI behavior:** Like TableDir but with explicit table/column configuration in the AD (not derived from column name convention). Allows referencing non-standard columns.

**Real example:** Various configuration fields where the FK name doesn't follow the convention.

**Checklist:**
- [ ] Same visual as TableDir (dropdown)
- [ ] Populated from explicitly configured table and key/display columns
- [ ] Validation rules applied

### 2.17 Search (ID: 30)

**UI behavior:** Text input with a search icon (magnifying glass). Clicking the icon opens a popup search dialog to find and select a record from the referenced table.

**Real example:** `Resource Assignment` field in **Sales Order** > Lines; **Expense Sheet** > Lines.

**Edge cases:**
- Popup search dialog filters and columns
- Direct ID entry in the text field
- Selected value display (identifier)
- Clearing the selection

**Checklist:**
- [ ] Text field with search icon
- [ ] Search popup opens on icon click
- [ ] Popup shows correct filterable columns
- [ ] Selection populates the field
- [ ] Clear/remove selection works
- [ ] Direct keyboard entry validates against table

### 2.18 OBUISEL_Selector Reference (ID: 95E2A8B5...)

**UI behavior:** Modern selector widget. Typeahead/autocomplete dropdown that queries the server as the user types. Configured via `OBUISEL_Selector` definition with custom HQL and displayed columns.

**Real example:** `Product` selector in **Sales Order** > Lines; `Business Partner` in **Payment In**; `Asset` in **Amortization**; `Warehouse` in **Advanced Warehouse Configuration**.

**Edge cases:**
- Typeahead search latency
- Minimum characters before search triggers
- Custom HQL filters (e.g., only products in certain category)
- Multiple display columns in dropdown
- Clearing selection
- Out-of-filter value already saved

**Checklist:**
- [ ] Typeahead triggers after configured character count
- [ ] Dropdown shows configured columns
- [ ] HQL filter restrictions applied
- [ ] Selection populates correct value
- [ ] Clear works
- [ ] Existing out-of-filter values display correctly
- [ ] Performance acceptable with large datasets

### 2.19 OBUISEL_Multi Selector Reference (ID: 87E6CFF8...)

**UI behavior:** Like Selector but allows multiple values. Typically renders as a tag/chip input.

**Real example:** Multi-select fields for assigning multiple related records.

**Checklist:**
- [ ] Multiple values can be selected
- [ ] Each selection appears as tag/chip
- [ ] Individual tags can be removed
- [ ] All selected values saved correctly
- [ ] Typeahead works for adding new selections

### 2.20 OBUISEL_SelectorAsLink Reference (ID: 80B16307...)

**UI behavior:** Displays the selected value as a clickable link that zooms to the referenced record's window.

**Real example:** `Triggered by Group` in **Process Request**.

**Checklist:**
- [ ] Value displays as clickable link
- [ ] Clicking navigates to the referenced record
- [ ] When editable, still allows changing the selection

### 2.21 YesNo (ID: 20)

**UI behavior:** Checkbox. Stored as 'Y'/'N' in the database.

**Real example:** `Active` flag on every record; `Is Sales Transaction` in **Sales Order**; `Stocked` in **Product**.

**Edge cases:**
- Default value (Y or N)
- Read-only checkbox (displayed but not clickable)
- Display logic dependent on checkbox state

**Checklist:**
- [ ] Renders as checkbox
- [ ] Checked = Y, Unchecked = N
- [ ] Default value applied on new record
- [ ] Read-only shows disabled checkbox (not hidden)
- [ ] Callouts fire on toggle
- [ ] Display logic re-evaluates on toggle

### 2.22 Button (ID: 28)

**UI behavior:** Renders as a clickable button within the form. Associated with a process (ad_process) that executes on click. Often used for document actions.

**Real example:** `Document Action` button (Complete/Reactivate/Void) in transaction windows; `Post` button for accounting.

**Edge cases:**
- Button enabled/disabled per document status
- Button label changes per context (shows "Complete" when draft, "Reactivate" when completed)
- Confirmation dialog before execution
- Process with parameters shows popup

**Checklist:**
- [ ] Button renders with correct label
- [ ] Enabled/disabled state matches document status
- [ ] Click triggers associated process
- [ ] Parameter popup shown (if process has params)
- [ ] Success/error feedback displayed
- [ ] Form refreshes after process execution

### 2.23 Text (ID: 14)

**UI behavior:** Multi-line text area. Renders as a larger input compared to String.

**Real example:** `Description` fields, `Note` fields across many windows.

**Checklist:**
- [ ] Renders as multi-line textarea
- [ ] Resizable (or auto-expanding)
- [ ] No length limit or large limit
- [ ] Line breaks preserved
- [ ] Read-only displays as text block

### 2.24 Memo (ID: 34)

**UI behavior:** Large text area, similar to Text but typically used for even longer content.

**Real example:** `Description` in **Accounting Process**; `SQL` in **Alert** > Alert Rule; `Default Value` in **Report and Process** > Parameter; `SQL_Record_Identifier` in **Tables and Columns**.

**Checklist:**
- [ ] Large text area
- [ ] Preserves formatting/whitespace
- [ ] Scrollable for long content

### 2.25 Rich Text Area (ID: 7CB371C1...)

**UI behavior:** WYSIWYG HTML editor with formatting toolbar (bold, italic, lists, links, etc.).

**Real example:** `Graph Img` in **Agent** > Agent Header; Content fields in agent/memory contexts.

**Checklist:**
- [ ] WYSIWYG editor renders with toolbar
- [ ] Bold, italic, underline, lists work
- [ ] HTML stored correctly
- [ ] Read-only renders as formatted HTML
- [ ] Paste from external source sanitized

### 2.26 Image (ID: 32)

**UI behavior:** Displays an image referenced by ID from `ad_image` table. Upload/select interface.

**Real example:** Various image reference fields.

**Checklist:**
- [ ] Image preview displayed
- [ ] Upload new image works
- [ ] Remove image works
- [ ] Supported formats (PNG, JPG, GIF)

### 2.27 Image BLOB (ID: 4AA6C3BE...)

**UI behavior:** Image stored directly as binary (BLOB) in the database column. Upload interface with preview.

**Real example:** `Image` in **Product**; `Image` in **Business Partner** > Contact; `Your Company Logo` images in **Client** > Information; `Image` in **Product Category**.

**Checklist:**
- [ ] Image preview displayed inline
- [ ] Upload dialog for new image
- [ ] Clear/remove image
- [ ] File size limits enforced
- [ ] Multiple image formats supported

### 2.28 Link (ID: 800101)

**UI behavior:** Renders as a clickable hyperlink. Stored as URL string. Click opens in new tab.

**Real example:** `URL` in **Business Partner** (Customer/Vendor tabs); `Jira Url` in **Bag Hours** > Issue; `Your Company URL` in **System Info**.

**Checklist:**
- [ ] Renders as clickable link in read mode
- [ ] Editable as text input in edit mode
- [ ] Click opens URL in new browser tab
- [ ] URL validation on save

### 2.29 PAttribute (ID: 35)

**UI behavior:** Opens a popup to select product attribute set instance values (lot, serial, expiry, custom attributes).

**Real example:** `Attribute Set Value` in **Sales Order** > Lines; inventory-related fields.

**Checklist:**
- [ ] Button/icon opens attribute popup
- [ ] Popup shows correct attributes for the product's attribute set
- [ ] Lot, serial number, expiry date fields render correctly
- [ ] Selected instance saved and displayed
- [ ] Works differently for instance vs non-instance attributes

### 2.30 ID (ID: 13)

**UI behavior:** Hidden field. Stores the UUID primary key. Never displayed to the user in form view but used internally.

**Checklist:**
- [ ] Not visible in form view
- [ ] Used correctly for internal record identification
- [ ] Properly handled in URL parameters for direct record access

### 2.31 Password — decryptable (ID: 16EC6DF4...)

**UI behavior:** Masked input field (dots/asterisks). Value can be decrypted by the system for use.

**Real example:** `Email Server Password` in **Business Partner** > Contact; `Smtp Server Password` in **Client** > Email Configuration; `Token` in **Copilot API Tokens**; `Certificate Pass` in **Configuración TBAI**.

**Checklist:**
- [ ] Input masked on screen
- [ ] Value not exposed in page source / network requests
- [ ] Copy to clipboard prevented or warned
- [ ] Saved value encrypted in database

### 2.32 Password — not decryptable (ID: C5C21C28...)

**UI behavior:** Like decryptable password but one-way hash. Cannot be retrieved, only reset.

**Checklist:**
- [ ] Input masked
- [ ] Cannot view existing value
- [ ] Only overwrite supported

### 2.33 Binary (ID: 23)

**UI behavior:** File upload/download for binary data.

**Real example:** `Binary Data` in **Application Image**.

**Checklist:**
- [ ] Upload interface
- [ ] Download stored file
- [ ] File size handling

### 2.34 Upload File (ID: 715C53D4...)

**UI behavior:** File upload widget with drag-and-drop support.

**Checklist:**
- [ ] Upload button and drag-and-drop zone
- [ ] File type validation
- [ ] Upload progress indicator
- [ ] Download uploaded file

### 2.35 Color (ID: 27)

**UI behavior:** Color picker widget.

**Checklist:**
- [ ] Color picker popup
- [ ] Selected color preview swatch
- [ ] Hex/RGB value storage

### 2.36 Assignment (ID: 33)

**UI behavior:** Opens a resource assignment popup to select a resource and time slot.

**Real example:** `Resource Assignment` in **Sales Order** > Lines; **Purchase Order** > Lines; **Expense Sheet** > Lines; **Sales Invoice** > Lines.

**Checklist:**
- [ ] Opens resource assignment dialog
- [ ] Correct resources listed
- [ ] Time slot selection
- [ ] Assignment saved and displayed

### 2.37 Masked String (ID: 52529102...)

**UI behavior:** String input with a mask pattern (e.g., phone number format, tax ID format).

**Checklist:**
- [ ] Mask pattern applied during input
- [ ] Placeholder shows expected format
- [ ] Only valid characters accepted per position

### 2.38 Non Transactional Sequence (ID: 4148378344...)

**UI behavior:** Auto-generated sequence number, not tied to document type. Typically read-only.

**Checklist:**
- [ ] Auto-generated on creation
- [ ] Read-only after generation
- [ ] Sequence respects configured format

### 2.39 Transactional Sequence (ID: B82E1C56...)

**UI behavior:** Auto-generated document number tied to document type and year.

**Checklist:**
- [ ] Auto-generated per document type sequence
- [ ] Unique within fiscal year (if configured)
- [ ] Read-only after completion

### 2.40 Product Characteristics (ID: C632F1CF...)

**UI behavior:** Displays product characteristic values (like "Color: Red, Size: L") with special rendering.

**Checklist:**
- [ ] Characteristic values displayed correctly
- [ ] Read-only presentation

### 2.41 Search Vector (ID: 81FCDA65...)

**UI behavior:** Full-text search index field. Typically hidden or technical.

**Checklist:**
- [ ] Hidden from form view (or technical display only)

### 2.42 Tree Reference (ID: 8C57A4A2...)

**UI behavior:** Tree-structured selector showing hierarchical data.

**Checklist:**
- [ ] Tree navigation
- [ ] Expand/collapse nodes
- [ ] Selection at any tree level

### 2.43 Window Reference (ID: FF808181...)

**UI behavior:** Selector for referencing another window in the AD.

**Checklist:**
- [ ] Window selector dropdown/search
- [ ] Correct window list

### 2.44 DateTime_From (Date) (ID: 487AE3E7...)

**UI behavior:** Date picker that represents the **start** of a date range filter. Renders identically to a standard Date field, but semantically marks the field as the "from" boundary. Used primarily in report/process parameter forms for defining filter ranges.

**Real example:** Not currently used by any column or parameter in this instance, but available as a reference type for custom development.

**Checklist:**
- [ ] Renders as standard date picker
- [ ] Value used as lower bound in range queries
- [ ] Paired correctly with a corresponding DateTime_To field
- [ ] Empty value means "no lower bound"

### 2.45 DateTime_To (Date) (ID: 439F775E...)

**UI behavior:** Date picker that represents the **end** of a date range filter. Renders identically to a standard Date field, but semantically marks the field as the "to" boundary. The UI should validate that it is not earlier than the paired DateTime_From field.

**Real example:** Not currently used by any column or parameter in this instance, but available as a reference type for custom development.

**Checklist:**
- [ ] Renders as standard date picker
- [ ] Value used as upper bound in range queries
- [ ] Validation: cannot be earlier than paired DateTime_From
- [ ] Empty value means "no upper bound"

### 2.46 OBKMO_Widget in Form Reference (ID: FF808081...31241C2BB30012)

**UI behavior:** Embeds a Workspace Widget inside a generated form. Instead of rendering a traditional field, this reference type renders an entire widget component (as defined in the Widgets framework) inline within the form layout. Used by the My Openbravo / Boards framework to place dashboard widgets inside tab forms.

**Real example:** Not currently used by any column in this instance, but available as a reference type. Designed for embedding chart widgets, KPI indicators, or custom visualization components inside standard windows.

**Checklist:**
- [ ] Widget component renders inline within the form
- [ ] Widget loads its data source correctly
- [ ] Widget respects the form's read-only state
- [ ] Widget refreshes when the parent record changes
- [ ] Widget layout does not break the form grid/column alignment
- [ ] Widget interactions (click, drill-down) work within the form context

---

## SECTION 2.B — Hardcoded Button Columns (Special HTML Templates)

Certain Button columns (reference type 28) bypass the standard process framework entirely. Instead of following the `uipattern` of their linked `ad_process`, they are intercepted by column name and rendered via **dedicated HTML templates and Java servlets**. The `uipattern` field on the linked process is **ignored** for these columns.

This is determined in the WAD code generation layer ([WadActionButton.java](src-wad/src/org/openbravo/wad/WadActionButton.java)) and in the OBUIAPP layer ([OBViewTab.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/window/OBViewTab.java)).

> **Critical for new UI:** These cases cannot rely on the generic process rendering pipeline. Each one requires a dedicated reimplementation that replicates the specific behavior of its HTML template.

### 2.B.1 DocAction — Document Action

**Detected by:** `columnname = 'DocAction'`

**What it does:** Renders a dropdown with the valid document actions (Complete, Void, Close, Reactivate, etc.) filtered by the current document status. The available actions are computed server-side by `ActionButtonUtility.docAction()` based on the `docstatus`, the reference value list (`AD_Ref_List` for the specific document type), and business rules.

**HTML Template:** [DocAction.html](src/org/openbravo/erpCommon/ad_actionButton/DocAction.html)
**Server logic:** `ActionButtonUtility.docAction()` + generated WAD servlet code

**Tables where it exists:**

| Table | Process | Windows |
|-------|---------|---------|
| `C_Order` | Process Order | Sales Order, Purchase Order, Sales Quotation, Return from Customer, Return to Vendor, Sales Order for Picking |
| `C_Invoice` | Process Invoice | Sales Invoice, Purchase Invoice |
| `M_InOut` | Process Shipment | Goods Shipment, Goods Receipt |
| `M_Requisition` | Post Requisition | Manage Requisitions |
| `GL_Journal` | Add Payment From Journal | G/L Journal |

**What the new UI must implement:**
- [ ] Query available document actions for the current record status
- [ ] Render dropdown with only valid transitions
- [ ] Submit selected action to the process handler
- [ ] Update UI after status change (fields become read-only, buttons change)
- [ ] Handle confirmation dialogs for destructive actions (Void, Close)

### 2.B.2 Posted — Accounting Post/Unpost

**Detected by:** `columnname = 'Posted'` AND no `ad_process` linked (`ad_process_id IS NULL`)

**What it does:** Toggles the accounting posting status of a document. Clicking it either posts the document (creates `Fact_Acct` entries) or un-posts it (deletes accounting entries). Uses `ActionButtonUtility.processButton()` to post and `ActionButtonUtility.resetAccounting()` to un-post.

**HTML Template:** [Posted.html](src/org/openbravo/erpCommon/ad_actionButton/Posted.html)
**Java Servlet:** [Posted.java](src/org/openbravo/erpCommon/ad_actionButton/Posted.java)

**Tables where it exists (32 tables):**

| Category | Tables |
|----------|--------|
| Financial | `C_Invoice`, `C_Order`, `C_Cash`, `C_Settlement`, `C_DP_Management`, `C_BankStatement` |
| Payments (APRM) | `FIN_Payment`, `FIN_Finacc_Transaction`, `FIN_Reconciliation`, `FIN_BankStatement`, `FIN_Doubtful_Debt`, `APRM_Finacc_Transaction_v`, `APRM_Reconciliation_v` |
| Inventory | `M_InOut`, `M_Inventory`, `M_Movement`, `M_Production`, `M_Internal_Consumption`, `M_MatchInv`, `M_MatchPO`, `M_MatchSI`, `M_MatchSO` |
| Costing | `M_CostAdjustment`, `M_LandedCost`, `M_LC_Cost` |
| Assets | `A_Amortization` |
| Projects | `C_ProjectIssue` |
| Expenses | `S_TimeExpense` |
| Remittance | `REM_Remittance`, `REM_RemittanceLine_Cancel`, `REM_RemittanceLine_Return` |
| Cash VAT | `OBCVAT_ManualSettlement` |

**What the new UI must implement:**
- [ ] Show current posting status (Not Posted / Posted / Error)
- [ ] Post action: invoke accounting engine, display success/error
- [ ] Unpost action: delete accounting entries with confirmation
- [ ] Show accounting entries viewer after posting (link to Accounting Transaction Details)
- [ ] Handle posting errors (missing configuration, period closed, etc.)

### 2.B.3 CreateFrom — Create Lines From

**Detected by:** `columnname = 'CreateFrom'` AND no `ad_process` linked (`ad_process_id IS NULL`)

**What it does:** Opens a popup to select source document lines and copy them into the current document. The popup varies depending on the document type — it shows different source data (orders for invoices, invoices for payments, etc.) with a grid for row selection.

**HTML Templates (multiple variants):**
- [CreateFrom_F0.html](src/org/openbravo/erpCommon/ad_actionButton/CreateFrom_F0.html) — Generic / GL Journal
- [CreateFrom_FS.html](src/org/openbravo/erpCommon/ad_actionButton/CreateFrom_FS.html) — Financial statement
- [CreateFrom_Shipment.html](src/org/openbravo/erpCommon/ad_actionButton/CreateFrom_Shipment.html) — Create from Shipment
- [CreateFrom_ShipmentPO.html](src/org/openbravo/erpCommon/ad_actionButton/CreateFrom_ShipmentPO.html) — Create from PO Shipment
- [CreateFrom_Response.html](src/org/openbravo/erpCommon/ad_actionButton/CreateFrom_Response.html) — Response/result

**Java Servlet:** [CreateFrom.java](src/org/openbravo/erpCommon/ad_actionButton/CreateFrom.java)

**Tables where it exists:**

| Table | Window | Source documents |
|-------|--------|------------------|
| `C_Invoice` | Sales/Purchase Invoice | Orders, Shipments/Receipts |
| `M_InOut` | Goods Shipment/Receipt | Orders |
| `C_BankStatement` | Bank Statement | Payments |
| `C_Settlement` | Business Partner Settlement | Invoices, Payments |
| `C_DP_Management` | Debt Payment Management | Payments |
| `C_Remittance` | Remittance | Invoices, Payments |

**What the new UI must implement:**
- [ ] Determine correct source document type for the current table
- [ ] Render filterable grid with source document lines
- [ ] Allow multi-row selection with checkboxes
- [ ] Allow editing quantities/amounts before import
- [ ] Copy selected lines into current document
- [ ] Refresh line tab after import

### 2.B.4 ChangeProjectStatus — Change Project Status

**Detected by:** `columnname = 'ChangeProjectStatus'`

**What it does:** Renders a dropdown with valid project status transitions, similar to DocAction but for projects. Uses `ActionButtonUtility.projectAction()` to compute available status values.

**HTML Template:** [ChangeProjectStatus.html](src/org/openbravo/erpCommon/ad_actionButton/ChangeProjectStatus.html)
**Server logic:** `ActionButtonUtility.projectAction()`

**Tables where it exists:**

| Table | Windows |
|-------|---------|
| `C_Project` | Multiphase Project, Service Project |

**What the new UI must implement:**
- [ ] Query valid project status transitions
- [ ] Render dropdown with valid options
- [ ] Submit status change
- [ ] Refresh form after status update

### 2.B.5 PaymentRule — Payment Rule (Special Column)

**Detected by:** `columnname = 'PaymentRule'`

**What it does:** In the WAD layer, PaymentRule is detected as a special column (`xmlid = ""`), but in the modern UI it is typically handled as a regular List reference rather than a special HTML template. It controls how payment is made (Cash, Wire Transfer, Credit, etc.).

**Note:** While hardcoded in `WadActionButton.java`, in practice this column rarely triggers a custom HTML popup in the current codebase. It is included here for completeness as it IS special-cased in the WAD code.

---

### 2.B.6 Other Hardcoded HTML Button Processes

Beyond the 5 special column names, there are additional Button columns with `uipattern = 'M'` that render specific HTML templates based on their linked `ad_process`. These are identified by the `procedurename` field on the process, which maps to the WAD-generated servlet command.

#### Copy/Import Operations

| Process | HTML Template | procedurename | Windows |
|---------|--------------|---------------|---------|
| Copy Lines (Invoice) | [CopyFromInvoice.html](src/org/openbravo/erpCommon/ad_actionButton/CopyFromInvoice.html) | `CopyFrom` | Sales Invoice, Purchase Invoice |
| Copy Lines (Order) | [CopyFromOrder.html](src/org/openbravo/erpCommon/ad_actionButton/CopyFromOrder.html) | `CopyFrom` | Sales Order, Purchase Order, Sales Quotation, Return from/to |
| Copy from Settlement | [CopyFromSettlement.html](src/org/openbravo/erpCommon/ad_actionButton/CopyFromSettlement.html) | `CopyFrom` | Business Partner Settlement |
| Copy Details (Project) | (Generated) | `CopyFrom` | Multiphase Project, Service Project |
| Copy Details (GL Batch) | (Generated) | `CopyFrom` | G/L Journal |

#### Accounting Operations

| Process | HTML Template | procedurename | Windows |
|---------|--------------|---------------|---------|
| Close Year | [CreateRegFactAcct.html](src/org/openbravo/erpCommon/ad_actionButton/CreateRegFactAcct.html) | `Create_Reg_Fact_Acct` | Fiscal Calendar |
| Undo Close Year | [DropRegFactAcct.html](src/org/openbravo/erpCommon/ad_actionButton/DropRegFactAcct.html) | `Drop_Reg_Fact_Acct` | Fiscal Calendar |
| Create VAT Registers | [CreateVatRegisters.html](src/org/openbravo/erpCommon/ad_actionButton/CreateVatRegisters.html) | `Createfrom` | Tax Payment |

#### Project Operations

| Process | HTML Template | procedurename | Windows |
|---------|--------------|---------------|---------|
| Close Project | [ProjectClose.html](src/org/openbravo/erpCommon/ad_actionButton/ProjectClose.html) | `Processing` | Multiphase Project, Service Project |
| Set Project Type | [ProjectSetType.html](src/org/openbravo/erpCommon/ad_actionButton/ProjectSetType.html) | `Setprojecttype` | Multiphase Project, Service Project |
| Project Copy From | [ProjectCopyFrom.html](src/org/openbravo/erpCommon/ad_actionButton/ProjectCopyFrom.html) | (referenced from Project Copy) | Service Project |

#### Financial/Payment Operations

| Process | HTML Template/Servlet | procedurename | Windows |
|---------|----------------------|---------------|---------|
| APRM Process Invoice | (Generated) | `EM_APRM_Processinvoice` | Sales Invoice, Purchase Invoice |
| Execute Payment | (Generated) | `EM_Aprm_Executepayment` | Payment In, Payment Out, Payment Proposal |
| Reconcile | (Generated) | `EM_APRM_Reconcile` | Financial Account |
| Reconciliation Details | (Generated) | `EM_APRM_PrintDetailed` | Financial Account |
| Reconciliation Summary | (Generated) | `EM_APRM_PrintSummary` | Financial Account |
| Process Payment Proposal | (Generated) | `EM_APRM_Process_Proposal` | Payment Proposal |
| Import Statement | (Generated) | `EM_APRM_ImportBankFile` | Financial Account |
| Process Shipment Java | [ProcessGoods.java](src/org/openbravo/erpCommon/ad_actionButton/ProcessGoods.java) | `Process_Goods_Java` | Goods Shipment, Goods Receipt, Return Material Receipt/Shipment |

#### Other Operations

| Process | HTML Template | procedurename | Windows |
|---------|--------------|---------------|---------|
| Edit CCP Measured Values | [EditCCPMeasureValues.html](src/org/openbravo/erpCommon/ad_actionButton/EditCCPMeasureValues.html) | `Edit` | Quality Control Report |
| Export Reference Data | [ExportReferenceData.html](src/org/openbravo/erpCommon/ad_actionButton/ExportReferenceData.html) | `Export` | Dataset |
| Export Budget to Excel | (Generated) | `Exportexcel` | Budget |
| Grant Access | [InsertAcces.html](src/org/openbravo/erpCommon/ad_actionButton/InsertAcces.html) | `Processing` | Role, Role Access |
| Create Remittance File | (Generated) | `Getfile` | Remittance |
| Instance Purpose Config | (Generated) | `Change_Instance_Purpose` | System Info, Heartbeat Configuration |
| Physical Inventory | [PhysicalInventory.html](src/org/openbravo/erpCommon/ad_actionButton/PhysicalInventory.html) | (referenced from inventory) | Physical Inventory |
| Update Maintenance | [UpdateMaintenanceScheduled.html](src/org/openbravo/erpCommon/ad_actionButton/UpdateMaintenanceScheduled.html) | `CreateMaint` | Maintenance Order |
| Schedule/Unschedule/Reschedule Process | (Generated) | `Schedule`/`Unschedule`/`Reschedule` | Process Request |
| Display Jasper Report | (Generated) | `Result` | Process Monitor, Process Request |

### 2.B.7 Generic Framework Templates

These are not process-specific but are the generic templates used by the action button framework itself:

| Template | Purpose |
|----------|---------|
| [ActionButtonDefault.html](src/org/openbravo/erpCommon/ad_actionButton/ActionButtonDefault.html) | Default rendering for action buttons that don't have a specific template |
| [ActionButtonDefaultFrames.html](src/org/openbravo/erpCommon/ad_actionButton/ActionButtonDefaultFrames.html) | Frame wrapper for the default action button |
| [ActionButtonResponse.html](src/org/openbravo/erpCommon/ad_actionButton/ActionButtonResponse.html) | Generic response display after process execution |
| [CreditPaymentGrid.html](src/org/openbravo/erpCommon/ad_actionButton/CreditPaymentGrid.html) | Credit payment selection grid (used by payment flows) |

### 2.B.8 Modern vs Legacy: How to Determine the Rendering Path

When a Button column (reference 28) is clicked, the system decides the rendering path as follows:

```
Column has em_obuiapp_process_id set?
  ├── YES → Use Process Definition (obuiapp_process) → modern API flow
  │         (uipattern: A, M, OBUIAPP_PickAndExecute, OBUIAPP_Report, ETRX_RxAction)
  │
  └── NO → Column has ad_process_id set?
            ├── YES → Is columnname one of the 5 special names?
            │         ├── YES → Hardcoded HTML template (bypass uipattern)
            │         └── NO  → Use ad_process.uipattern
            │                   ├── 'S' (Standard) → API parameter flow
            │                   └── 'M' (Manual) → HTML servlet flow
            │                         (procedurename determines which template)
            │
            └── NO → Is columnname 'Posted' or 'CreateFrom'?
                      ├── YES → Hardcoded HTML template (standalone, no process)
                      └── NO  → No action (button does nothing)
```

**Key rule for the new UI:** Check `em_obuiapp_process_id` first. If set, use the modern API. If not, you must handle the legacy path, which may involve reimplementing the behavior of the 27 HTML templates listed above.

### 2.B.9 Complete Validation Checklist for Hardcoded Buttons

- [ ] **DocAction** dropdown shows correct actions per document status on all 5 document tables
- [ ] **Posted** button posts/un-posts documents correctly on all 32 tables
- [ ] **CreateFrom** popup loads correct source data per document type on all 6 tables
- [ ] **ChangeProjectStatus** dropdown shows valid transitions on `C_Project`
- [ ] **CopyFrom** (button column) opens correct copy dialog per document type
- [ ] **Process Shipment Java** (ProcessGoods) handles shipment completion correctly
- [ ] **APRM Process Invoice** handles invoice processing correctly
- [ ] **Execute Payment** handles payment execution correctly
- [ ] **Reconcile** handles bank reconciliation correctly
- [ ] **Close Year** / **Undo Close Year** handle fiscal year operations
- [ ] **Create VAT Registers** creates tax register entries
- [ ] **Close Project** / **Set Project Type** handle project lifecycle
- [ ] **Grant Access** (InsertAcces) manages role security access
- [ ] **Export Reference Data** exports datasets
- [ ] **Schedule/Unschedule/Reschedule** manage process scheduling
- [ ] **Import Statement** handles bank file import
- [ ] All 27 HTML template behaviors reimplemented or replaced with equivalent modern UI
- [ ] Decision tree (2.B.8) correctly routes each button to its handler
- [ ] Buttons with `em_obuiapp_process_id` use the modern API (not HTML)

---

## SECTION 3 — Process Types

Etendo has **two distinct process entities** in the Application Dictionary, each with its own set of UI patterns:

| Entity | AD Table | Window to configure | Count in this instance |
|--------|----------|---------------------|----------------------|
| **Report and Process** | `ad_process` | Report and Process | 305 |
| **Process Definition** | `obuiapp_process` | Process Definition | 131 |

---

### 3.A — Report and Process (`ad_process`)

The legacy process entity. Configured in the **Report and Process** window. Has 3 possible UI Patterns:

| Code | UI Pattern Name | Count |
|------|----------------|-------|
| `S` | Standard | 135 |
| `M` | Manual | 170 |
| `OBUIAPP_PickAndExecute` | Pick and Execute | 0* |

\* No Report and Process in this instance uses Pick and Execute, but the option exists in the AD.

Additionally, `ad_process` records have boolean flags that further classify their behavior:
- `isbackground` — scheduled background execution (16 processes)
- `isreport` — generates a report output (97 processes)
- `isjasper` — uses Jasper Report engine (2 processes: Print Requisition, Customer Statement)

**Processes by source module:**

| Source | Total | Standard (S) | Manual (M) |
|--------|-------|-------------|------------|
| Core | 271 | 120 | 151 |
| org.openbravo.advpaymentmngt | 22 | 12 | 10 |
| org.openbravo.module.remittance | 7 | 3 | 4 |
| com.etendoerp.copilot | 2 | 0 | 2 |
| org.openbravo.reports.ordersawaitingdelivery | 1 | 0 | 1 |
| org.openbravo.financial.paymentreport | 1 | 0 | 1 |
| org.openbravo.utility.cleanup.log | 1 | 0 | 1 |

#### 3.A.1 Report and Process — Standard (`uipattern = S`)

**What it is:** A process that uses the modern OBUIAPP framework for its UI. When it has parameters (defined in `ad_process_para`), a popup form appears. Without parameters, it executes directly. Server-side logic is implemented via a Java class or a stored procedure (`procedurename`).

**How triggered:** Button field in a window (reference type = Button linked to this process), or toolbar gear icon → process list.

**Expected UI behavior:**
1. If parameters defined: popup form with all parameters rendered according to their reference types
2. User fills in parameters (mandatory validation applies)
3. "OK" / "Done" button submits
4. Spinner/loading indicator during execution
5. Result message (success, error, or warning)
6. Parent window/tab refreshes to reflect changes

If no parameters: executes immediately upon invocation (with optional confirmation).

**Real examples (with parameters):**
- **Bank Statement Process** (1 param) — processes/reconciles bank statement lines
- **Calculate Freight Amount** (2 params) — computes freight costs on orders based on rules
- **Calculate Standard Costs** (3 params) — runs cost calculation per costing rule
- **Copy Accounts** (2 params) — copies accounting configuration from source to target schema
- **Copy Budget** (1 param) — duplicates a budget to a new period

**Real examples (without parameters):**
- **Create Amortization** — generates amortization schedule entries for an asset
- **Calculate Promotions** — recalculates applicable discounts/promotions
- **Close Work Requirement** — transitions a work requirement to closed status
- **Change Project Status** — advances project lifecycle state
- **Create Book Lines** — generates accounting book entries

**Checklist:**
- [ ] Process invoked from button field renders correctly
- [ ] Parameter popup shows all defined parameters with correct reference types
- [ ] Mandatory parameters enforced — cannot submit without them
- [ ] Default values populated correctly on popup open
- [ ] Parameter validation rules (min/max, regex) applied
- [ ] Dropdown/selector parameters populated with correct options
- [ ] Date picker parameters work correctly
- [ ] Process executes successfully and returns result message
- [ ] Error messages display clearly on failure (not raw stack trace)
- [ ] Window/tab refreshes after execution to reflect changes
- [ ] Loading indicator shown during long-running execution
- [ ] Process without parameters executes immediately on click
- [ ] Confirmation dialog shown where configured (no-param processes)

#### 3.A.2 Report and Process — Manual (`uipattern = M`)

**What it is:** A process that uses the classic Etendo UI framework (servlet-based). This is the most common type (170 processes). It covers three distinct sub-categories based on boolean flags:

##### 3.A.2.a Manual — Report (`isreport = Y`, `isbackground = N`)

Generates a report output (HTML, PDF, or Excel). The classic reporting framework renders a parameter form and then displays the report inline or as a download.

**How triggered:** Menu entry under "Reports" section, or toolbar in a window.

**Expected UI behavior:**
1. Opens a classic parameter form (if parameters defined)
2. User fills parameters and clicks a generate/print button
3. Report renders inline in a new tab/popup (HTML) or downloads (PDF/Excel)
4. May include print-friendly formatting

**Real examples:**
- **General Ledger Report** — core accounting report with period/account filters
- **Customer Invoice Report** — lists invoices per customer
- **Delivered Sales Order Report** — shows delivery status of sales orders
- **Expense Report** — employee expense summary
- **Cashflow Forecast** — projected cash flow report
- **Balance sheet and P&L structure** — financial statement structure
- **Daily Invoice** (1 param) — daily invoice listing
- **Invoice Summary** (3 params) — summarized invoice data with filters
- **Asset Delivery** (6 params) — asset delivery tracking report
- **Create Report** (8 params) — configurable report with many filter parameters

**Checklist:**
- [ ] Report appears in the correct menu location
- [ ] Classic parameter form renders correctly
- [ ] All parameter types display correctly (dropdowns, dates, checkboxes)
- [ ] Report generates and displays results
- [ ] HTML report renders inline correctly
- [ ] PDF output generates and downloads
- [ ] Excel output generates and downloads (where supported)
- [ ] Multi-page reports paginate correctly
- [ ] Number formatting respects locale (decimals, thousands separator)
- [ ] Date formatting respects locale
- [ ] Empty result set shows informative message (not blank page)
- [ ] Large reports do not timeout

##### 3.A.2.b Manual — Background Process (`isbackground = Y`)

Server-side scheduled processes that run asynchronously. Not directly invoked from the UI by a user click — instead configured via the **Process Scheduling** window. They execute on a cron schedule or at a defined interval.

**How triggered:** Scheduled via **Process Scheduling** window (not by UI button click).

**Expected UI behavior:**
- Not directly visible to the end user during execution
- **Process Monitor** window shows running/completed/error status
- **Process Request** window shows configured scheduled instances
- Execution logs accessible in **Async Process Log** or the process's own log tab

**Real examples:**
- **Acct Server Process** — background accounting posting engine
- **Alert Process** — evaluates configured alert rules on schedule
- **Costing Background process** — recalculates inventory costing
- **Execute Pending Payments** (APRM module) — processes pending payment executions
- **Heartbeat Process** — system health monitoring heartbeat
- **Job Runner** — SMF Jobs background task runner
- **Payment Monitor** (APRM module) — monitors payment statuses
- **Agent Schedule** (Copilot module) — scheduled Copilot agent execution
- **Execute Copilot Bulk Tasks** (Copilot module) — runs Copilot tasks in bulk
- **Log Clean Up Process** (cleanup.log module) — purges old system logs

**Checklist:**
- [ ] Process appears in the Process Scheduling dropdown
- [ ] Schedule configuration (cron expression or interval) accepts valid values
- [ ] Scheduled process executes at the configured time
- [ ] Process Monitor shows real-time status (running, completed, error)
- [ ] Execution logs capture start time, end time, and result
- [ ] Error details recorded in logs on failure
- [ ] Cancel/kill a running process works (if supported)
- [ ] Multiple concurrent schedules of the same process handled correctly
- [ ] Process does not block the UI thread

##### 3.A.2.c Manual — Action Process (`isreport = N`, `isbackground = N`)

A classic-style process that performs a server-side action (not a report, not background). May have parameters. Uses the classic popup/form UI.

**How triggered:** Button field click, toolbar process menu, or menu entry.

**Expected UI behavior:**
1. Classic popup or inline form opens
2. Parameters rendered in classic layout (if defined)
3. User submits; server executes
4. Result message or redirect

**Real examples:**
- **Close Year** — year-end closing process
- **Create All Price Lists** — generates all price lists from schemas
- **Delete Client** — removes an entire client and all its data
- **Grant Access** — assigns security access to roles
- **Cache Reset** — clears server-side caches
- **Apply Modules** — applies pending module installations
- **Copy Lines** (1 param) — copies lines from one document to another
- **Import Bank Statement** (4 params) — imports bank data from file
- **Generate PO from Project** (3 params) — creates purchase orders from project phases
- **APRM Process Invoice** (APRM module) — invoice processing action
- **Execute Payment** (APRM module) — payment execution action
- **Reconcile** (APRM module) — bank reconciliation action
- **Select Payments** / **Select Orders or Invoices** / **Create Remittance File** (Remittance module) — remittance management actions

**Checklist:**
- [ ] Classic popup/form opens correctly
- [ ] Parameters render with correct field types
- [ ] Mandatory parameters validated
- [ ] Process executes and returns result
- [ ] Success/error feedback displayed
- [ ] Long-running processes show progress indicator
- [ ] Window refreshes after completion

#### 3.A.3 Report and Process — Pick and Execute (`uipattern = OBUIAPP_PickAndExecute`)

**What it is:** A Report and Process configured with the Pick and Execute UI pattern. Although no process in this instance currently uses this pattern, it is a valid option. It works similarly to the Pick and Execute windows (see Section 1.4) but is defined as a process rather than a window.

**How triggered:** Button field or toolbar action that opens a P&E-style grid.

**Expected UI behavior:**
1. A grid view appears with filter parameters in a header section
2. User filters and selects rows using checkboxes
3. Inline editing of grid values (if configured)
4. "Done" / "OK" button executes the process on selected rows
5. Result summary displayed

**Checklist:**
- [ ] Filter header renders and filters the grid
- [ ] Grid with checkboxes for row selection
- [ ] Select All / Deselect All works
- [ ] Inline-editable fields functional (if configured)
- [ ] Execute button runs on selected rows
- [ ] Proper result feedback after execution
- [ ] Empty selection handled gracefully

#### 3.A.4 Report and Process — Jasper Reports (`isjasper = Y`)

**What it is:** A special flag on Report and Process that indicates the output is generated by the Jasper Report engine. The process invokes a `.jrxml` template compiled at runtime, passing parameters and a data source. Can be combined with any UI Pattern (Standard or Manual).

**How triggered:** Print button in toolbar, button field, or menu entry.

**Expected UI behavior:**
1. Parameter popup (if parameters defined) — UI pattern determines the popup style
2. Report generation via Jasper engine (loading indicator)
3. Output format: PDF (default), or Excel/HTML if configured
4. PDF opens in browser viewer or triggers download
5. Print dialog available

**Real examples:**
- **Print Requisition** (uipattern=S, 0 params) — prints a requisition document directly as PDF
- **Customer Statement** (uipattern=S, 0 params) — prints a customer account statement as PDF

**Checklist:**
- [ ] Jasper template resolves correctly (`.jrxml` file found)
- [ ] Parameters passed to Jasper report correctly
- [ ] PDF output renders correctly (layout, fonts, images)
- [ ] Excel export works if configured
- [ ] Subreports within the Jasper template load properly
- [ ] Images and logos embedded in the report render
- [ ] Multi-page reports paginate with correct headers/footers
- [ ] Number formatting in report respects locale settings
- [ ] Date formatting in report respects locale settings
- [ ] Large reports generate without timeout
- [ ] Print dialog accessible from PDF viewer

---

### 3.B — Process Definition (`obuiapp_process`)

The modern process entity, configured in the **Process Definition** window. Introduced with the OBUIAPP module. Parameters are defined in the `obuiapp_parameter` table (not `ad_process_para`). Process logic is implemented in a Java `ActionHandler` class (server-side) or a JavaScript function (client-side for Manual pattern).

Has 5 possible UI Patterns:

| Code | UI Pattern Name | Count | Implementation |
|------|----------------|-------|----------------|
| `A` | Action | 32 | Java ActionHandler class |
| `M` | Manual | 17 | JavaScript function (client-side) |
| `OBUIAPP_PickAndExecute` | Standard (Parameters defined in Dictionary) | 76 | Java ActionHandler + parameter popup |
| `OBUIAPP_Report` | Report (Using JR templates) | 5 | Java ActionHandler + Jasper output |
| `ETRX_RxAction` | RX Action | 1 | Java class invoked via EtendoRX |

**Process Definitions by source module:**

| Source | Total | A | M | P&E | Report | RX |
|--------|-------|---|---|-----|--------|----|
| Core | 55 | 2 | 3 | 46 | 4 | 0 |
| org.openbravo.warehouse.pickinglist | 21 | 7 | 8 | 6 | 0 | 0 |
| com.smf.jobs.defaults | 10 | 10 | 0 | 0 | 0 | 0 |
| org.openbravo.warehouse.packing | 10 | 7 | 2 | 1 | 0 | 0 |
| com.etendoerp.copilot | 9 | 3 | 0 | 6 | 0 | 0 |
| org.openbravo.advpaymentmngt | 9 | 1 | 0 | 8 | 0 | 0 |
| com.etendoerp.etendorx | 8 | 2 | 3 | 2 | 0 | 1 |
| org.openbravo.module.remittance | 2 | 0 | 0 | 2 | 0 | 0 |
| com.smf.jobs | 2 | 0 | 0 | 2 | 0 | 0 |
| org.openbravo.client.application | 2 | 0 | 0 | 2 | 0 | 0 |
| com.etendoerp.openapi | 1 | 0 | 1 | 0 | 0 | 0 |
| com.etendoerp.advpaymentmngt | 1 | 0 | 0 | 1 | 0 | 0 |
| com.etendoerp.reportvaluationstock | 1 | 0 | 0 | 0 | 1 | 0 |

#### 3.B.1 Process Definition — Action (`uipattern = A`)

**What it is:** A server-side action handler invoked directly from the UI. The Java class (extending `BaseProcessActionHandler`) receives a JSON payload with the current record context and returns a JSON response. These processes do **not** use AD-defined parameters — instead, they build their own UI (if any) programmatically via the ActionHandler's response, or they run with no UI at all (triggered from a button).

When parameters are needed, the ActionHandler defines them in its own popup structure via JSON response. Some Action processes do have `obuiapp_parameter` entries (25 processes), which are used programmatically by the handler to generate a custom form.

**How triggered:** Button field on a window/tab, toolbar action, or programmatic invocation.

**Expected UI behavior:**
- **Without params:** Executes immediately on button click. May show a confirmation dialog. Returns a success/error/info message. May trigger a UI refresh, redirect, or custom behavior.
- **With params:** Opens a custom popup form defined by the ActionHandler. User fills fields, submits; handler processes and returns result.

**Real examples (without parameters):**
- **Post** (`com.smf.jobs.defaults.Post`) — posts a document to accounting
- **Clone** (`com.smf.jobs.defaults.CloneRecords`) — clones the current record
- **Cancel Picking List Action** (Pickinglist module) — cancels an active picking list
- **Restart RX Services** (EtendoRX module) — restarts EtendoRX microservices
- **RefreshOAuthConfigs** (EtendoRX module) — refreshes OAuth configuration
- **Process Packing Action** / **Manage Packing Action** (Packing module) — warehouse packing operations
- **Create Invoices from Orders** (`com.smf.jobs.defaults`) — generates invoices from sales orders
- **Offer Add Product** / **Offer Add Org** / **Offer Add Product Category** (`com.smf.jobs.defaults`) — manage discount/promotion assignments
- **Get MCP Server Configuration** (Copilot module) — retrieves MCP server configuration
- **Execute Copilot Task** / **Evaluate Copilot Task** (Copilot module) — runs/evaluates Copilot tasks

**Real examples (with parameters):**
- **Process Invoices** (`com.smf.jobs.defaults.ProcessInvoices`) — processes invoices with action/document type selection
- **Process Orders** (`com.smf.jobs.defaults.ProcessOrders`) — processes sales/purchase orders with action selection
- **Process Shipment** (`com.smf.jobs.defaults.ProcessShipment`) — processes goods shipments
- **Send Mail** (`com.smf.jobs.defaults.mail.SendMail`) — sends email with template, recipients, attachments
- **Add Payment** (APRM module) — complex payment creation with full form

**Checklist:**
- [ ] Button field or toolbar action triggers the ActionHandler
- [ ] Processes without parameters execute immediately on click
- [ ] Custom parameter popup renders correctly (when handler defines one)
- [ ] All parameter field types in custom popup work (dates, selectors, amounts, etc.)
- [ ] Mandatory fields in custom popup enforced
- [ ] JSON payload sent to handler includes correct record context (recordId, tabId, etc.)
- [ ] Handler response processed correctly: message displayed, type respected (success/error/warning/info)
- [ ] `refreshGrid` response action refreshes the parent grid
- [ ] `openDirectTab` response navigates to specified tab
- [ ] `showMsgInProcessView` displays inline message
- [ ] Multi-record mode works when `ismultirecord = Y` (handler receives array of selected record IDs)
- [ ] Error in handler shows user-friendly message (not raw exception)
- [ ] Loading indicator shown during server-side execution
- [ ] Process works when invoked from grid view (row selected)
- [ ] Process works when invoked from form view

#### 3.B.2 Process Definition — Manual (`uipattern = M`)

**What it is:** A process whose execution logic is entirely **client-side JavaScript**. The `classname` field contains a JavaScript function reference (e.g., `OB.OBWPL.Process.assign`) instead of a Java class. No server round-trip occurs unless the JS function explicitly makes an AJAX call.

**How triggered:** Button field on a window/tab, or toolbar action.

**Expected UI behavior:**
1. Button click invokes the JavaScript function directly in the browser
2. The function may: open a popup, manipulate the DOM, call a REST API, redirect, show a message, etc.
3. Behavior is entirely defined by the JS code — there is no standard parameter popup

**Real examples:**
- **Open Close Periods** (`OB.OpenClose.openClose`) — opens the period control management UI
- **Recalculate Role Permissions** (`OB.RoleInheritance.recalculatePermissions`) — triggers role permission recalculation
- **Open Swagger** (`OB.ETAPI.swagger.openSwagger`, OpenAPI module) — opens the Swagger/OpenAPI documentation page
- **Get Token** (`OB.ETRX.oAuthToken.getToken`, EtendoRX module) — retrieves an OAuth token and displays it
- **GetMiddlewareToken** (`OB.ETRX.middlewareToken.getMiddlewareToken`, EtendoRX module) — retrieves a middleware authentication token
- **ApproveGoogleDoc** (`OB.ETRX.approveGoogleDoc`, EtendoRX module) — approves a Google Document
- **Assign and Group Picking List** (`OB.OBWPL.Process.assign`, Pickinglist module) — assigns operators to picking lists
- **Cancel Picking List** / **Close Picking List** / **Process Picking List** / **Validate Picking List** / **Re Assign Picking List** (Pickinglist module) — various picking list lifecycle operations via client-side JS
- **Picking List Movement Line Reject** / **Complete** (`OB.OBWPL.MovementLine.*`, Pickinglist module) — picking movement line operations
- **Create Packing** / **Create Packing Header** (`OB.OBWPACK.Process.create/createHeader`, Packing module) — warehouse packing operations

**Checklist:**
- [ ] Button click invokes the correct JavaScript function
- [ ] JS function executes without console errors
- [ ] Custom UI (popup/dialog) rendered by the JS function displays correctly
- [ ] AJAX calls to server (if any) succeed and handle errors
- [ ] Result/feedback shown to user after execution
- [ ] Browser state consistent after execution (no orphan popups, no frozen UI)
- [ ] Function works in both grid and form view contexts
- [ ] Back navigation works after JS-driven redirects
- [ ] Function receives correct context parameters (current record, tab, window)

#### 3.B.3 Process Definition — Standard / Parameters defined in Dictionary (`uipattern = OBUIAPP_PickAndExecute`)

**What it is:** Despite the internal code name `OBUIAPP_PickAndExecute`, this is the **Standard** Process Definition pattern. It renders a parameter popup using parameters defined in the `obuiapp_parameter` table, then calls a Java ActionHandler with those parameter values. This is the most common Process Definition type (76 processes).

The name "Standard (Parameters defined in Dictionary)" comes from the fact that the parameter form is entirely driven by AD metadata — the ActionHandler does not need to build its own popup.

**How triggered:** Button field, toolbar action, or from a Pick and Execute window.

**Expected UI behavior:**
1. A popup form appears with parameters defined in the AD
2. Parameters render according to their reference types (same as fields: String, Date, List, Selector, etc.)
3. User fills in parameters
4. "Done" / "OK" button submits to the ActionHandler
5. Handler processes the request and returns a response
6. Result message displayed; grid/form refreshes

Many of these processes are the **backend handlers for Pick and Execute windows** — the P&E window provides the grid selection UI, and this process handles the execution. Others are standalone processes with a simple parameter popup.

**Real examples:**
- **Add Transaction** (APRM module) — adds a financial transaction to an account with full form
- **Add Multiple Payments** (APRM module) — bulk payment creation for an invoice
- **Match Statement** (APRM module) — matches bank statement lines to payments
- **Log Management** — purges system logs with date/type filters
- **Run Job** / **Kill Job** (SMF Jobs module) — executes/terminates scheduled job instances
- **Sync Models** / **Sync Assistant** / **Sync Tool Structure** / **Sync LangGraph Image** / **Check Hosts** / **Add Bulk Tasks** (Copilot module) — Copilot synchronization and management operations
- **Create Entity Mappings** / **Initialize RX Services** (EtendoRX module) — EtendoRX configuration management
- **Select Invoices and Orders** / **Select Payments Pick and Edit** (Remittance module) — remittance document selection
- **Etendo Payment Execution** (com.etendoerp.advpaymentmngt) — extended payment execution handler
- **PickingList Pick And Edit** / **Edit Picking List Item** / **Delete Picking Line** / **Print Picking List** (Pickinglist module) — picking list management
- **Pick Goods Shipments** (Packing module) — select goods for shipment packing
- **RegisterModule** — registers a new module in the system

**Checklist:**
- [ ] Parameter popup renders with all AD-defined parameters
- [ ] Parameter reference types render correctly (String, Date, List, TableDir, Selector, YesNo, etc.)
- [ ] Mandatory parameters enforced (cannot submit without them)
- [ ] Default values from AD loaded correctly
- [ ] Parameter display logic works (show/hide params based on other param values)
- [ ] Selector parameters show typeahead with correct filtered options
- [ ] Date parameters show date picker
- [ ] List parameters show dropdown with correct values
- [ ] YesNo parameters render as checkbox
- [ ] Numeric parameters validate input type
- [ ] "Done" button submits to ActionHandler correctly
- [ ] Handler response message displayed (success/error/warning)
- [ ] Grid refreshes after successful execution
- [ ] Works correctly when invoked from a P&E window (selected rows passed to handler)
- [ ] Works correctly when invoked standalone (single record context)
- [ ] Error in handler shows user-friendly message

#### 3.B.4 Process Definition — Report / Using JR Templates (`uipattern = OBUIAPP_Report`)

**What it is:** A Process Definition that generates a Jasper Report output. Parameters are defined in `obuiapp_parameter` and rendered in a modern popup. The ActionHandler class generates the report using a `.jrxml` template and returns PDF/Excel output. This is the modern replacement for the legacy R&P Jasper reports.

**How triggered:** Menu entry, toolbar action, or button field. Typically found under "Reports" in the application menu.

**Expected UI behavior:**
1. Parameter popup appears (same modern UI as Standard/P&E type)
2. User fills in filter parameters (date ranges, organizations, dimensions, etc.)
3. Click "Generate" / "Print" / "OK"
4. Report generates server-side via Jasper engine
5. PDF opens in a new browser tab or triggers download
6. Some reports also support Excel output

**Real examples:**
- **General Ledger Report Advanced** — modern version of the GL report with many dimension filters
- **Journal Entries Report Advanced** — detailed journal entry listing
- **Balance Sheet and P&L Structure advanced** — the most parameter-rich report; full financial statement with many filter/configuration parameters
- **Trial Balance** — trial balance with period and dimension filters
- **Valued Stock Report** (com.etendoerp.reportvaluationstock module) — inventory valuation report

**Checklist:**
- [ ] Parameter popup renders with all AD-defined parameters
- [ ] Complex parameter forms with 20+ parameters layout correctly (scrolling, sections)
- [ ] Date range parameters (from/to) work correctly
- [ ] Organization/client filter parameters respect access rules
- [ ] Selector parameters (accounts, BPs, products, dimensions) work with typeahead
- [ ] Multi-select parameters work (if any)
- [ ] Default values populated (current period, current org, etc.)
- [ ] Report generates successfully after parameter submission
- [ ] PDF output opens in browser or downloads
- [ ] PDF layout correct: headers, footers, page numbers, company logo
- [ ] Numbers formatted per locale (decimal/thousand separators)
- [ ] Dates formatted per locale
- [ ] Currency amounts show correct precision
- [ ] Large reports with many rows generate without timeout
- [ ] Empty result set shows informative message (not blank PDF)
- [ ] Excel export works (where supported by the report)
- [ ] Subreports load correctly
- [ ] Report parameters visible in the PDF header (user can see what was filtered)

#### 3.B.5 Process Definition — RX Action (`uipattern = ETRX_RxAction`)

**What it is:** A process whose execution is delegated to the EtendoRX microservice layer instead of running inside the Etendo Classic JVM. The Java class processes the request via the RX infrastructure, enabling reactive/async processing patterns.

**How triggered:** Button field or toolbar action, same as Action type.

**Expected UI behavior:**
1. Button click invokes the process
2. Request is sent to the EtendoRX service
3. May execute asynchronously (response may be deferred)
4. Result message returned to the UI

**Real example:**
- **ExampleProcess** (`com.etendoerp.etendorx.ExampleProcess`, 0 params) — example/template RX action process

**Checklist:**
- [ ] Process invocation reaches EtendoRX service
- [ ] EtendoRX connectivity validated (service running)
- [ ] Async execution handled gracefully (polling or callback for result)
- [ ] Result message displayed to user
- [ ] Error handling for EtendoRX service unavailability
- [ ] Timeout handling for long-running RX processes
- [ ] UI does not freeze during async execution

---

### 3.C — Cross-Cutting Process Behaviors

These behaviors apply to **both** Report and Process and Process Definition:

#### 3.C.1 Document Action Processes

**What it is:** Special processes associated with the document action button on Transaction windows. They change document status (Complete, Void, Close, Reactivate, etc.). Typically implemented as Process Definition — Action type.

**How triggered:** The document action combo/button on transaction windows.

**Expected UI behavior:**
1. User selects desired action from dropdown (Complete, Void, Close, etc.)
2. Clicks the process button (gear icon)
3. Confirmation dialog for destructive actions (Void, Close)
4. Document status changes
5. Fields become read-only/editable per new status
6. Toolbar buttons update

**Real examples:**
- **Process Orders** (PD Action, 1 param) — Complete/Void/Close/Reactivate on Sales Order, Purchase Order
- **Process Invoices** (PD Action, 4 params) — Complete/Void on Sales Invoice, Purchase Invoice
- **Process Shipment** (PD Action, 1 param) — Complete on Goods Shipment
- **APRM Process Invoice** (R&P Manual) — legacy invoice processing

**Checklist:**
- [ ] Action dropdown shows only valid actions for current document status
- [ ] Process button triggers the selected action
- [ ] Status transitions correctly (Draft → Completed, Completed → Voided, etc.)
- [ ] Fields become read-only after completion
- [ ] Lines tab becomes read-only after completion
- [ ] Toolbar updates (button availability per status)
- [ ] Accounting entries created on posting
- [ ] Reversal documents created on void (where applicable)
- [ ] Error messages for invalid transitions (e.g., void without permissions)
- [ ] Concurrent processing protection (two users processing same document)

#### 3.C.2 Process Summary Statistics

| Category | Count |
|----------|-------|
| **Report and Process — Total** | **305** |
| R&P Standard (S) | 135 |
| R&P Manual (M) | 170 |
| R&P Manual — Reports | 97 |
| R&P Manual — Background | 16 |
| R&P Manual — Action (non-report, non-background) | 57 |
| R&P Jasper Reports | 2 |
| **Process Definition — Total** | **131** |
| PD Action (A) | 32 |
| PD Manual (M) | 17 |
| PD Standard / Params in Dictionary (OBUIAPP_PickAndExecute) | 76 |
| PD Report / JR Templates (OBUIAPP_Report) | 5 |
| PD RX Action (ETRX_RxAction) | 1 |

---

## SECTION 4 — Display Logic

Display logic controls whether a field, tab, or section is visible in the UI based on the current record state. Expressions are evaluated client-side.

### 4.1 Syntax Reference

Display logic expressions use this grammar:

```
expression     = condition ( ('&' | '|') condition )*
condition      = '@' context_var '@' operator value
context_var    = column_name | '$' session_variable
operator       = '=' | '!' | '<' | '>' | '<=' | '>=' | '^'
value          = quoted_string | unquoted_token
```

#### Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Equals | `@IsActive@='Y'` |
| `!` | Not equals | `@Status@!'DR'` |
| `<` | Less than | `@Qty@<'0'` |
| `>` | Greater than | `@Amount@>'100'` |
| `<=` | Less than or equal | `@SeqNo@<='10'` |
| `>=` | Greater than or equal | `@LineNo@>='1'` |
| `^` | Starts with | `@Name@^'INV'` |

#### Logical Connectors

| Connector | Meaning |
|-----------|---------|
| `&` | AND |
| `\|` | OR |

**Note:** There is NO explicit grouping with parentheses in the standard syntax. However, some implementations in Etendo core do use parentheses — the evaluator handles `(expr)` grouping.

#### Context Variables

| Syntax | Source | Example |
|--------|--------|---------|
| `@ColumnName@` | Current record field value | `@IsActive@`, `@DocStatus@` |
| `@$SessionVar@` | Session/preference variable | `@$Element_BP@`, `@$HasAlias@` |
| `@#UserVar@` | User session context | `@#AD_Client_ID@` |
| `@ColumnName_ID@` | FK field raw ID value | `@M_Product_ID@` |

Common session variables (`$`-prefixed):
- `@$Element_BP@` — Business Partner accounting dimension enabled
- `@$Element_PR@` — Product accounting dimension enabled
- `@$Element_PJ@` — Project accounting dimension enabled
- `@$Element_AY@` — Activity dimension enabled
- `@$Element_MC@` — Sales Campaign dimension enabled
- `@$Element_SR@` — Sales Region dimension enabled
- `@$Element_LF@` — Location From dimension enabled
- `@$Element_LT@` — Location To dimension enabled
- `@$Element_U1@` — User Dimension 1 enabled
- `@$Element_U2@` — User Dimension 2 enabled
- `@$Element_CC@` — Cost Center dimension enabled
- `@$HasAlias@` — Account alias enabled

### 4.2 Real Examples from Etendo Core

#### Example 1: Simple Boolean Check
```
@HasRegion@='Y'
```
- **Window:** Country and Region
- **Tab:** Region
- **Meaning:** Show the Region tab only when the country has regions enabled
- **Trigger:** Toggle the `Has Region` checkbox on the Country header
- **Result:** Tab shows/hides

#### Example 2: Session Variable Check
```
@$Element_BP@='Y'
```
- **Window:** Accounting Transaction Details
- **Field:** Business Partner
- **Meaning:** Show Business Partner filter only if BP accounting dimension is enabled in General Ledger Configuration
- **Trigger:** System configuration — not per-record
- **Result:** Field visible/hidden

#### Example 3: Compound AND
```
@IsVendor@='Y' & @IsCustomer@='Y'
```
- **Window:** Business Partner
- **Tab:** Intercompany Documents
- **Meaning:** Show the Intercompany Documents tab only when the BP is both a vendor AND a customer
- **Trigger:** Toggle IsVendor and IsCustomer checkboxes
- **Result:** Tab visible only when both are checked

#### Example 4: List Value Equality
```
@BP_Settlement_Type@ = 'CR'
```
- **Window:** Business Partner Settlement
- **Tab:** Credit In / Credit Out
- **Meaning:** Show credit tabs only when settlement type is "Credit"
- **Trigger:** Change the Settlement Type dropdown to "Credit"
- **Result:** Credit tabs show; Invoice tabs hide

#### Example 5: Not-Equals Check
```
@Useastabledataorigin@!'Y'
```
- **Window:** Datasource
- **Tab:** Datasource field
- **Meaning:** Show the datasource field configuration tab only when NOT using table data origin
- **Trigger:** Toggle "Use as Table Data Origin" checkbox
- **Result:** Tab shows when checkbox is unchecked

#### Example 6: OR Connector
```
@Type_Value@='D' | @Type_Value@='DA'
```
- **Window:** Events
- **Tab:** Args Data
- **Meaning:** Show Args Data tab when event type is either 'D' (Data) or 'DA' (Data Array)
- **Trigger:** Change the Type dropdown
- **Result:** Tab visible for two specific type values

#### Example 7: Client-Level Restriction
```
@AD_CLIENT_ID@='0'
```
- **Window:** Client
- **Tab:** Secure web services configuration
- **Meaning:** Show this tab only for System Admin client (client ID = 0)
- **Trigger:** Only visible when logged in as System Administrator
- **Result:** Tab hidden for all non-system clients

#### Example 8: Compound AND with Session + Record Variables
```
@$Element_U1@='Y' & @User1_ID@!''
```
- **Window:** Account Combination
- **Field:** 1st Dimension
- **Meaning:** Show User Dimension 1 field only when the dimension is enabled AND a value is set
- **Trigger:** System config enables dimension + record has value
- **Result:** Field visible when both conditions met

#### Example 9: Complex Multi-Condition with Parentheses and OR
```
((@Processed@='Y' & @isReceipt@='Y') | @isReceipt@='N') | @Status@='RPAE'
```
- **Window:** Add Multiple Payments P&E
- **Field:** Amount (readonly logic)
- **Meaning:** Amount is read-only when: (processed AND is receipt) OR (not a receipt) OR status is RPAE
- **Trigger:** Multiple state combinations
- **Result:** Field becomes read-only under several conditions

#### Example 10: Multi-Value Exclusion (Complex Real-World)
```
@Wednesday@='Y' & @Allweekdays@='N' & @M_Offer_Type_ID@!'20E4EC27...' & @M_Offer_Type_ID@!'7B49D8CC...' & ...
```
- **Window:** Discounts and Promotions
- **Field:** Starting Time Wednesday / Ending Time Wednesday
- **Meaning:** Show per-day time fields only when: that weekday is enabled AND "All weekdays" is not checked AND the offer type is not one of several excluded types
- **Trigger:** Toggle Wednesday checkbox + ensure Allweekdays is unchecked + specific offer types
- **Result:** Per-day time range fields show/hide dynamically

### 4.3 Validation Checklist for Display Logic

- [ ] Simple equality (`@Field@='value'`) shows/hides field correctly
- [ ] Not-equals (`@Field@!'value'`) works correctly
- [ ] AND connector (`&`) requires ALL conditions to be true
- [ ] OR connector (`|`) requires ANY condition to be true
- [ ] Session variables (`@$Var@`) resolve from session context
- [ ] Empty string check (`@Field@!''` and `@Field@=''`) works
- [ ] Null check (`@Field@!null`) works
- [ ] Numeric comparisons work (`<`, `>`, `<=`, `>=`)
- [ ] FK ID fields resolve correctly (`@M_Product_ID@`)
- [ ] Display logic re-evaluates on EVERY field change (not just on save)
- [ ] Cascading display logic: Field A controls Field B which controls Field C
- [ ] Fields hidden by display logic are NOT submitted in save (or are ignored server-side)
- [ ] Mandatory fields hidden by display logic do NOT block save
- [ ] Grid/list view columns respect display logic
- [ ] Display logic with parentheses evaluates with correct precedence

---

## SECTION 5 — Tab-Level Behaviors

### 5.1 Tab Visibility (Tab Display Logic)

Tabs themselves can have display logic that controls their visibility. The expression syntax is identical to field display logic.

**Real examples from this instance:**

| Tab | Window | Display Logic | Meaning |
|-----|--------|--------------|---------|
| Region | Country and Region | `@HasRegion@='Y'` | Show only for countries with regions |
| Intercompany Documents | Business Partner | `@IsVendor@='Y' & @IsCustomer@='Y'` | Show only for dual-role BPs |
| Credit In | BP Settlement | `@BP_Settlement_Type@ = 'CR'` | Show only for credit settlements |
| Sales Invoices | BP Settlement | `@BP_Settlement_Type@ = 'INV'` | Show only for invoice settlements |
| Team Members | Agent | `@Apptype@ = 'langgraph'` | Show only for LangGraph agents |
| MCP Servers | Agent | `@Apptype@ ! 'langgraph'` | Show for non-LangGraph agents |
| Args | Events | `@Type_Value@='C'` | Show for type C events |
| Args Data | Events | `@Type_Value@='D' \| @Type_Value@='DA'` | Show for D or DA events |
| Path Management | Entity Mapping | `@Integration_Direction@='EtendoToExternalSystem'` | Direction-specific |
| Tabs | OpenAPI Request | `@Type@='ETRX_Tab'` | Show for Tab-type requests |

### 5.2 Read-Only Tabs

Tabs with `isreadonly='Y'` are entirely non-editable. No New/Save/Delete operations allowed.

**Real examples:**

| Tab | Window | Tab Level |
|-----|--------|-----------|
| Alert | Alert | 1 |
| All sub-tabs | Business Partner Info | 0-1 (all read-only — it's a Q window) |
| Lines | Employee Expenses | 1 |
| Employee | Employee Expenses | 0 |
| Goods Transaction | Goods Transaction | 0 |
| Heartbeat Log | Heartbeat Configuration | 1 |
| Used in Columns | Element | 1 |
| Lines | Invoiceable Expenses | 1 |

### 5.3 Tab UI Patterns

Tabs also have a `uipattern` field:

| Pattern | Meaning |
|---------|---------|
| `STD` | Standard — normal editable tab |
| `RO` | Read-Only — same as isreadonly=Y |
| `ED` | Editable grid — allows inline editing |
| `SR` | Single Record — form view only, no grid |

### 5.4 Tab Hierarchy

Tabs are organized in levels (`tablevel`):
- Level 0: Header/main tab
- Level 1: Direct child tabs
- Level 2: Grandchild tabs (child of level 1)
- etc.

**Real example — Sales Order tab hierarchy:**

| Tab | Level | Fields |
|-----|-------|--------|
| Header | 0 | 90 |
| Lines | 1 | 66 |
| Basic Discounts | 1 | 8 |
| Tax | 1 | 9 |
| Payment Plan | 1 | 16 |
| Replacement Orders | 1 | 6 |
| Line Tax | 2 | 9 |
| Intrastat | 2 | 17 |
| Reserved Stock | 2 | 13 |
| Related Products | 2 | 12 |
| Related Services | 2 | 6 |
| Payment Details | 2 | 27 |

### 5.5 Tab Validation Checklist

- [ ] Tab display logic shows/hides tabs correctly based on header record state
- [ ] Tab display logic re-evaluates when header fields change (without saving)
- [ ] Read-only tabs show no New/Save/Delete buttons
- [ ] Read-only tabs do not allow inline editing in grid
- [ ] Editable grid (ED) tabs allow inline cell editing
- [ ] Single Record (SR) tabs only show form view
- [ ] Tab level hierarchy renders correctly (indented navigation or breadcrumb)
- [ ] Selecting a child tab filters records by parent record
- [ ] Creating new record in child tab inherits parent FK automatically
- [ ] Tab sequence (order) matches `seqno` configuration
- [ ] Navigating between tabs preserves parent record selection
- [ ] Tab count badges (if shown) are accurate
- [ ] All tabs load their grids independently (not all at once)
- [ ] Switching tabs with unsaved changes on current tab warns before discarding
- [ ] Tab navigation does NOT re-fetch the parent record data

---

## SECTION 6 — Callouts

### 6.1 What Callouts Are

A callout is server-side (or client-side) logic that fires when a specific field value changes. It can:
- Auto-fill other fields
- Validate the changed value
- Recalculate derived fields
- Show warning/info messages
- Filter dropdown options in related fields

Callouts are defined in `ad_callout` and linked to columns via `ad_column.ad_callout_id`.

### 6.2 How to Identify Callouts in the AD

```sql
SELECT co.name, col.name AS column_name, t.name AS tab, w.name AS window
FROM ad_callout co
JOIN ad_column col ON col.ad_callout_id = co.ad_callout_id
JOIN ad_table tbl ON col.ad_table_id = tbl.ad_table_id
JOIN ad_tab t ON tbl.ad_table_id = t.ad_table_id
JOIN ad_window w ON t.ad_window_id = w.ad_window_id
WHERE co.isactive = 'Y';
```

### 6.3 Real Examples from Etendo Core

#### Example 1: SE_Payment_BPartner
- **Window:** Add Multiple Payments P&E, Payment In, Payment Out
- **Field:** Business Partner
- **Description:** "Selects payment method and financial account related to business partner"
- **Effect:** When BP is selected, auto-fills Payment Method and Financial Account fields based on BP's default payment configuration

#### Example 2: SE_PaymentMethod_FinAccount
- **Window:** Accounting Dimension, Add Multiple Payments P&E, Payment windows
- **Field:** Payment Method
- **Description:** "This callout filters the Financial Accounts for selected Payment Method"
- **Effect:** Changes the available options in the Financial Account dropdown

#### Example 3: SE_Payment_MultiCurrency
- **Window:** Add Multiple Payments P&E, Payment In, Payment Out
- **Fields:** Amount, Currency, Financial Transaction Amount, Financial Transaction Convert Rate, Payment Date, Generated_Credit
- **Description:** "Updates fields affected by multicurrency in Payment In / Out windows"
- **Effect:** Recalculates exchange rates, converted amounts when currency or amount changes

#### Example 4: SL_Product_Type
- **Window:** Accounting Dimension (Product Dimension)
- **Field:** Product Type
- **Description:** "This callout changes the value of the stocked field if the product type is Service"
- **Effect:** Auto-unchecks "Stocked" when Product Type changes to Service

#### Example 5: SE_ElementValue_AccountSign
- **Window:** Account Tree
- **Field:** Account Type
- **Description:** "It sets account sign based on account type"
- **Effect:** Auto-selects Debit/Credit sign based on account type (Asset=Debit, Liability=Credit, etc.)

#### Example 6: SL_BankStmt_Amount
- **Window:** Bank Statement
- **Fields:** Charge Amount, Convert Charge Amount, Statement Amount
- **Effect:** Recalculates statement amounts when charge amounts change

#### Example 7: SL_Production_Conversion / SL_Production_Product
- **Window:** Bill of Materials Production
- **Fields:** Product, Order Quantity, Order UOM, Conversion Rate, Process Quantity, Production Quantity
- **Effect:** Selects BOM for product; recalculates quantities with UOM conversion

#### Example 8: MetadataOnTab
- **Window:** Attachment Method
- **Field:** Attachment Method
- **Description:** "Populates the sequence number based on the existing metadata assigned to the tab"
- **Effect:** Auto-assigns next sequence number

#### Example 9: SL_AdvPayment_Document
- **Window:** Add Multiple Payments P&E
- **Field:** Document Type
- **Description:** "Document number generation"
- **Effect:** Auto-generates document number based on selected document type sequence

#### Example 10: SL_Budget_Product
- **Window:** Budget
- **Field:** Product
- **Effect:** Auto-fills related fields when product is selected in budget lines

### 6.4 Callout Validation Checklist

- [ ] Callout fires immediately when the triggering field value changes
- [ ] Callout does NOT fire on record load (only on user-initiated change)
- [ ] Auto-filled fields show updated values without page refresh
- [ ] Callout-modified fields are visually distinguished (brief highlight)
- [ ] Multiple callouts on the same field execute in correct order
- [ ] Callout on one field that changes another callout-enabled field triggers cascade
- [ ] Callout works in form view
- [ ] Callout works in grid inline-edit mode (if applicable)
- [ ] Callout error messages display correctly
- [ ] Callout warning messages display correctly (non-blocking)
- [ ] Callout does not fire when field is programmatically set (e.g., by another callout)
- [ ] Callout response time is acceptable (no UI freeze)
- [ ] Callout works with selector fields (fires after selection from popup)
- [ ] Callout works with date picker fields (fires after date selection)

---

## SECTION 7 — Record State Machine

### 7.1 Document Statuses

All possible document statuses (from `All_Document Status` reference list):

| Code | Name | Description |
|------|------|-------------|
| `DR` | Draft | Initial state, fully editable |
| `IP` | Under Way | Processing in progress |
| `CO` | Completed | Processed, generally read-only |
| `CL` | Closed | Permanently closed |
| `VO` | Voided | Cancelled/voided |
| `RE` | Re-Opened | Previously completed, now re-opened |
| `NA` | Not Accepted | Rejected |
| `WP` | Not Paid | Awaiting payment |
| `TEMP` | Temporal | Temporary state |
| `??` | Unknown | Undefined state |

### 7.2 Document Actions

Available actions (from `All_Document Action` reference list):

| Code | Name | Description |
|------|------|-------------|
| `--` | None | No action |
| `CO` | Complete | Complete the document |
| `AP` | Approve | Approve the document |
| `PR` | Process | Process the document |
| `PO` | Post | Post to accounting |
| `RE` | Reactivate | Reactivate to draft |
| `VO` | Void | Void the document |
| `RC` | Void | Void (alternate code) |
| `CL` | Close | Close the document |
| `RA` | Reverse - Accrual | Reverse with accrual |
| `RJ` | Reject | Reject the document |
| `XL` | Unlock | Unlock a locked document |

### 7.3 Valid State Transitions

```
                    ┌──────────┐
                    │  Draft   │ (DR)
                    │ (editable)│
                    └─────┬────┘
                          │ Complete (CO)
                          ▼
                    ┌──────────┐
               ┌────│ Completed│ (CO)
               │    │(read-only)│
               │    └──┬───┬───┘
               │       │   │
    Reactivate │  Close│   │ Void
      (RE)     │  (CL) │   │ (VO/RC)
               │       │   │
               ▼       ▼   ▼
          ┌────────┐ ┌────┐ ┌──────┐
          │  Draft │ │Closed│ │Voided│
          │  (DR)  │ │(CL)  │ │(VO)  │
          └────────┘ └──────┘ └──────┘
```

**Per document type specifics:**

| Document Type | Typical Statuses | Special Behavior |
|---------------|------------------|------------------|
| Sales Order | DR → CO (Booked) → CL | Can close partially delivered orders |
| Purchase Order | DR → CO → CL | Can reactivate if no receipts |
| Sales Invoice | DR → CO → VO | Void creates reversal invoice |
| Purchase Invoice | DR → CO → VO | Void creates reversal |
| Goods Shipment | DR → CO | Usually no reactivate |
| Goods Receipt | DR → CO | Usually no reactivate |
| Payment In/Out | DR → CO → VO | Void reverses the payment |
| G/L Journal | DR → CO → VO | Can void to reverse entries |
| Physical Inventory | DR → CO | Count → adjustment |

### 7.4 Button Availability per Status

| Status | Complete | Reactivate | Void | Close | Post |
|--------|----------|------------|------|-------|------|
| Draft | ✅ | ❌ | ❌ | ❌ | ❌ |
| Completed | ❌ | ✅* | ✅* | ✅ | ✅ |
| Closed | ❌ | ❌ | ❌ | ❌ | ❌ |
| Voided | ❌ | ❌ | ❌ | ❌ | ❌ |

*Availability of Reactivate and Void depends on document type configuration and whether related documents exist.

### 7.5 Field Editability per Status

| Status | Header Fields | Line Fields | New Lines | Delete Lines |
|--------|---------------|-------------|-----------|-------------|
| Draft | ✅ Editable | ✅ Editable | ✅ | ✅ |
| Completed | ❌ Read-only | ❌ Read-only | ❌ | ❌ |
| Closed | ❌ Read-only | ❌ Read-only | ❌ | ❌ |
| Voided | ❌ Read-only | ❌ Read-only | ❌ | ❌ |
| Re-Opened | ✅ Editable | ✅ Editable | ✅ | ✅ |

**Note:** Some fields may have specific `readonlylogic` that makes them read-only even in Draft status based on other conditions. For example, in Add Multiple Payments:
- `@Processed@='Y'` → Business Partner, Document No., Account, Payment Method become read-only
- `@Processed@='Y' & @status@!'RPAE'` → Payment Date, Payment Method read-only unless status is RPAE

### 7.6 State Machine Validation Checklist

- [ ] New documents always created in Draft status
- [ ] Complete action transitions to Completed
- [ ] Complete validates required data (lines exist, quantities > 0, etc.)
- [ ] Completed document fields are read-only
- [ ] Reactivate returns to Draft (where allowed)
- [ ] Reactivate blocked when dependent documents exist (e.g., invoice linked to shipment)
- [ ] Void creates reversal document (for invoices, payments)
- [ ] Voided documents are fully read-only
- [ ] Close permanently prevents further changes
- [ ] Post action creates accounting entries
- [ ] Undo Post removes accounting entries and returns to Completed
- [ ] Document action dropdown shows ONLY valid actions for current status
- [ ] Error message shown for invalid transitions
- [ ] Concurrent edit protection (two users processing same document)
- [ ] Process status bar updates in real-time

---

## SECTION 8 — Selectors and FK Fields

### 8.1 TableDir vs Table vs Search vs Selector

| Type | UI Widget | Data Source | When Used |
|------|-----------|-------------|-----------|
| **TableDir** | Dropdown | Auto from column name convention (`C_BPartner_ID` → `C_BPartner` table) | Simple FKs with small datasets |
| **Table** | Dropdown | Explicit table/column config in AD | Non-standard column names or custom display |
| **Search** | Text + popup | Search dialog with filters | Large datasets needing complex search |
| **Selector (OBUISEL)** | Typeahead autocomplete | HQL query with custom columns | Modern, preferred for all FK fields |
| **Multi Selector** | Tag/chip multi-select | HQL query | Many-to-many relationships |
| **SelectorAsLink** | Clickable link | HQL query | Display FK as navigation link |

### 8.2 Filtering Behavior

**TableDir / Table:**
- Filtered by: Organization (natural tree), Active records
- Additional filtering via Validation Rules (ad_val_rule)
- Example: Warehouse dropdown filtered by current organization

**Selector (OBUISEL):**
- Filtered by: HQL clause defined in `OBUISEL_Selector`
- Can include dynamic parameters: `@current_org@`, `@ad_client_id@`
- Example: Product selector with category filter

**Search:**
- Popup dialog with its own filter fields
- More flexible for complex lookups

### 8.3 Inactive Record Handling

- **In dropdowns/selectors:** Inactive records are NOT shown in the list
- **Already-selected inactive record:** The value still displays (it doesn't disappear), but typically shown in a different style (strikethrough or grayed out)
- **Saving with inactive FK:** May be blocked or warn depending on configuration

### 8.4 Selector Validation Checklist

- [ ] **TableDir:** Dropdown populated with correct records from referenced table
- [ ] **TableDir:** Organization filter applied correctly
- [ ] **TableDir:** Only active records shown
- [ ] **TableDir:** Validation rules restrict options correctly
- [ ] **Table:** Same as TableDir but with explicit table config
- [ ] **Search:** Popup opens with correct search fields
- [ ] **Search:** Search results filtered correctly
- [ ] **Search:** Selection populates the field
- [ ] **Search:** Clear selection works
- [ ] **Selector:** Typeahead triggers after min characters
- [ ] **Selector:** Results filtered by HQL definition
- [ ] **Selector:** Custom columns displayed in dropdown
- [ ] **Selector:** Selection populates field + triggers callout
- [ ] **Selector:** Performance acceptable (response time < 500ms)
- [ ] **Multi Selector:** Multiple selections as tags
- [ ] **Multi Selector:** Remove individual tags
- [ ] **Multi Selector:** All selected values persisted
- [ ] **SelectorAsLink:** Clicking navigates to referenced record
- [ ] Already-selected inactive records display correctly (not blank)
- [ ] Cascading selectors work (changing parent updates child options)
- [ ] Zoom icon (if present) navigates to referenced record's window

---

## SECTION 9 — Grid / List View Behaviors

### 9.1 Sorting

- Click column header to sort ascending, click again for descending
- Multi-column sort (shift+click) if supported
- Sort indicators visible (arrow up/down)
- Server-side sorting for large datasets
- Sort persistence within session

### 9.2 Filtering

- Column-level filters (text, date range, list selection)
- Advanced filter builder (multiple conditions with AND/OR)
- Quick filter / search bar
- Filter persistence within session
- Clear all filters

### 9.3 Pagination

- Page size configuration (10, 25, 50, 100 records)
- Page navigation (first, previous, next, last)
- Total record count display
- Smooth scrolling / virtual scrolling for performance

### 9.4 Inline Editing

- Available on tabs with `uipattern = 'ED'` (Editable Grid)
- Click cell to enter edit mode
- Tab between editable cells
- Save on row exit or explicit save
- Validation on cell exit
- Callouts fire on cell value change

### 9.5 Column Configuration

- Show/hide columns
- Reorder columns by drag
- Resize column width
- Column configuration persistence per user

### 9.6 Export

In the classic UI, export is handled by `exportData()` in [ob-grid.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/grid/ob-grid.js). It submits the current grid criteria (filters + sort) via a hidden form POST to the datasource URL with `exportToFile=true`. The server returns all matching records — **not just the visible page** — as a CSV file. The UTC offset is included for timezone-aware date export.

- Export to CSV (default format)
- Export to Excel (via Jasper exporters: `JRXlsExporter`, `JRXlsxExporter`)
- Export includes **all records matching current filters**, not just the visible page
- Export respects current sort order
- Export respects current column visibility configuration

### 9.7 Grid Validation Checklist

- [ ] Grid loads with correct columns per tab configuration
- [ ] Sorting by clicking column header works (ascending/descending toggle)
- [ ] Multi-column sort works (if supported)
- [ ] Sort indicators (arrows) visible
- [ ] Column filters work for text fields (contains/starts with)
- [ ] Column filters work for date fields (range)
- [ ] Column filters work for list fields (dropdown)
- [ ] Column filters work for numeric fields (range)
- [ ] Advanced filter builder works with AND/OR conditions
- [ ] Pagination controls work (next/prev/first/last)
- [ ] Page size selector works
- [ ] Total record count displayed and accurate
- [ ] Inline editing works for ED-pattern tabs
- [ ] Inline edit callouts fire correctly
- [ ] Inline edit validation works (mandatory, type)
- [ ] Column show/hide persists
- [ ] Column reorder persists
- [ ] Column resize persists
- [ ] Column filters work for YesNo fields (checkbox or tri-state)
- [ ] Column filters work for Selector/TableDir fields (search within FK display value)
- [ ] Export to CSV downloads ALL matching records (not just visible page)
- [ ] Export to Excel downloads ALL matching records
- [ ] Export respects active filters and sort order
- [ ] Grid handles 0 records gracefully (empty state message)
- [ ] Grid handles large datasets (1000+ rows) without UI freeze
- [ ] Row selection highlights correctly
- [ ] Double-click row opens form view
- [ ] Right-click context menu (if applicable)
- [ ] Grid refreshes correctly after process execution
- [ ] Column totals/summaries display (if configured)

---

## SECTION 10 — Cross-Cutting Behaviors

These behaviors apply across ALL window types and must be validated everywhere.

### 10.1 Audit Fields

Every record in Etendo has four audit fields:

| Field | Type | Description |
|-------|------|-------------|
| `Created` | DateTime | Timestamp of record creation |
| `CreatedBy` | FK → User | User who created the record |
| `Updated` | DateTime | Timestamp of last modification |
| `UpdatedBy` | FK → User | User who last modified |

**Checklist:**
- [ ] Audit fields display on every record
- [ ] All four fields are always read-only
- [ ] Created/CreatedBy set correctly on new record
- [ ] Updated/UpdatedBy change on every save
- [ ] DateTime format follows user locale
- [ ] CreatedBy/UpdatedBy show user name (not UUID)

### 10.2 Organization and Client Filtering

Etendo is multi-tenant (Client) and multi-organization within each client.

**Checklist:**
- [ ] Records only visible for user's accessible organizations
- [ ] Organization tree filtering works (parent org sees child org data based on config)
- [ ] New records default to user's current organization
- [ ] Organization dropdown only shows accessible organizations
- [ ] Client-level records (Org = *) visible to all orgs within client
- [ ] System-level records (Client = System) only visible to System Admin
- [ ] Switching organization context refreshes data correctly
- [ ] Cross-organization references respect access rules

### 10.3 Active / Inactive Record Filtering

**Checklist:**
- [ ] By default, only active records shown in grid
- [ ] "Show inactive" toggle/filter available
- [ ] Inactive records shown with visual distinction (strikethrough, gray)
- [ ] Deactivating a record (Active = N) hides it from grids on refresh
- [ ] Inactive records still accessible via direct link/URL
- [ ] FK selectors exclude inactive records
- [ ] Already-selected inactive FK values still display

### 10.4 Attachments

**Checklist:**
- [ ] Attachment button/icon visible in toolbar
- [ ] Upload attachment dialog works
- [ ] Multiple attachments per record
- [ ] Download attached file
- [ ] Delete attachment
- [ ] Attachment indicator shows when record has attachments
- [ ] File size limits enforced
- [ ] Supported file types configurable
- [ ] Attachments tied to correct record (survive Copy Record: should NOT copy)

### 10.5 Notes

**Checklist:**
- [ ] Notes button/icon in toolbar
- [ ] Add new note with text
- [ ] View note history (timestamp + author)
- [ ] Delete note (if allowed)
- [ ] Notes indicator when record has notes
- [ ] Notes associated with correct record

### 10.6 Copy Record

**Checklist:**
- [ ] Copy record button in toolbar
- [ ] Creates new record with copied field values
- [ ] Unique fields regenerated (Document No, Search Key)
- [ ] FK references preserved (Business Partner, Product, etc.)
- [ ] Audit fields reset (new Created/CreatedBy)
- [ ] Document status reset to Draft (for transaction windows)
- [ ] Copy from header level works
- [ ] Copy includes child records (configurable per window)
- [ ] Copy does NOT include attachments or notes
- [ ] Copied record is immediately editable

### 10.7 Zoom to Related Record

**Checklist:**
- [ ] FK fields show zoom icon (magnifying glass or link icon)
- [ ] Clicking zoom navigates to the referenced record in its own window
- [ ] Back navigation returns to the original record
- [ ] Zoom works for TableDir, Table, Search, and Selector fields
- [ ] Zoom opens correct tab when target record is in a child tab
- [ ] Zoom works from grid view (row context)
- [ ] SelectorAsLink references are clickable and navigate correctly

### 10.8 Keyboard Navigation

> **See Section 28 for the complete list of 43 keyboard shortcuts with exact key combinations.**

**Checklist:**
- [ ] Tab key moves between fields in form view
- [ ] Enter confirms/saves the current field edit
- [ ] Escape cancels current edit / closes form view
- [ ] Arrow keys navigate grid rows
- [ ] `Ctrl+D` creates new document (header record)
- [ ] `Ctrl+I` creates new row (inline grid record)
- [ ] `Ctrl+S` saves current record
- [ ] `Ctrl+Shift+X` saves and closes form view
- [ ] `Ctrl+Shift+Z` undoes unsaved changes
- [ ] `Ctrl+Delete` deletes current record (with confirmation)
- [ ] `Ctrl+Shift+R` refreshes the view
- [ ] All 43 shortcuts from `OBUIAPP_KeyboardShortcuts` preference are functional (see Section 28)

### 10.9 Error Handling

In the classic UI, errors are processed centrally by `setErrorMessageFromResponse()` in [ob-standard-view.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/main/ob-standard-view.js) and displayed via the `OBMessageBar` component ([ob-messagebar.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/main/ob-messagebar.js)) with four message types: `SUCCESS`, `ERROR`, `WARNING`, `INFO`.

**Field-level validation errors** are handled by `handleFieldErrors()` in [ob-view-form.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/form/ob-view-form.js) — the server returns a map of `{fieldName: errorMessage}` and the UI highlights each offending field and aggregates messages in the message bar.

**Grid-level errors** use `setRecordErrorMessage()` and `setRecordFieldErrorMessages()` in [ob-view-grid.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/grid/ob-view-grid.js) — records in error state get a `recordStyleError` CSS class and the edit button shows the error inline.

**Checklist:**
- [ ] Mandatory field validation shows clear error message identifying each field by label
- [ ] Field-level errors highlight the offending field visually (border color, icon)
- [ ] Multiple field errors aggregated in a single message bar notification
- [ ] Unique constraint violation shows user-friendly message (not raw SQL exception)
- [ ] FK constraint violation on delete shows descriptive message with referenced entity
- [ ] Server-side business validation errors (`OBError`) display with correct type (error/warning/info)
- [ ] Network errors (timeout, connection lost) show friendly message — not blank screen
- [ ] HTTP 500 errors show the server's error message, not a generic "Internal Server Error"
- [ ] Concurrent edit conflict detection — server returns conflict, UI prompts reload
- [ ] Session timeout redirects to login with explanatory message (see Section 11)
- [ ] Errors during save do NOT persist partial data — transaction rolled back server-side
- [ ] Error boundaries: a JS error in one component does not crash the entire application
- [ ] Errors in inline grid editing show per-row error indicator
- [ ] Large payload errors (413, file too large) show actionable message

### 10.10 Direct Tab Navigation

The function `OB.Utilities.openDirectTab()` allows programmatic navigation to a specific tab within any window, optionally opening a specific record. This is used by process response actions, linked items, zoom functionality, and deep links.

**Parameters supported:**
- `tabId` — target tab identifier
- `recordId` — specific record to open (optional)
- `command` — action: `NEW` (create new record), `DEFAULT` (open tab normally)
- `criteria` — additional HQL filter criteria for the tab
- `urlParams` — extra URL parameters

**Checklist:**
- [ ] Opening a direct tab navigates to the correct window and selects the correct tab
- [ ] Opening with `recordId` displays that specific record in form view
- [ ] Opening with `command=NEW` creates a new record in the target tab
- [ ] Opening with `criteria` filters the tab's grid to matching records
- [ ] If the target window is already open, it activates it (does not create duplicate)
- [ ] FK context data passed via `openDirectTab` populates correctly in the target

### 10.11 URL / Deep Linking

**Checklist:**
- [ ] Direct URL to a specific window works
- [ ] Direct URL to a specific record works (record ID in URL)
- [ ] URL updates when navigating between records
- [ ] Browser back/forward navigation works correctly
- [ ] Bookmark a specific record and return to it later
- [ ] Sharing a URL with another user opens the same record (respecting permissions)

### 10.12 Translations / Localization

The classic UI loads all labels via the `OB.I18N.getLabel(key, params)` mechanism ([ob-i18n.js](modules_core/org.openbravo.client.kernel/web/org.openbravo.client.kernel/js/ob-i18n.js)), with labels pre-populated from the AD at page load via [i18n.ftl](modules_core/org.openbravo.client.kernel/src/org/openbravo/client/kernel/templates/i18n.ftl). Labels not found locally are fetched on-demand from the server. Parameter substitution uses `%0`, `%1` placeholders.

Number formatting is configured in [application-js.ftl](modules_core/org.openbravo.client.kernel/src/org/openbravo/client/kernel/templates/application-js.ftl) via `OB.Format.defaultGroupingSymbol`, `OB.Format.defaultDecimalSymbol`, and `OB.Format.defaultGroupingSize` (hardcoded to 3). Conversion between display and internal formats is handled by `OBMaskedToOBPlain()` and `OBPlainToOBMasked()` in [ob-utilities-number.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/utilities/ob-utilities-number.js).

Date formatting is controlled by `dateFormat.java` (default: `dd-MM-yyyy`) and `dateTimeFormat.java` (default: `dd-MM-yyyy HH:mm:ss`) properties, exposed via [ApplicationComponent.java](modules_core/org.openbravo.client.kernel/src/org/openbravo/client/kernel/ApplicationComponent.java). Client-side normalization in [ob-utilities-date.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/utilities/ob-utilities-date.js) converts between Java and JS format patterns.

**Checklist:**
- [ ] Window titles translated per user language
- [ ] Field labels translated per user language
- [ ] Tab names translated
- [ ] List reference values translated
- [ ] Selector dropdown display columns translated
- [ ] Error messages and validation messages translated
- [ ] Menu entries translated
- [ ] Process parameter labels translated
- [ ] Date format follows user locale (`dd/MM/yyyy` vs `MM/dd/yyyy`)
- [ ] Date pickers respect locale (month names, first day of week)
- [ ] Decimal separator follows locale (`.` vs `,`)
- [ ] Thousands grouping separator follows locale (`,` vs `.`)
- [ ] Grouping size = 3 digits (consistent with classic UI)
- [ ] Amount/Price/Quantity fields display with correct locale formatting
- [ ] Currency symbol/code displayed correctly per currency record
- [ ] Number input fields accept locale-specific separator during typing
- [ ] Labels support parameter substitution (`%0`, `%1` placeholders)
- [ ] Missing labels fall back gracefully (show key, not crash)

### 10.13 Permissions and Security

**Checklist:**
- [ ] Windows not in role's window access are not accessible
- [ ] Tabs not in role's tab access are hidden
- [ ] Fields not in role's field access are hidden
- [ ] Read-only access renders window in read-only mode
- [ ] Process access restrictions enforced
- [ ] Organization access restrictions enforced
- [ ] Buttons/processes hidden when user lacks access
- [ ] Direct URL access to forbidden window shows access denied

### 10.14 Performance

**Checklist:**
- [ ] First page load (cold, after login): acceptable time
- [ ] Login authentication round-trip: acceptable time
- [ ] Window load (opening a window from menu): acceptable time
- [ ] Grid load with many records (1000+ rows): pagination loads without freeze
- [ ] Grid load on window with many tabs (10+ tabs, e.g. Sales Order): only active tab loads data
- [ ] Form view load for record with many fields (50+ fields): acceptable time
- [ ] Form save for record with many fields: acceptable time
- [ ] Tab switching within a window: does not re-fetch parent data
- [ ] Window switching (closing one, opening another): no memory leaks
- [ ] Selector typeahead response time < 500ms
- [ ] Callout response time < 1 second per field change
- [ ] Process execution shows progress for long-running operations
- [ ] No UI freeze during any asynchronous server operation
- [ ] Memory usage stable during extended use (no progressive degradation)
- [ ] Works with 10+ browser tabs open simultaneously
- [ ] Browser compatibility: Chrome, Firefox, Edge — same behavior

---

## SECTION 11 — Authentication, Session, and Authorization

### 11.1 Login / Logout

In the classic UI, login is handled by [LoginHandler.java](src/org/openbravo/base/secureApp/LoginHandler.java) which delegates credential validation to the pluggable `AuthenticationManager` ([AuthenticationManager.java](src/org/openbravo/authentication/AuthenticationManager.java)). On success, a session record is persisted in `AD_Session` via [SessionLogin.java](src/org/openbravo/erpCommon/security/SessionLogin.java).

The new UI uses JWT Bearer tokens via the Secure Web Services layer ([SecureLoginServlet.java](modules_core/com.smf.securewebservices/src/com/smf/securewebservices/service/SecureLoginServlet.java)). The login endpoint returns a JWT token with expiration.

Logout in the classic UI is a two-step process: [ob-logout-widget.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/navbar/ob-logout-widget.js) first closes all open tabs (processing a `logoutWorkQueue`), then calls [LogOutActionHandler.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/LogOutActionHandler.java) which invalidates the session and redirects.

**Checklist:**
- [ ] Login with valid credentials creates session and returns token
- [ ] Login with invalid credentials shows descriptive error (not generic "error")
- [ ] Login with expired password prompts password change
- [ ] Login respects license restrictions (max concurrent users, instance purpose)
- [ ] Logout invalidates session server-side (token no longer valid)
- [ ] Logout clears all client-side state (no stale data on re-login)
- [ ] Logout with unsaved changes warns before proceeding
- [ ] After logout, browser back button does not show authenticated content

### 11.2 Session Expiration and Token Renewal

The classic UI uses `SessionExpirationFilter` ([SessionExpirationFilter.java](src-core/src/org/openbravo/utils/SessionExpirationFilter.java)) which checks an `expirationDate` attribute on every request. The timeout duration is `maxInactiveInterval` (configured via `ws.maxInactiveInterval` in `gradle.properties`, currently 3600 seconds). AJAX calls marked with `ignoreForSessionTimeout=1` do NOT reset the expiration timer (preventing background polling from keeping sessions alive indefinitely).

**Checklist:**
- [ ] Session expires after configured inactivity period
- [ ] Token expiration is enforced — expired token returns 401
- [ ] Token refresh mechanism works before expiration (if implemented)
- [ ] Expired session redirects to login with explanatory message
- [ ] Background polling/heartbeat does NOT extend session lifetime
- [ ] Active user interaction (form editing, clicking) resets the expiration timer
- [ ] Multiple browser tabs share the same session — expiration affects all tabs
- [ ] After session expiry, any pending save operation shows error (not silent data loss)

### 11.3 Help & About

The Help & About widget ([ob-help-about-widget.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/navbar/ob-help-about-widget.js)) is a navigation bar dropdown with two links:

- **About:** Opens a popup (`about.html`, 620×500) showing version info, installed modules, license, Java/OS info
- **Help:** Conditionally shown when the current window has a help view configured; links to context-sensitive help

**Checklist:**
- [ ] About link opens popup with version, modules, license, system info
- [ ] Help link appears only when the current window has help configured
- [ ] Help link navigates to the correct context-sensitive help content
- [ ] Escape key closes the dropdown

### 11.4 Change Password

The User Profile widget includes a **Change Password** tab (alongside the Profile tab).

**Checklist:**
- [ ] Change Password tab accessible from User Profile widget
- [ ] Current Password field required and validated
- [ ] New Password field accepts input
- [ ] Confirm Password field validates match with New Password
- [ ] Successful password change shows confirmation message
- [ ] Wrong current password shows error
- [ ] Password policy requirements enforced (if configured)

### 11.5 Role and Organization Switching

Managed by the User Profile Widget ([ob-user-profile-widget.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/navbar/ob-user-profile-widget.js)) on the client side and [UserInfoWidgetActionHandler.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/navigationbarcomponents/UserInfoWidgetActionHandler.java) on the server side. The widget presents dropdowns for Role, Organization, Warehouse, and Language. Available organizations are filtered by role via [RoleInfo.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/navigationbarcomponents/RoleInfo.java) querying `ADRoleOrganization`. The context is stored in the ThreadLocal `OBContext` ([OBContext.java](src/org/openbravo/dal/core/OBContext.java)).

**Checklist:**
- [ ] User can switch role — available roles loaded from `AD_User_Roles`
- [ ] Switching role updates: menu, accessible windows, organization list, warehouse list
- [ ] User can switch organization — available orgs filtered by current role
- [ ] Switching organization updates: visible data, default org on new records, warehouse list
- [ ] User can switch warehouse — available warehouses filtered by current org
- [ ] User can switch language — UI re-renders with new translations
- [ ] "Set as default" option persists selection for future logins
- [ ] Current role/org/warehouse displayed in the navigation bar at all times
- [ ] After switch, all open windows refresh to reflect new context
- [ ] Organization tree filtering: parent org access includes child orgs per configuration

### 11.6 Access Control Enforcement

Menu filtering is performed by [MenuManager.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/MenuManager.java) which links windows (`ADWindowAccess`), processes (`ADProcessAccess`), and forms (`ADFormAccess`) and removes inaccessible nodes from the menu tree.

**Checklist:**
- [ ] Menu shows only entries accessible to the current role
- [ ] Windows not in `AD_Window_Access` for the role are not reachable
- [ ] Direct URL to a forbidden window shows access denied (not data leak)
- [ ] Tab-level access: tabs not granted are hidden
- [ ] Field-level access: fields not granted are hidden
- [ ] Read-only window access renders all fields as non-editable
- [ ] Process access: buttons for non-granted processes are hidden or disabled
- [ ] Organization access: records from non-accessible orgs are not returned by queries

---

## SECTION 12 — Navigation and Application Structure

### 12.1 Menu System

The menu tree is built by [GlobalMenu.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/GlobalMenu.java) using the role's primary menu tree (or default tree ID `10`). It is cached globally per `language + treeId` combination and cloned per request. Menu entries are typed as: `Window`, `Process`, `ProcessManual`, `Report`, `Form`, `External`, `Summary`, `View`, `ProcessDefinition`.

**Checklist:**
- [ ] Menu tree loads all entries from the role's menu tree
- [ ] Menu hierarchy (folders / sub-folders / entries) matches AD configuration
- [ ] Menu entry types route correctly: Window opens window, Process opens process, Report opens report, Form opens form, External opens URL
- [ ] Menu search/filter finds entries by partial name match
- [ ] Menu search is case-insensitive
- [ ] Menu entries respect translations per user language
- [ ] Clicking a menu entry opens the corresponding window/process/report
- [ ] Menu structure updates after role switch (reflects new role's access)

### 12.2 Recent Items

The classic UI tracks recent items client-side via `OB.RecentUtilities` ([ob-recent-utilities.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/utilities/ob-recent-utilities.js)), persisted to server as user preferences in `AD_Preference`. Three separate lists are maintained:

| Property Key | Content |
|---|---|
| `UINAVBA_MenuRecentList` | Recently opened menu entries (windows/processes) |
| `UBUIAPP_RecentDocumentsList` | Recently viewed individual records (document-level) |
| `OBUIAPP_RecentViewList` | Recently visited views |

Each entry stores: `windowId`, `tabId`, `title`, `icon`, `type`, `readOnly`. The maximum number of items is controlled by the `UINAVBA_RecentListSize` preference (default: 3).

**Checklist:**
- [ ] Recent windows list updated when opening a window
- [ ] Recent documents list updated when viewing a specific record
- [ ] Recent items list shows correct number of entries (per `RecentListSize` preference)
- [ ] Clicking a recent item navigates to the correct window/record
- [ ] Recent items persist across page refreshes (stored server-side)
- [ ] Recent items are per-user (not shared)
- [ ] Recent items update after role switch (only accessible items shown)
- [ ] Oldest items are evicted when list exceeds max size

### 12.3 Navigation Behavior

**Checklist:**
- [ ] Breadcrumb or contextual navigation shows current position (Window > Tab > Record)
- [ ] Browser back button navigates to previous view without inconsistent state
- [ ] Browser forward button works after using back
- [ ] Deep links: direct URL to a window opens that window
- [ ] Deep links: direct URL with record ID opens that specific record in form view
- [ ] URL updates when navigating between windows, tabs, and records
- [ ] Bookmarking a URL and returning later opens the same context
- [ ] Sharing a URL with another user (same role) opens the same view
- [ ] Sharing a URL with a user lacking access shows access denied (not error)
- [ ] Tab switching within a window does NOT trigger full data reload of other tabs
- [ ] Switching between windows does not lose unsaved changes without warning

---

## SECTION 13 — Record Creation, Editing, and Persistence

### 13.0 Form Initialization Modes

The server-side [FormInitializationComponent.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/window/FormInitializationComponent.java) handles form data preparation in four distinct modes:

| Mode | When | What it does |
|------|------|-------------|
| `NEW` | Creating a new record | Applies column default values, resolves context variables, runs initial callouts |
| `EDIT` | Opening an existing record | Loads stored values, computes read-only/display logic states, loads combo options |
| `CHANGE` | User changed a field value | Re-evaluates callouts for the changed field, recomputes dependent combos and auxiliary inputs |
| `SETSESSION` | Called from process/report context | Sets session variables from the current record without rendering a form |

**Processing sequence (NEW mode):**
1. Load parent record context and set session variables
2. Set column default values (`@#Date@`, `@AD_ORG_ID@`, `@SQL=...`, literals)
3. Compute validation dependencies (which combos need re-filtering)
4. Compute auxiliary inputs (derived/computed fields)
5. Execute initial callouts (auto-fill fields based on defaults)
6. Recompute auxiliary inputs after callouts (cascade effect)
7. Load combo/selector options filtered by current context

**Checklist:**
- [ ] `NEW` mode applies all default values before displaying the form
- [ ] `EDIT` mode loads all stored values correctly
- [ ] `CHANGE` mode fires callouts only for the changed field (and its cascades)
- [ ] `CHANGE` mode does NOT reset user-edited values in unrelated fields
- [ ] Callout cascade: a callout that sets Field B triggers Field B's callout
- [ ] Combo options re-filtered after context changes (parent FK, organization, etc.)
- [ ] Auxiliary inputs recomputed after callout chain completes

### 13.1 Form View — New Record

**Checklist:**
- [ ] "New" action (toolbar button or shortcut) clears form and enters creation mode
- [ ] All field default values populated from AD column configuration (`defaultvalue`)
- [ ] Default values from context variables resolved (`@AD_Org_ID@`, `@#Date@`, etc.)
- [ ] Mandatory fields visually distinguished (asterisk, bold label, or border)
- [ ] Organization field defaults to user's current active organization
- [ ] Auto-generated fields (sequences) populated on save, not on new
- [ ] Form in "new" mode does not show audit fields (or shows them empty)
- [ ] All 46 reference types render correctly for input in new mode (see Section 2)
- [ ] Saving a new record with all mandatory fields succeeds and returns the created record
- [ ] Saving with missing mandatory fields shows validation error per field
- [ ] After successful save, form transitions to "edit" mode with record ID

### 13.2 Form View — Edit Record

**Checklist:**
- [ ] Clicking a grid row opens the record in form view with all fields populated
- [ ] All field types display their stored values correctly (see Section 2 per type)
- [ ] Read-only fields (column `isreadonly = Y`) are not editable
- [ ] Read-only logic (`readonlylogic` expressions) evaluated and applied per field
- [ ] Computed/derived fields update when their dependencies change (via callouts)
- [ ] Editing a field marks the form as "dirty" (unsaved changes)
- [ ] Saving persists all changed fields and clears the dirty state
- [ ] Saving without changes does NOT trigger a server request (no unnecessary writes)
- [ ] Concurrent edit detection: if another user modified the record, show conflict

### 13.3 Inline Grid Editing

Available on tabs with `uipattern = 'ED'` (Editable Grid).

**Checklist:**
- [ ] Clicking a cell in an editable grid column enters edit mode for that cell
- [ ] Tab key moves to next editable cell in the row
- [ ] Enter confirms the cell edit and moves to next row
- [ ] Escape cancels the cell edit and restores original value
- [ ] Callouts fire on cell value change (same as form view)
- [ ] Validation errors on a cell prevent row save and highlight the cell
- [ ] Saving a row in inline edit persists immediately (auto-save on row exit)
- [ ] New row creation in grid works (empty row appears at bottom or top)
- [ ] Delete row from grid works with confirmation
- [ ] All editable reference types work in inline mode (selectors, dates, checkboxes, etc.)

### 13.4 Dirty Form and Unsaved Changes

**Checklist:**
- [ ] Navigating away from a dirty form shows a confirmation dialog ("Discard changes?")
- [ ] Switching tabs within a window with a dirty form warns before discarding
- [ ] Closing the browser tab with unsaved changes shows browser-level prompt
- [ ] Clicking "New" on a dirty form warns before clearing
- [ ] Selecting a different record in the grid with a dirty form warns
- [ ] The dirty indicator is visible in the UI (modified field highlight, save button state)
- [ ] Discarding changes restores the original values (re-fetches from server)

### 13.5 Deletion

**Checklist:**
- [ ] Delete action (toolbar button or shortcut) shows confirmation dialog
- [ ] Successful deletion removes the record from the grid and shows success message
- [ ] Deletion of a record with child records (FK dependencies) shows descriptive error
- [ ] Deletion of a record referenced by other records shows constraint error with entity name
- [ ] Deletion in grid view (with selected rows) supports multi-record delete
- [ ] Undo/restore is NOT expected — deletion is permanent after confirmation
- [ ] After deletion, the grid selects the next record (or shows empty state)

---

## SECTION 14 — Reports (Standalone Menu Access)

Reports accessible from the application menu (not just process buttons on windows) fall into two categories based on their entity type:

### 14.1 Report and Process (`ad_process`) Reports

These are `ad_process` records with `isreport = Y` and/or `isjasper = Y`, accessible via menu entries of type `Report` or `ProcessManual`. They use the classic HTML servlet framework.

**Real examples from menu:**
- General Ledger Report
- Customer Invoice Report
- Balance sheet and P&L structure
- Invoice Summary (3 params)
- Statement of Accounts (6 params)

**Checklist:**
- [ ] Report appears in the menu under the correct folder
- [ ] Clicking the menu entry opens the report parameter form
- [ ] Parameter form renders correctly (classic HTML or modern depending on `uipattern`)
- [ ] Submitting the form generates the report output
- [ ] HTML report output renders inline
- [ ] PDF output opens in browser viewer or downloads
- [ ] Excel output downloads correctly
- [ ] Report respects organization access — only data from accessible orgs shown
- [ ] Empty result set shows informative message (not blank output)

### 14.2 Process Definition (`obuiapp_process`) Reports

These are `obuiapp_process` records with `uipattern = 'OBUIAPP_Report'`, accessible via menu entries of type `ProcessDefinition`. They use the modern parameter popup and Jasper engine.

**Real examples from menu (11 reports):**
- General Ledger Report Advanced (23 params)
- Journal Entries Report Advanced (28 params)
- Balance Sheet and P&L Structure advanced (35 params)
- Trial Balance (14 params)
- Customer Statement (8 params)
- Aging Balance for Receivables/Payables (12-13 params)
- Purchase Invoice Dimensional Report (17 params)
- Valued Stock Report (6 params)

**Checklist:**
- [ ] Report appears in the menu under the correct folder
- [ ] Parameter popup renders with all AD-defined parameters
- [ ] Complex parameter forms (20+ params) layout correctly with scrolling
- [ ] Date range parameters validate from ≤ to
- [ ] Organization/client parameters respect access rules
- [ ] Default values populated (current org, current period, etc.)
- [ ] Report generates PDF output after parameter submission
- [ ] Excel export works where supported
- [ ] Report output includes parameter summary (which filters were applied)
- [ ] Large reports with many rows do not timeout
- [ ] Number and date formatting in output respects user locale
- [ ] Report respects organization access

---

## SECTION 15 — Loading Indicators and Feedback

The classic UI uses SmartClient's built-in loading state management for grids, supplemented by the `OBMessageBar` for explicit feedback. The `fetchingData` flag on grids ([ob-grid.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/grid/ob-grid.js)) tracks asynchronous data loads with a `fetchDelay` of 500ms.

**Checklist — loading indicators must be present for:**
- [ ] Login/authentication — indicator while credentials are validated
- [ ] Logout — indicator while session is invalidated and tabs are closed
- [ ] Application shell load — indicator while menu and initial state are fetched
- [ ] Window opening — indicator while window metadata and first tab data are loaded
- [ ] Tab switching — indicator while child tab data is fetched
- [ ] Grid data loading — indicator while rows are fetched (pagination, filter, sort)
- [ ] Form view loading — indicator while record detail is fetched
- [ ] Record save — indicator while server persists changes
- [ ] Record delete — indicator while server processes deletion
- [ ] Selector dropdown — indicator while typeahead results are fetched
- [ ] Callout execution — indicator (subtle) while server computes derived values
- [ ] Process execution — indicator while server runs the process (may be long-running)
- [ ] Report generation — indicator while server generates PDF/Excel output
- [ ] Export to CSV/Excel — indicator while server prepares the file

**Checklist — feedback messages:**
- [ ] Success messages on: save, delete, process completion
- [ ] Error messages on: validation failure, server error, network error
- [ ] Warning messages on: non-blocking issues (e.g., callout warnings)
- [ ] Info messages on: informational process results
- [ ] Messages auto-dismiss after timeout OR have explicit close button
- [ ] Messages do not overlap or stack uncontrollably
- [ ] Messages are visible regardless of scroll position (fixed or sticky)

---

## SECTION 16 — Final Consistency Validation (Classic vs New UI)

This section defines the acceptance criteria for confirming that the new UI is functionally equivalent to the classic Etendo UI. These checks should be performed as the final validation pass.

### 16.1 Data Parity

- [ ] Every window in the classic UI has a functional equivalent in the new UI
- [ ] The same user with the same role sees exactly the same menu entries in both UIs
- [ ] Opening the same window shows the same records (same default query, same filters)
- [ ] The same record shows the same field values in both UIs
- [ ] No fields are missing from any form (compare field count per tab)
- [ ] Field order matches (or is an intentional improvement)
- [ ] Grid columns match (same columns visible by default)
- [ ] Tab structure matches (same tabs in same order at same levels)

### 16.2 Behavioral Parity

- [ ] Callouts produce the same side effects (same fields auto-filled with same values)
- [ ] Display logic shows/hides the same fields under the same conditions
- [ ] Read-only logic makes the same fields read-only under the same conditions
- [ ] Tab display logic shows/hides the same tabs under the same conditions
- [ ] Document status transitions produce the same results
- [ ] Process execution produces the same results (same records created/modified)
- [ ] Selectors show the same filtered options for the same context
- [ ] Validation rules accept/reject the same values

### 16.3 Security Parity

- [ ] A user with read-only window access cannot edit in the new UI
- [ ] A user without process access cannot invoke the process in the new UI
- [ ] Organization access restrictions filter the same records
- [ ] Field-level and tab-level access hides the same elements
- [ ] System Administrator role has the same elevated access in both UIs

---

## SECTION 17 — Toolbar Buttons (Complete Reference)

The toolbar is the primary action bar visible at the top of every standard window. It is rendered by [ob-toolbar.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/toolbar/ob-toolbar.js) and populated via `OB.ToolbarRegistry`. Buttons are registered per tab and ordered by `sortPosition`. Modules can register additional custom buttons via `OB.ToolbarRegistry.registerButton()`.

### 17.1 Standard Toolbar Buttons (in default order)

These buttons are registered globally (all tabs) from `ob-toolbar.js`:

| #   | Button                 | Key                        | Sort | Keyboard Shortcut        | Action                                                                                                          |
| --- | ---------------------- | -------------------------- | ---- | ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| 1   | **New Document**       | `newDoc`                   | 10   | —                        | Creates a new record in form view (header-level). Clears form, populates defaults.                              |
| 2   | **New Row**            | `newRow`                   | 20   | —                        | Creates a new record in grid view (inline). Inserts editable empty row at grid top/bottom.                      |
| 3   | **Save**               | `save`                     | 30   | `ToolBar_Save`           | Persists the current record changes to the server.                                                              |
| 4   | **Save & Close**       | `saveclose` / `savecloseX` | 40   | `ToolBar_SaveClose`      | Saves the record and returns to grid view (closes form). Variant `savecloseX` used in some contexts.            |
| 5   | **Undo**               | `undo`                     | 50   | `ToolBar_Undo`           | Reverts the current dirty form to last-saved state. Discards unsaved changes.                                   |
| 6   | **Delete**             | `eliminate`                | 60   | `ToolBar_Eliminate`      | Deletes the current record (with confirmation dialog). Supports multi-record delete from grid selection.        |
| 7   | **Refresh**            | `refresh`                  | 70   | `ToolBar_Refresh`        | Reloads the current grid/form data from the server. Discards client-side cache for the tab.                     |
| 8   | **Export**             | `export`                   | 80   | `ToolBar_Export`         | Exports all grid records matching the current filters to CSV. Submits a hidden form POST to the datasource URL. |
| 9   | **Attachments**        | `attach` / `attachExists`  | 90   | `ToolBar_Attachments`    | Opens the attachment management dialog. Icon changes to `attachExists` when the record has attachments.         |
| 10  | **Link (Direct Link)** | `link`                     | 300  | `ToolBar_Link`           | Opens a dialog showing the direct URL to the current record for sharing/bookmarking.                            |

### 17.2 Template-Generated Buttons (per-window, from Java)

These buttons are generated by [OBViewTab.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/window/OBViewTab.java) and registered dynamically via `ob-standard-view.js` (sort position = `200 + index * 10`). They use `isc.OBToolbarActionButton` for processes or `isc.OBToolbarIconButton` for others. Button IDs follow the pattern `{tabId}_{index}`.

| Button | Condition | Action |
|--------|-----------|--------|
| **Clone** | Tab has `enableCopyRecord='Y'` or window-level copy configured | Clones the current record (and optionally child records). Registered via `OB.ToolbarUtils.addCloneButton()`. Sort 100, shortcut `ToolBar_Clone`. |
| **Print** | Tab has associated Jasper report or print process | Generates and opens the associated report/document (PDF). |
| **Email** | Tab has email configuration | Opens the "Send Mail" process dialog (recipients, template, attachments). |
| **Audit** | System setting enables audit trail | Opens the Audit Trail popup showing change history for the current record. |
| **Process Buttons** | Tab has Button columns linked to processes | One button per process; renders with the process name as label. These are the gear/cog buttons for Document Actions, posting, and custom processes. |

### 17.3 Personalization & View Management Buttons

Registered from personalization JS files, available on all tabs:

| Button | Key | Sort | Source File | Action |
|--------|-----|------|-------------|--------|
| **Personalize Form** | `personalization` | 310 | `ob-personalize-form-toolbar-button.js` | Opens form layout manager to rearrange/hide fields. Shortcut `ToolBar_Personalization`. |
| **Edit Personalization** | `edit_personalization` | 320 | `ob-personalize-form-toolbar-button.js` | Only on Window Personalization tab (`FF8081813157AED2013157BF6D810023`). Shortcut `ToolBar_Personalization_Edit`. |
| **Manage Views** | `manageviews` | 320 | `ob-manage-views-toolbar.js` | Opens dropdown menu with saved views, save/delete view options. Shortcut `ToolBar_ManageViews`. |

### 17.4 Upload/Import Buttons (tab-specific)

Registered from upload JS files, restricted to specific tabs:

| Button | Key | Sort | Target Tab | Action |
|--------|-----|------|------------|--------|
| **Import Products in Discount** | `ob-upload-import-product-in-discount` | 500 | `800082` (Discounts) | Opens file upload dialog to bulk-import products into a discount definition. |
| **Import BP in BP Set** | `ob-upload-import-bp-in-bp-set` | 500 | `BF972A02844E43AFAD23F3B25338E970` (BP Set) | Opens file upload dialog to bulk-import business partners into a BP set. |
| **Import BP in BP Set Line** | `ob-upload-import-bp-in-bp-set-line` | 510 | `7D7E6951FF4945AE9CC556C36E680DBA` (BP Set Line) | Same as above but for the BP set line tab. |

### 17.5 Module-Registered Buttons

These buttons are registered by installed modules via their `ComponentProvider` + JavaScript files:

| Module | Button | Key | Sort | Scope | Action |
|--------|--------|-----|------|-------|--------|
| **com.etendoerp.copilot** | Copilot | `etcop` | 500 | All tabs | Opens the Copilot AI assistant in a floating window (isc.Window with iframe). Sends context: windowId, tabId, tabTitle, selected records, form values. Supports minimize/maximize/full-screen modes. Communicates with embedded React app via `postMessage`. |
| **com.etendoerp.etendorx** | Init RX Services | `etrx_init_services` | 150 | Tab `157BE3AB99E6403592DE2F84BFA1B29F` (RX Config) | Calls `InitializeRXServices` ActionHandler via `OB.RemoteCallManager.call()`. Initializes EtendoRX service configurations. |
| **com.etendoerp.etendorx** | Config Middleware | `etrx_config_middleware` | 150 | Tab `FBC953B05883490DAA092C9E29BA58EB` (SSO Login) | Calls `ConfigEtendoMiddleware` ActionHandler. Configures Etendo middleware with current environment URL. |
| **com.smf.smartclient.boostedui** | Grid & Form | `gridAndFilter` | 700 | All tabs | Toggles split view showing grid and form simultaneously via `OB.Utilities.showGridAndForm()`. |
| **com.smf.smartclient.debugtools** | Remove Filters | `rmFilters` | 800 | All tabs (conditional) | Toggles window filter removal. Only registered when preference `SMFSCDT_EnableDebug = 'Y'`. Toggle style indicates active state. |
| **com.smf.smartclient.debugtools** | Show Hidden Fields | `showFields` | 800 | All tabs (conditional) | Shows all hidden fields in form view by iterating `form.dataSource.fields` and calling `field.show()`. Only in form mode. Conditional on `SMFSCDT_EnableDebug`. |
| **com.smf.smartclient.debugtools** | Show Grid ID | `showGridId` | 800 | All tabs (conditional) | Toggles the `id` column visibility in grid. Only in grid mode. Conditional on `SMFSCDT_EnableDebug`. |
| **com.smf.integrations.jira** | Profitability Report | `smfij_print` | 1000 | Tab `79BA74BB1F8249FABA76560809260C54` (Guest/Stay) | Calls `ProfiabilityActionHandler` to generate and download an Excel (.xls) profitability report. Disabled unless exactly 1 record selected in grid. |

### 17.6 Toolbar Behavior Overrides (Monkey-Patching)

Some modules override the behavior of existing standard buttons for specific tabs without using `registerButton`. They use SmartClient's `isc.addProperties()` to wrap the original action function:

| Module | Button Overridden | Target Tab | Override Behavior |
|--------|-------------------|------------|-------------------|
| **org.openbravo.module.remittance** | Delete (`eliminate`) | `CEE05A3E6C3F4624A6444039AD362993` (Remittance Lines) | Instead of standard delete, collects selected line IDs and calls `DeleteRemittanceLineActionHandler` via `OB.RemoteCallManager.call()`. Falls back to original action for all other tabs. |
| **org.openbravo.warehouse.pickinglist** | Delete (`eliminate`) | `2C7235D821114C619D8205C99F4ECCEA` (Picking List Lines) | Instead of standard delete, collects selected line IDs and calls `MvmtLineDeleteHandler` via `OB.RemoteCallManager.call()` with a confirmation dialog. Falls back to original action for all other tabs. |

**Pattern used:** Both modules save the original function (`isc.OBToolbar.addClassProperties({ MODULE_Original_DELETE_BUTTON_PROPERTIES_action: ... })`) and wrap it with a tab-ID check, calling the original for non-targeted tabs.

> **Important for new UI:** This monkey-patching pattern is inherently fragile and should be replaced by a proper hook/middleware system. The new UI should provide a `beforeDelete(tabId, records)` hook that modules can register for, avoiding the need to override core button behavior.

### 17.7 Button State Management

Every toolbar button implements `updateState()` which is called whenever the view state changes. The function evaluates:

- **View mode** (grid vs form) — some buttons only available in one mode (e.g., `showFields` only in form, `showGridId` only in grid)
- **Record selection** — buttons like Delete, Audit, Profitability require at least one record selected
- **Record state** — buttons may be disabled based on record status (e.g., no Delete on completed documents)
- **Dirty form** — Undo only enabled when form has unsaved changes; Save highlighted when dirty
- **Permissions** — buttons hidden when user lacks corresponding access (no Delete if editableReadonly window access)
- **New record mode** — Delete and Audit disabled on unsaved new records; Clone disabled on new records
- **Preference flags** — Debug tools buttons only appear when `SMFSCDT_EnableDebug = 'Y'`
- **Toggle state** — Some buttons change their icon/style to indicate active state (e.g., `rmFilters` toggles between enable/disable labels)

**Checklist:**
- [ ] All 10 standard buttons render in correct order with keyboard shortcuts
- [ ] Template-generated buttons (Clone, Print, Email, Audit) appear when configured
- [ ] Process buttons appear for all Button columns on the tab
- [ ] Personalization button opens form layout editor
- [ ] Manage Views button shows dropdown with saved views
- [ ] Upload/import buttons appear only on their designated tabs
- [ ] Module-registered buttons appear in correct sort position
- [ ] Tab-scoped buttons (EtendoRX, JIRA, Upload) only visible on their target tabs
- [ ] Copilot button opens floating window with context (selected records, form values, window/tab info)
- [ ] BoostedUI split view button toggles grid+form simultaneous display
- [ ] Debug tools buttons appear only when `SMFSCDT_EnableDebug` preference is `Y`
- [ ] Button states update correctly when switching between grid/form view
- [ ] Button states update when selecting/deselecting records in grid
- [ ] Button states update when form becomes dirty/clean
- [ ] Button states update after document status change
- [ ] Buttons respect role permissions (hidden/disabled for unauthorized actions)
- [ ] Buttons disabled on new unsaved records where appropriate
- [ ] Module behavior overrides (Delete on Remittance/Picking tabs) call correct ActionHandler
- [ ] Toolbar responsive: handles overflow when too many buttons for screen width
- [ ] New UI provides plugin API for modules to register buttons without monkey-patching

---

## SECTION 18 — Application Forms (ad_form)

Application Forms are standalone UI screens that do NOT follow the standard window/tab/field pattern. They are Java servlet-based or JavaScript-based screens with completely custom layouts. Configured in the `AD_Form` table, they appear in the menu with action type `X` (External) or are opened programmatically.

There are **21 active forms** in this installation:

### 18.1 System Administration Forms

| Form | Class | Description |
|------|-------|-------------|
| **Initial Client Setup** | `InitialClientSetup` | Wizard to create a new client from scratch with chart of accounts, calendar, etc. |
| **Initial Organization Setup** | `InitialOrgSetup` | Wizard to create a new organization within an existing client. |
| **Enterprise Module Management** | `UpdateReferenceData` | Manages module installation, updates, and dependency resolution. |
| **Instance Activation** | `InstanceManagement` | License activation and instance purpose configuration. |
| **Heartbeat** | `Heartbeat` | System health monitoring configuration popup. |
| **SQL Query** | `SQLExecutor` | Direct SQL query execution against the database with result display. |

### 18.2 Session & User Forms

| Form | Class | Description |
|------|-------|-------------|
| **About** | `About` | Displays version info, license, modules installed, Java/OS info. |
| **Session Preferences** | `ShowSessionPreferences` | View and edit session-level preferences (date format, language, etc.). |
| **Session Variables** | `ShowSessionVariables` | Debug view of all current session context variables. |
| **Logout** | `Logout` | Session termination form. |
| **Menu** | `Menu` | The application menu tree form. |

### 18.3 Business Process Forms

| Form | Class | Description |
|------|-------|-------------|
| **Create Invoices from Orders** | `GenerateInvoicesmanual` | Batch process: generates invoices from pending sales orders. Filter criteria + process execution. |
| **Create Shipments from Orders** | `GenerateShipmentsmanual` | Batch process: generates shipments from pending sales orders. |
| **Pending Goods Receipts** | `MaterialReceiptPending` | View of pending purchase order lines with process to create goods receipts. |
| **Requisition To Order** | `RequisitionToOrder` | Converts purchase requisition lines into purchase order lines. |
| **GL Posting by DB Tables** | `CallAcctServer` | Re-runs the accounting posting engine for selected document tables. |
| **Settle / Protest Remittances** | `CancelReturnRemittance` (Remittance module) | Operates on payment remittance lines: settle, protest, return. |

### 18.4 Other Forms

| Form | Class | Description |
|------|-------|-------------|
| **Alert Management** | `AlertManagement` | Manages and views fired alerts. Also exposed as a view (`OBUIAPP_OpenView`). |
| **Audit Trail** | `AuditTrailPopup` | Displays field-level change history for a record (popup, not standalone). |
| **Background Process** | `BackgroundProcessList` | Lists and manages background scheduled processes. |
| **Import/Export Translations** | `Translation` | Import or export language translation files for localization. |
| **Multi Business Partner Selector** | `ExampleSelectorUsage` | Example/utility form for multi-BP selection pattern. |

> **Note:** The original instance listed 22 forms. One form is inactive in this installation, leaving 21 active forms total. The **Settle / Protest Remittances** form comes from the `org.openbravo.module.remittance` module.

### 18.5 Form Validation Checklist

- [ ] Each form is accessible from its menu entry
- [ ] Form renders its custom layout correctly
- [ ] Form parameters/filters work
- [ ] Form actions execute correctly (process, import, export)
- [ ] Form results display correctly
- [ ] Form respects role access (menu access controls visibility)
- [ ] Wizard-style forms (Initial Client/Org Setup) navigate steps correctly
- [ ] SQL Query form safely executes read queries and displays results
- [ ] Import/Export Translations form handles file upload/download
- [ ] Audit Trail popup shows correct change history with timestamps and users
- [ ] About dialog shows accurate version and module information

---

## SECTION 19 — Linked Items (Cross-References)

### 19.1 What Linked Items Are

Linked Items is a collapsible section at the bottom of every form view (below all field groups), rendered by [ob-view-form-linked-items.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/form/ob-view-form-linked-items.js). It displays records from other tables that reference the current record, providing quick navigation to related data without manually opening other windows.

### 19.2 How It Works

- The section title is "Linked Items" and it is **collapsed by default**
- It is **not shown for new/unsaved records** (only existing records)
- When expanded, it makes a server call to fetch linked records
- Server-side handler: [LinkedItemsActionHandler.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/window/LinkedItemsActionHandler.java) queries FK relationships
- Results are grouped by entity type (e.g., "Sales Order Lines", "Payments", "Shipments")
- Each linked item is a clickable link that navigates (zooms) to that record in its own window

### 19.3 Real Examples

For a **Business Partner** record, linked items may show:
- Sales Orders referencing this BP
- Purchase Invoices referencing this BP
- Payments linked to this BP
- Shipments to/from this BP

For a **Sales Order** record:
- Invoice lines created from this order
- Shipment lines created from this order
- Payments linked to this order

### 19.4 Linked Items Validation Checklist

- [ ] Linked Items section appears at the bottom of form view for existing records
- [ ] Section collapsed by default
- [ ] Section NOT shown for new unsaved records
- [ ] Expanding section loads linked records from server
- [ ] Linked records grouped by entity type
- [ ] Each linked record shows identifier (document number, name, etc.)
- [ ] Clicking a linked record navigates to that record in its window
- [ ] Back navigation returns to the original record
- [ ] Performance acceptable (lazy-loaded on expand, not on form load)
- [ ] Empty state: "No linked items" message when no cross-references exist
- [ ] Respects organization access (does not show linked records from inaccessible orgs)

---

## SECTION 20 — Quick Launch (Global Search)

### 20.1 What Quick Launch Is

The Quick Launch widget is a search/command palette accessible from the navigation bar, implemented in [ob-quick-launch.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/navbar/ob-quick-launch.js). It allows users to quickly find and open windows, processes, reports, and forms by typing partial names.

### 20.2 How It Works

1. User clicks the Quick Launch icon in the navigation bar (or uses keyboard shortcut)
2. A search input field appears
3. As the user types, menu entries matching the input are listed (fuzzy/partial match)
4. Results include: windows, processes, reports, forms, external links
5. Clicking a result (or pressing Enter on highlighted result) opens that item
6. Also shows **Recent Items** sections:
   - Recent menu entries (`UINAVBA_RecentLaunchList`)
   - Recent documents (`OBUIAPP_RecentDocumentsList`)
   - Recent views (`OBUIAPP_RecentViewList`)

### 20.3 Quick Launch Validation Checklist

- [ ] Quick Launch accessible from navigation bar
- [ ] Search input accepts text and filters results in real-time
- [ ] Results show matching menu entries (windows, processes, reports, forms)
- [ ] Partial name matching works (e.g., "sales" finds "Sales Order", "Sales Invoice")
- [ ] Case-insensitive search
- [ ] Results respect role access (only accessible items shown)
- [ ] Selecting a result opens the correct window/process/report/form
- [ ] Recent items sections display below search results
- [ ] Recent items are clickable and navigate correctly
- [ ] External links open in new browser tab
- [ ] Keyboard navigation through results (arrow up/down + Enter)
- [ ] Escape closes the Quick Launch popup

---

## SECTION 21 — Workspace / Dashboard (My Openbravo)

### 21.1 What the Workspace Is

The Workspace (historically called "My Openbravo") is the default landing page after login. It is a configurable dashboard built from Widget instances, managed by the OBKMO (Openbravo Kernel MyOpenbravo) module. Users can add, remove, rearrange, and configure widgets on their personal workspace.

### 21.2 Widget Framework

Widgets are defined in `obkmo_widget_class` and instantiated per user in `obkmo_widget_instance`. Each widget class has:

- **Widget Class** (`obkmo_widget_class`) — defines the widget type, its data source, and rendering
- **Widget Class Access** (`obkmo_widget_class_access`) — role-level access control
- **Widget Instance** (`obkmo_widget_instance`) — user-specific instance with position and configuration

Widget types include:
- **URL Widgets** (`obkmo_widget_url`) — embed external URLs in iframes
- **Query Widgets** (`obcql_widget_query`) — display data from HQL/SQL queries
- **Reference Widgets** (`obkmo_widget_reference`) — display data from named data references
- **Custom JS Widgets** — fully custom JavaScript rendering

### 21.3 Workspace Interactions

- **Add Widget:** User selects from available widget types and adds to workspace
- **Remove Widget:** User removes a widget from their workspace
- **Drag & Drop:** Widgets can be rearranged by drag-and-drop
- **Resize:** Some widgets support height/width adjustment
- **Configure:** Some widgets have per-instance configuration (parameters, filters)
- **Collapse/Expand:** Widgets can be collapsed to save space
- **Multi-column layout:** Workspace supports multiple columns of widgets

### 21.4 Workspace Validation Checklist

- [ ] Workspace loads as default landing page after login
- [ ] User's configured widgets load with correct data
- [ ] Add Widget functionality lists available widget types (filtered by role access)
- [ ] Remove Widget works
- [ ] Drag-and-drop rearrangement works and persists
- [ ] Widget configuration dialogs work (where applicable)
- [ ] Collapse/expand widgets works
- [ ] URL widgets load external content in iframe
- [ ] Query widgets display data correctly
- [ ] Widget data refreshes correctly (manual and periodic)
- [ ] Widget layout persists across sessions (server-side storage)
- [ ] Widgets respect organization/role context
- [ ] Performance: only visible widgets load data initially

---

## SECTION 22 — Field Groups (Form Sections)

### 22.1 What Field Groups Are

Field Groups (`ad_fieldgroup`) organize fields within a form into collapsible sections. They create visual groupings with a section header that users can expand/collapse. This prevents long forms from becoming overwhelming.

### 22.2 Configuration

- Each field can be assigned to a `ad_fieldgroup` via `ad_field.ad_fieldgroup_id`
- Field Groups have an `iscollapsed` flag controlling whether the section starts expanded or collapsed
- Fields within the same group are rendered together under the group's header
- Fields without a group appear in the default (ungrouped) section at the top of the form

### 22.3 Most Common Field Groups in This Installation

| Field Group | Default State | Fields Using It | Purpose |
|-------------|---------------|-----------------|---------|
| **Dimensions** | Expanded | 540 | Accounting dimension fields (BP, Product, Project, Activity, etc.) |
| **More Information** | Collapsed | 254 | Secondary fields not needed for primary data entry |
| **Reference** | Expanded | 65 | Reference/source document fields |
| **Amounts** | Expanded | 57 | Financial amount fields |
| **Business Partner** | Expanded | 56 | BP-related fields |
| **Status** | Expanded | 52 | Status/state fields |
| **Product** | Expanded | 45 | Product-related fields |
| **Scheduling** | Expanded | 25 | Schedule/timing fields |
| **Availability** | Collapsed | 24 | Availability configuration |
| **SMTP Server** | Expanded | 12 | Email server configuration |
| **Advanced settings** | Collapsed | 9 | Advanced configuration |

### 22.4 Field Group Validation Checklist

- [ ] Field groups render as collapsible sections with headers
- [ ] Section header displays the translated field group name
- [ ] Sections with `iscollapsed='Y'` start collapsed
- [ ] Sections with `iscollapsed='N'` or NULL start expanded
- [ ] Clicking the section header toggles expand/collapse
- [ ] Collapsed sections hide all their fields
- [ ] Expanding a section shows all fields within the group
- [ ] Collapse state persists within the session
- [ ] Fields without a group appear in the default section (above all groups)
- [ ] Multiple field groups on the same tab render in sequence
- [ ] Mandatory fields in collapsed sections: section auto-expands on validation error
- [ ] Field group ordering follows the field `seqno` ordering

---

## SECTION 23 — Status Bar (Bottom Bar)

### 23.1 What the Status Bar Is

The Status Bar is the bottom bar of every standard window view, rendered below the form/grid. It provides record navigation, record count, and key field summary information.

### 23.2 Components

1. **Record Navigation:** Previous/Next buttons to navigate between records without returning to grid
2. **Record Count:** Shows "Record N of M" indicator
3. **Maximize/Restore:** Toggle between maximized (form only) and split (grid+form) view
4. **Close:** Returns to grid-only view
5. **Show in Status Bar Fields:** Key fields marked with `isshowninstatusbar='Y'` are displayed in the status bar, giving a summary of the current record without scrolling the form

### 23.3 "Show In Status Bar" Fields

Fields with `isshowninstatusbar='Y'` on `ad_field` display their label and value in the status bar. This provides at-a-glance information about the current record.

**Real examples from this installation (20+ fields):**

| Field | Tab | Window |
|-------|-----|--------|
| Organization | Combination | Account Combination |
| General Ledger | Combination | Account Combination |
| Accounting Status / Processed | Header | Amortization |
| Depreciated Value / Plan / Fully Depreciated | Assets | Assets |
| Current Balance | Business Partner | Business Partner |
| Displayed Account | Bank Account | Business Partner |
| Document Status / Accounting Status | Header | Cost Adjustment |
| Validated | Costing Rule | Costing Rules |
| Settlement Status / Amounts | Header | Business Partner Settlement |

### 23.4 Status Bar Validation Checklist

- [ ] Status bar visible at the bottom of every standard window
- [ ] Previous/Next record navigation works correctly
- [ ] Record counter shows accurate position ("Record 5 of 47")
- [ ] Maximize button expands form to full height (hides grid)
- [ ] Restore button returns to split view (grid + form)
- [ ] Close returns to grid-only view
- [ ] "Show in Status Bar" fields display their labels and current values
- [ ] Status bar fields update when navigating between records
- [ ] Status bar fields update when the record is edited (before saving)
- [ ] Keyboard shortcuts for Previous (`Alt+Shift+PageUp`) and Next (`Alt+Shift+PageDown`) work
- [ ] Keyboard shortcut for Maximize/Restore (`Alt+Shift+Enter`) works
- [ ] Keyboard shortcut for Close (`Escape`) works

---

## SECTION 24 — Form Layout System

### 24.1 How Form Layout Works

The form layout is controlled by field-level properties in `ad_field` and rendered as a multi-column grid. The classic UI uses a **2-column layout by default** (label + field × 2 across the width).

### 24.2 Layout Properties on `ad_field`

| Property | Effect |
|----------|--------|
| `seqno` | Determines field order within the form (lower = earlier) |
| `startrow` | When `'Y'`, forces this field to start on a new row |
| `startnewline` | When `'Y'`, forces this field to begin a new line (similar to startrow) |
| `numcolumn` | Column span — how many columns the field occupies (default 1, max typically 2 for full-width) |
| `showingridview` | When `'N'`, field appears only in form view (hidden from grid) |
| `isfirstfocusedfield` | When `'Y'`, this field receives focus when the form opens |

### 24.3 Grid Column Configuration

| Property | Effect |
|----------|--------|
| `seqno_grid` (on `ad_field`) | Determines column order in grid view (may differ from form `seqno`) |
| `isselectioncolumn` (on `ad_column`) | **247 columns** — these are the columns shown as filter fields in the grid's filter row by default |
| `isidentifier` (on `ad_column`) | **1493 columns** — these compose the record's display string (what appears in dropdowns and FK references) |
| `issecondarykey` (on `ad_column`) | **8 columns** — secondary business key (e.g., Search Key) used for unique lookups |

### 24.4 Column-Level Metadata Affecting UI

| Flag | Count | UI Effect |
|------|-------|-----------|
| `isidentifier='Y'` | 1,493 | Column participates in the record identifier string |
| `isupdateable='N'` | 6,388 | Field is always read-only (regardless of readonlylogic) |
| `isparent='Y'` | 631 | Field is the FK to the parent tab's record (auto-set, usually hidden) |
| `isselectioncolumn='Y'` | 247 | Field appears as a filterable column in grid filter row |
| `isencrypted='Y'` | 14 | Field value encrypted in database; may display masked in UI |
| `issecondarykey='Y'` | 8 | Secondary unique key; used for record lookup by value |
| `istransient='Y'` | 1 | Virtual/computed field, not persisted to database |
| Read-only logic defined | 1,160 | Dynamic read-only based on expression evaluation |
| Display logic defined | 2,549 | Dynamic visibility based on expression evaluation |

### 24.5 Form Layout Validation Checklist

- [ ] Fields render in `seqno` order
- [ ] `startrow='Y'` forces field to new row (no adjacent field from previous row)
- [ ] `startnewline='Y'` forces new line
- [ ] Fields with large `numcolumn` span across columns correctly
- [ ] Text/Memo/Rich Text fields typically span full width
- [ ] `showingridview='N'` fields hidden from grid columns
- [ ] `isfirstfocusedfield='Y'` field receives focus on form open/new
- [ ] Grid columns ordered by `seqno_grid` (independent of form order)
- [ ] `isselectioncolumn` fields show in grid filter row
- [ ] `isupdateable='N'` fields are always read-only regardless of form state
- [ ] `isparent` fields are auto-populated with parent FK and typically hidden
- [ ] `isencrypted` fields display masked values
- [ ] Identifier fields compose the correct display string for FK references

---

## SECTION 25 — Default Value Expressions

### 25.1 Syntax Reference

Default values on `ad_column.defaultvalue` use a specific expression syntax evaluated when creating a new record. **5,614 columns** in this installation have default values defined.

### 25.2 Expression Types

| Pattern | Meaning | Count | Example |
|---------|---------|-------|---------|
| `@#Date@` | Current date from session context | 925 | Order Date defaults to today |
| `Y` / `N` | Literal string (for YesNo fields) | 863 / 798 | Active defaults to Y |
| `@AD_CLIENT_ID@` | Current client from context | 833 | Client field auto-filled |
| `@AD_ORG_ID@` | Current organization from context | 643+ | Organization field auto-filled |
| `SYSDATE` | Database system date | 277 | Timestamp fields |
| `0` | Literal zero | 211 | Numeric defaults |
| `@SQL=SELECT ...` | SQL query default | ~200 | `@SQL=SELECT COALESCE(MAX(LINE),0)+10 FROM C_ORDERLINE WHERE C_ORDER_ID=@C_Order_ID@` — next line number |
| `DR` / `CO` | Literal status codes | 15 / 7 | DocStatus defaults to Draft |
| `@C_Currency_ID@` | Currency from context | 9 | Default currency |
| `@ColumnName@` | Value from parent/context record | varies | Inherit from header |

### 25.3 SQL Default Values

SQL defaults (`@SQL=...`) execute a query to compute the default value. They can reference context variables within the SQL. Common patterns:

- **Next sequence number:** `@SQL=SELECT COALESCE(MAX(LINE),0)+10 FROM table WHERE parent_id=@Parent_ID@`
- **Next line number:** Same pattern for SeqNo fields
- **Default from configuration:** `@SQL=SELECT value FROM ad_preference WHERE ...`
- **Value from related record:** `@SQL=SELECT field FROM table WHERE id=@Related_ID@`

### 25.4 Default Value Validation Checklist

- [ ] Literal defaults (`Y`, `N`, `0`, `DR`) applied correctly on new record
- [ ] Context variable defaults (`@AD_ORG_ID@`, `@AD_CLIENT_ID@`) resolve from session
- [ ] Date default (`@#Date@`) resolves to today's date in user timezone
- [ ] SQL defaults (`@SQL=...`) execute and return correct values
- [ ] SQL defaults with context variable substitution work (`@Parent_ID@` in SQL)
- [ ] Default values do NOT override explicitly set values during creation
- [ ] Default values NOT applied when loading existing records
- [ ] Copy Record does NOT use defaults (preserves source values, except for unique fields)
- [ ] Defaults evaluated in correct order (column defaults before callout execution)

---

## SECTION 26 — Tab Default Filters and Sort Order

### 26.1 What Tab Filters Are

Tabs can define default filter and sort clauses that are applied automatically when the tab loads. These are configured via `filterclause` (SQL), `hqlfilterclause` (HQL), `orderbyclause`, and `hqlorderbyclause` on `ad_tab`.

### 26.2 Real Examples

| Tab | Window | HQL Filter | Sort Order |
|-----|--------|-----------|------------|
| Add Multiple Payments P&E | Add Multiple Payments P&E | `e.account.id = @FIN_Financial_Account.id@` | `paymentDate, documentNo` |
| Transaction | Financial Account | `not exists (select 1 from FIN_Reconciliation r where r = e.reconciliation and r.processed = true)` | `dateAcct, lineNo` |
| Import Entries | Data Import Entries | `importStatus='Initial' or importStatus='Error'` | `creationDate desc` |
| Check Printing | Check Printing | `e.status='NP'` | — |
| Header | Commission | `e.active='Y'` | — |
| Create Invoice Lines... | Create Invoice Lines From Order Lines | `@filterByDocumentsProcessedSinceNDaysAgo@` | `@orderByClause@` |
| Lines | Create Purchase Order Lines | `e.priceList.id = @Order.priceList@` | `product.name, product.characteristicDescription` |
| End Year Close | End Year Close | `e.organization.id = ad_org_getperiodcontrolallow(@#AD_Org_ID@)` | `year._identifier` |

### 26.3 Dynamic Filter Parameters

Some filter clauses use `@parameter@` substitution — the value is resolved from:
1. Parent record field values (e.g., `@FIN_Financial_Account.id@`)
2. Session context (e.g., `@#AD_Org_ID@`)
3. Preferences or configured parameters (e.g., `@filterByDocumentsProcessedSinceNDaysAgo@`)

### 26.4 Tab Filter Validation Checklist

- [ ] Default HQL filter applied when tab loads (only matching records shown)
- [ ] Default sort order applied when tab loads
- [ ] Context variable substitution in filters resolves correctly
- [ ] Parent record references in filter clauses resolve to current parent
- [ ] User can add additional filters on top of the default filter
- [ ] User can change sort order (overrides default)
- [ ] Filter clause does NOT prevent the user from seeing records they created
- [ ] Dynamic filter parameters (`@param@`) resolve correctly at runtime

---

## SECTION 27 — Multi-Window Tab Interface (MDI)

### 27.1 How Multi-Window Works

Etendo uses a Multi-Document Interface (MDI) where each opened window runs as an independent tab in a tab bar at the top of the application area. This is managed by the `OBTabSetMain` component.

### 27.2 Tab Bar Behaviors

- **Workspace tab** (tab 1, always present): The dashboard/workspace, always the leftmost tab
- **Window tabs**: Each opened window adds a tab with the window title
- **Tab ordering**: Tabs appear in the order windows were opened
- **Close tab**: Each tab has a close button (×); closes the window and frees resources
- **Active tab indicator**: The currently active tab is visually highlighted
- **Tab overflow**: When too many tabs are open, a scroll or overflow menu appears

### 27.3 Tab Bar Validation Checklist

- [ ] Opening a window from menu adds a new tab
- [ ] Re-opening the same window activates the existing tab (no duplicates)
- [ ] Closing a tab with unsaved changes warns before closing
- [ ] Close keyboard shortcut (`Alt+Shift+W`) closes the active tab
- [ ] Tab switching preserves each window's state (scroll position, selected record, filters)
- [ ] Navigate between tabs: `Alt+Shift+Left/Right` or `Ctrl+Space+Left/Right`
- [ ] `Alt+Shift+1` jumps back to the Workspace tab
- [ ] Tab bar handles overflow with 10+ open windows
- [ ] Closing all tabs returns to the Workspace
- [ ] Memory: closed tabs release their resources (no memory leak)

---

## SECTION 28 — Complete Keyboard Shortcuts Reference

The following keyboard shortcuts are configured in the `OBUIAPP_KeyboardShortcuts` preference. They are registered by [ob-keyboard-manager.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/utilities/ob-keyboard-manager.js).

### 28.1 Tab Navigation

| Shortcut | Alternative | Action |
|----------|------------|--------|
| `Alt+Shift+W` | — | Close selected tab |
| `Alt+Shift+↑` | `Ctrl+Space+↑` | Select parent tab (in tab hierarchy) |
| `Alt+Shift+↓` | `Ctrl+Space+↓` | Select child tab |
| `Alt+Shift+←` | `Ctrl+Space+←` | Select previous sibling tab |
| `Alt+Shift+→` | `Ctrl+Space+→` | Select next sibling tab |
| `Alt+Shift+1` | — | Jump to Workspace tab |

### 28.2 Toolbar Actions

| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | New Document (header-level record) |
| `Ctrl+I` | New Row (grid-level record) |
| `Ctrl+S` | Save |
| `Ctrl+Shift+X` | Save & Close |
| `Ctrl+Shift+Z` | Undo changes |
| `Ctrl+Delete` | Delete record |
| `Ctrl+Shift+R` | Refresh |
| `Ctrl+Shift+E` | Export to CSV |
| `Ctrl+Shift+A` | Attachments |
| `Ctrl+Shift+K` | Clone record |
| `Ctrl+Shift+P` | Print |
| `Ctrl+Shift+M` | Email |
| `Ctrl+Shift+Y` | Audit Trail |
| `Ctrl+Shift+U` | Direct Link |

### 28.3 Status Bar Navigation

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+PageUp` | Previous record |
| `Alt+Shift+PageDown` | Next record |
| `Alt+Shift+Enter` | Maximize / Restore form view |
| `Escape` | Close form / Cancel editing |

### 28.4 Grid Operations

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+F` | Focus grid filter row |
| `Escape` | Return focus to grid (from filter) |
| `Alt+Delete` | Clear all filters |
| `Alt+Shift+A` | Select all records |
| `Alt+Shift+N` | Deselect all records |
| `F2` | Edit selected row in grid (inline) |
| `Ctrl+F2` | Edit selected row in form view |
| `Escape` | Cancel inline editing |
| `Delete` | Delete selected records (from grid) |

### 28.5 Navigation Bar Shortcuts

| Shortcut | Action |
|----------|--------|
| Configurable | Open Application Menu (`NavBar_MenuButton`) |
| Configurable | Open Quick Launch search (`NavBar_QuickLaunch`) |
| Configurable | Open User Profile widget (`NavBar_OBUserProfile`) |
| Configurable | Logout (`NavBar_OBLogout`) |
| Configurable | Open Help & About (`NavBar_OBHelpAbout`) |
| Configurable | Open Form Personalization (`ToolBar_Personalization`) |

> These shortcuts are registered via `UINAVBA_KeyboardShortcuts` preference (separate from the `OBUIAPP_KeyboardShortcuts` preference that holds the 43 toolbar/grid shortcuts).

### 28.6 Field-Level Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Open selector popup (for Selector, SelectorAsLink, TreeItem fields) |
| `Alt+↓` | Show tree dropdown (for Tree fields) |
| `↓` | Move to tree (for Tree fields) |
| `Ctrl+Alt+Enter` | Open link-out / zoom to referenced record (from form) |

### 28.7 Keyboard Shortcuts Validation Checklist

- [ ] All 43 keyboard shortcuts from the preference are functional
- [ ] Shortcuts do not conflict with browser default shortcuts
- [ ] Alternative shortcuts (Ctrl+Space variants) work identically to primary
- [ ] Shortcuts disabled when user input is in a text field (except Ctrl+S, Escape)
- [ ] Shortcut hints visible in button tooltips
- [ ] Shortcuts customizable via `OBUIAPP_KeyboardShortcuts` preference (if exposed)

---

## SECTION 29 — Tree Views

### 29.1 What Tree Views Are

Some tabs have `hastree='Y'` which adds a tree navigation panel alongside the grid/form. This allows hierarchical browsing of records that have a parent-child relationship defined by a tree structure in `ad_tree`/`ad_treenode`.

### 29.2 Tree Types in This Installation

| Tree Code | Meaning | Trees |
|-----------|---------|-------|
| `MM` | Menu | 1 |
| `OO` | Organization | 3 |
| `PR` | Product Category | 3 |
| `BP` | Business Partner Group | 3 |
| `PJ` | Project | 3 |
| `AR` | Account (Element Value) | 3 |
| `SR` | Sales Region | 3 |
| `EV` | Element Value | 3 |
| `AY` | Activity | 2 |
| `CC` | Cost Center | 2 |
| `MC` | Campaign | 2 |
| `U1`, `U2` | User Dimensions 1 & 2 | 2 each |
| `TR` | Tax Report Group | 3 |
| `PC` | Product Characteristic | 2 |
| `AS` | Asset Group | 2 |

### 29.3 Tree-Enabled Tabs

Currently only **1 tab** has `hastree='Y'`:
- **User Defined Accounting Report Setup** — uses tree for hierarchical accounting report structure

However, tree rendering is also used by:
- The **Menu** system itself
- **Organization tree** in role/access configuration
- **Account tree** in chart of accounts navigation
- **Tree Reference** field type (Section 2.42)

### 29.4 Tree View Validation Checklist

- [ ] Tree panel renders alongside grid when tab has `hastree='Y'`
- [ ] Tree nodes expand/collapse correctly
- [ ] Selecting a tree node filters the grid to show that node's records
- [ ] Drag-and-drop node reordering (if supported by tree type)
- [ ] Tree respects organization access
- [ ] Tree Reference fields (Section 2.42) render their own tree selector popup
- [ ] Menu tree renders correctly with proper hierarchy

---

## SECTION 30 — Grouping in Grid View

### 30.1 What Grouping Is

Grid columns can be grouped, which reorganizes the grid into collapsible groups based on a column's values. For example, grouping Sales Order lines by Product Category creates expandable sections for each category.

### 30.2 Configuration

Grouping behavior is controlled by two preferences:
- `OBUIAPP_GroupingEnabled` — enables/disables the grouping feature
- `OBUIAPP_GroupingMaxRecords` — maximum records for which grouping is allowed (performance limit)

### 30.3 How It Works

1. User right-clicks on a column header → context menu includes "Group by this field"
2. Grid reorganizes into collapsible groups by unique values of that column
3. Each group header shows the value and record count
4. Groups can be expanded/collapsed
5. Multiple levels of grouping may be supported
6. "Ungroup" option removes the grouping

### 30.4 Grouping Validation Checklist

- [ ] Group by column available in context menu (when `OBUIAPP_GroupingEnabled` preference is set)
- [ ] Grouping reorganizes grid into collapsible sections
- [ ] Group headers show value + count
- [ ] Expand/collapse groups works
- [ ] Ungroup restores flat view
- [ ] Grouping respects active filters (only groups from filtered data)
- [ ] Performance: grouping respects `OBUIAPP_GroupingMaxRecords` limit
- [ ] Sorting within groups works correctly

---

## SECTION 31 — Data Import System

### 31.1 What Data Import Is

Etendo has a data import system that allows loading external data (CSV, XML) into database tables through an import buffer. The import process validates, transforms, and inserts/updates records.

### 31.2 Components

- **Import Entry** (`c_import_entry`) — central import buffer table
- **Data Import Entries** window — UI to view/manage import entries with default filter `importStatus='Initial' or importStatus='Error'`
- **Import Format** — defines field mappings for structured import
- **Import/Export Translations** form — specialized import for language translations

### 31.3 Import Entry Statuses

| Status | Meaning |
|--------|---------|
| `Initial` | Entry received, pending processing |
| `Error` | Processing failed, error recorded |
| `Processed` | Successfully imported |

### 31.4 Data Import Validation Checklist

- [ ] Import entries visible in Data Import Entries window
- [ ] Default filter shows only Initial and Error status entries
- [ ] Error details accessible for failed imports
- [ ] Reprocess failed entries after fixing data
- [ ] Import respects organization and client context
- [ ] Import/Export Translations form handles file upload for .xml/.csv translation files
- [ ] Import validates data types, mandatory fields, FK references before insert
- [ ] Large imports handle batch processing without timeout

---

## SECTION 32 — Alert System (Real-Time Notifications)

### 32.1 What the Alert System Is

The Alert system provides real-time notifications to users based on configurable rules. It consists of three layers:

1. **Alert Rules** (`ad_alertrule`) — SQL-based rules evaluated periodically by the background `Alert Process`
2. **Alerts** (`ad_alert`) — individual alert instances generated when a rule fires
3. **Alert Manager** (client-side) — polls the server every 50 seconds for new alerts

### 32.2 Client-Side Components

- **Alert Manager** ([ob-alert-manager.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/alert-management/ob-alert-manager.js)) — Polls the server via `OB.RemoteCallManager` at 50-second intervals. Maintains a list of listeners notified on new alerts.
- **Alert Icon** (`OBAlertIcon`) — Navigation bar icon showing the current unacknowledged alert count as a badge number.
- **Alert Grid** ([ob-alert-grid.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/alert-management/ob-alert-grid.js)) — Grid showing alert details, filterable and sortable.
- **Alert Management View** ([ob-alert-management-view.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/alert-management/ob-alert-management-view.js)) — The full alert management screen (accessible via menu as `OBUIAPP_OpenView`).

### 32.3 Alert Lifecycle

1. Background process evaluates alert rules on schedule
2. When rule SQL returns rows, alerts are created in `ad_alert`
3. Alert Manager polls server, detects new alerts
4. Alert Icon badge updates with unacknowledged count
5. User clicks icon → opens Alert Management view
6. User can acknowledge, comment on, or delete alerts

### 32.4 Alert Validation Checklist

- [ ] Alert Icon visible in navigation bar
- [ ] Badge count shows number of unacknowledged alerts
- [ ] Badge updates in real-time (within 50-second poll cycle)
- [ ] Clicking Alert Icon opens Alert Management view
- [ ] Alert Management view shows filterable/sortable grid of alerts
- [ ] Alert details show: rule name, description, generated date, record reference
- [ ] Acknowledge alert marks it as read (decrements badge count)
- [ ] Alert links navigate to the source record/window (if configured)
- [ ] Alerts filtered by role/organization access
- [ ] Performance: polling does NOT extend session timeout (uses `ignoreForSessionTimeout`)

---

## SECTION 33 — View Personalization (Saved Views)

### 33.1 What View Personalization Is

The Personalization framework allows users to save and restore custom view configurations for each window. It is implemented in [ob-manage-views.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/personalization/ob-manage-views.js) (client) and [PersonalizationActionHandler.java](modules_core/org.openbravo.client.application/src/org/openbravo/client/application/personalization/PersonalizationActionHandler.java) (server). View state is stored in the `OBUIAPP_UIPersonalization` table.

### 33.2 What Can Be Personalized

A saved view stores the complete window state as JSON:

**Grid State (per tab):**
- Which columns are visible/hidden
- Column order
- Column widths
- Active sort order
- Active filters
- Frozen columns

**Form State (per tab):**
- Field layout (position, visibility)
- First focused field
- Custom field arrangement

**Window State:**
- Parent/child tab split layout
- Maximized/minimized state

### 33.3 View Management Operations

- **Save View:** Store the current window configuration with a name
- **Save as Default:** Mark a view as the default for the user (auto-applied on window open)
- **Apply View:** Switch to a previously saved view configuration
- **Delete View:** Remove a saved view
- **Reset to System Default:** Discard all personalization and return to the AD-defined layout

### 33.4 Form Personalization

Beyond saved views, the **Form Personalization** feature ([ob-personalize-form.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/personalization/ob-personalize-form.js)) allows administrators to customize the form layout via a drag-and-drop interface accessible via a toolbar button ([ob-personalize-form-toolbar-button.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/personalization/ob-personalize-form-toolbar-button.js)).

This allows:
- Rearranging field positions within the form
- Hiding fields from the form
- Changing field group assignments
- Modifying the number of form columns

### 33.5 Personalization and Preference Levels

Both personalization and general preferences (`ad_preference`) follow a hierarchical override system. The preference resolution engine ([Preferences.java](src/org/openbravo/erpCommon/businessUtility/Preferences.java)) evaluates in this priority order (highest override wins):

1. **User + Window** — most specific: preference for this user on this window
2. **User** — user-level preference (applies to all windows)
3. **Role + Window** — role-specific preference for a window
4. **Role** — role-level preference
5. **Organization** — org-level preference (follows organization tree hierarchy)
6. **Client** — client-level preference
7. **System** — system-wide default (Client = 0, Org = 0)

Preferences have two types:
- **Property List** (`isPropertyList=Y`): Uses predefined `property` keys (e.g., `OBUIAPP_GroupingEnabled`)
- **Attribute** (`isPropertyList=N`): Uses custom `attribute` keys for ad-hoc settings

### 33.6 Personalization Validation Checklist

- [ ] Save View captures all grid column configuration (visibility, order, width)
- [ ] Save View captures sort and filter state
- [ ] Save View captures form layout
- [ ] Named views persist across sessions (stored server-side)
- [ ] Apply View restores complete configuration correctly
- [ ] Default view auto-applied when opening the window
- [ ] Delete View removes the saved configuration
- [ ] Reset to System Default restores AD-defined layout
- [ ] Multiple saved views per window supported
- [ ] User-level personalization overrides role-level
- [ ] Role-level personalization overrides system-level
- [ ] Form Personalization drag-and-drop works (admin only)
- [ ] Personalization persists correctly for each tab independently

---

## SECTION 34 — Calendar Views

### 34.1 What Calendar Views Are

Etendo includes a calendar widget framework for scheduling and time-based data visualization. Implemented in [ob-calendar.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/calendar/ob-calendar.js) and [ob-multicalendar.js](modules_core/org.openbravo.client.application/web/org.openbravo.client.application/js/calendar/ob-multicalendar.js).

### 34.2 Components

- **OBCalendar** — Single calendar view with day/week/month views
- **OBMultiCalendar** — Multiple calendars side-by-side with a legend and left-side controls
- **OBEventEditor** (`OBCalendar_EventDialogBridge`) — Custom event editor dialog for creating/editing calendar events

### 34.3 Calendar Features

- **View modes:** Day, Week, Month
- **Event display:** Events shown as colored blocks on the calendar
- **Event creation:** Click on a time slot to create a new event
- **Event editing:** Click on an existing event to open the editor
- **Drag & drop:** Move events by dragging them to a new time slot
- **Resize:** Resize events by dragging the edge (change duration)
- **Lanes:** OBMultiCalendar supports swim lanes (multiple resources/people)
- **Legend:** Color-coded legend for event categories
- **Navigation:** Previous/Next buttons to navigate time periods

### 34.4 Calendar Validation Checklist

- [ ] Calendar renders with correct view mode (day/week/month)
- [ ] Events display correctly at their time positions
- [ ] Navigate between days/weeks/months
- [ ] Create event by clicking time slot
- [ ] Edit event by clicking existing event
- [ ] Event editor dialog opens with correct fields
- [ ] Drag-and-drop event rescheduling works
- [ ] Event resize changes duration
- [ ] Multi-calendar shows multiple lanes correctly
- [ ] Color coding and legend display correctly
- [ ] Calendar respects user's timezone
- [ ] Calendar respects organization/role access for events

---

## SECTION 35 — View States (Form/Grid Layout)

### 35.1 Window Layout States

The standard window has four layout states that control the split between grid and form:

| State | Description |
|-------|-------------|
| `TOP_MAX` | Grid maximized — grid fills the window, form hidden |
| `BOTTOM_MAX` | Form maximized — form fills the window, grid hidden |
| `MID` | Split view — both grid and form visible, split by draggable divider |
| `MIN` | Minimized — depends on context |

### 35.2 How State Changes Occur

- **Double-click on grid row** → switches to `BOTTOM_MAX` (form view for that record)
- **Status bar Maximize button** (`Alt+Shift+Enter`) → toggles between `MID` and `BOTTOM_MAX`
- **Status bar Close button** (`Escape`) → returns to `TOP_MAX` (grid only)
- **New Document** (`Ctrl+D`) → switches to `BOTTOM_MAX` with empty form
- **Save & Close** (`Ctrl+Shift+X`) → saves and returns to `TOP_MAX`
- **Dragging the split divider** → adjusts the split ratio in `MID` state

### 35.3 View State Validation Checklist

- [ ] Grid-only view (`TOP_MAX`) shows full-height grid
- [ ] Form-only view (`BOTTOM_MAX`) shows full-height form
- [ ] Split view (`MID`) shows both grid and form with divider
- [ ] Double-click grid row opens form view with that record
- [ ] Maximize/Restore toggle works via status bar and keyboard shortcut
- [ ] Close returns to grid view
- [ ] Split divider is draggable to resize proportions
- [ ] Split position persists within session (or per saved view)
- [ ] Form-only view still shows status bar with navigation
- [ ] Grid-only view hides form completely (no blank space)

---

## Summary Statistics from This Installation

| Entity | Count |
|--------|-------|
| **Windows** | |
| Active Windows | 406 |
| Maintain (M) windows | 288 |
| Transaction (T) windows | 47 |
| Query (Q) windows | 12 |
| Pick & Execute (P&E) windows | 59 |
| **Processes** | |
| Report and Process (ad_process) | 305 |
| Process Definition (obuiapp_process) | 131 |
| **Application Forms (ad_form)** | **21** |
| **Reference Types (documented)** | **46** |
| **Document Statuses** | **10** |
| **Document Actions** | **12** |
| **Menu Entries** | |
| Window (W) | 325 |
| Summary/Folder (blank) | 84 |
| Report (R) | 52 |
| Process Definition (OBUIAPP_Process) | 31 |
| Process (P) | 23 |
| External / Form (X) | 13 |
| Open View (OBUIAPP_OpenView) | 1 |
| **Field-Level Metadata** | |
| Fields with Display Logic | 2,549 |
| Columns with Read-Only Logic | 1,160 |
| Columns with isIdentifier | 1,493 |
| Columns with isUpdateable=N | 6,388 |
| Columns with isParent | 631 |
| Columns with isSelectionColumn | 247 |
| Columns with isEncrypted | 14 |
| Columns with defaultvalue | ~5,600 |
| **Other** | |
| Standard Toolbar Buttons | 10 |
| Keyboard Shortcuts | 43 |
| Field Groups (form sections) | 25+ |
| Tree Types | 20 |

---

*Generated from Etendo Core + all installed modules. 35 sections, ~1000 checklist items. Counts updated 2026-03-31.*
