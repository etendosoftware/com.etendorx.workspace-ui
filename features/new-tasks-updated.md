# New Tasks (Updated) — Pending New UI completeness tasks

Filtered version of `new-tasks.md` that contains **only the tasks not yet created** (every task marked `[CREATED]` in the original document has been removed). Each task keeps its section of origin via the `[SEC-N]` prefix.

**Scope:** each task was reviewed one by one against the classic UI (code in `/erp` and data in `etendodev`) and the new UI (`client`). Tasks that are kept were rewritten where needed with the classic behavior to reproduce and the steps to test it; tasks whose premise did not hold were discarded with the reason in their metainformation. The end goal is to create the `To create` tasks in Jira; for now **no** connection to Jira is made.

**Test environment:** `/erp` (Etendo with all modules), `client` (new UI, latest version) and the `etendodev` database.

**Structure of each task:** Title (`[SEC-N]` + summary < 80 characters) · Description · Proposed solution · Test cases · Result · Metainformation.

**Total:** 24 tasks reviewed across 15 sections:

| Status | Count | Priority breakdown |
|--------|-------|--------------------|
| Created | 13 | Critical: 2 · Major: 4 · Minor: 6 · Trivial: 1 (ETP-5613 … ETP-5625) |
| Discarded | 10 | — |
| Pending analysis | 1 | `[SEC-17] Generic plugin API for module buttons` (needs a deeper design discussion) |

Sections whose tasks have all been created (or that never had tasks) state "No pending tasks. The section is complete.". At the end, the [Redundancies and groupings](#redundancies-and-groupings) section keeps only the relations that involve pending tasks.

## Jira priorities and task metainformation

Tasks are created in the Jira project **ETP (ETENDO PRODUCT)** as issue type **Task**. When a task is created, its **title** becomes the Jira *Summary* and the text that follows it (Description, Proposed solution, Test cases, Result) becomes the Jira *Description*. The **Metainformation** block at the end of each task is **not** sent to Jira.

**Available priorities in Jira** (field `priority`, default value: **Major**):

| Priority | Jira id | Meaning |
|----------|---------|---------|
| **Blocker** | 1 | Blocks development or use of the product; no workaround. Must be addressed immediately. |
| **Critical** | 2 | Severe impact on a core feature or on many users; a workaround may exist but is costly. |
| **Major** | 3 | Significant functional gap or parity issue with real user impact. Jira default. |
| **Minor** | 4 | Limited impact: robustness, UX, or parity improvement with an easy workaround or few affected cases. |
| **Trivial** | 5 | Cosmetic or text adjustment with no functional impact. |

**Metainformation fields** (added at the end of each task):

- **Status** — internal tracking only, **not sent to Jira**. Values:
  - `Pending analysis` — not yet reviewed.
  - `To create` — reviewed and approved for creation in Jira.
  - `Discarded` — reviewed and will not be created (add the reason next to the status).
  - `Created` — already created in Jira (add the issue key, e.g. `Created (ETP-1234)`).
- **Priority** — the Jira priority (one of the values in the table above) that will be set when the issue is created.

> The **⚠️** indicators inherited from the original analyses (priority, "verify before taking") are preserved because they affect the planning of each task.

---

## Section 1 — Window Types

No pending tasks. The section is complete.

---

## Section 2 — Field / Column Reference Types

No pending tasks. The section is complete.

---

## Section 3 — Process Types

No pending tasks. The section is complete.

---

## Section 4 — Display Logic

### [SEC-4] Support the `^` (starts-with) operator in the display logic parser

**Description:** the display logic grammar in the spec includes the `^` operator ("starts with", e.g. `@Name@^'INV'`). The current new UI parser does not translate it, so in JavaScript it would be interpreted as XOR and the condition would not work as in the classic UI. Currently no expression in the instance (core + bundles) uses it, so it is a robustness/parity improvement, not an active defect.

**Proposed solution:** extend the expression translation so that `@Campo@^'valor'` is evaluated as a prefix check on the field value (equivalent to "the value starts with the literal"), respecting the existing value normalization and context resolution. Keep the behavior of all other operators intact.

**Test cases:**

1. **Scenario:** Starts-with shows the field
   - Given: a display logic expression `@Name@^'INV'`
   - When: the field value starts with `INV`
   - Then: the field/tab is shown; otherwise it is hidden
2. **Scenario:** Combined with logical operators
   - Given: `^` combined with `&` and `|` and inside parentheses
   - When: the expression is evaluated
   - Then: it works respecting precedence
3. **Scenario:** No regression on other operators
   - Given: existing expressions using `=`, `!`, `<`, `>`, `<=`, `>=`
   - When: they are evaluated
   - Then: their behavior and existing expressions are unchanged (zero regression)
4. **Scenario:** Empty/null value handling
   - Given: an empty/null value in the evaluated field
   - When: the expression is evaluated
   - Then: no error occurs and it resolves to "not visible"

**Result:** the parser covers 100% of the documented operators, guaranteeing full parity with the classic syntax even though no expression uses `^` today.

**Metainformation:**

- Status: Created (ETP-5613)
- Priority: Minor

---

## Section 5 — Tab-Level Behaviors

### [SEC-5] Re-evaluate tab display logic with live header values

**Description:** the visibility of child tabs is recalculated only when the selected parent record changes (selection/save), not while the user is editing the header form. This differs from the classic UI, where an unsaved change in a header field that controls a tab (e.g. `@HasRegion@='Y'`) shows/hides the tab instantly.

The classic UI does this in `ob-view-form.js`: on every item change it calls `view.updateSubtabVisibility()`, which evaluates each child tab's `showTabIf` against the **current form context** (`getContextInfo`), not the persisted record. In the new UI, `TabsContainer` evaluates tab display logic against `useSelectedRecord` (the persisted record), so the visibility only updates after saving.

**Reproduction example (core, available in any environment):** window **Country and Region** (`AD_Window_ID = 122`), child tab **Region** with display logic `@HasRegion@='Y'`.

1. Open *Country and Region* and select a country that has regions (e.g. *Spain*, with *Has Region* checked). The **Region** tab is visible.
2. In the header form, uncheck *Has Region* **without saving**.
   - Classic UI: the **Region** tab disappears immediately.
   - New UI: the **Region** tab stays visible until the record is saved.
3. Check *Has Region* again without saving.
   - Classic UI: the **Region** tab reappears immediately.
4. Discard/undo the changes: visibility returns to the persisted record state.

**Proposed solution:** feed the tab display logic evaluation with the current values of the parent form (not just the persisted record), so that changing a field that affects a tab's visibility makes it appear/disappear in real time, reusing the existing display logic engine and its value normalization. Keep the reactive subscription only to the fields that each expression references.

**Test cases:**

1. **Scenario:** Live show/hide on header edit
   - Given: a header field that controls a tab (e.g. *Has Region* in *Country and Region*, controlling the **Region** tab)
   - When: the user edits it without saving
   - Then: the tab is shown/hidden immediately
2. **Scenario:** Cascade hide with live values
   - Given: a parent tab hidden by live values
   - When: it is hidden
   - Then: cascade hide still works (hiding the parent hides the children)
3. **Scenario:** Revert on discard/reload
   - Given: unsaved header changes affecting tab visibility
   - When: the record is discarded/reloaded
   - Then: visibility returns to the persisted record state
4. **Scenario:** No regressions or mass re-render
   - Given: tabs without display logic
   - When: the header is edited
   - Then: there are no regressions and no massive re-render (no performance impact)

**Result:** tab visibility reacts to live header changes, matching the classic UI behavior.

**Metainformation:**

- Status: Created (ETP-5614)
- Priority: Minor

### [SEC-5] Honor `isreadonly='Y'` at tab level independent of uipattern

**Description:** the client determines a tab's read-only mode only from `uIPattern`; a tab marked `isreadonly='Y'` but with a different `uipattern` (e.g. `SR`) renders as editable. There is a single case in the instance (the *Session* tab), so it is a robustness/parity improvement rather than an active defect.

**Proposed solution:** propagate the tab's own read-only flag from the backend and treat it as effective read-only in the client (hide New/Save/Delete/Copy and block inline editing), combining it with the existing `uIPattern` logic without altering the other patterns.

**Test cases:**

1. **Scenario:** Read-only tab blocks editing
   - Given: a tab with `isreadonly='Y'` (any `uipattern`)
   - When: the user interacts with it
   - Then: it does not allow create/edit/delete nor inline editing
2. **Scenario:** Non-read-only tabs unchanged
   - Given: `SR`/`ED`/`STD` tabs that are not read-only
   - When: the user interacts with them
   - Then: they keep their current behavior
3. **Scenario:** No regression on RO tabs
   - Given: tabs already covered by `uIPattern='RO'`
   - When: they are rendered
   - Then: there is no regression

**Result:** the tab's read-only mode respects both `uipattern` and `isreadonly`, closing parity with the classic UI.

**Metainformation:**

- Status: Discarded — Both UIs ignore tab-level `isreadonly`; read-only mode derives only from `uipattern` and role access. Verified on the Session tab (identical behavior).
- Priority: N/A

---

## Section 6 — Callouts

No pending tasks. The section is complete.

---

## Section 7 — Record State Machine

No pending tasks. The section is complete.

---

## Section 8 — Selectors and FK Fields

### [SEC-8] Visually distinguish selected inactive FK values

**Description:** when an FK field has a selected record that is inactive, the new UI shows its identifier (it is not left blank) but with no visual signal that the record is inactive. In the classic UI these values are distinguished (struck-through or dimmed), which helps the user notice that the reference is no longer current.

**Proposed solution:** detect that the selected value of an FK corresponds to an inactive record and represent it with a differentiated style (dimmed or struck-through), both in form view and in the grid, without altering the identifier resolution or excluding it (it must still be shown). Reuse the record state information the datasource already returns when resolving the value.

**Test cases:**

1. **Scenario:** Inactive FK value differentiated
   - Given: an FK with a selected inactive record
   - When: the user views it
   - Then: the value is shown with a differentiated style (not blank, not as active)
2. **Scenario:** Active FK value normal
   - Given: an FK with an active record
   - When: the user views it
   - Then: it is shown with the normal style (no regression)
3. **Scenario:** Dropdown still excludes inactives
   - Given: an FK dropdown
   - When: the user searches for new options
   - Then: it still does **not** list inactive records
4. **Scenario:** Applies in form and grid
   - Given: an inactive selected FK value
   - When: it is shown in form view or in the grid
   - Then: the distinction applies in both
5. **Scenario:** Distinction removed on active selection
   - Given: an FK with an inactive value shown as differentiated
   - When: the value is changed to an active record
   - Then: the visual distinction is removed

**Result:** already-selected inactive FK values are visually distinguished, matching the classic UI visual cue without losing visibility of the data.

**Metainformation:**

- Status: Discarded — The classic UI does not style selected inactive FK values (no strikethrough/gray in FK form items, selector, or grid); the spec's "typically shown in a different style" was an unverified assumption. Verified on Product → Product Category with an inactive category (identical behavior: value shown as a normal value).
- Priority: N/A

### [SEC-8] Minimum character threshold for the selector typeahead

**Description:** search selectors (OBUISEL/Search) query the backend after the *debounce* with any number of characters, even a single one. Triggering the search only from a minimum number of characters avoids poorly selective queries on large tables.

> **Note:** this is **not** a parity gap. The classic UI does **not** have this functionality: the `OBUISEL_Selector` definition has no minimum-characters setting and the classic selector (`ob-selector-item.js`) only applies a 400 ms fetch delay, querying from the first character. This task is a **performance improvement** over the classic behavior.

**Proposed solution:** introduce a configurable minimum character threshold (with a reasonable default, e.g. 2–3) below which the typeahead does not trigger the query, keeping the current *debounce* and pagination. The search input **placeholder must reflect the threshold** (e.g. "Type at least 3 characters to search"), so the user understands why no results appear below the minimum; while fewer characters than the minimum are typed, the dropdown should show the same hint instead of an empty or "no results" state. Allow opening the full search popup for cases where the user wants to explore without typing.

**Test cases:**

1. **Scenario:** Below threshold no query
   - Given: fewer than the minimum characters typed
   - When: the user types
   - Then: no query is triggered to the backend
2. **Scenario:** Reaching threshold queries
   - Given: the minimum number of characters typed
   - When: the user reaches it
   - Then: the query is triggered (with the current *debounce*)
3. **Scenario:** Popup lists without typing
   - Given: the search popup
   - When: the user opens it
   - Then: it still allows listing/paginating without typing
4. **Scenario:** No stale results below threshold
   - Given: results shown from a previous query
   - When: the user deletes below the minimum
   - Then: no stale results remain visible
5. **Scenario:** Placeholder and hint reflect the threshold
   - Given: an empty selector search input, or one with fewer than the minimum characters
   - When: the user focuses it or types below the minimum
   - Then: the placeholder/hint indicates the minimum number of characters required (e.g. "Type at least 3 characters to search") instead of showing "no results"
6. **Scenario:** No regression on working selectors
   - Given: selectors that work today
   - When: the user selects and the callout runs
   - Then: selection and callout stay the same (no regression)

**Result:** the typeahead queries only when the term is selective enough, reducing unnecessary backend load (a performance improvement beyond the classic UI), with a placeholder that tells the user how many characters are required.

**Metainformation:**

- Status: Created (ETP-5615)
- Priority: Minor

---

## Section 9 — Grid / List View Behaviors

### [SEC-9] Show the exact total record count in the grid

**Description:** the grid queries with `NOCOUNT` to optimize infinite scroll, so the counter shows the loaded records (and a "there are more" indicator) instead of the exact total of records matching the current filters. The checklist asks for a visible, precise total.

**Proposed solution:** obtain the real total of records that meet the current filters (for example, via a deferred/asynchronous count that does not block the initial load) and show it in the grid counter, keeping infinite scroll and without degrading first-load performance.

**Test cases:**

1. **Scenario:** Exact total for a filtered set
   - Given: a grid with N filtered records
   - When: the grid displays its counter
   - Then: it shows the exact total N (not "loaded + 1")
2. **Scenario:** Total updates when filters change
   - Given: a grid showing a total for the current set
   - When: filters are applied or removed
   - Then: the total updates to the new set
3. **Scenario:** Total reflects parent→child implicit filter
   - Given: a child tab filtered by its parent record
   - When: the total is computed
   - Then: it reflects the implicit parent→child filter
4. **Scenario:** No performance regression
   - Given: the exact-total feature is enabled
   - When: the initial load and infinite scroll run
   - Then: they keep working without perceptible delays

**Result:** the user sees the real total of records in the filtered set, aligned with the expected checklist behavior.

**Metainformation:**

- Status: Discarded — The classic UI doesn't show the exact total either: it always queries with `_noCount=true` and displays `>100` when more than one page exists (exact count only for ≤100 records). Verified manually: both UIs behave the same.
- Priority: N/A

### [SEC-9] Numeric column filters: support the classic expression syntax

**Description:** in the classic UI, numeric grid columns are filtered by typing an **expression** in the column filter (`OBNumberFilterItem` in `ob-formitem-number.js`, parsed by SmartClient `parseValueExpressions` plus the Openbravo `and`/`or` extension in `ob-smartclient.js`). There is no min/max widget: comparisons and ranges are written as text. The new UI parses part of this syntax (`LegacyColumnFilterUtils.parseLogicalFilter` in `api-client/src/utils/search-utils.ts`), but manual testing showed that several expressions do not behave like the classic UI (e.g. the `a...b` range syntax is not implemented). Users coming from the classic UI type these expressions daily, so the numeric filter must accept the same syntax and produce the same results.

**Classic numeric filter syntax the new UI must reproduce:**

| Typed in the filter | Classic operator | Meaning |
|---------------------|------------------|---------|
| `100` (no symbol) | `equals` | value equal to 100 (exact match, **not** "contains": `100` must not match `1000`) |
| `=100` / `==100` | `equals` | value equal to 100 |
| `!100` | `notEqual` | value different from 100 |
| `>100` | `greaterThan` | value greater than 100 |
| `<100` | `lessThan` | value less than 100 |
| `>=100` | `greaterOrEqual` | value greater than or equal to 100 |
| `<=100` | `lessOrEqual` | value less than or equal to 100 |
| `100...500` | `betweenInclusive` | value between 100 and 500, both limits included |
| `#` | `isNull` | value is empty |
| `>=100 and <=500` | `and` of both criteria | both conditions must hold (lowercase ` and ` with spaces) |
| `<100 or >500` | `or` of both criteria | either condition holds (lowercase ` or ` with spaces) |
| unsupported operator (e.g. `^100`, `~100`) | — | the filter value is cleared and no filter is applied |

Additional rules:

- Values are interpreted using the **user's number format** (decimal and grouping separators), e.g. `1.234,56` vs `1,234.56`, and negative values (`>-50`) are supported.
- Leading/trailing spaces around the value are ignored.
- The filter is applied **server-side** (criteria sent to the datasource), combines with AND with the other column filters, and is kept when the grid is refreshed or the session filter state is restored.
- Extensions that the new UI already supports beyond the classic UI (`&` and `|` as AND/OR) may be kept, as long as they don't change the results of the classic syntax above.

**Proposed solution:** align `LegacyColumnFilterUtils` with the classic numeric filter grammar for numeric columns (Amount, Number, Integer, Quantity, Price, etc.): add the `a...b` inclusive range, the `#` empty-value operator, exact `equals` for values without a symbol, locale-aware number parsing, and clearing the filter for unsupported operators. Review each row of the table above against the current parser and fix every mismatch, generating the same datasource criteria as the classic UI (`greaterThan`, `betweenInclusive`, `isNull`, etc.).

**Test cases:**

Use e.g. *Sales Order*, column *Grand Total Amount*, and compare the results with the classic UI.

1. **Scenario:** Value without symbol is an exact match
   - Given: records with totals 100, 1000 and 2100
   - When: the user types `100`
   - Then: only the record with 100 is returned (not 1000 nor 2100)
2. **Scenario:** Comparison operators
   - Given: a numeric column
   - When: the user types `>100`, `<100`, `>=100`, `<=100`, `=100`, `!100`
   - Then: each one returns exactly the same records as the classic UI
3. **Scenario:** Inclusive range with `...`
   - Given: a numeric column
   - When: the user types `100...500`
   - Then: only records between 100 and 500 (both included) are returned, and the request carries a `betweenInclusive` criterion
4. **Scenario:** Combined conditions with `and` / `or`
   - Given: a numeric column
   - When: the user types `>=100 and <=500` or `<100 or >500`
   - Then: the results match the classic UI
5. **Scenario:** Empty values
   - Given: a numeric column with empty values
   - When: the user types `#`
   - Then: only records with an empty value are returned
6. **Scenario:** Locale-aware and negative values
   - Given: a user whose number format uses `,` as decimal separator
   - When: the user types `>1.234,5` or `<-50`
   - Then: the values are interpreted with the user's format and the results are correct
7. **Scenario:** Unsupported operator
   - Given: a numeric column
   - When: the user types `^100`
   - Then: no filter is applied and the filter input is cleared (classic behavior), without errors
8. **Scenario:** Combination, server-side and persistence
   - Given: a numeric expression filter plus a filter on another column
   - When: the grid loads, is refreshed, or the filter state is restored
   - Then: both filters are applied together server-side and the expression filter is kept

**Result:** numeric column filters accept the same expression syntax as the classic UI (comparisons, inclusive ranges, empty values, `and`/`or`) and return the same records, so users can filter numeric data exactly as they do today in the classic UI.

**Metainformation:**

- Status: Created (ETP-5616)
- Priority: Major

---

## Section 10 — Cross-Cutting Behaviors

### [SEC-10] "Show inactive" toggle and a notes indicator in the grid

**Description:** (a) to view inactive records today you must manually filter the Active column; a one-click "show inactive" toggle is missing. (b) The grid shows an attachments indicator but not a notes one.

**Proposed solution:** (a) add a "show/hide inactive" control in the grid that adjusts the active filter and reloads, keeping the existing visual distinction for inactive rows; (b) add a notes indicator in the grid analogous to the attachments one, reusing the existing indicator pattern.

**Test cases:**

1. **Scenario:** Toggle inactive visibility
   - Given: a grid with inactive records
   - When: "show inactive" is enabled and then disabled
   - Then: inactive rows (with their gray style) are included and then hidden again
2. **Scenario:** Toggle consistent with Active filter
   - Given: the "show inactive" toggle
   - When: it is toggled
   - Then: its state is consistent with the Active column filtering
3. **Scenario:** Notes indicator shown
   - Given: records that have notes
   - When: the grid is rendered
   - Then: they show the corresponding notes indicator
4. **Scenario:** No regression in attachments/inactive styling
   - Given: the new toggle and notes indicator
   - When: the grid renders
   - Then: there is no regression in the attachments indicator or the visual distinction for inactive rows

**Result:** the user can toggle inactive visibility with one click and spot at a glance which records have notes, matching parity with the classic UI.

**Metainformation:**

- Status: Discarded — The classic UI has neither a "show inactive" toggle (inactive records are listed with active ones) nor a notes indicator in the grid (note count only in the form's Notes section title). Verified manually: in the new UI inactive rows are highlighted but fully accessible; this accepted difference (visual highlight) is kept as is.
- Priority: N/A

---

## Section 11 — Authentication, Session, and Authorization

No pending tasks. The section is complete.

---

## Section 12 — Navigation and Application Structure

### [SEC-12] Support External / external-link menu entries (open URL)

**Description:** the menu click dispatch (and the menu search) does not handle the `External` / external-link entry type; an entry with a configured URL performs no action. In the classic UI these entries are configured in `AD_Menu` with *Action* = `L` (**External link**), the **URL** field and the **Open link in browser** flag (`OPENLINKINBROWSER`), and behave as follows (`ob-application-menu.js`, `ob-quick-launch.js`, `MenuManager.java`):

- **Open link in browser = Y:** the URL opens in a new browser tab (`window.open`).
- **Open link in browser = N:** the URL opens **inside the application**, in its own tab with an embedded page (iframe, `OBExternalPage`).
- If the URL has no protocol (e.g. `example.com`), `http://` is prepended.
- External entries are **always visible** in the menu, regardless of the role's window/process access.
- They can be opened from **Quick Launch** (menu search) and are added to the **recent items** list.
- They are shown with a **specific icon** that identifies them as external links. The new UI must also give these items a particular icon (talk to Ale, if necessary, to define it).

**How to test (classic vs new UI):** there are no external-link menu entries in the representative environment, so they must be created for testing.

1. **Create the entries** (role *System Administrator*, window *Application Dictionary → Menu*):
   - **Entry A:** Name `TEST External (browser)`, Action = *External link*, URL = `https://example.com`, **Open link in browser = Y**.
   - **Entry B:** Name `TEST External (in-app)`, Action = *External link*, URL = `example.com` (no protocol, on purpose), **Open link in browser = N**.
   - The *Module* must be a module in development. `example.com` is used because it allows being embedded in an iframe (many sites block it, which would show a blank page for reasons unrelated to the UI).
2. **Place them in the menu tree:** from the tree view of the *Menu* window, drag both entries into a folder (e.g. *General Setup*).
3. **Reload the menu:** log out and log in again in both UIs (any role).
4. **Compare both UIs:**

| # | Action | Expected (classic behavior) |
|---|--------|-----------------------------|
| 1 | Click entry A | `https://example.com` opens in a new browser tab |
| 2 | Click entry B | a tab opens **inside the application** showing the page embedded, with `http://` prepended to the URL |
| 3 | Search "TEST External" in Quick Launch and select each entry | same behavior as rows 1 and 2 |
| 4 | Check recent items after opening them | both entries appear in the recent items list |
| 5 | Look at the entries in the menu | they show the external-link icon |
| 6 | Log in with a role without access to any window in that folder | the entries are still visible |
| 7 | Browser blocking popups (entry A) | the new UI shows the blocked-popup notice with a manual-open option (improvement over classic, which fails silently) |

5. **Clean up:** delete or deactivate both menu entries.

**Proposed solution:** add a branch in the menu click/search routing for External / external-link entries, consuming the URL and *Open link in browser* values emitted by the backend (add them to the menu metadata if they are not emitted yet): when the flag is `Y`, open the URL in a new browser tab with the same blocked-popup notice that classic reports/processes already use; when it is `N`, open the URL inside the application in its own tab with an embedded page. Prepend `http://` when the URL has no protocol, show the entries regardless of role access, register them in recent items, support them in Quick Launch, and render them with a specific external-link icon. It must not alter the behavior of the already-supported item types.

**Test cases:**

1. **Scenario:** External entry opens in a new browser tab
   - Given: an external-link menu entry with *Open link in browser* = Y
   - When: it is clicked or selected from the search
   - Then: its URL opens in a new browser tab
2. **Scenario:** External entry opens inside the application
   - Given: an external-link menu entry with *Open link in browser* = N
   - When: it is clicked or selected from the search
   - Then: its URL opens inside the application in its own tab with the embedded page
3. **Scenario:** URL without protocol
   - Given: an external-link entry whose URL has no protocol (e.g. `example.com`)
   - When: it is opened
   - Then: `http://` is prepended and the page loads
4. **Scenario:** Visibility, recents and icon
   - Given: external-link menu entries
   - When: the menu is shown for any role and the entries are opened
   - Then: they are visible regardless of role access, show the external-link icon, and are added to the recent items list
5. **Scenario:** Blocked popup notice
   - Given: the browser blocks the opening of an *Open link in browser* = Y entry
   - When: the user activates the entry
   - Then: the notice with a manual-open option is shown
6. **Scenario:** Other item types unchanged
   - Given: other item types (window, process, report, form, view)
   - When: they are opened
   - Then: they keep their current behavior
7. **Scenario:** External entry without URL does not break
   - Given: an External entry without a URL
   - When: it is activated
   - Then: navigation is not broken

**Result:** External / external-link menu entries behave as in the classic UI (new browser tab or in-app tab depending on *Open link in browser*, Quick Launch, recent items and a specific icon), with a blocked-popup fallback as an improvement.

> Consolidates the former `[SEC-20] Opening external-link menu entries` task (merged here).

**Metainformation:**

- Status: Created (ETP-5617)
- Priority: Major

---

## Section 13 — Record Creation, Editing, and Persistence

No pending tasks. The section is complete.

---

## Section 14 — Reports (Standalone Menu Access)

### [SEC-14] Output format selection in Process Definition reports

**Description:** in the classic UI, Process Definition reports (UI pattern `OBUIAPP_Report`) show one button per output format configured in the report definition (`OBUIAPP_Report`): **HTML** (view), **PDF** and **XLS** (`ob-parameter-window-view.js`). Each button sends the chosen format to the report handler (`_buttonValue: 'HTML' | 'PDF' | 'XLS'`), which generates the report with the corresponding template (or with the PDF template when *Use PDF as XLS/HTML template* is checked) and opens or downloads the result.

Manual testing shows that this **does not work in the new UI**: the user cannot obtain the report in the configured formats as in the classic UI. A first implementation was merged in ETP-4205 (client commit `2a428d25a`, metadata commits `629730d`/`4fa712a`: `getReportActions` in `reportActions.ts`, `pdfExport`/`xlsExport`/`htmlExport` in `ReportDefinitionBuilder`), so the analysis must start from that code to find where the flow breaks (format flags emitted by the backend, buttons rendered in the modal footer, format sent to the handler, or delivery of the generated file).

**How to test (classic vs new UI):**

Reports to use and their configured formats:

| Report (menu entry) | Configured formats |
|---------------------|--------------------|
| **Aging Balance Process Definition for Receivables** (also *for Payables*) | HTML, PDF and XLS (three templates) |
| **Purchase Order Report** | PDF and XLS, plus HTML using the PDF template |
| **Cashflow Forecast Report** | PDF and XLS, plus HTML using the PDF template |

1. Open *Aging Balance Process Definition for Receivables* from the menu in both UIs.
   - Expected (classic): the modal footer shows **three buttons**, in this order: HTML (view), PDF, Excel.
2. Fill in the mandatory parameters (e.g. organization, date) and press each button separately:
   - **HTML:** the report opens for viewing in a new tab.
   - **PDF:** a PDF file is opened/downloaded with the report content.
   - **XLS:** an Excel file is downloaded with the report content.
3. With the browser developer tools (F12 → Network), check that each button sends the chosen format to the report handler request (`_buttonValue` = `HTML` / `PDF` / `XLS`) and that the response contains the file in that format.
4. Repeat steps 1–3 with *Purchase Order Report* and *Cashflow Forecast Report*, checking that the new UI shows exactly the same buttons as the classic UI.
5. Check error handling: run a report with parameters that produce no data and compare the message shown in both UIs.

**Proposed solution:** review the ETP-4205 implementation end to end and fix every broken step so the new UI behaves like the classic popup: the backend emits the export flags for each `OBUIAPP_Report` process, the modal footer renders one button per enabled format (HTML → PDF → XLS, only for report-type processes), the chosen format is sent to the report handler exactly as the classic UI does, and the generated file is opened (HTML) or downloaded (PDF/XLS) with the correct content type and file name. Errors returned by the handler must be shown to the user instead of failing silently.

**Test cases:**

1. **Scenario:** Buttons match the configured formats
   - Given: the *Aging Balance Process Definition for Receivables* report (HTML, PDF and XLS configured)
   - When: the report modal is opened
   - Then: the footer shows the HTML, PDF and Excel buttons, in that order, as in the classic UI
2. **Scenario:** Execute a report as HTML
   - Given: a report with HTML enabled and valid parameters
   - When: the user presses the HTML button
   - Then: the report opens for viewing with the expected content
3. **Scenario:** Execute a report as PDF
   - Given: a report with PDF enabled and valid parameters
   - When: the user presses the PDF button
   - Then: a valid PDF file with the expected content is delivered
4. **Scenario:** Execute a report as Excel
   - Given: a report with XLS enabled and valid parameters
   - When: the user presses the Excel button
   - Then: a valid, downloadable Excel file with the expected content is delivered
5. **Scenario:** "Use PDF as template" reports
   - Given: *Purchase Order Report* (HTML uses the PDF template)
   - When: the user executes it as HTML
   - Then: the report is generated correctly from the PDF template, as in the classic UI
6. **Scenario:** Chosen format sent to the backend
   - Given: a chosen format
   - When: the report handler is invoked
   - Then: the request carries the same format value as the classic UI (verifiable in the request)
7. **Scenario:** Handler errors are shown
   - Given: a report execution that fails or returns no data
   - When: the user executes it
   - Then: the same message as in the classic UI is shown, without silent failures
8. **Scenario:** Non-report processes unchanged
   - Given: a Process Definition that is not a report
   - When: it is opened
   - Then: it keeps its current footer buttons and behavior

**Result:** the user can run Process Definition reports from the new UI in every configured output format (HTML, PDF, XLS), with the same buttons and results as the classic popup.

**Metainformation:**

- Status: Created (ETP-5618)
- Priority: Critical

### [SEC-14] Robustness of large reports (avoid execution timeout)

**Description:** a Process Definition report is executed with a single request to the handler; for reports with many rows there is a risk that the request exceeds the maximum time and fails without a clear message, unlike the *report-and-process* route that already uses polling with a deadline.

In the classic UI the report is also executed with a single request (`ob-parameter-window-view.js`, `doProcess`): it shows a "processing" overlay and the SmartClient RPC call has a default timeout of **240 s**, after which a generic error is shown. In the new UI no client-side timeout was found for Process Definition reports: the request waits until the `/api/erp` proxy or the server cuts it, and what the user sees in that case is undefined. The new UI must at least match the classic behavior (deliver the file whenever the classic UI does, and show a clear error when the execution is cut).

> **⚠️ Special setup required to test this task.** With the data available in the test environment (`etendodev`, largest client *F&B International Group*: 3,905 payment schedules, 8,952 stock transactions, 11,599 accounting entries), every report finishes in seconds, so the timeout can **not** be reproduced with real data. An **artificial delay must be added to the backend** (local environment only) and removed after testing, as described below.

**How to test (classic vs new UI):**

Test environment: `/erp` (Etendo with all modules), `client` (new UI, latest version) and the `etendodev` database.

- **Report:** *Receivables Aging Schedule* (Process Definition *Aging Balance Process Definition for Receivables*, `0D37A9F6109549DEB058373EF2DAEB6A`). It is active, has an active menu entry, the role *F&B International Group Admin* has access, it has real data and it uses its own handler (`AgingBalanceReportActionHandler`), so the delay only affects this report.

1. **Add the delay:** at the beginning of `getReportData` in `erp/src/org/openbravo/common/actionhandler/AgingBalanceReportActionHandler.java`, add:
   ```java
   try { Thread.sleep(300_000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
   ```
   (300 s, longer than the 240 s classic limit). Compile and deploy (`./gradlew smartbuild`) and restart Tomcat.
2. **Log in** with the role *F&B International Group Admin* in both UIs.
3. **Run** *Receivables Aging Schedule* (organization *F&B International Group*, today's date, PDF):
   - Classic (expected): "processing" overlay and, after 240 s, the SmartClient timeout error.
   - New UI: check what happens after 240 s and after 300 s (keeps waiting, proxy cuts with 502/504, message shown or silent failure) and whether the modal stays in a consistent state.
4. **Variant:** change the delay to **90 s**. The classic UI delivers the file; the new UI must deliver it too (if the `/api/erp` proxy cuts earlier than the classic limit, it is a regression).
5. **Clean up:** remove the `Thread.sleep`, compile and deploy again.

**Proposed solution:** verify the real behavior with voluminous reports and, if the risk is confirmed, align report execution with a mechanism tolerant of long executions (progress indicator and controlled wait), with an explicit timeout message if the limit is reached.

**Test cases:**

1. **Scenario:** Large dataset completes
   - Given: a report with a large dataset
   - When: it is executed
   - Then: it completes and delivers its output without a network error
2. **Scenario:** Progress indicator during long execution
   - Given: a long execution
   - When: it is running
   - Then: a progress indicator is shown and the modal is not left in an ambiguous state
3. **Scenario:** Timeout shows a clear message
   - Given: an execution that reaches the time limit
   - When: the limit is hit
   - Then: an understandable timeout message is shown instead of a silent failure

**Result:** large reports run reliably or, failing that, clearly report the timeout, without degrading the experience of fast reports.

**Metainformation:**

- Status: Created (ETP-5619)
- Priority: Minor

---

## Section 15 — Loading Indicators and Feedback

No pending tasks. The section is complete.

---

## Section 17 — Toolbar Buttons (Complete Reference)

### [SEC-17] Audit Trail button and viewer in the toolbar

**Description:** the classic UI offers an **Audit Trail** button in the toolbar that opens the change history of the selected record (who, when, from which process and what changed). The new UI exposes neither this button nor an equivalent viewer, and the metadata module does not emit whether the tab's table is audited.

**Classic UI behavior that the new UI must reproduce:**

*Toolbar button* (`OBViewTab.getIconButtons`, `ob-toolbar.js` → `BUTTON_PROPERTIES.audit` and `OB.ToolbarUtils.showAuditTrail`):

- The button is shown **only** when the tab's table is marked as **Fully Audited** (`AD_Table.isFullyAudited = 'Y'`); it is hidden in every other tab.
- It is **disabled** when:
  - more than one record is selected (if invoked anyway, the warning message `JS28` is shown in the message bar);
  - the record is new and not yet saved (form view or inline grid editing);
  - the record has never been modified (`updated` equals `creationDate`).
- It has a keyboard shortcut (`ToolBar_Audit`).
- It opens the history viewer for the selected record, sending the tab, the table, the record and the browser time zone offset, so audit times are shown in the user's local time (same as the grid).

*History viewer* (`AuditTrailPopup`, command `POPUP_HISTORY`, classic popup of 900×600):

- **Header text** identifying the record: record identifier and business element name (e.g. "Business Partner: <record identifier>"), or a specific text if the record was deleted.
- **Excluded columns notice:** if the table has columns marked as *Exclude Audit*, a text lists them.
- **Filters:** date from, date to, user (hidden when the preference `ShowAuditTrailUserFilter` = `N`) and field (only the fields of the current tab).
- **History grid**, 20 rows per page, sorted by time descending, with the columns: **Time**, **Action** (insert/update/delete), **User**, **Process** (the window, process or form that made the change, e.g. "Form: …", "Process: …"), **Field** (field name as shown in the tab), **Old value** and **New value**. Values are formatted for display (FK identifiers instead of ids, dates/numbers in the user's format).
- **"View deleted records"** link: opens the list of deleted records of the tab (command `POPUP_DELETED`), with the same filters, and for child tabs restricted to the current parent record.
- **Close** button.

The new UI must offer an equivalent native viewer (e.g. a modal) with the same information, filters and navigation; reusing the classic `AuditTrailPopup` backend (or exposing its data through the metadata module) is acceptable as long as the result is equivalent.

**How to test (classic vs new UI):**

Test environment: `/erp`, `client` (new UI) and the `etendodev` database. In `etendodev` no table is audited by default, so auditing must be enabled first. **No manual database changes are needed**: enabling the flag and running `smartbuild` is enough.

1. **Enable auditing:** with the role *System Administrator*, open *Application Dictionary → Tables and Columns*, select the table **C_BPartner** (Business Partner), check **Fully Audited** and save. The classic UI shows the message *"In order to activate this change it is necessary to build Etendo and to restart Tomcat. Use "Exclude Audit" in column to exclude some columns from Audit."*
2. **Build and restart:** run `./gradlew smartbuild` in `/erp` and restart Tomcat. This creates the audit triggers and regenerates the window, so the **Audit Trail** button appears in the *Business Partner* window.
3. **Generate history:** log in with the role *F&B International Group Admin*, open a business partner and modify it two or three times (e.g. *Name*, *Description*, *Business Partner Category*), saving each time.
4. **Compare both UIs** in the *Business Partner* window:

| # | Action | Expected (classic behavior) |
|---|--------|-----------------------------|
| 1 | Select the modified business partner | the **Audit Trail** button is visible and enabled |
| 2 | Press it | the history viewer opens with the record identifier, the filters and one row per changed field (time, action, user, process, field, old value, new value), most recent first |
| 3 | Check the values of the FK field changed (*Business Partner Category*) | old and new values show identifiers, not ids |
| 4 | Filter by date range, user and field | only the matching rows are shown |
| 5 | Press "View deleted records" after deleting a test business partner | the deleted record is listed |
| 6 | Select two business partners | the button is disabled (or shows the `JS28` warning) |
| 7 | Create a new business partner without saving | the button is disabled |
| 8 | Select a business partner created and never modified | the button is disabled |
| 9 | Open a window whose table is not audited (e.g. *Product*) | the button is not shown |
| 10 | Use the `ToolBar_Audit` keyboard shortcut on the modified record | the history viewer opens |

5. **Clean up (optional):** uncheck **Fully Audited** on C_BPartner, run `./gradlew smartbuild` again and restart Tomcat.

**Proposed solution:** emit from the metadata module whether the tab's table is fully audited, add an Audit Trail button to the toolbar registry with the classic visibility and enablement rules, and implement a native history viewer that obtains the audit data from the backend (record identifier, excluded columns, filters, paged history grid with formatted values, deleted records view). It must respect permissions and the user's time zone.

**Test cases:**

1. **Scenario:** Button visible only for audited tables
   - Given: a window whose table is fully audited and another whose table is not
   - When: viewing the toolbar
   - Then: the button appears only in the audited one
2. **Scenario:** Enablement rules
   - Given: a fully audited window
   - When: there are several records selected, a new unsaved record, or a record never modified
   - Then: the button is disabled in each case; with one modified record it is enabled
3. **Scenario:** History content
   - Given: a record with audited changes
   - When: the history viewer is opened
   - Then: it shows the record identifier and one row per change with time (local time), action, user, process, field, old value and new value, most recent first, with formatted values (FK identifiers)
4. **Scenario:** Filters and paging
   - Given: a record with many audited changes
   - When: filtering by date range, user or field, and paging
   - Then: only matching rows are shown, 20 per page
5. **Scenario:** Excluded columns notice
   - Given: a table with columns marked as *Exclude Audit*
   - When: the history viewer is opened
   - Then: the excluded columns are listed and their changes are not shown
6. **Scenario:** Deleted records
   - Given: a deleted record of an audited table
   - When: the user opens "View deleted records"
   - Then: the deleted record and its audited data are listed (restricted to the parent record in child tabs)
7. **Scenario:** Keyboard shortcut
   - Given: a modified record in an audited window
   - When: the user presses the Audit Trail shortcut
   - Then: the history viewer opens

**Result:** the user can consult a record's change history from the toolbar of the new UI, with the same visibility rules, information, filters and deleted-records view as the classic Audit Trail.

**Metainformation:**

- Status: Created (ETP-5620)
- Priority: Critical

### [SEC-17] Responsive toolbar overflow

**Description:** When the number of buttons exceeds the available width (narrow screens or windows with many module/process buttons), the toolbar renders them in a row without handling overflow, which may clip them or break the layout.

**Proposed solution:** Introduce a responsive behavior that, when not all buttons fit, groups the excess into an overflow menu ("more…") or enables controlled scrolling, preserving the buttons' priority/order and their accessibility. It must keep section grouping consistent.

**Test cases:**

1. **Scenario:** Overflow grouped in narrow viewport
   - Given: a window with many buttons and a narrow viewport
   - When: not all buttons fit
   - Then: the excess is grouped into an accessible overflow menu
2. **Scenario:** All buttons reachable
   - Given: buttons moved to the overflow menu
   - When: the user opens the overflow
   - Then: all buttons remain reachable and executable
3. **Scenario:** Buttons return inline when widened
   - Given: an overflowing toolbar
   - When: the window is widened
   - Then: the buttons show inline again without duplication
4. **Scenario:** Order/priority preserved
   - Given: buttons moved to overflow
   - When: viewing the toolbar
   - Then: the buttons' order/priority is respected

**Result:** The toolbar adapts to any width without clipping actions, keeping all actions accessible.

**Metainformation:**

- Status: Discarded — The new UI design is not responsive yet; toolbar overflow will be addressed as part of the responsive design work. (Classic only scrolls the toolbar horizontally; process buttons are already grouped in a dropdown in the new UI.)
- Priority: N/A

### [SEC-17] Generic plugin API for module buttons

**Description:** The toolbar registry is declarative and supports per-window scope, but the **action dispatch is a fixed map** in the client: the `DROPDOWN`/`MODAL`/`TOGGLE`/`CUSTOM` types have no generic handler and the `etmetaActionHandler` field is not consumed generically. Furthermore, there is no system of **override hooks** to replace the classic monkey-patching (e.g. the custom Delete of Remittance/Picking). For this reason, module buttons with their own behavior (per-tab import, Config Middleware, BoostedUI Grid&Form, debug tools, Profitability) require changes in the client core.

**Proposed solution:** Define a generic extension point where a module registers a button (with its per-window/tab scope, preference-based visibility condition, and type) and its behavior resolves without touching the core: dispatch via `etmetaActionHandler` (backend invocation) and/or action handlers declared by the module for the `DROPDOWN`/`MODAL`/`TOGGLE`/`CUSTOM` types. Complementarily, provide behavior **hooks** (e.g. `beforeDelete(tabId, records)`) that modules can register to alter standard actions without monkey-patching. With this foundation, the pending buttons (17.4 import, Config Middleware, BoostedUI, preference-gated debug tools, Profitability) and the Delete overrides can be ported.

**Test cases:**

1. **Scenario:** Module registers a new button
   - Given: a module registering a button with its own action
   - When: the button is used
   - Then: it works without modifying the client core
2. **Scenario:** `etmetaActionHandler` dispatch
   - Given: a button with `etmetaActionHandler`
   - When: it is clicked
   - Then: it invokes the backend handler and shows its result
3. **Scenario:** Preference-gated button
   - Given: a button gated by a preference (e.g. debug)
   - When: the preference is active
   - Then: the button appears (and only then)
4. **Scenario:** `beforeDelete` hook interception
   - Given: a module that registers a `beforeDelete` hook
   - When: Delete runs on its target tab
   - Then: the hook intercepts it and leaves the standard Delete intact on the rest
5. **Scenario:** Type interactions execute
   - Given: buttons of type `DROPDOWN`/`MODAL`/`TOGGLE`
   - When: they are activated
   - Then: they execute their expected interaction

**Result:** Modules can extend the toolbar (buttons and behavior overrides) declaratively and without monkey-patching, enabling the porting of the pending module buttons.

**Metainformation:**

- Status: Pending analysis — Needs a deeper design discussion. Findings in `/erp`: classic module buttons are the core import buttons (Business Partner Set, Discounts and Promotions → Products), debug tools (preference `SMFSCDT_EnableDebug`) and BoostedUI "Show table and form" (already in the new UI as `SHOW_TABLE_AND_FORM`); Remittance, Config Middleware and Profitability are not installed; all 21 `etmeta_toolbar_button` rows are `ACTION` and none uses `etmeta_action_handler`.
- Priority: 

---

## Section 18 — Application Forms (ad_form)

No pending tasks. The section is complete.

---

## Section 19 — Linked Items (Cross-References)

### [SEC-19] Lazy loading of Linked Items on expand

**Description:** The Linked Items section queries its categories when opening any existing record, even if the user never expands it, because the collapsible container always mounts its content. The classic UI, by contrast, loads the categories only the first time the section is expanded. The result is an additional server request per visited record, which degrades performance in heavily navigated forms and departs from the reference behavior.

**Proposed solution:** Make the categories query (and consequently the items query) fire only when the section is expanded for the first time, and not when the form mounts. The general idea is to gate the start of loading on the "expanded" state of the section (or mount the section's content only on expand), keeping the cache once loaded so the query is not repeated when collapsing/expanding again within the same record.

**Test cases:**

1. **Scenario:** No request without expanding
   - Given: an existing record opened without expanding the section
   - When: the form loads
   - Then: no request is made to Linked Items
2. **Scenario:** First expand loads categories
   - Given: the section not yet expanded
   - When: the user expands it for the first time
   - Then: the categories are loaded from the server
3. **Scenario:** Cache on re-expand
   - Given: an already-loaded section
   - When: the user collapses and re-expands it
   - Then: the categories query is not fired again (uses the cache)
4. **Scenario:** New record re-queries
   - Given: a different record
   - When: the user expands the section
   - Then: the new record's categories are queried
5. **Scenario:** Hidden for new records
   - Given: a new/unsaved record
   - When: the form loads
   - Then: the section stays hidden and fires no request

**Result:** Linked Items loads lazily on expand, with performance parity to the classic UI and without unnecessary requests during record navigation.

**Metainformation:**

- Status: Created (ETP-5621)
- Priority: Minor

### [SEC-19] Dedicated empty-state message for items with no results

**Description:** When the user selects a Linked Items category that has no associated records, the items panel shows the message "No categories available", which corresponds to the absence-of-categories case and is confusing in this context. A specific message is missing to indicate that the selected category has no linked items.

In the new UI, the `LinkedItems` component (`ComponentLibrary/src/components/LinkedItems/index.tsx`) reuses the "no categories" content for the items panel when `items.length === 0`. The classic UI uses a dedicated message for the items grid, `OBUIAPP_LinkedItemsEmptyMessage` ("No linked items, click on a category on the left to show the linked items for that category").

This is an **edge case**: the backend (`UsedByLink`, `JSONCategory`) only returns categories with at least one linked record, so a selected category normally has items. The empty items panel only appears when the data changes between loading the categories and selecting one (e.g. the referencing record is deleted meanwhile).

**How to test (classic vs new UI):** test environment `/erp`, `client` (new UI) and the `etendodev` database, role *F&B International Group Admin*. Since the backend never lists empty categories, the case must be **forced by deleting the linked record after the categories are loaded**:

1. Create a test business partner (e.g. `TEST-LINKED`).
2. Create **one** *Sales Order* for that business partner and leave it in draft (not completed), so it can be deleted later.
3. **Browser tab A:** open the business partner `TEST-LINKED`, expand *Linked Items* and **do not** click any category yet. The sales order category is listed with 1 record.
4. **Browser tab B:** delete that sales order.
5. **Back in tab A:** click the category (it is still listed because the categories were not reloaded).
   - Classic (expected): the empty items grid shows "No linked items, click on a category on the left to show the linked items for that category".
   - New UI (current): it shows "No categories available" (wrong message).
6. Clean up: delete the test business partner.

**Proposed solution:** Introduce a dedicated empty-state text for the items panel and use it when a selected category returns zero items, distinguishing it from the "no categories" message. The classic message `OBUIAPP_LinkedItemsEmptyMessage` (or an equivalent text such as "No associated items") can be reused. It must be translated in the supported languages.

**Test cases:**

1. **Scenario:** Category with items shows list
   - Given: a category with items
   - When: it is selected
   - Then: the item list is shown
2. **Scenario:** Category without items shows dedicated message
   - Given: a category without items
   - When: it is selected
   - Then: the specific "no associated items" message is shown, not the "no categories" one
3. **Scenario:** No categories at all
   - Given: a record with no categories
   - When: viewing the panel
   - Then: the "no categories" message is still shown
4. **Scenario:** Messages translated
   - Given: the active language
   - When: an empty-state message is shown
   - Then: it appears correctly translated

**Result:** The items panel's empty state is clear and not confused with the absence of categories, improving comprehension of the section.

**Metainformation:**

- Status: Created (ETP-5622)
- Priority: Trivial

---

## Section 20 — Quick Launch (Global Search)

No pending tasks. The section is complete.

---

## Section 21 — Workspace / Dashboard (My Openbravo)

No pending tasks. The section is complete.

---

## Section 22 — Field Groups (Form Sections)

No pending tasks. The section is complete.

---

## Section 23 — Status Bar (Bottom Bar)

### [SEC-23] "Record N of M" position counter format

> **⚠️ Low priority.** It is a cosmetic/text adjustment. The position and total are already shown correctly as `N / M`; only the label changes.

**Description:** The status bar position counter shows the current position and the total as `N / M` (e.g. `5 / 47`). The classic UI uses the label "Record 5 of 47". The information is equivalent and correct; the difference is purely textual presentation.

**Proposed solution:** Present the counter with a translatable label in the style "Record N of M" (and its equivalent in each language), preserving the current position/total calculation and the empty state when no record is selected. It must be translated in the supported languages.

**Test cases:**

1. **Scenario:** Counter shows expected label
   - Given: records available
   - When: viewing the counter
   - Then: it shows the position and total with the expected label
2. **Scenario:** No record selected
   - Given: no record selected (new or empty)
   - When: viewing the counter
   - Then: the state is still clearly indicated
3. **Scenario:** Label translated
   - Given: the active language
   - When: the counter is shown
   - Then: the label appears correctly translated

**Result:** The position counter feels more familiar relative to the classic UI, without changing the accuracy of the information already shown.

**Metainformation:**

- Status: Discarded — The classic status bar has no record position counter at all (only status, status-bar fields, previous/next, maximize and close); the new UI's `N / M` indicator is an addition, so there is no classic format to match. Verified manually.
- Priority: N/A

---

## Section 24 — Form Layout System

No pending tasks. The section is complete.

---

## Section 25 — Default Value Expressions

No pending tasks. The section is complete.

---

## Section 26 — Tab Default Filters and Sort Order

No pending tasks. The section is complete.

---

## Section 27 — Multi-Window Tab Interface (MDI)

No pending tasks. The section is complete.

---

## Section 28 — Complete Keyboard Shortcuts Reference

No pending tasks. The section is complete.

---

## Section 29 — Tree Views

### [SEC-29] Consolidate tree detection on authoritative metadata

**Description:** the new UI decides whether a tab can be shown as a **tree** by mixing the metadata emitted by the adapter with several unreliable fallback layers: detection by patterns in the entity/table name ("org", "menu", "category", etc.), a simulated query with data and artificial delays, and hardcoded ID mappings (`useTreeModeMetadata.ts`). In addition, the condition that shows the toggle-tree button in the toolbar uses a different field (`tableTree`, `Toolbar.tsx`) than the one detection uses (`hasTree`/`tableTreeId`).

The root cause is that the adapter uses a **different criterion than the classic UI**:

- **Classic UI:** the tree button is shown when the tab has a **tree configured in `AD_Tab.AD_Table_Tree_ID`** (`OBViewTab.getIconButtons`: `if (tab.getTableTree() != null)`). The `AD_Tab.HasTree` flag is not used.
- **New UI adapter:** `TabBuilder` only emits `hasTree`/`tableTreeId` when **`AD_Tab.HasTree = 'Y'`** (`tab.isTreeIncluded()`).

In `etendodev` only **one** tab has `HasTree = 'Y'` (*User Defined Accounting Report Setup*), while **17 active tabs in active windows** have `AD_Table_Tree_ID` and therefore offer tree mode in the classic UI: *Organization*, *Product Category*, *Account Tree → Element Value*, *Menu*, *Sales Region*, *Assets*, *Activity*, *Cost Center*, *Sales Campaign*, *Multiphase Project*, *Tax Report Setup*, *User Defined Dimension 1*, *User Defined Dimension 2*, *Product Characteristic → Value*, *Cost Adjustment → Line*, *Manufacturing Plan → Lines*, among others. The name-based heuristics partially hide this gap (they catch "org", "menu", "category"), but they can miss real tree tabs (e.g. *Account Tree*, *Sales Region*, *Assets*) and offer tree mode on tabs that do not have one in classic (e.g. *Business Partner Category*).

**How to test (classic vs new UI):** test environment `/erp`, `client` (new UI) and the `etendodev` database, role *F&B International Group Admin* (*System Administrator* for *Menu*).

| Window (tab) | Expected (classic behavior) |
|--------------|-----------------------------|
| *Organization* | toggle-tree button; organization hierarchy |
| *Product Category* | toggle-tree button; category hierarchy |
| *Account Tree → Element Value* | toggle-tree button; hierarchical chart of accounts |
| *Sales Region* | toggle-tree button |
| *Assets* | toggle-tree button |
| *User Defined Accounting Report Setup* | toggle-tree button (the only tab with `HasTree = 'Y'`) |
| *Menu* (System Administrator) | toggle-tree button |
| *Business Partner Category* (no tree) | **no** toggle-tree button |

For each tab with a tree: enter tree mode, expand nodes, and drag a node onto another parent on a test record (e.g. a new *Product Category*), then refresh and check that the move persisted.

**Proposed solution:** align the criterion with the classic UI: the adapter (`TabBuilder`) must emit the tree metadata (`hasTree`, `tableTreeId`, `treeStructure`, `isReadOnlyTree`, `showTreeNodeIcons`, `hqlWhereClauseForRootNodes`) whenever the tab has `AD_Table_Tree_ID` configured, not only when `HasTree = 'Y'`. On the client, make tree mode enablement depend **exclusively** on that metadata, removing the name-based heuristics, the simulated query and the hardcoded identifiers, and use the same single source of truth for the internal detection and the toggle-tree button visibility.

**Test cases:**

1. **Scenario:** Tabs with `AD_Table_Tree_ID` offer tree mode
   - Given: the tabs listed above with a table tree (e.g. *Organization*, *Account Tree → Element Value*, *Sales Region*, *Assets*)
   - When: they are opened
   - Then: they show the toggle-tree button and, on activating it, enter tree mode with the hierarchy loaded, as in the classic UI
2. **Scenario:** Tab with `HasTree = 'Y'`
   - Given: the *User Defined Accounting Report Setup* tab
   - When: it is opened
   - Then: it keeps offering tree mode (no regression)
3. **Scenario:** Tab without tree but suggestive name
   - Given: a tab without a table tree whose name contains "org", "menu", "category", etc. (e.g. *Business Partner Category*)
   - When: it is opened
   - Then: it does **not** offer tree mode
4. **Scenario:** Detection and button visibility agree
   - Given: any tab
   - When: internal detection and button visibility are evaluated
   - Then: they agree (no case where one says "has tree" and the other does not)
5. **Scenario:** Drag-and-drop persistence
   - Given: a tab in tree mode
   - When: a node is dragged and dropped
   - Then: the move persists in the backend and the new order is reflected after refresh; an invalid move (creating a cycle) is prevented on the client
6. **Scenario:** Read-only tree
   - Given: a tab whose table tree is configured as read-only (`isReadOnlyTree`)
   - When: tree mode is active
   - Then: nodes cannot be moved, as in the classic UI
7. **Scenario:** Tree Reference field unaffected
   - Given: a Tree Reference field
   - When: its tree selector is opened
   - Then: it still opens correctly (unaffected by the change in grid tree detection)

**Result:** tree mode is offered exactly on the tabs where the classic UI offers it (those with `AD_Table_Tree_ID`), determined by authoritative metadata with no name-based heuristics or fragile identifiers, and with the toggle button consistent with detection.

**Metainformation:**

- Status: Created (ETP-5623)
- Priority: Minor

---

## Section 30 — Grouping in Grid View

### [SEC-30] Column grouping in the grid (Group by / Ungroup)

**Description:** the classic UI allows grouping the grid by a column from the column header menu: rows are grouped by value, each group with a collapsible header. The new UI has no grouping capability (the saved view state only writes an empty `group` object, `Tab.tsx`).

**Classic UI behavior that the new UI must reproduce** (`ob-view-grid.js`, `groupBy` / `clearGroupBy`):

- The column header menu offers **"Group by ‹column›"** (`OBUIAPP_GroupBy`) and, when the grid is grouped, **"Ungroup"** (`OBUIAPP_ungroup`). The checkbox/actions column cannot be used for grouping.
- When grouping:
  - the grouped column is **moved to the first position** and locked (it cannot be reordered or hidden while grouped);
  - the grid is **sorted by the grouped column**, so groups appear in order;
  - each group has a header that can be **expanded/collapsed**; when the grouping changes, the first group is opened automatically;
  - if summary functions are defined on columns, **group subtotals are shown in the group header** (`showGroupSummary`, `showGroupSummaryInHeader`).
- When ungrouping or changing the grouped column, the previous grouped column returns to its **original position**.
- **Limit of 1000 records** (`groupByMaxRecords`): if the loaded data exceeds it, grouping is cleared and the message "There are more than 1000 records, grouping is disabled for larger datasets." (`OBUIAPP_MaxGroupingReached`) is shown.
- The grouping is **stored in the view state** (`storeViewState`), so it is kept when reopening the window and in saved views.

**How to test (classic vs new UI):** test environment `/erp`, `client` (new UI) and the `etendodev` database, role *F&B International Group Admin*.

1. **Group:** open *Sales Order* (708 orders, below the limit). Open the header menu of **Business Partner** and choose "Group by Business Partner".
   - Expected: rows grouped by customer, column moved to the left, groups sorted and the first one open.
2. **Expand/collapse** several groups.
3. **Change grouping:** group by **Document Status**.
   - Expected: the previous column returns to its position and the grid is grouped by status.
4. **Group subtotals:** from the header menu of *Total Gross Amount*, add a summary function (e.g. sum).
   - Expected: each group header shows its subtotal.
5. **Ungroup** with "Ungroup".
   - Expected: the grid returns to normal and the column to its original position.
6. **1000-record limit:** open *Purchase Invoice* (1,731 invoices), scroll so more than 1000 rows are loaded and group by *Business Partner*.
   - Expected: the message "There are more than 1000 records…" is shown and the grid is ungrouped.
7. **Persistence:** group *Sales Order*, close and reopen the window (and, if saved views are used, save and reload the view).
   - Expected: the grouping is kept.

**Proposed solution:** add grouping to the grid (the table library used by the new UI supports row grouping) exposed through the column header menu with "Group by ‹column›" / "Ungroup", reproducing the classic rules: grouped column first and locked, sort by the grouped column, collapsible groups with the first one open, group subtotals in the header when summary functions exist, restore the column position when ungrouping, the 1000-record limit with the classic message, and persistence of the grouping in the view state / saved views.

**Test cases:**

1. **Scenario:** Group by a column
   - Given: a grid with fewer than 1000 records (e.g. *Sales Order*)
   - When: the user chooses "Group by ‹column›" in the column header menu
   - Then: rows are grouped by that column's values, the column moves to the first position, groups are sorted and the first group is open
2. **Scenario:** Expand and collapse groups
   - Given: a grouped grid
   - When: the user clicks group headers
   - Then: groups expand and collapse
3. **Scenario:** Change the grouped column
   - Given: a grid grouped by one column
   - When: the user groups by another column
   - Then: the previous column returns to its original position and the grid is grouped by the new one
4. **Scenario:** Group subtotals
   - Given: a grouped grid with a summary function on a numeric column
   - When: the groups are displayed
   - Then: each group header shows the subtotal
5. **Scenario:** Ungroup
   - Given: a grouped grid
   - When: the user chooses "Ungroup"
   - Then: the grid returns to its normal state and column order
6. **Scenario:** Record limit
   - Given: a grid with more than 1000 loaded records
   - When: the user tries to group (or the data grows over the limit while grouped)
   - Then: grouping is disabled/cleared and the classic message is shown
7. **Scenario:** Persistence
   - Given: a grouped grid
   - When: the window is closed and reopened, or a saved view is reloaded
   - Then: the grouping is restored

**Result:** users can group grid records by any column with the same behavior as the classic UI (ordering, collapsible groups, subtotals, record limit and persistence).

**Metainformation:**

- Status: Created (ETP-5624)
- Priority: Major

---

## Section 31 — Data Import System

### [SEC-31] Default Initial/Error filter in Data Import Entries

**Description:** When opening the Data Import Entries window, classic applies a default filter that shows only entries in `Initial` and `Error` status (hiding `Processed` ones), so the user immediately sees what is pending and what failed. That filter is not defined in the window metadata (there is no whereclause/filterclause or grid configuration); rather, in classic it is injected on the client side. The new UI, lacking it, opens the window showing all statuses.

**Proposed solution:** Provide, for this window, a default initial filter criterion on the Import Status column equivalent to "Initial or Error", applied on open and editable/removable by the user like any filter. The general idea is to have a mechanism by which certain windows can declare a default filter (by configuration/metadata or specific record), so that Data Import Entries uses it without hardcoding business logic in the interface. It does not involve the server or the adapter.

**Test cases:**

1. **Scenario:** First open shows Initial/Error only
   - Given: Data Import Entries opened for the first time
   - When: the grid loads
   - Then: it shows only entries in Initial or Error status
2. **Scenario:** Processed hidden
   - Given: the default filter is applied
   - When: the grid loads
   - Then: entries in Processed status do not appear
3. **Scenario:** Remove filter then reopen
   - Given: the user removes or modifies the default filter to see all statuses
   - When: the window is reopened
   - Then: the default filter is applied again (behavior consistent with classic)
4. **Scenario:** Combine with other filters
   - Given: the default filter is active
   - When: other filters and sorting are applied
   - Then: they keep working in combination with the default filter

**Result:** Data Import Entries opens showing by default only pending and failed entries, with parity relative to classic, and the user can broaden the criterion when needed.

**Metainformation:**

- Status: Discarded — Already covered: the filter is the tab's HQL filter clause (`importStatus='Initial' or importStatus='Error'`), applied by the new UI as implicit filter (`getDefaultImplicitFilter`, ETP-4381, in main). Verified manually: both UIs behave the same.
- Priority: N/A

### [SEC-31] Access to the Import/Export Translations form

**Description:** Importing/exporting translations (language .xml/.csv files) is done in classic via a special form (legacy, type `X`), which is not a metadata-driven window. The new UI has no way to display legacy forms of this type, so this translation administration functionality is not available from the new interface.

**Proposed solution:** Enable access to the translations form from the new UI. The lowest-risk, lowest-effort route is to **delegate to the classic form** by embedding it (for example, in a container/iframe with the session propagated), analogous to how other legacy functionality is already delegated to classic; this reuses the existing implementation without rewriting the translation import logic. Alternatively, and with much greater effort, reimplement it natively; delegation is recommended unless product requests otherwise.

**Test cases:**

1. **Scenario:** Accessible entry point
   - Given: the new UI
   - When: the user looks for Import/Export Translations
   - Then: there is an accessible entry (menu/action) that opens it
2. **Scenario:** Import a translation file
   - Given: the translations form is open
   - When: the user uploads a translation file (.xml/.csv) and runs the import
   - Then: it produces the same result as in classic
3. **Scenario:** Export translations
   - Given: the translations form is open
   - When: the user runs the export
   - Then: it generates the expected file
4. **Scenario:** Session and context respected
   - Given: an authenticated user
   - When: the import/export runs
   - Then: it respects the session, language, and client/organization context of the user

**Result:** The user can import and export translations from the new UI, with functional parity relative to the classic form, reusing the existing server implementation.

**Metainformation:**

- Status: Discarded — Already covered: Form menu entries open the classic form embedded in the new UI (`Sidebar.tsx`, `formUrl`). Verified manually with System Administrator: the Import/Export Translations form opens and works correctly.
- Priority: N/A

---

## Section 32 — Alert System (Real-Time Notifications)

### [SEC-32] Alert icon with badge and real-time polling

**Description:** the classic UI shows in the top navigation bar an **alerts indicator** ("Alerts (N)") with the number of pending alerts of the user, refreshed automatically by polling the server. It works as a quick access: clicking it opens the *Alert Management* view. The new UI has nothing similar (no indicator, no polling, no access to Alert Management from the navigation bar), so this task must be built **from scratch**.

**Classic UI behavior that the new UI must reproduce** (`ob-alert-manager.js`, `AlertActionHandler.java`):

*Indicator (navigation bar):*

- Label `UINAVBA_Alerts` = **"Alerts (%0)"**, where `%0` is the number of pending alerts. It shows **"Alerts (-)"** until the first response arrives.
- When the count is greater than 0, an **alert icon** is shown next to the label; with 0 alerts it shows "Alerts (0)" without the icon.
- **Click** (and keyboard shortcut `NavBar_OBAlertIcon`): opens the *Alert Management* view. In the new UI it must be opened the same way as its menu entry (delegated to the classic UI).

*Polling:*

- The client calls the backend **once on startup and then every 50 seconds** (it re-schedules after each response). While the user is logging in, it skips the call and re-schedules.
- The call must **not extend the user session** (classic sends `ignoreForSessionTimeout=1`): background polling alone must never keep an idle session alive.
- On each call, the backend also **updates the session last ping** (`AD_Session.Last_Session_Ping`, shown in the *Session* window), so the session is reported as alive while the application is open.

*Count calculation (backend):*

- Alert rules that are **active** and have a **recipient** matching the current **user**, or the current **role** when the recipient has no user.
- Only rules visible for the role's readable **clients and organizations**.
- Count of alerts of those rules with status **NEW** (`COALESCE(STATUS, 'NEW') = 'NEW'`); alerts in *Acknowledged*, *Suppressed* or *Solved* are not counted.
- The alert rule's **filter clause** is applied (rules with a broken filter clause count 0).

The new UI may reuse the classic `AlertActionHandler` (response `{ "cnt": N, "result": "success" }`) through the metadata module, or expose an equivalent endpoint, as long as the count and the side effects are the same.

**How to test (classic vs new UI):** test environment `/erp`, `client` (new UI) and the `etendodev` database, role *F&B International Group Admin*. This role receives 6 alert rules; currently there is **1 alert in status NEW** (*G/L ITEM WITHOUT ACCOUNTING*) and 10 *Suppressed* alerts (*Wrong Purchase Order Payment Plan*), so the expected count is **1**.

1. **Counter:** log in with the role in both UIs.
   - Expected (classic): the navigation bar shows **"Alerts (1)"** with the alert icon.
2. **Quick access:** click the indicator.
   - Expected: the *Alert Management* view opens.
3. **Automatic refresh:**
   - In **browser tab B**, open *Alert Management* and move a *Suppressed* alert of *Wrong Purchase Order Payment Plan* back to **New** (or move the NEW alert to *Acknowledged*).
   - In **browser tab A**, do nothing and wait up to 50 s.
   - Expected: the counter changes by itself ("Alerts (2)" or "Alerts (0)"). In F12 → Network, filter by `AlertActionHandler` to see one request every ~50 s.
4. **Zero alerts:** with no alert in status NEW, the indicator shows "Alerts (0)" without the icon.
5. **Session not extended** (optional, the session timeout is 3600 s): leave the tab idle longer than the session timeout; the session expires even though the polling keeps running.
6. **Clean up:** restore the original alert statuses from *Alert Management*.

**Proposed solution:** add an alerts indicator to the new UI navigation bar that shows "Alerts (N)" (translated label `UINAVBA_Alerts`) with an icon when N > 0, polls the backend on startup and every 50 seconds using a request that does not reset the session inactivity timer, and opens the *Alert Management* view on click and with its keyboard shortcut. Reuse (or expose through the metadata module) the classic `AlertActionHandler` so the count rules and the session last-ping update are identical to the classic UI.

**Test cases:**

1. **Scenario:** Initial counter
   - Given: a user with pending alerts in status NEW
   - When: the user logs in
   - Then: the indicator shows "Alerts (-)" until the first response and then "Alerts (N)" with the alert icon, with the same N as the classic UI
2. **Scenario:** Only NEW alerts are counted
   - Given: alerts in statuses New, Acknowledged, Suppressed and Solved
   - When: the counter is calculated
   - Then: only the alerts in status New of active rules addressed to the user/role (and visible for its clients/organizations) are counted
3. **Scenario:** Automatic refresh
   - Given: the application open and idle
   - When: the number of NEW alerts changes in the backend
   - Then: the counter is updated within 50 seconds without user interaction
4. **Scenario:** Zero alerts
   - Given: no alerts in status NEW
   - When: the counter is refreshed
   - Then: it shows "Alerts (0)" without the alert icon
5. **Scenario:** Quick access
   - Given: the indicator
   - When: the user clicks it or presses its keyboard shortcut
   - Then: the *Alert Management* view opens
6. **Scenario:** Polling does not extend the session
   - Given: an idle user with the application open
   - When: the session inactivity timeout is reached
   - Then: the session expires even though the alert polling kept running
7. **Scenario:** Session last ping updated
   - Given: the application open
   - When: the polling runs
   - Then: the session's *Last Ping* in the *Session* window is updated

**Result:** the new UI shows the number of pending alerts in the navigation bar, refreshed automatically like the classic UI, with quick access to *Alert Management*, without keeping idle sessions alive.

> Dependency with `[SEC-11] Token renewal / activity-based validity reset`: the alert polling must not extend the session. On click, the *Alert Management* view must be opened the same way the menu entry does it today (delegated to the classic UI); `[SEC-32] Alert management view` was discarded because that delegation is accepted.

**Metainformation:**

- Status: Created (ETP-5625)
- Priority: Major

### [SEC-32] Alert management view (grid, detail, acknowledge, links)

**Description:** Clicking the alert icon should open a management view with the user's alert list: a filterable and sortable grid that shows the detail of each alert (rule, description, generation date, and reference to the record), allows **acknowledging** an alert (marking it as read, which should decrement the badge), and offers **navigation links** to the originating record/window when the alert references one. None of this exists today.

**Proposed solution:** Provide an alert management view accessible from the icon, showing the user's alerts in a grid with filtering and sorting and the relevant detail. Add an **acknowledge** action that marks the alert as acknowledged on the server and updates the badge count, and **links** that open the originating record/window when the alert has a reference. Since the system exposes a standard window over alerts, the preferred approach is to **reuse the generic window engine / existing grid infrastructure** for the listing and detail, adding the acknowledge action and navigation to origin on top; a fully native reimplementation is the higher-effort alternative. It must respect the role/organization filtering already applied by the server.

**Test cases:**

1. **Scenario:** Management view opens from the icon
   - Given: the user clicks the alert icon
   - When: the view opens
   - Then: the management view shows the user's alert list
2. **Scenario:** Grid filters, sorts, and shows detail
   - Given: the management view is open
   - When: the user filters and sorts the grid
   - Then: each alert shows rule, description, date, and (if applicable) reference to the record
3. **Scenario:** Acknowledging decrements the badge
   - Given: an unacknowledged alert
   - When: the user acknowledges it
   - Then: the alert is marked as read and the icon badge decrements accordingly
4. **Scenario:** Link opens the originating record
   - Given: an alert with a reference to a record
   - When: the user clicks its link
   - Then: the correct originating window/record opens
5. **Scenario:** View scoped to role/organization
   - Given: alerts exist for various roles/organizations
   - When: the view renders
   - Then: only alerts of the user's role/organization are shown

**Result:** The user can open alert management from the icon, review and filter alerts, acknowledge them (with the badge reflecting the change), and jump to the originating record, with functional parity to the Classic Alert Management View.

**Metainformation:**

- Status: Discarded — Alert Management is a View menu entry that the new UI already opens delegated to the classic UI (popup, `Sidebar.tsx`); delegation to classic is accepted as correct.
- Priority: N/A

---

## Section 33 — View Personalization (Saved Views)

No pending tasks. The section is complete.

---

## Section 34 — Calendar Views

### [SEC-34] Agenda calendar view (day/week/month) as a widget

**Description:** The new UI does not offer an agenda calendar view in the style of Classic OBCalendar/OBMultiCalendar: there is no day/week/month time grid, no events as color blocks, no event creation on clicking a slot, no editing via an editor dialog, no drag & drop to reschedule, no resize to change duration, and no multi-calendar with swim lanes and a per-category legend. The only existing "CALENDAR" widget shows fiscal periods, which is a different functionality. In addition, this feature is niche and in Classic depends on a custom Action Handler to obtain the events (there is no standard events table), so its actual scope must be agreed with product.

**Proposed solution:** Build a **new agenda widget renderer** within the existing dashboard system (reusing its layout, data lifecycle, and type registry), presenting the events in day/week/month views with previous/next navigation, allowing an event to be created by selecting a slot and edited via a dialog with its fields, supporting drag & drop and resize to reschedule and resize, and offering a multi-calendar variant with lanes and a color-coded legend by category, respecting time zone and organization/role access. As an indispensable prior step, **define the event data source** (a new server entity/source or a proxy to the Classic Action Handler mechanism), given that the core does not provide a standard events table. Given the niche and *work-in-progress* nature of the Classic functionality, it is recommended to **prioritize it below** the window/process gaps and validate the minimum scope with product (for example, starting with a read-only monthly view).

**Test cases:**

1. **Scenario:** Calendar renders in the selected view mode
   - Given: a selected view mode (day/week/month)
   - When: the calendar renders
   - Then: events appear in their correct time position
2. **Scenario:** Previous/next navigation reloads events
   - Given: the calendar is displayed
   - When: the user navigates previous/next
   - Then: the shown period changes and the corresponding events reload
3. **Scenario:** Slot click creates, event click edits
   - Given: the calendar is displayed
   - When: the user clicks a time slot (or an existing event)
   - Then: the event creation dialog opens (or the editor opens with its fields)
4. **Scenario:** Drag & drop and resize persist
   - Given: an existing event
   - When: the user drags & drops it to a new time or resizes it
   - Then: the event is rescheduled/its duration changes, persisting the change
5. **Scenario:** Multi-calendar variant with lanes and legend
   - Given: the multi-calendar variant
   - When: it renders
   - Then: several lanes and a color-coded per-category legend are shown correctly
6. **Scenario:** Events respect time zone and access scope
   - Given: events across time zones and organizations/roles
   - When: the calendar renders and edits are attempted
   - Then: events respect the user's time zone and organization/role access (events outside the user's scope are neither shown nor edited)

**Result:** The user has a functional agenda calendar view (day/week/month) in the dashboard, with creation, editing, drag & drop, resize, multi-calendar with lanes and legend, with parity to the Classic OBCalendar within the scope agreed with product, and backed by an explicitly defined event data source.

**Metainformation:**

- Status: Discarded — No agenda calendar exists in the reference environment: in `etendodev` the classic "Calendar Widget" is only a superclass (no concrete subclass, 0 instances) and no installed module uses OBCalendar/OBMultiCalendar, so there is no classic behavior to match. To be reconsidered if a module providing a calendar is installed.
- Priority: N/A

---

## Section 35 — View States (Form/Grid Layout)

No pending tasks. The section is complete.

---

## Redundancies and groupings

Only the relations from `new-tasks.md` that involve at least one pending task are kept. Tasks referenced here that are already created are marked as such so the links can be made against the existing Jira issues.

**Reviewed: 24 tasks** across 15 sections — 13 created, 10 discarded, 1 pending analysis.

### Merges applied

- **External menu entries:** `[SEC-20] Opening external-link menu entries` merged into `[SEC-12] Support External / external-link menu entries (open URL)` (pending).

### Remaining relations (kept separate, linked in Jira)

- **Alerts / session:** `[SEC-32] Alert icon with badge and real-time polling` (pending) must not extend the session — coordinate with `[SEC-11] Token renewal / validity reset on activity` (already created). → Link as "relates to".

### Summary for Jira

- **Tasks created: 13** (Critical: 2 · Major: 4 · Minor: 6 · Trivial: 1).

| Priority | Task |
|----------|------|
| Critical | `[SEC-14] Output format selection in Process Definition reports` — **Created (ETP-5618)** |
| Critical | `[SEC-17] Audit Trail button and viewer in the toolbar` — **Created (ETP-5620)** |
| Major | `[SEC-9] Numeric column filters: support the classic expression syntax` — **Created (ETP-5616)** |
| Major | `[SEC-12] Support External / external-link menu entries (open URL)` — **Created (ETP-5617)** |
| Major | `[SEC-30] Column grouping in the grid (Group by / Ungroup)` — **Created (ETP-5624)** |
| Major | `[SEC-32] Alert icon with badge and real-time polling` — **Created (ETP-5625)** |
| Minor | `[SEC-4] Support the ^ (starts-with) operator in the display logic parser` — **Created (ETP-5613)** |
| Minor | `[SEC-5] Re-evaluate tab display logic with live header values` — **Created (ETP-5614)** |
| Minor | `[SEC-8] Minimum character threshold for the selector typeahead` — **Created (ETP-5615)** |
| Minor | `[SEC-14] Robustness of large reports (avoid execution timeout)` — **Created (ETP-5619)** |
| Minor | `[SEC-19] Lazy loading of Linked Items on expand` — **Created (ETP-5621)** |
| Minor | `[SEC-29] Consolidate tree detection on authoritative metadata` — **Created (ETP-5623)** |
| Trivial | `[SEC-19] Dedicated empty-state message for items with no results` — **Created (ETP-5622)** |

- **Discarded: 10** (reason in each task's metainformation).
- **Pending analysis: 1** — `[SEC-17] Generic plugin API for module buttons`.
- The relation above is a cross-link to an already-created issue, not a further merge.
