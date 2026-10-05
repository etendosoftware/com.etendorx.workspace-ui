# New Tasks — New UI completeness tasks

Consolidated document of all the tasks described in the completeness analyses in `client/features/seccion-*.md`, cross-checked against `all-features.md` (source of truth). Each task keeps its section of origin via the `[SEC-N]` prefix.

**Scope:** this document **only aggregates and reorganizes** the tasks already identified in each section analysis. It does not re-analyze the completeness of the sections (each source document is fully trusted). The end goal is to create these tasks in Jira; for now **no** connection to Jira is made.

**Structure of each task:** Title (`[SEC-N]` + summary < 80 characters) · Description · Proposed solution · Test cases · Result.

**Total:** 76 tasks across 34 sections with pending work. **Section 1 (Window Types)** has no tasks (complete). At the end, the [Redundancies and groupings](#redundancies-and-groupings) section documents duplicates, clusters, and dependencies between tasks.

> The **⚠️** indicators inherited from the original analyses (priority, "verify before taking") are preserved because they affect the planning of each task.

---

## Section 1 — Window Types

No pending tasks. The section is complete.

---

## Section 2 — Field / Column Reference Types

### [CREATED] [SEC-2] Time-only widget for Absolute Time fields (ref 2.12)

**Description:** A time selector (no date, no time zone conversion) is missing for type 2.12. It is the only pending type with real impact: 17 visible columns (time ranges per day in *Discounts and Promotions*).

**Proposed solution:** Reuse/extend the existing time selector for the Absolute Time `reference`, without a date component and without TZ conversion, and route it in the dispatcher.

**Test cases:**

1. **Scenario:** Time-only rendering
   - Given: an Absolute Time field (ref 2.12)
   - When: the user edits the field
   - Then: only time selection is rendered
2. **Scenario:** No time zone conversion
   - Given: an Absolute Time value
   - When: the value is displayed or edited
   - Then: no time zone conversion is applied
3. **Scenario:** Correct sorting order
   - Given: several Absolute Time values
   - When: they are compared/sorted
   - Then: the comparison/sorting order is correct
4. **Scenario:** Read-only display
   - Given: a read-only Absolute Time field
   - When: the user views it
   - Then: the formatted time is shown

**Result:** Absolute Time fields are edited as pure time.

### [CREATED] [SEC-2] Thousands separators in numeric form fields

**Description:** Numeric form fields do not show thousands separators in any state (`useGrouping:false`), unlike the classic UI, which shows them in the field display. The spec lists it as a requirement (2.3 Amount, 2.4 Number). The grid does group them correctly. This is a cosmetic gap, not a functional one.

**Proposed solution:** Enable thousands grouping in the `NumericSelector` when the field is **not focused** (display/read-only), respecting the locale, and keep the value ungrouped while editing so as not to hinder typing/parsing.

**Test cases:**

1. **Scenario:** Grouped display value
   - Given: an Amount/Number field in display state
   - When: the user views it
   - Then: it shows thousands separators according to the locale
2. **Scenario:** Editable on focus
   - Given: a numeric field in display state
   - When: the user focuses the field
   - Then: the value switches to editable format (ungrouped) and can be typed normally
3. **Scenario:** Reformat on blur
   - Given: a focused numeric field being edited
   - When: the field loses focus
   - Then: it is reformatted with separators
4. **Scenario:** Read-only grouping
   - Given: a read-only numeric field
   - When: the user views it
   - Then: the value is shown grouped
5. **Scenario:** Persisted value unaffected
   - Given: a numeric field with grouping applied
   - When: the record is saved
   - Then: the saved value does not change due to formatting (presentation only)

**Result:** Numeric form fields show thousands as in the classic UI, without affecting editing or the persisted value.

---

## Section 3 — Process Types

### [CREATED] [SEC-3] Migrate the classic JS of the remaining Manual Process Definitions

**Description:** 16 of 24 `Process Definition` processes with `uipattern = M` still reference classic SmartClient JavaScript functions (`classname`, e.g. `OB.AEATSII.send`) that do not exist in the new UI; when executed, the modal does not perform the expected action. The mechanism to run the migrated client logic already exists (`em_etmeta_onprocess`) and 8 processes already use it.

**Proposed solution:** move the logic of each classic JS function to the migrated process hook in the new UI (same approach already applied to Picking List/Packing), respecting the original behavior (popups, AJAX calls, messages, refresh). Prioritize the Core ones (Open Close Periods, UpdateInvariants, Recalculate Role Permissions) and then the modules according to business need (Spain SII, Etendo RX, OpenAPI). For processes that only open an external page (Open Swagger, Get Token), an equivalent open/redirect action is enough.

**Test cases:**

1. **Scenario:** Migrated process feedback parity
   - Given: a migrated process invoked from its button
   - When: the user executes it
   - Then: it runs its logic and shows the same feedback as the classic UI
2. **Scenario:** Popups/dialogs render cleanly
   - Given: a process that opens popups/dialogs
   - When: the user executes it
   - Then: they are shown correctly with no console errors
3. **Scenario:** Server calls succeed with friendly errors
   - Given: a process that makes server calls
   - When: the calls run
   - Then: they succeed and errors are handled with a friendly message
4. **Scenario:** Parent refresh after execution
   - Given: a process that affects the parent record
   - When: execution completes
   - Then: the parent grid/form refreshes when appropriate
5. **Scenario:** Works in grid and form contexts
   - Given: a process launched from grid view or form view
   - When: the user executes it
   - Then: it works with the correct context (record, tab, window)

**Result:** all 24 Manual Process Definitions execute natively in the new UI, eliminating the dependency on classic JavaScript and closing the section 100%.

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

---

## Section 5 — Tab-Level Behaviors

### [SEC-5] Re-evaluate tab display logic with live header values

**Description:** the visibility of child tabs is recalculated only when the selected parent record changes (selection/save), not while the user is editing the header form. This differs from the classic UI, where an unsaved change in a header field that controls a tab (e.g. `@IsVendor@='Y' & @IsCustomer@='Y'`) shows/hides the tab instantly.

**Proposed solution:** feed the tab display logic evaluation with the current values of the parent form (not just the persisted record), so that changing a field that affects a tab's visibility makes it appear/disappear in real time, reusing the existing display logic engine and its value normalization. Keep the reactive subscription only to the fields that each expression references.

**Test cases:**

1. **Scenario:** Live show/hide on header edit
   - Given: a header field that controls a tab
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

---

## Section 6 — Callouts

### [CREATED] [SEC-6] Show non-blocking callout messages in form and grid

**Description:** when a callout emits a message (information, warning, or success) the FIC returns it in the `calloutMessages` array of the change response, but the new UI only processes the blocking error (`status: -1`) and discards the rest. As a result, the non-blocking notices the user would see in the classic UI do not appear when editing in a window (neither in the form nor in inline grid editing).

**Proposed solution:** read the messages the callout returns in the change response and present them to the user with the corresponding severity (info/warning/success as a non-blocking notification and error as blocking), reusing the same messaging mechanism already available for the process modal. It must apply both to the form path and to the inline grid editing path, without altering the application of the values the callout also returns.

**Test cases:**

1. **Scenario:** Warning is non-blocking
   - Given: a callout that emits a warning
   - When: it fires
   - Then: the non-blocking notice is shown and editing can continue
2. **Scenario:** Info/success severity
   - Given: an informational/success callout
   - When: it fires
   - Then: the message is shown with the correct severity
3. **Scenario:** Error stays blocking
   - Given: a callout error message
   - When: it fires
   - Then: it is still shown as blocking (no regression relative to `status: -1`)
4. **Scenario:** Messages in form and inline grid
   - Given: a callout that emits a message
   - When: the user edits in the form or in inline grid editing
   - Then: the messages appear in both cases
5. **Scenario:** Multiple messages
   - Given: multiple messages in a single callout response
   - When: it fires
   - Then: all of them are shown
6. **Scenario:** No messages on load or programmatic change
   - Given: record load or programmatic changes
   - When: they occur
   - Then: no messages are shown

**Result:** callout notices (non-blocking and blocking) are communicated to the user in the window just like the classic UI, closing the only functional gap in the section.

### [CREATED] [SEC-6] Briefly highlight fields modified by a callout

**Description:** after a callout runs, the fields it changes automatically are updated but with no visual signal; in the classic UI the user perceives a momentary highlight indicating which fields the callout touched. This is a parity/UX improvement, not a data defect.

**Proposed solution:** when applying the values returned by a callout, transiently mark the fields that actually changed with a brief highlight that fades out, reusing the information about which columns the response returned so as not to highlight fields that did not change. Applicable to the form and, if feasible, to the grid.

**Test cases:**

1. **Scenario:** Auto-filled fields highlight briefly
   - Given: a callout that auto-fills fields
   - When: it fires
   - Then: those fields show a brief highlight and then return to normal
2. **Scenario:** Unchanged fields not highlighted
   - Given: fields not modified by the callout
   - When: the callout fires
   - Then: they are not highlighted
3. **Scenario:** Highlight does not interfere
   - Given: a field with an active highlight
   - When: the user continues editing
   - Then: the highlight does not interfere with subsequent editing or focus
4. **Scenario:** No performance impact
   - Given: a callout that applies many values at once
   - When: it fires
   - Then: there is no perceptible performance impact

**Result:** the user visually identifies which fields a callout changed, matching the classic UI experience.

---

## Section 7 — Record State Machine

### [CREATED] [SEC-7] Communicate concurrent-edit conflicts on save

**Description:** when two users edit the same document, the backend rejects the second save via optimistic locking (the new UI already sends the record's `updated`), but the user only receives a generic save error. There is no clear "the record was modified by another user" message nor a guided action to reload the updated record, as happens in the classic UI.

**Proposed solution:** detect the version-conflict response the backend returns on save and present it as a specific concurrent-edit notice, offering the user to reload the record with the current data before retrying. Reuse the existing messaging mechanism and the record-refresh flow the section uses after document actions, without altering the rest of the save error handling.

**Test cases:**

1. **Scenario:** Clear conflict notice
   - Given: a record another user already modified
   - When: the user edits and saves it
   - Then: a clear conflict notice is shown (not a generic error)
2. **Scenario:** Reload shows current version
   - Given: a conflict notice offering to reload
   - When: the user reloads
   - Then: the data reflects the current version
3. **Scenario:** No notice without conflict
   - Given: a save without conflict
   - When: the user saves
   - Then: no notice is shown (no regression)
4. **Scenario:** Other save errors unchanged
   - Given: save errors like validation or permissions
   - When: they occur
   - Then: they are still shown as before
5. **Scenario:** Applies in form and inline grid
   - Given: a concurrent-edit conflict
   - When: it occurs in form view or inline grid editing
   - Then: the notice applies in both

**Result:** concurrent-edit conflicts are communicated clearly and actionably, matching the classic UI experience and closing the last checklist item of the section.

> Related to `[SEC-10] Global error boundary and network/conflict error handling` (which also mentions the concurrent conflict). See [Redundancies and groupings](#redundancies-and-groupings), cluster G.

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

### [SEC-8] Minimum character threshold for the selector typeahead

**Description:** search selectors (OBUISEL/Search) query the backend after the *debounce* with any number of characters, even a single one. The spec checklist contemplates triggering the search only from a minimum number of characters, which avoids poorly selective queries on large tables.

**Proposed solution:** introduce a configurable minimum character threshold (with a reasonable default, e.g. 2–3) below which the typeahead does not trigger the query, keeping the current *debounce* and pagination. Allow opening the full search popup for cases where the user wants to explore without typing.

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
5. **Scenario:** No regression on working selectors
   - Given: selectors that work today
   - When: the user selects and the callout runs
   - Then: selection and callout stay the same (no regression)

**Result:** the typeahead queries only when the term is selective enough, reducing unnecessary load and aligning with the checklist's expected behavior.

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

### [SEC-9] Range filters for numeric fields

**Description:** numeric columns are filtered as text (`contains`); there is no numeric range filter with operators (min/max, `>=`/`<=`) that the checklist contemplates for numeric fields.

**Proposed solution:** offer, for numeric columns, a range filter (minimum and/or maximum value, or comparison operators) that translates to the corresponding datasource criteria, keeping filter persistence and the combination with other column filters.

**Test cases:**

1. **Scenario:** Filter within a range
   - Given: a numeric column
   - When: it is filtered by a range
   - Then: only records within the range are returned
2. **Scenario:** Only min or only max
   - Given: a numeric column
   - When: filtering with only a minimum or only a maximum
   - Then: the filter works
3. **Scenario:** Combines with other column filters
   - Given: a numeric range filter and other column filters
   - When: they are applied together
   - Then: they combine with AND
4. **Scenario:** Persisted and sent server-side
   - Given: an applied numeric filter
   - When: the request is issued
   - Then: it persists in the session and is sent server-side (no client-side filtering)

**Result:** numeric columns can be filtered by range, covering the checklist item.

---

## Section 10 — Cross-Cutting Behaviors

### [CREATED] [SEC-10] Global error boundary and network/conflict error handling

**Description:** business, validation, and process error handling is covered, but there is no global application error boundary (a JS error in a component can propagate) nor explicit, friendly handling of network/timeout errors and concurrent-edit conflicts.

**Proposed solution:** add a global error boundary that catches render failures and shows a recovery screen instead of breaking the application; and standardize friendly messages for network/timeout errors and for the concurrent-edit case (when the server signals a conflict, warn and offer to reload). Reuse the existing toast/messaging system.

**Test cases:**

1. **Scenario:** Render error shows recovery UI
   - Given: a component that throws a render error
   - When: the error occurs
   - Then: the recovery UI is shown, not a blank screen
2. **Scenario:** Network failure shows actionable message
   - Given: a timeout or loss of connection
   - When: the request fails
   - Then: an actionable message is shown, not a generic error
3. **Scenario:** Concurrent-edit conflict allows reload
   - Given: the server reports an edit conflict
   - When: the conflict is received
   - Then: the UI warns and allows reloading without losing context
4. **Scenario:** No regression in business/validation errors
   - Given: the global error handling is in place
   - When: an existing business/validation error occurs
   - Then: it is still shown with its correct type

**Result:** the application is more robust against unexpected failures and communicates infrastructure errors clearly.

> The concurrent-conflict case overlaps with `[SEC-7] Communicate concurrent-edit conflicts on save`. See cluster G.

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

---

## Section 11 — Authentication, Session, and Authorization

### [CREATED] [SEC-11] Invalidate the token on the server at logout

**Description:** since JWT is stateless, logout clears the client state but the token remains valid until it expires; a leaked token is still usable after logout. Checklist 11.1 requires the token to stop being valid.

**Proposed solution:** introduce a server-side revocation mechanism (for example, a revocation list/blacklist of tokens until they expire, or a logout endpoint in SWS that invalidates the associated session) and have the client logout invoke it. This requires coordination with the backend (`com.smf.securewebservices` / adapter). The client already centralizes logout, so it only needs to call the new endpoint.

**Test cases:**

1. **Scenario:** Reusing the old token returns 401
   - Given: a user who has logged out
   - When: the previous token is reused
   - Then: the request returns 401
2. **Scenario:** Client state cleared even if revocation fails
   - Given: a revocation call that fails
   - When: the user logs out
   - Then: the client state is still cleared (graceful degradation)
3. **Scenario:** Non-revoked token keeps working
   - Given: a token that has not been revoked
   - When: it is used before expiring
   - Then: it keeps working until its normal expiration

**Result:** logout effectively invalidates the token, closing the reuse window.

### [CREATED] [SEC-11] Token renewal / validity reset on activity

**Description:** with a fixed JWT expiration, user activity does not extend the session and there is no refresh; an active user can be kicked out when the token expires. The checklist asks that interaction reset the timer (and optionally that refresh exist).

**Proposed solution:** implement transparent token renewal (a refresh endpoint in the backend + client logic that requests it before expiration while there is recent activity), so the session is extended with use and only expires after real inactivity. Keep the current 401-based eviction behavior as a safety net.

**Test cases:**

1. **Scenario:** Continuous activity keeps session alive
   - Given: continuous user activity
   - When: the original token time is reached
   - Then: the session does not expire
2. **Scenario:** Inactivity expires the session
   - Given: a period of inactivity
   - When: the token time is reached
   - Then: the session expires and redirects to login with a message
3. **Scenario:** Refresh is transparent
   - Given: an operation in progress
   - When: the refresh occurs
   - Then: it happens transparently, without interrupting the operation
4. **Scenario:** Background polling does not keep the session alive forever
   - Given: a background polling/heartbeat
   - When: there is no real user activity
   - Then: it does not keep the session alive indefinitely

**Result:** the session validity reflects the user's real activity, avoiding evictions during work.

> Dependency note: the alerts polling in `[SEC-32] Alerts icon with badge and polling` must **not** renew the session; coordinate with this task.

### [CREATED] [SEC-11] Force change of expired password at login

**Description:** the user model already exposes `isPasswordExpired`, but the login flow neither checks nor acts on it; a user with an expired password is not directed to change it.

**Proposed solution:** at login, detect the expired-password condition (from the backend response) and route the user to a mandatory password-change flow before allowing access, reusing the existing password-change functionality.

**Test cases:**

1. **Scenario:** Login with expired password forces change
   - Given: a user with an expired password
   - When: they log in
   - Then: the mandatory change flow is shown and they do not enter the app
2. **Scenario:** After changing, access is granted
   - Given: the mandatory change flow
   - When: the password is changed successfully
   - Then: the user accesses normally
3. **Scenario:** Valid password logs in directly
   - Given: a user with a valid password
   - When: they log in
   - Then: the flow is not shown and they access directly
4. **Scenario:** Failed change keeps the flow open
   - Given: a password change that does not meet policy
   - When: the change is attempted
   - Then: the error is shown and the flow stays open

**Result:** users with an expired password are forced to update it, complying with the security policy.

### [CREATED] [SEC-11] Contextual Help link per window

**Description:** the classic help widget offers, in addition to About (already implemented), a Help link that appears only when the current window has help configured and opens the contextual help content. This link does not exist in the new UI.

**Proposed solution:** conditionally show a "Help" access when the active window's metadata indicates it has help configured, and open the corresponding help content (for example, the classic help view via the proxy, analogous to how About is opened).

**Test cases:**

1. **Scenario:** Help link appears only with configured help
   - Given: a window that has help configured
   - When: the help widget is shown
   - Then: the Help link appears
2. **Scenario:** Help opens the correct content
   - Given: a window with configured help
   - When: the Help link is opened
   - Then: the help content for the correct window is shown
3. **Scenario:** No Help link without configured help
   - Given: a window without help
   - When: the help widget is shown
   - Then: the link is not shown
4. **Scenario:** Escape/close closes help
   - Given: the help content open
   - When: Escape/close is pressed
   - Then: the help content is closed

**Result:** the user accesses contextual help for each window, completing parity of the Help & About widget with the classic UI.

---

## Section 12 — Navigation and Application Structure

### [CREATED] [SEC-12] Persist recent items server-side with configurable size

**Description:** recent items are saved only in `localStorage` with a fixed cap of 5 entries, whereas the classic UI persists them in `AD_Preference` (server-side) and limits their size with the `UINAVBA_RecentListSize` preference (default 3). As a result, the new UI's recent items are not shared across browsers/devices nor do they respect the user's configuration.

**Proposed solution:** persist the recent items list as a user preference in the backend (through the adapter) so it is retrieved at login from any machine, and use the size preference value for trimming instead of a fixed number. Keep the local cache as a backup/optimization to avoid depending on the network on every open.

**Test cases:**

1. **Scenario:** Recent items shared across browsers
   - Given: windows opened in one browser
   - When: the user logs in on another browser
   - Then: the same recent items are shown
2. **Scenario:** Size respects the preference
   - Given: `RecentListSize = 3`
   - When: items are added or the preference is changed
   - Then: the list never exceeds 3 entries and the cap adjusts when changed
3. **Scenario:** Oldest items discarded
   - Given: a full recent list
   - When: the configured size is exceeded
   - Then: the oldest items are discarded
4. **Scenario:** List scoped per user and role
   - Given: the recent items list
   - When: it is retrieved
   - Then: it remains per user and per role

**Result:** recent items behave as in the classic UI: persistent across sessions/devices and with a user-configurable size.

### [CREATED] [SEC-12] Recent documents list (individual records)

**Description:** the classic UI keeps, in addition to the list of menu entries, a list of **recent documents** (records viewed individually). The new UI only records the windows/processes opened from the menu, not the concrete records the user visits.

**Proposed solution:** record access to individual records (when a record is opened in form view) in a separate recent documents list, and offer direct navigation from that list to the corresponding record (reusing the URL-based *recovery* system). Apply the same size, most-recent-order, and per-user/role segmentation criteria as the menu list.

**Test cases:**

1. **Scenario:** Opening a record adds it to recent documents
   - Given: a record opened in form view
   - When: it is opened
   - Then: it is added to the recent documents list
2. **Scenario:** Clicking a recent document opens it
   - Given: a recent document in the list
   - When: it is clicked
   - Then: that specific record opens in form view
3. **Scenario:** List respects configured size
   - Given: a full recent documents list
   - When: new documents are added
   - Then: it respects the configured size and discards the oldest
4. **Scenario:** Inaccessible documents hidden after role change
   - Given: documents for resources with no access after a role change
   - When: the list is shown
   - Then: those documents are not shown

**Result:** the user can quickly return to the last records they consulted, with parity to the classic UI.

### [SEC-12] Support External / external-link menu entries (open URL)

> **⚠️ Low priority.** In the representative environment (`etendodev`) there are no active menu entries with an external URL, so the current impact is nil. Take it only if the project needs to support menus with external links.

**Description:** the menu click dispatch (and the menu search) does not handle the `External` / external-link entry type; an entry with a configured URL performs no action, unlike the classic UI which opens it in a new browser tab. It is a valid checklist type and may appear if an administrator configures it.

**Proposed solution:** add a branch in the menu click/search routing that, for External / external-link entries, opens the entry's URL in a new browser tab, consuming the URL field the backend already emits, with the same blocked-popup notice that classic reports/processes already use. It must not alter the behavior of the already-supported item types.

**Test cases:**

1. **Scenario:** External entry opens its URL
   - Given: an External / external-link menu entry with a URL
   - When: it is clicked or selected from the search
   - Then: its URL opens in a new browser tab
2. **Scenario:** Blocked popup notice
   - Given: the browser blocks the opening
   - When: the user activates the entry
   - Then: the notice with a manual-open option is shown
3. **Scenario:** Other item types unchanged
   - Given: other item types (window, process, report, form, view)
   - When: they are opened
   - Then: they keep their current behavior
4. **Scenario:** External entry without URL does not break
   - Given: an External entry without a URL
   - When: it is activated
   - Then: navigation is not broken

**Result:** External / external-link menu entries open correctly in a new tab (with a blocked-popup fallback), covering the checklist item.

> Consolidates the former `[SEC-20] Opening external-link menu entries` task (merged here).

### [CREATED] [SEC-12] "Access denied" screen on deep-links without access

**Description:** when sharing/opening a direct URL to a window or record for which the current role has no access, server-side enforcement prevents data delivery, but the client does not show a clear "access denied" message (likely an empty view). This is the same behavior observed in 11.6 / 10.13.

**Proposed solution:** detect in the navigation layer the case of a non-accessible resource (due to missing authorized metadata/data) and show an explicit "access denied" screen or message, instead of an empty view or a generic error. It does not change enforcement (still in the backend), only the presentation of the case.

**Test cases:**

1. **Scenario:** URL without access shows "access denied"
   - Given: a URL to a window the role cannot access
   - When: it is opened
   - Then: "access denied" is shown, not an empty view or a generic error
2. **Scenario:** User with access opens normally
   - Given: a user with access
   - When: they open the same URL
   - Then: it opens normally
3. **Scenario:** Role change restores access
   - Given: a role that gains access
   - When: switching to that role and opening the URL
   - Then: the resource opens again

**Result:** deep-links to unauthorized resources give clear feedback to the user, closing the UX gap noted in Sections 10, 11, and 12.

> This task consolidates the "access denied" UX gap also referenced in Sections 10 and 11. See cluster H.

---

## Section 13 — Record Creation, Editing, and Persistence

### [CREATED] [SEC-13] Unified unsaved-changes guard (logout, tab close, New, switch)

**Description:** there is no consistent unsaved-changes guard across exit and transition points. Today: logout from the profile widget executes immediately (losing unsaved edits without warning); closing or reloading the browser tab with a dirty form or inline row shows no native warning; pressing *New* clears the form without warning, and navigating between records autosaves — all differing from the classic UI, which warns and offers to discard. Dirty-state detection already exists for navigation between forms/tabs.

**Proposed solution:** build a single unified dirty-state guard, reusing the existing per-window/tab and per-row change tracking, applied at every trigger point: (a) **logout** — confirm (continue and discard / cancel) before proceeding; (b) **browser tab close/reload** — a document-level native warning active while any dirty source exists and cleared once everything is saved/discarded; (c) **in-window transitions** (pressing *New*, selecting another record, switching tabs) — offer save / discard / cancel consistently. Define with the team whether the current autosave-on-navigation is kept as an option or replaced by the warning. It only adds guards; it does not change the save logic, and it must not interfere with the automatic logout on session expiry.

**Test cases:**

1. **Scenario:** Logout with unsaved changes
   - Given: unsaved changes in a record
   - When: the user triggers logout
   - Then: it asks for confirmation; cancel keeps the session, confirm discards and logs out
2. **Scenario:** No pending changes logs out smoothly
   - Given: no pending changes
   - When: the user triggers logout
   - Then: logout proceeds without friction, and session-expiry logout is unaffected
3. **Scenario:** Dirty form/row warns on tab close
   - Given: a dirty form or an inline row with unsaved changes
   - When: the user tries to close/reload the browser tab
   - Then: the browser's native warning is shown
4. **Scenario:** Warning stops after save/discard
   - Given: previously dirty state
   - When: the changes are saved or discarded
   - Then: no tab-close warning appears
5. **Scenario:** New with a dirty form
   - Given: a dirty form
   - When: *New* is pressed
   - Then: it offers save/discard/cancel before clearing
6. **Scenario:** Switching record or tab with unsaved changes
   - Given: unsaved changes
   - When: another record is selected or another tab is opened within the window
   - Then: the same save/discard/cancel policy applies; cancel keeps the form and changes intact

**Result:** a single, consistent unsaved-changes guard protects work across logout, browser tab close/reload, and in-window transitions (New / record switch / tab switch), with parity to the classic UI.

> Consolidates the former `[SEC-11] Warn about unsaved changes before logout` and `[SEC-13] Discard warnings when pressing New or switching records` tasks (merged here).

### [CREATED] [SEC-13] Select the next record after a deletion

**Description:** after deleting a record, the classic UI leaves the next record selected (or shows an empty state if there are no more). In the new UI, deleting from the form returns to the grid and refreshes, without guaranteeing automatic selection of the next record.

**Proposed solution:** when a deletion completes, automatically select a neighboring record from the current list (next or previous depending on availability) and, if the list becomes empty, show the corresponding empty state, reusing the grid's existing selection mechanism.

**Test cases:**

1. **Scenario:** Deleting a middle record selects the next
   - Given: a middle record in the list
   - When: it is deleted
   - Then: the next record is left selected
2. **Scenario:** Deleting the last record selects the previous
   - Given: the last record in the list
   - When: it is deleted
   - Then: the previous record is selected
3. **Scenario:** Deleting the only record shows empty state
   - Given: a single record in the list
   - When: it is deleted
   - Then: the empty state is shown
4. **Scenario:** Multiple deletion leaves a coherent selection
   - Given: several selected records
   - When: they are deleted and the rows are removed
   - Then: a coherent selection is left

**Result:** the post-deletion flow is smooth and consistent with the classic UI, without leaving the grid with no selection context.

---

## Section 14 — Reports (Standalone Menu Access)

### [SEC-14] Output format selection in Process Definition reports

> **⚠️ Verify before taking the task.** This functionality may already be resolved in a task/PR **not yet merged** into the analyzed branch. Before starting, confirm the real state: review open branches/PRs related to report output format and check, on the already-integrated base, whether the native `OBUIAPP_Report` modal offers format choice (PDF/Excel/HTML). If it is already merged, this task is closed with no changes; if not, proceed as described below.

**Description:** `OBUIAPP_Report` reports (14.2) run today with a single *Execute* button and return a single format (by default, typically PDF). The classic popup lets the user choose the output format (e.g. PDF, Excel, HTML) in the report footer. That choice capability is missing in the native modal.

**Proposed solution:** offer the supported format options in the report modal footer and propagate the user's choice to the report handler execution, so the download/view action delivers the file in the requested format. The choice should be presented only for report-type processes and respect the formats the backend actually supports.

**Test cases:**

1. **Scenario:** Execute a report as PDF
   - Given: a 14.2 report
   - When: it is executed choosing PDF
   - Then: it generates and delivers a PDF
2. **Scenario:** Execute the same report as Excel
   - Given: the same report
   - When: it is executed choosing Excel
   - Then: it delivers a downloadable Excel file
3. **Scenario:** Single-format report shows no redundant options
   - Given: a report that only supports one format
   - When: it is executed
   - Then: it shows no redundant options and works as today
4. **Scenario:** Chosen format sent to the backend
   - Given: a chosen format
   - When: the report handler is invoked
   - Then: the format is correctly sent to the backend handler (verifiable in the request)

**Result:** the user can choose the output format of a Process Definition report from the new UI, with parity to the classic popup.

### [SEC-14] Robustness of large reports (avoid execution timeout)

**Description:** a Process Definition report is executed with a single request to the handler; for reports with many rows there is a risk that the request exceeds the maximum time and fails without a clear message, unlike the *report-and-process* route that already uses polling with a deadline.

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

---

## Section 15 — Loading Indicators and Feedback

### [CREATED] [SEC-15] Loading indicator during CSV/Excel export

**Description:** the action to export the grid to CSV/Excel makes an asynchronous request to the server and downloads the file, but offers no visual feedback while the operation is in progress. In exports with many records the user does not perceive that the system is working and may retry or believe the action failed.

**Proposed solution:** reflect the "in progress" state of the export in the UI while the request lasts: for example, disable/animate the export trigger and/or show the existing loading indicator, and hide it on completion or failure. The solution must reuse the indicator mechanisms already present in the application to keep visual consistency.

**Test cases:**

1. **Scenario:** Export shows a loading indicator
   - Given: an export starts
   - When: the request is in progress
   - Then: a loading indicator is shown and the trigger is in a busy state
2. **Scenario:** Indicator disappears on completion
   - Given: an in-progress export
   - When: the download completes
   - Then: the indicator disappears and the file is delivered
3. **Scenario:** Indicator disappears on failure
   - Given: an in-progress export
   - When: the export fails
   - Then: the indicator disappears and the corresponding error message is shown
4. **Scenario:** Fast export does not hang the indicator
   - Given: a small, fast export
   - When: it completes quickly
   - Then: the indicator is not left "hanging"

**Result:** the user gets clear feedback while the exported file is prepared and downloaded, aligned with the rest of the application's loading indicators.

### [CREATED] [SEC-15] Loading indicator during logout

**Description:** logout invalidates the session, clears the token, and redirects, but shows no indicator nor blocks the trigger control while the process happens. On slow networks the user could click several times or not perceive that the session is being closed.

**Proposed solution:** present a loading indicator (global or local to the logout control) while logout runs, preventing multiple triggers, until invalidation and redirection complete. It must reuse the existing global indicator or the busy-state pattern already used in other controls.

**Test cases:**

1. **Scenario:** Logout shows an indicator and blocks clicks
   - Given: the logout control
   - When: it is pressed
   - Then: an indicator is shown and the control does not accept new clicks
2. **Scenario:** Redirect to login after invalidation
   - Given: the session has been invalidated
   - When: logout completes
   - Then: the application redirects to login with no ambiguous states
3. **Scenario:** Logout failure returns to a consistent state
   - Given: a logout that fails
   - When: the failure occurs
   - Then: the error is reported and the UI returns to a consistent state

**Result:** logout offers visual feedback during session invalidation, with parity to the classic behavior.

---

## Section 17 — Toolbar Buttons (Complete Reference)

### [SEC-17] Audit Trail button and viewer in the toolbar

**Description:** The classic UI offers an **Audit** button that opens the change history of the current record (who, when, and what changed) when the audit trail is enabled. The new UI exposes neither this button nor an equivalent view.

**Proposed solution:** Add an audit button to the toolbar registry, visible only when the record has auditing enabled and a saved record is selected, that opens a view/dialog with the change history obtained from the backend. It must respect permissions and be disabled on new unsaved records.

**Test cases:**

1. **Scenario:** Button opens history
   - Given: a window with audit trail enabled and a record selected
   - When: the user clicks the button
   - Then: it appears and opens the change history
2. **Scenario:** History content
   - Given: a record with audited changes
   - When: the history is displayed
   - Then: it shows the changes (field, old/new value, user, date)
3. **Scenario:** Disabled on new record
   - Given: a new unsaved record
   - When: viewing the toolbar
   - Then: the button is disabled
4. **Scenario:** Hidden without auditing
   - Given: a window without auditing enabled
   - When: viewing the toolbar
   - Then: the button does not appear

**Result:** The user can consult a record's change history from the toolbar, with parity to the classic Audit button.

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

---

## Section 18 — Application Forms (ad_form)

### [CREATED] [SEC-18] "Popup blocked" fallback when opening Application Forms

**Description:** When clicking a Form-type menu entry, the new UI opens the classic form in a browser popup (`window.open`). If the browser blocks the popup, the action fails silently: the form does not open and the user receives no message or alternative to open it manually. Classic reports/processes already handle this case with a notice and a manual-open action; forms do not.

**Proposed solution:** Reuse the same blocked-popup handling pattern that reports already use: when attempting to open the form, detect whether the opening was blocked and, in that case, show a notice with an action to open the form manually. The solution must be consistent with the existing behavior for reports and must not alter the flow when the popup opens correctly.

**Test cases:**

1. **Scenario:** Form opens with popups allowed
   - Given: popups allowed
   - When: the user clicks a form in the menu
   - Then: the classic form opens normally in its window
2. **Scenario:** Blocked popup shows notice
   - Given: the popup blocker active
   - When: the user clicks
   - Then: the "popup blocked" notice is shown with an action to open the form manually
3. **Scenario:** Manual-open action works
   - Given: the "popup blocked" notice
   - When: the user triggers the manual-open action
   - Then: the same form opens correctly (same authenticated URL)
4. **Scenario:** Reports/processes unchanged
   - Given: classic reports/processes
   - When: they are opened
   - Then: their behavior remains unchanged

**Result:** Opening forms from the menu provides feedback and a manual alternative when the browser blocks the popup, with parity to the handling of reports.

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

### [SEC-19] Dedicated empty-state message for items with no results

**Description:** When the user selects a Linked Items category that has no associated records, the items panel shows the message "No categories available", which corresponds to the absence-of-categories case and is confusing in this context. A specific message is missing to indicate that the selected category has no linked items.

**Proposed solution:** Introduce a dedicated empty-state text for the items panel (for example, "No associated items") and use it when a selected category returns zero items, distinguishing it from the "no categories" message. It must be translated in the supported languages.

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

---

## Section 20 — Quick Launch (Global Search)

### [CREATED] [SEC-20] Keyboard navigation and closing in the menu search

**Description:** The menu search filters results in real time, but does not allow keyboard operation beyond accepting the autocomplete suggestion (Tab). One cannot traverse results with the ↑/↓ arrows, open the highlighted result with Enter, or clear/close the search with Escape. This forces mouse use and departs from the "command palette" experience of the classic Quick Launch.

**Proposed solution:** Add keyboard handling to the search: move the highlight through the results list with the arrows, open the highlighted result with Enter (reusing the existing click dispatch), and use Escape to clear the search term and return the focus/initial state. The solution must respect the current filtering and item-opening flow and be consistent across the different result types.

**Test cases:**

1. **Scenario:** Arrows move the highlight
   - Given: visible results
   - When: the user presses ↑/↓
   - Then: the highlight moves between them
2. **Scenario:** Enter opens the highlighted result
   - Given: a highlighted result
   - When: the user presses Enter
   - Then: it opens the correct item (window/process/report/form/view)
3. **Scenario:** Escape clears the term
   - Given: a search term entered
   - When: the user presses Escape
   - Then: the term is cleared and the full menu list is restored
4. **Scenario:** Tab autocomplete unchanged
   - Given: the existing Tab autocomplete
   - When: it is used
   - Then: it continues working without regressions
5. **Scenario:** Navigation respects visible order
   - Given: filtered results
   - When: navigating by keyboard
   - Then: navigation respects the visible order of the filtered results

**Result:** The menu search is fully operable with the keyboard (traverse, open, and close), with parity in efficiency and accessibility to the classic Quick Launch.

---

## Section 21 — Workspace / Dashboard (My Openbravo)

### [CREATED] [SEC-21] Collapse/expand dashboard widgets

**Description:** The dashboard cards cannot be collapsed; they always occupy their full height. The classic Workspace allows collapsing a widget to reduce it to its header and save space. The collapse control on the card and the persistence of that state across sessions are missing.

**Proposed solution:** Add a collapse/expand action to the widget card that hides its content leaving the header visible, and persist that state per instance along with the rest of the user's layout (same per-user+role persistence path as position and size). When collapsed, the widget should not need to reload data until expanded again.

**Test cases:**

1. **Scenario:** Collapse hides content
   - Given: an expanded widget
   - When: the user collapses it
   - Then: its content is hidden and the header remains visible
2. **Scenario:** Expand shows data again
   - Given: a collapsed widget
   - When: the user expands it
   - Then: it shows again with its data
3. **Scenario:** State persists across sessions
   - Given: a collapsed/expanded state
   - When: the page is reloaded / the user re-enters
   - Then: the state persists (server-side)
4. **Scenario:** Collapse does not break layout
   - Given: a collapsed widget
   - When: reordering or resizing other widgets
   - Then: the collapse does not break their reorder or resize
5. **Scenario:** No data requests while collapsed
   - Given: a collapsed widget
   - When: it remains collapsed
   - Then: it fires no data requests until expanded

**Result:** The user can collapse/expand widgets and the state is preserved across sessions, with parity to the classic Workspace.

### [CREATED] [SEC-21] Filter the "Add widget" catalog by role access

**Description:** The "Add widget" dialog shows the same catalog of types to all roles, because the new framework has no per-role access control over widget classes (unlike the classic UI, which defines it in its access table). Each widget's data is already scoped by organization/role, but any role can add any widget type from the catalog.

**Proposed solution:** Introduce a per-role access control over widget classes (conceptually equivalent to the classic access table) and apply it both when listing the "Add widget" catalog and when resolving the layout, so that each role only sees/adds the allowed types. It must include a safe default behavior (e.g. visible unless explicitly restricted) so as not to break existing dashboards.

**Test cases:**

1. **Scenario:** Restricted type hidden from catalog
   - Given: a role with restricted access to a widget type
   - When: opening the "Add widget" catalog
   - Then: it does not see that type
2. **Scenario:** Allowed type can be added
   - Given: a role with access
   - When: adding the widget type
   - Then: it can be added
3. **Scenario:** Layout omits disallowed types
   - Given: the active role
   - When: the layout is resolved
   - Then: it does not show widgets of types not allowed for that role
4. **Scenario:** Safe default preserves existing widgets
   - Given: widgets already in use
   - When: the control is introduced
   - Then: the default behavior does not hide them

**Result:** The widget catalog and the dashboard respect per-role access, completing the checklist criterion.

### [CREATED] [SEC-21] Manual widget data refresh

> **⚠️ Low priority.** Periodic auto-refresh via `refreshInterval` and programmatic refresh already exist; only the on-demand manual action is missing.

**Description:** The user cannot force a widget's data to update: they must wait for the auto-refresh interval (if the widget has one) or reload the page. An explicit "refresh" control on the card is missing.

**Proposed solution:** Add a refresh action to the widget card that re-requests that instance's data (reusing the existing per-instance refresh), with a visual loading indication while it updates. It must not alter the periodic auto-refresh.

**Test cases:**

1. **Scenario:** Refresh re-requests data
   - Given: a widget
   - When: the user clicks the refresh button
   - Then: it re-requests the widget's data and updates the content
2. **Scenario:** Loading state during refresh
   - Given: a refresh in progress
   - When: the data is being fetched
   - Then: a loading state is shown
3. **Scenario:** Auto-refresh unchanged
   - Given: periodic auto-refresh
   - When: a manual refresh is performed
   - Then: the auto-refresh continues working without changes
4. **Scenario:** Refresh error handled
   - Given: a refresh that fails
   - When: the error occurs
   - Then: the error message is shown without breaking the card

**Result:** The user can update a widget's data on demand, completing the "manual and periodic refresh" criterion.

---

## Section 22 — Field Groups (Form Sections)

### [CREATED] [SEC-22] Auto-expand collapsed sections on mandatory-field error

**Description:** When the user saves a form and a value is missing in a mandatory field that belongs to a collapsed section (field group), the new UI shows the error in a modal but does not expand the section or visually indicate which field is the problem. Since the field is hidden inside the collapsed section, the user cannot easily locate it, unlike the classic UI, which auto-expands the group and highlights the field with the error.

**Proposed solution:** Upon receiving field-level validation errors after a save attempt, determine which section(s) the affected fields belong to and automatically expand those sections, bringing focus (and scroll) to the first field with an error. The logic must reuse the existing section-expansion mechanism and the field→group mapping that the form builds, without altering the flow when there are no errors.

**Test cases:**

1. **Scenario:** Save expands collapsed section
   - Given: a mandatory field empty inside a collapsed section
   - When: the user saves
   - Then: that section is expanded automatically
2. **Scenario:** Focus on first missing field
   - Given: a section expanded due to an error
   - When: it expands
   - Then: focus/scroll lands on the first missing mandatory field
3. **Scenario:** Multiple sections expand
   - Given: several missing fields in different collapsed sections
   - When: the user saves
   - Then: all involved sections are expanded
4. **Scenario:** Missing field in expanded section
   - Given: a missing mandatory field in an already-expanded section
   - When: the user saves
   - Then: the error is still shown with no behavior changes
5. **Scenario:** Successful save leaves expansion untouched
   - Given: a successful save
   - When: it completes
   - Then: it does not alter the sections' expansion state

**Result:** On a validation error, the user always sees the affected mandatory field because its section expands automatically, with behavior parity to the classic UI.

### [CREATED] [SEC-22] Persist the collapse/expansion preference during the session

> **⚠️ Low priority.** It is a convenience improvement. The initial state from metadata (`iscollapsed`) and persistence during navigation between records already work; what is missing is remembering the user's manual changes when the form unmounts.

**Description:** The collapse/expansion state of sections is kept while the form is mounted (including navigation between records of the same tab), but it is lost when the `FormView` unmounts (for example, when returning to the grid and reopening the form), reverting to the initial state defined by metadata. In the classic UI, the user's preference about which sections are open/closed is preserved during the session.

**Proposed solution:** Persist the expansion preference per section (associated with the tab/window and the user) so that it survives the form's unmounting and reopening within the same session, using the initial metadata state only the first time a tab is opened. It must still respect `fieldGroupCollapsed` as the default value when there is no prior preference.

**Test cases:**

1. **Scenario:** Collapsed state survives reopen
   - Given: a section expanded by default that the user collapses
   - When: the form is closed and reopened
   - Then: the section stays collapsed
2. **Scenario:** Expanded state survives reopen
   - Given: a section collapsed by default that the user expands
   - When: the form is reopened
   - Then: the section stays expanded
3. **Scenario:** Metadata state on first open
   - Given: a tab opened for the first time (no prior preference)
   - When: the form opens
   - Then: the metadata state (`iscollapsed`) is applied
4. **Scenario:** Tabs are independent
   - Given: a state change on one tab
   - When: viewing another tab
   - Then: it does not affect the other tabs' preferences

**Result:** The interface remembers the sections the user left open or closed during the session, improving work continuity relative to the current behavior.

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

---

## Section 24 — Form Layout System

### [CREATED] [SEC-24] Grid column order per `grid_seqno`

**Description:** In classic, the grid column order can differ from the form field order via `ad_field.grid_seqno`. The new UI shows the window grid columns in the same order as the form (`seqno`), ignoring the configured grid order. In the representative environment there are 2,988 fields whose `grid_seqno` differs from their `seqno`, so on those tabs the columns appear in a different order than in classic.

**Proposed solution:** Expose each field's grid sequence number from the adapter (today it is not emitted for regular fields) and sort the window grid columns by that value, falling back to the form `seqno` when it is not defined. The sorting must apply only to the data grid (not the form) and coexist with visibility via `showingridview`, quick filters, and the user's manual column reordering.

**Test cases:**

1. **Scenario:** Grid order differs from form order
   - Given: a tab whose `grid_seqno` differs from the form `seqno`
   - When: the grid is displayed
   - Then: the grid columns appear in the grid order, not the form order
2. **Scenario:** Form order unaffected
   - Given: the same tab
   - When: the form is displayed
   - Then: the form keeps its fields in `seqno` order, unaffected by the change
3. **Scenario:** Fallback for fields without grid_seqno
   - Given: fields with no `grid_seqno` defined
   - When: the grid is sorted
   - Then: those fields fall back to `seqno` order without ending up out of place
4. **Scenario:** Visibility and quick filters preserved
   - Given: a reordered grid
   - When: initial visibility via `showingridview` and the quick-filter row are used
   - Then: both keep working after the reordering
5. **Scenario:** Manual column reordering preserved
   - Given: a reordered grid
   - When: the user manually reorders/hides columns
   - Then: it keeps operating without regressions

**Result:** The data grid shows columns in the order configured in classic, with parity for tabs that define their own grid order.

### [CREATED] [SEC-24] Full width for long-text / memo / rich-text fields

> **⚠️ Low priority.** It is a visual layout adjustment. Long-text fields are already fully functional and expand in height (`row-span`); what is missing is for them to take up the full row width.

**Description:** Long-text, memo, and rich-text fields in classic usually take up the full form width. In the new UI these fields expand vertically (taller) but keep the width of a single column within the 3-column grid, unless they have an explicit `colspan` in metadata (which almost no field defines). This can leave narrow text areas for long content.

**Proposed solution:** Make long-text/memo/rich-text fields (and similar "expanded" ones) take up the full form row width by default, unless the metadata explicitly indicates a smaller `colspan`. It must coexist with `startnewline`/`startinoddcolumn` positioning and with the existing vertical expansion, without breaking the grid of the other fields.

**Test cases:**

1. **Scenario:** Long-text field without explicit colspan
   - Given: a long-text/memo/rich-text field with no explicit `colspan`
   - When: the form is rendered
   - Then: it takes up the full row width
2. **Scenario:** Long-text field with explicit colspan
   - Given: a field of those types with an explicit `colspan`
   - When: the form is rendered
   - Then: it respects that value instead of the full width
3. **Scenario:** Vertical expansion preserved
   - Given: those fields
   - When: the form is rendered
   - Then: their vertical (height) expansion is maintained
4. **Scenario:** Neighboring fields unaffected
   - Given: neighboring fields and the rest of the form's row/column breaks
   - When: the wide field is rendered
   - Then: they are not affected

**Result:** Long-text fields offer a wide editing area consistent with classic, without affecting the rest of the layout.

---

## Section 25 — Default Value Expressions

No pending tasks. The section is complete.

---

## Section 26 — Tab Default Filters and Sort Order

### [CREATED] [SEC-26] Multi-column default sort order with full notation

**Description:** A grid's initial sort is taken from the tab's order-by clause (`hqlorderbyclause`/`sQLOrderByClause`), but the client only interprets single-column clauses correctly. When the clause has **several comma-separated columns** (e.g. `dateAcct, lineNo`), a `-` **prefix** for descending (e.g. `-accountingDate`), an **entity alias** (e.g. `e.documentNo desc`), or an **expression** (e.g. `abs(debit) desc`), the resulting initial sort does not match classic: the secondary columns and/or the ascending/descending direction are lost. The user sees the tab sorted differently from how it is configured, until they reorder manually.

**Proposed solution:** Improve the interpretation of the order-by clause so it handles: (a) **multiple columns** separated by commas, preserving their priority; (b) the **descending-by-`-`-prefix** convention in addition to the `DESC` keyword; (c) **entity alias normalization** (stripping the leading `e.`) before resolving the field; and (d) a safe fallback for tokens that do not map to a known field (expressions), without breaking the grid load. The resolved order must be sent to the datasource in a way that produces the same result as classic, and the grid's visual sort indicator must reflect the effectively sorted column(s) when they correspond to visible fields. The current precedence of the user's manually chosen order over the default must be maintained.

**Test cases:**

1. **Scenario:** Single ascending column
   - Given: a tab with order `lineNo` (a single ascending column)
   - When: the grid loads
   - Then: the current behavior is maintained
2. **Scenario:** Single descending column
   - Given: a tab with order `creationDate desc` (a single descending column)
   - When: the grid loads
   - Then: the current behavior is maintained
3. **Scenario:** Multi-column order
   - Given: a tab with multi-column order (e.g. `dateAcct, lineNo`)
   - When: the grid loads
   - Then: it is sorted by both columns in the indicated priority
4. **Scenario:** Descending by prefix
   - Given: a tab with order `-accountingDate`
   - When: the grid loads
   - Then: it loads in descending order by that column and the visual indicator reflects it
5. **Scenario:** Order with entity alias
   - Given: a tab with an alias-based order (e.g. `e.documentNo desc`)
   - When: the grid loads
   - Then: it resolves the correct field and applies the descending direction
6. **Scenario:** Non-mappable expression
   - Given: a clause with an expression that does not map to a field
   - When: the grid loads
   - Then: it does not break the grid load (safe fallback)
7. **Scenario:** Manual order overrides default
   - Given: a tab with a default order
   - When: the user changes the order manually
   - Then: it still overrides the default order

**Result:** Each tab's initial order matches the classic configuration also in the multi-column, `-` prefix, entity alias, and expression cases, without affecting the user's ability to reorder manually.

---

## Section 27 — Multi-Window Tab Interface (MDI)

No pending standalone tasks — the MDI tab-bar keyboard shortcuts are consolidated into `[SEC-28] Register all keyboard shortcut families`. (This section has no backend/adapter component.)

---

## Section 28 — Complete Keyboard Shortcuts Reference

### [CREATED] [SEC-28] Keyboard shortcuts: infrastructure + register all families

**Description:** The app's keyboard shortcut support is incomplete on two fronts. (1) **Infrastructure:** the current mechanism only recognizes `Ctrl/Cmd+key` and single keys, so it cannot represent most of classic's 43 shortcuts (combinations with `Alt+Shift`, `Ctrl+Shift`, `Ctrl+Alt`, `Ctrl+Delete`, `Alt+Delete`, the `Ctrl+Space+…` chords, and keys such as `F2`, `PageUp/PageDown`); classic also defines those shortcuts as data in the `OBUIAPP_KeyboardShortcuts` preference (43 entries, confirmed in the database) and the new UI does not consume it, so there is neither personalization nor alternative variants. (2) **Bindings:** even for representable combinations, the app's actions are accessible only by mouse and lack keyboard bindings across every classic family — cross-cutting, toolbar, status bar, grid, MDI tab bar, and field-level.

**Proposed solution:** deliver the complete keyboard shortcut capability in a single effort:

- **Infrastructure (grammar + source):** extend shortcut recognition to support any combination of modifiers and the required special keys/chords, so a single shortcut can have a primary combination and an equivalent alternative; feed the shortcut set from the system preference (source of truth and personalization) with a default mapping that reproduces the classic inventory; keep the rule of disabling shortcuts when focus is in a text field, with the correct exceptions (save and close/cancel must still work within fields); avoid collisions with native browser shortcuts.
- **Register all families:** bind each classic shortcut to its already-implemented action, respecting availability (enabled/disabled by context and permissions) and existing confirmations (delete/clone confirm; previous/next autosave). Register per surface/scope (form, grid, field, MDI tab bar), active only when that surface has focus, without interfering with arrow/Enter navigation, in-progress cell editing, or normal typing:
  - **(a) cross-cutting** — new document, new inline row, save and close, undo, delete, refresh;
  - **(b) toolbar** — export, attachments, clone, print, email, audit trail, direct link — plus realigning "new" from `Ctrl+N` to classic `Ctrl+D`/`Ctrl+I`, and **status bar** — previous/next record;
  - **(c) grid** — focus the filter row / return to grid, clear all filters (binds to the existing clear-filters grid action, already available via a button), select/deselect all, edit selected inline, edit in form, delete selected;
  - **(d) MDI tab bar** — close the active tab, previous/next tab, jump to Workspace (incl. `Alt+Shift` and `Ctrl+Space` variants);
  - **(e) field-level** — open the selector popup (Selector/SelectorAsLink/TreeItem), zoom/link-out to the referenced record, and tree expand/move.
- Add the shortcut hint to the corresponding button tooltips.

**Test cases:**

1. **Scenario:** Modifier combinations and alternate
   - Given: shortcuts defined with `Alt+Shift+<key>` and `Ctrl+Shift+<key>`
   - When: they are pressed
   - Then: they fire correctly, and their alternate variant (`Ctrl+Space+<key>`) produces the same result
2. **Scenario:** Special keys
   - Given: special keys (`F2`, `PageUp/PageDown`, `Delete`)
   - When: they are pressed
   - Then: they are recognized as shortcuts
3. **Scenario:** No browser collision
   - Given: any registered combination
   - When: it is pressed
   - Then: it does not collide with a browser default shortcut (no native browser action)
4. **Scenario:** Preference-driven shortcuts
   - Given: shortcuts fed from the preference
   - When: the preference is changed
   - Then: the effective shortcut changes without touching code
5. **Scenario:** Cross-cutting action shortcuts
   - Given: a form or grid context
   - When: a cross-cutting shortcut (new, save and close, undo, delete, refresh) is pressed
   - Then: it fires its action in the correct context and respects disabled state
6. **Scenario:** Toolbar action shortcuts with tooltip hints
   - Given: an available toolbar action
   - When: its classic shortcut is pressed (and its tooltip is shown)
   - Then: the action fires (delete/clone confirm first) and the tooltip displays the shortcut
7. **Scenario:** New document vs new row bindings
   - Given: a header vs. grid context
   - When: the "new document" / "new row" shortcuts are pressed
   - Then: they respond to the classic bindings and create the correct record type for the context
8. **Scenario:** Previous/next record from the status bar
   - Given: a record in the form
   - When: the previous/next record shortcut is pressed
   - Then: it navigates with the same safe autosave behavior as the status bar arrows; if the save fails it does not navigate
9. **Scenario:** Grid operation shortcuts
   - Given: the grid has focus
   - When: focus-filter / clear-filters / select-all / edit / delete shortcuts are pressed
   - Then: each triggers its existing action (delete confirms) without breaking arrow/Enter navigation or in-progress cell editing
10. **Scenario:** MDI tab-bar navigation
   - Given: several open windows
   - When: close-active / previous / next / Workspace shortcuts are pressed (primary or the Ctrl+Space variant)
   - Then: they perform the action (close respects the unsaved-changes guard) and behave predictably at the extremes
11. **Scenario:** Field-level shortcuts
   - Given: focus in a selector/SelectorAsLink/TreeItem, a navigable-reference, or a tree field
   - When: the corresponding shortcut is pressed
   - Then: it opens the selector popup / zooms to the referenced record / expands the tree, only for the correct field type
12. **Scenario:** Focus in a text field
   - Given: focus inside a text field
   - When: navigation shortcuts are pressed
   - Then: they do not fire, but save and close/cancel still work

**Result:** a single keyboard shortcut capability expresses all classic shortcuts (primary and alternative, optionally preference-driven) and binds every classic family (cross-cutting, toolbar, status bar, grid, MDI tab bar, field-level) to existing actions, fully operable via keyboard with binding parity to classic and discoverability via tooltips.

> Consolidates the former `[SEC-28] Extend keyboard shortcut infrastructure`, `[SEC-28] Register all keyboard shortcut families`, and the cross-cutting (`[SEC-10]`), record-navigation (`[SEC-23]`), and MDI tab-bar (`[SEC-27]`) shortcut tasks into a single task (merged here). Cluster A.

---

## Section 29 — Tree Views

### [SEC-29] Consolidate tree detection on authoritative metadata

> **⚠️ Medium priority.** It does not fix a confirmed defect in the real tab, but it eliminates fragility (false positives) and a possible inconsistency that could leave tree mode unreachable.

**Description:** Enabling tree mode relies on a correct path (the `hasTree`/`tableTreeId` metadata the adapter emits) but drags along several unreliable fallback layers: detection by patterns in the entity/table name, a simulated query with data and artificial delays, and hardcoded ID mappings. This can offer a tree on tabs that do not have one in classic. In addition, the condition that shows the toggle-tree button in the bar uses a different field (`tableTree`) than the one detection uses (`hasTree`/`tableTreeId`), which could prevent the button from appearing on the only tab that actually has a tree.

**Proposed solution:** Make tree mode enablement depend **exclusively on the authoritative metadata** provided by the adapter (the tab's tree indicator and tree-structure identifier), removing the name-based heuristics, the simulated query, and the fixed identifiers. Unify both internal detection and the toggle-tree button's visibility condition into a single source of truth so that both agree. Verify end-to-end that the tab with `hastree='Y'` offers the button, enters tree mode, loads the hierarchy, and allows drag and drop.

**Test cases:**

1. **Scenario:** Tab with hastree='Y'
   - Given: the tab with `hastree='Y'` (*User Defined Accounting Report Setup*)
   - When: it is opened
   - Then: it shows the toggle-tree button and, on activating it, enters tree mode with the hierarchy loaded
2. **Scenario:** Tab without tree but suggestive name
   - Given: a tab with no tree whose name happens to contain "org", "menu", "category", etc.
   - When: it is opened
   - Then: it does **not** offer tree mode
3. **Scenario:** Detection and button visibility agree
   - Given: the same tab
   - When: internal detection and button visibility are evaluated
   - Then: they agree (no case where one says "has tree" and the other does not)
4. **Scenario:** Drag-and-drop persistence
   - Given: a tab in tree mode
   - When: a node is dragged and dropped
   - Then: the move persists in the backend and the new order is reflected after refresh; an invalid move (creating a cycle) is prevented on the client
5. **Scenario:** Tree Reference field unaffected
   - Given: a Tree Reference field
   - When: its tree selector is opened
   - Then: it still opens correctly (unaffected by the change in grid tree detection)

**Result:** Tree mode enablement is determined by the real classic metadata, with no false positives or fragile identifiers, with the toggle button consistent with detection, guaranteeing the functionality is reachable where it should be and does not appear where it should not.

---

## Section 30 — Grouping in Grid View

### [SEC-30] Column grouping in the grid (Group by / Ungroup)

**Description:** The grid does not allow grouping by a column. The whole cycle is missing: offering "Group by this field" on right-clicking a header (only when the `OBUIAPP_GroupingEnabled` preference is active), reorganizing the grid into collapsible sections by that column's unique values, showing the value and record count in each group header, allowing expand/collapse, offering "Ungroup" to return to the flat view, and respecting both the active filters (grouping only over the filtered data) and the `OBUIAPP_GroupingMaxRecords` performance cap. The two preferences that govern the feature exist and are configured in the representative environment, but today the client does not read them.

**Proposed solution:** Enable and expose the table's native grouping capability, integrating it into the existing header context menu (where the summary functions currently live): add the "Group by this field" and "Ungroup" actions, gating availability on the enablement preference and limiting the operation per the maximum-records preference (with a clear warning when the limit is exceeded). The grouped sections must be collapsible and show the group value along with the record count, staying consistent with the active filters and sort order. Reuse the existing context-menu and grid-state infrastructure as much as possible, without introducing a server component (the operation is client-side, just like in classic).

**Test cases:**

1. **Scenario:** Grouping enablement gating
   - Given: `OBUIAPP_GroupingEnabled` active (or disabled)
   - When: the header context menu is opened
   - Then: with the preference active it offers "Group by this field"; with it disabled the option does not appear
2. **Scenario:** Group by a column
   - Given: a grid with data
   - When: grouping by a column
   - Then: the grid reorganizes into sections by unique values and each header shows the value and record count
3. **Scenario:** Expand and collapse a group
   - Given: a grouped grid
   - When: a group is expanded and collapsed
   - Then: it works and preserves the selection/state of the rest
4. **Scenario:** Ungroup
   - Given: a grouped grid
   - When: "Ungroup" is invoked
   - Then: the flat view is restored without losing filters or order
5. **Scenario:** Grouping with active filters
   - Given: active filters
   - When: grouping is applied
   - Then: it is computed only over the filtered records
6. **Scenario:** Exceeding the record cap
   - Given: a record count over `OBUIAPP_GroupingMaxRecords`
   - When: grouping is attempted
   - Then: it does not group (or reports the reason) instead of degrading performance
7. **Scenario:** Sort within groups
   - Given: an applied sort order
   - When: the grid is grouped
   - Then: the sort is respected within each group

**Result:** The user can group the grid by any column from the header context menu, see collapsible sections with value and count, and return to the flat view, with functional parity relative to classic and respecting the enablement and record-limit preferences.

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

---

## Section 32 — Alert System (Real-Time Notifications)

### [SEC-32] Alert icon with badge and real-time polling

**Description:** The navigation bar has no alert indicator. It is missing a notifications icon with a badge that reflects the number of the user's **unacknowledged** alerts, updated periodically (parity with the Classic ~50 s cycle) so the user learns about new alerts without reloading. A notification button component with a badge exists in the library, but it is not mounted in the app, is disabled, and has no data.

**Proposed solution:** Mount the notifications icon in the navigation bar, enable it, and connect it to a data source that provides the current user's unacknowledged alert count (according to their role/organization). Add a periodic polling that refreshes that count at an interval equivalent to Classic, explicitly respecting that **those requests must not renew/extend the user's session** (equivalent to the timeout exclusion behavior). Reuse the existing badge component for the count. It requires no business logic in the client and, in principle, no adapter changes (the count can be obtained from the data infrastructure already used by the new UI).

**Test cases:**

1. **Scenario:** Alert icon shown when authenticated
   - Given: the user is authenticated
   - When: the navigation bar renders
   - Then: the alert icon appears, enabled
2. **Scenario:** Badge reflects unacknowledged alerts
   - Given: the user has unacknowledged alerts (or none)
   - When: the icon is displayed
   - Then: the badge shows the correct count if there are alerts; if there are none, no badge is shown (or zero, per the design)
3. **Scenario:** Badge updates on new alerts
   - Given: new alerts are generated on the server
   - When: the polling interval elapses
   - Then: the badge updates without reloading the page
4. **Scenario:** Count scoped to role/organization
   - Given: alerts exist for various roles/organizations
   - When: the count is computed
   - Then: it reflects only the alerts of the user's role/organization (not others')
5. **Scenario:** Polling does not extend the session
   - Given: the user is inactive while polling runs
   - When: the expected session timeout is reached
   - Then: the session expires on schedule despite the polling

**Result:** The user sees, in the navigation bar, an icon with the number of pending alerts kept up to date almost in real time, with parity to Classic and without affecting session expiration.

> Dependency with `[SEC-11] Token renewal / activity-based validity reset`: the alert polling must not extend the session.

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

---

## Section 33 — View Personalization (Saved Views)

### [CREATED] [SEC-33] Durably persist grid column and window state in saved views

**Description:** saved views do not capture the complete grid and window layout, and what they do capture is not durable. (1) **Grid columns:** visibility, order, sorting, and filters are preserved, but **not the column widths or the pinned columns** (pinning is fixed and not user-configurable); moreover, the full column configuration (visibility/order/width) is kept only in session memory, so it is lost on reload or between sessions, whereas the classic UI persists the grid configuration per user. (2) **Window state:** the split between parent and child tab and the maximized/minimized state of the grid/form are not part of the saved view either, so they are lost when closing or switching windows. The checklist requires a view to capture the complete column and window configuration and to persist it durably.

**Proposed solution:** extend the view configuration model and persist it durably per user via the Saved Views backend (no business changes on the server beyond storing the extended JSON), covering:

- **Grid column state:** include each column's width and which columns are pinned, and let the user adjust both from the grid (resize and pin). Persist the full column configuration durably per user (not only in session memory) and restore it when the window is reopened, keeping the current session persistence as the default behavior and staying compatible with existing views (which simply lack that data and use defaults).
- **Window layout state:** include the window layout (ratio/state of the parent-child split and maximized/minimized grid/form) within the view configuration, saved and restored along with the rest, and applied when opening the window or applying a view, respecting default values when the view does not specify it.

**Test cases:**

1. **Scenario:** Widths and pinning restored on reopen
   - Given: the user resizes columns and pins one, then saves the view
   - When: the view is reopened or reapplied
   - Then: the widths and pinning are restored
2. **Scenario:** Configuration survives a reload / new session
   - Given: the user changed column visibility/order/width
   - When: the page is reloaded or the user logs in again
   - Then: the configuration is preserved (per user, per window/tab)
3. **Scenario:** Pre-change view still applies
   - Given: a view saved before this change
   - When: it is applied
   - Then: it applies without error (using default widths)
4. **Scenario:** Re-saving updates width/pinning
   - Given: an existing view
   - When: the user changes the width or pinning and saves again
   - Then: the view is updated correctly
5. **Scenario:** Reset to default works
   - Given: a customized column configuration
   - When: the user resets to the default configuration
   - Then: the default layout is restored
6. **Scenario:** Window layout restored on reapply
   - Given: the user adjusts the parent/child split and maximizes the grid, then saves the view
   - When: the view is reapplied
   - Then: that window layout is restored
7. **Scenario:** View without window state applies defaults
   - Given: a view with no window state
   - When: it is applied
   - Then: it applies with the default layout without error
8. **Scenario:** Column, window, and rest of state coexist, no session regression
   - Given: a view with visibility, order, sorting, filters, column widths/pinning, and window state
   - When: it is restored, and while switching tabs or grid-form mode
   - Then: all parts are restored coherently and existing session persistence still works

**Result:** saved views capture and durably restore the complete grid column configuration (visibility, order, width, pinning) and the window layout state (split and maximized) per user across sessions, with parity to Classic and without breaking prior views.

> Consolidates the former `[SEC-9] Durable per-user persistence of column configuration` and `[SEC-33] Window state persistence (split and maximized)` (ETP-4641, now emptied) tasks (merged here). Part of the Saved Views backend (see `[SEC-33] Shared views by role/organization`). See cluster E.

### [CREATED] [SEC-33] Form personalization (layout editor, toolbar button, initial focus)

**Description:** the new UI does not allow personalizing the form: neither the field layout (position/visibility/grouping/number of columns), nor the admin drag-and-drop tool that classic offers via the **Personalize Form** toolbar button (persisted per user/role). Separately, the `isfirstfocusedfield='Y'` flag (received from the adapter; 382 fields configured in the representative environment) is not applied: no field is focused on open/create. Classic focuses that field and lets it be configured through personalization.

**Proposed solution:** add a form personalization capability analogous to classic, reachable from a **Personalize Form** toolbar button, where an authorized role can reorganize and hide fields, assign groups, set the number of columns, and define the initial focus field; persist that layout (leveraging and extending the adapter's personalization backend to also store form state per tab, today only grid/filters) and apply it on window open. Independently of the editor, apply the `isfirstfocusedfield` flag at runtime — a self-contained sub-part that can ship first: on form mount / new record, focus the first visible and editable marked field (respecting read-only/hidden state and not overriding focus the user moved manually). Define the precedence scope (per user and, if applicable, per role) consistently with shared views.

**Test cases:**

1. **Scenario:** Editor opens from the toolbar button
   - Given: the current form
   - When: the user clicks the Personalize Form button
   - Then: the layout editor opens with the current form's fields
2. **Scenario:** Personalization persists and applies on reopen
   - Given: an authorized user reorders/hides fields and adjusts the number of columns, then saves
   - When: the window is reopened
   - Then: the personalized layout is applied and persists per user/role
3. **Scenario:** Unauthorized user sees no tool but gets layout
   - Given: a user without form personalization permission
   - When: the window opens
   - Then: they do not see the tool but receive the applicable layout
4. **Scenario:** Reset discards personalization
   - Given: a personalized form layout
   - When: the user resets to the layout defined in AD
   - Then: the form personalization is discarded
5. **Scenario:** Initial focus applied on open/create
   - Given: a tab with a visible and editable field marked `isfirstfocusedfield='Y'`
   - When: the form opens or a new record is created
   - Then: that field receives focus and is ready for input
6. **Scenario:** Hidden/read-only or absent focus field
   - Given: the marked field is hidden/read-only, or no focus field is defined
   - When: the form opens
   - Then: no field is force-focused, no error occurs, and manual focus is not overridden

**Result:** users (per permissions) can personalize the form layout via the Personalize Form button, the personalization (including the configured initial focus field) persists and is applied on open, and the `isfirstfocusedfield` flag is honored at runtime, with parity to Classic.

> Consolidates the former `[SEC-17] Personalize Form button` and `[SEC-24] Initial focus on the isfirstfocusedfield field` tasks (merged here). Precedence aligns with `[SEC-33] Shared views by role/organization`.

### [CREATED] [SEC-33] Shared views by role/organization and their precedence

**Description:** The current view backend (`ETMETA_SavedView`) is exclusively **per user**, with no visibility by role/organization/client. This prevents an administrator from defining shared views (or a default view) for an entire role or organization, and there is no "user personalization prevails over role, and role over system" precedence for views, as the checklist contemplates.

**Proposed solution:** Extend the view model to support the visibility scope (user, role, organization, client, system) and resolve the effective view by applying the expected precedence (the most specific wins), consistently with how Classic handles shared personalization. Allow administrators to create views and default views at the role/organization level, and let the user override them with their own. Reuse the adapter backend, extending storage and querying with the scope criterion.

**Test cases:**

1. **Scenario:** Role default view applied to user without own view
   - Given: an admin defines a default view for a role
   - When: a user of that role without their own view opens the window
   - Then: they receive the role's default view
2. **Scenario:** User view prevails over role view
   - Given: the user has their own default view
   - When: the window opens
   - Then: the user's view prevails over the role's
3. **Scenario:** Role view prevails over system view
   - Given: the user has no view of their own
   - When: the effective view is resolved
   - Then: the role view prevails over an eventual system view
4. **Scenario:** Deleting own view falls back to role/system
   - Given: the user has their own default view
   - When: they delete it
   - Then: the role/system view applies again

**Result:** Shared views by role/organization exist with user→role→system precedence, allowing configurations to be standardized without preventing individual personalization.

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

---

## Section 35 — View States (Form/Grid Layout)

### [CREATED] [SEC-35] Split grid/form view (MID) with draggable divider

**Description:** In a standard tab, the new UI shows either the grid or the form full-screen, but not both at once. Classic also offers an intermediate state (`MID`) in which grid and form coexist on screen separated by a divider that the user can drag to adjust the proportion, with a button/shortcut to maximize/restore the form and with the proportion remembered during the session (or per saved view). That split view, its draggable divider, the maximize/restore toggle, and the persistence of the proportion do not exist today for the grid/form axis (the only draggable divider present operates between the parent tab and the children). It must be confirmed with product whether parity with Classic is sought or whether the current binary paradigm is the desired behavior.

**Proposed solution:** Introduce, for the standard window, a split view state in which grid and form are shown simultaneously separated by a draggable divider, reusing the divider component already present in the product instead of creating a new one. Add a control (a button in the status bar and its keyboard shortcut) to toggle between the split view and the maximized form, and make the split proportion persist during the session (and, if decided, per saved view). Keep the already-supported states intact (full grid and full form) and the current transitions (double-click, Escape/close, new, save). Since this is a paradigm change, prioritize it below the functional window/process gaps and agree the minimum scope with product (for example, starting with a split view whose proportion is not persisted).

**Test cases:**

1. **Scenario:** Grid and form visible simultaneously
   - Given: a standard tab (not in tree mode)
   - When: the split mode is active
   - Then: grid and form are seen simultaneously, with a divider between them
2. **Scenario:** Dragging the divider adjusts the proportion
   - Given: the split view
   - When: the user drags the divider
   - Then: the proportion between grid and form adjusts and the content resizes correctly
3. **Scenario:** Maximize/restore toggles the states
   - Given: the split view
   - When: the user uses the Maximize button/shortcut
   - Then: it toggles between the split view and the full-screen form, and Restore returns to the split view
4. **Scenario:** Close and double-click behave as before
   - Given: any state
   - When: the user closes (Escape/button) or double-clicks a row
   - Then: closing returns to the grid, and double-clicking a row still opens the record's form
5. **Scenario:** Split proportion preserved across records
   - Given: the split view during a session
   - When: the user navigates between records
   - Then: the split proportion is preserved (and, if defined, restored per saved view)
6. **Scenario:** Status bar remains operative
   - Given: the split view or the maximized form
   - When: the user works in either state
   - Then: the status bar with record navigation stays visible and operative

**Result:** The user can work with grid and form at once in a split view, adjust their proportion by dragging the divider, maximize/restore the form, and preserve the proportion during the session, reaching parity with the Classic `MID` state within the scope agreed with product, without regressions in the already-existing full-grid and full-form states.

> The persistence of the split proportion relates to `[SEC-33] Durably persist grid column and window state in saved views`. See cluster E.

---

## Redundancies and groupings

Consolidation performed to finalize the list before creating the tasks in Jira. True duplicates and clear overlaps were **merged**; each remaining relationship is kept as a separate task with an in-body relation note so the links can be created in Jira.

**Final count: 57 tasks** across 31 sections with pending work. Sections 1, 25, and 27 have no standalone tasks (1 and 25 are complete or covered; 27's shortcuts are consolidated into Section 28), and Section 16 (parity validations) was removed.

### Merges applied

- **External menu entries:** `[SEC-20] Opening external-link menu entries` merged into `[SEC-12] Support External / external-link menu entries (open URL)`.
- **Column persistence:** `[SEC-9] Durable per-user persistence of column configuration` subsumed into `[SEC-33] Complete and durably persist grid column state in saved views`.
- **Keyboard shortcuts (7 → 1):** the tasks across Sections 10, 23, 27, and 28 collapsed into a single `[SEC-28] Keyboard shortcuts: infrastructure + register all families` task covering the grammar/source infrastructure and every family (cross-cutting, toolbar, status bar, grid, MDI tab bar, field-level).
- **Form personalization (3 → 1):** `[SEC-17] Personalize Form button` and `[SEC-24] Initial focus on the isfirstfocusedfield field` merged into `[SEC-33] Form personalization (layout editor, toolbar button, initial focus)`.
- **Unsaved-changes guards (3 → 1):** `[SEC-11] Warn about unsaved changes before logout` and both Section 13 unsaved-changes tasks merged into `[SEC-13] Unified unsaved-changes guard (logout, tab close, New, switch)`.

### Remaining relations (kept separate, linked in Jira)

- **Cluster G — Concurrent-edit conflict:** `[SEC-7] Communicate concurrent-edit conflicts on save` owns the conflict UX; `[SEC-10] Global error boundary and network/conflict error handling` references it and focuses on the error boundary + network/timeout handling. → Link as "relates to".
- **Cluster H — "Access denied" on deep-links:** `[SEC-12] "Access denied" screen on deep-links without access` is the single canonical task; it covers the UX gap also referenced in Sections 10 and 11. → No separate tasks elsewhere.
- **Cluster E — Saved Views backend:** `[SEC-33] Durably persist grid column and window state in saved views` (grid column + window layout state) and `[SEC-33] Shared views by role/organization` share the same Saved Views backend; the split ratio of `[SEC-35] Split grid/form view (MID)` should persist via the same mechanism. → Group under one Saved Views epic in Jira.
- **Keyboard shortcuts (cluster A):** infrastructure and all families are now a single `[SEC-28] Keyboard shortcuts: infrastructure + register all families` task; no intra-cluster dependency remains.
- **Alerts / session:** `[SEC-32] Alert icon with badge and real-time polling` must not extend the session — coordinate with `[SEC-11] Token renewal / validity reset on activity`.

### Summary for Jira

- **Total effective tasks: 59.**
- The merges above already remove duplicates and clear overlaps. The remaining relations are cross-links (relates-to / depends-on / epic grouping), not further merges.
