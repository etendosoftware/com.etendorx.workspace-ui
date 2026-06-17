# Process-Definition JavaScript in the New UI — Architecture & Migration Guide

## 1. Purpose & audience

Etendo Classic lets a *Defined Process* (an `OBUIAPP_Process` record, optionally with
`OBUIAPP_Parameter` children) carry hand-written JavaScript that customizes the process dialog:
pre-filling fields when it opens, validating and transforming input as the user types, gating
execution behind confirmation dialogs, showing in-dialog banners, launching nested processes, and
post-processing the server response. In Classic this JavaScript runs inside the SmartClient runtime.

The new Next.js UI (`client/packages/MainUI`) reproduces that behavior **without SmartClient**. A
process dialog is a React component; the custom JavaScript is stored as text in metadata columns,
compiled at runtime, and executed against a curated context that emulates the Classic APIs the scripts
expect. Combined with a generic metadata endpoint in the `com.etendoerp.metadata` backend, this makes
the capability **fully metadata-driven and process-agnostic**: any process becomes scriptable by
populating its columns — no per-process code in the UI.

This document describes the **what, why, and how** of that runtime. It is the authoritative reference
for two audiences:

- **Engineers** maintaining or extending the process-script runtime.
- **A migration agent** (human or AI) that reads a Classic `.js` file and emits the equivalent
  migrated code to paste into the metadata columns. Section 10 is the actionable playbook for that
  audience.

**Companion document.** This file describes the *platform*. The per-process inventory — which
processes are in scope, which hook points each uses, and the QA acceptance criteria — lives in
[`process-definition-js-testing.md`](./process-definition-js-testing.md) and is the authority for *what
to migrate and test*. This document does not duplicate that inventory.

---

## 2. Background & objective

### 2.1 The five Classic hook points

A Classic Defined Process attaches behavior at up to five points. The new UI maps each to a metadata
column (Section 5):

| # | Classic hook | Fires when | Scope |
|---|---|---|---|
| 1 | `onLoadFunction` | The process dialog opens | Process |
| 2 | `onProcessFunction` | The user presses the execute/OK button | Process |
| 3 | `onRefreshFunction` | The dialog needs to re-pull data (e.g. after a nested process closes) | Process |
| 4 | `onChangeFunction` | A parameter's value is committed | Parameter |
| 5 | `onGridLoadFunction` | An embedded grid parameter finishes loading rows | Parameter |

Beyond these entry points, a Classic process file is a *single JavaScript module*: the entry points
call shared helpers, constants, and closure state declared in the same file by bare name. The new UI
reproduces this with a dedicated "module scope" column (Section 6.4).

### 2.2 Objective: behavioral parity through metadata

The goal is **behavioral parity**: a migrated process behaves the same as its Classic counterpart,
with the JavaScript living in metadata rather than in a SmartClient module. The runtime therefore
provides, for migrated scripts:

- The same **hook signatures** and firing semantics.
- A **`view` object** that mirrors the SmartClient `OBStandardView` surface the scripts read and call.
- An **`OB.*` namespace shim** and `isc.*` dialog helpers that mirror the Classic globals.
- **HTTP helpers** that reach the same backend handlers and datasources.

Anything a script touches that the new UI does not (yet) implement throws a clear
`"<api> is not implemented yet"` error rather than failing silently — so gaps surface during
migration instead of in production.

---

## 3. Reference architecture (end-to-end flow)

```
┌─────────────────────────── Backend: com.etendoerp.metadata ──────────────────────────┐
│  GET /meta/process/{processId}                                                         │
│    MetadataFilter ─► ServiceFactory ─► ProcessMetadataService                          │
│      ProcessDefinitionBuilder.toJSON()                                                  │
│        DataToJsonConverter  (generic: every entity property ─► JSON key)               │
│        + key normalization  (eTMETAOnload ─► etmetaOnload, …)                          │
│  ⇒ JSON: process metadata + parameters[], each carrying its etmeta* hook strings       │
└────────────────────────────────────────────────────────────────────────────────────┘
                                        │  (HTTP, via the client's /api proxy)
                                        ▼
┌──────────────────────────────── Client: packages/MainUI ──────────────────────────────┐
│  ProcessDefinitionModal                                                                │
│    builds one shared scriptHookContext = { Metadata, ...processScriptContext,          │
│                                            ...moduleScope }                             │
│    compileStringFunction(code, context)  ── new Function(...keys, "return " + code)     │
│    executeStringFunction(code, context, ...args)  ── compile then call with positional │
│      args                                                                              │
│                                                                                        │
│  Hosts that render script-driven UI (subscribe to React-free singleton stores):       │
│    ProcessDialogHost (confirm/warn/say)   ProcessMessageBar (in-dialog banner)         │
│    ProcessStackHost  (nested process modals, mounted in the root layout)               │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Substrate files (client):**

- `packages/MainUI/utils/functions.ts` — `compileStringFunction` / `executeStringFunction`.
- `packages/MainUI/utils/processes/definition/utils.ts` — `buildProcessScriptContext` (HTTP helpers +
  `OB` shim + dialog helpers + message bar).
- `packages/MainUI/utils/ob/` — `createOBShim` and one file per `OB.*` namespace.
- `packages/MainUI/utils/processes/definition/scriptProxies.ts` — the `view` / `form` / `item` / `grid`
  proxies.
- `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx` — compiles and runs `onLoad` /
  `onRefresh`, evaluates module scope, mounts the dialog/message-bar hosts.
- `packages/MainUI/components/ProcessModal/hooks/useProcessExecution.ts` — runs `onProcess`.
- `packages/MainUI/components/ProcessModal/hooks/useParameterChangeHooks.ts` — runs `onChange`.

**Key principle — work is on the client.** The backend is a thin, generic pass-through; the metadata
module is essentially complete. Almost all migration capability lives in the client substrate above.

---

## 4. Backend metadata emission

### 4.1 The metadata columns

Seven custom columns carry the migration data. Four belong to the process entity, two to the parameter
entity, and one is a rendering flag:

| DB column | Entity | JSON key | Role |
|---|---|---|---|
| `EM_Etmeta_Onload` | `OBUIAPP_Process` | `etmetaOnload` | Process `onLoad` body |
| `EM_Etmeta_Onprocess` | `OBUIAPP_Process` | `etmetaOnprocess` | Process `onProcess` body |
| `EM_Etmeta_On_Refresh` | `OBUIAPP_Process` | `etmetaOnRefresh` | Process `onRefresh` body |
| `EM_Etmeta_Payscript_Logic` | `OBUIAPP_Process` | `etmetaPayscriptLogic` | Shared module scope / PayScript DSL |
| `EM_Etmeta_On_Parameter_Change` | `OBUIAPP_Parameter` | `etmetaOnParameterChange` | Parameter `onChange` body |
| `EM_Etmeta_On_Grid_Load` | `OBUIAPP_Parameter` | `etmetaOnGridLoad` | Grid parameter `onGridLoad` body |
| `EM_Etmeta_Custom_Component` | `OBUIAPP_Process` | `etmetaCustomComponent` | Custom-component rendering flag (Section 9) |

In the generated Java entities (`org.openbravo.client.application.Process` and
`...application.Parameter`) these are properties such as `etmetaOnprocess`, `etmetaOnRefresh`,
`etmetaPayscriptLogic`, `etmetaCustomComponent`, `etmetaOnParameterChange`, `etmetaOnGridLoad`, and the
legacy-cased `eTMETAOnload`.

### 4.2 Generic serialization (no per-process gating)

Process metadata is served by `GET /meta/process/{processId}`. The request is routed by
`com.etendoerp.metadata.http.MetadataFilter` → `com.etendoerp.metadata.service.ServiceFactory` →
`com.etendoerp.metadata.service.ProcessMetadataService`, which loads the `Process` entity and builds
the response with `com.etendoerp.metadata.builders.ProcessDefinitionBuilder`.

The builder serializes with `org.openbravo.service.json.DataToJsonConverter` in
`FULL_TRANSLATABLE` mode. The converter is **fully generic**: it iterates over every persisted property
of the Hibernate entity and emits each one as a JSON key using the property's own name. There is **no
special case keyed on a process id or name** anywhere in this path — the `etmeta*` columns ride the
same generic pass as any other column. The parameters array is built the same way via the parameter
builder, so every parameter carries `etmetaOnParameterChange` and `etmetaOnGridLoad`.

Consequence: making any process scriptable is **pure data entry**. No backend deployment is required to
enable a new process.

### 4.3 The one normalization: key rename

`DataToJsonConverter` emits keys from Java property names verbatim, so the legacy-cased property
`eTMETAOnload` would reach the client as `eTMETAOnload`. `ProcessDefinitionBuilder.toJSON()` performs a
single, unconditional post-processing rename so the client always reads a normalized camelCase key:

- `eTMETAOnload` → `etmetaOnload` (always).
- `eTMETACustomComponent` → `etmetaCustomComponent` (only if the legacy-cased key is present).

The other three process keys (`etmetaOnprocess`, `etmetaOnRefresh`, `etmetaPayscriptLogic`) and both
parameter keys are already correctly cased and pass through unchanged. The rename is **never gated on a
process id or name**; it applies uniformly.

### 4.4 Null-vs-absent contract

Every `etmeta*` key is **always present** in the JSON, with value `null` when the column is empty
(never omitted). The client relies on this stable shape: a missing hook is `null`, not an absent
property. Backend tests in `com.etendoerp.metadata.builders.ProcessDefinitionBuilderTest` and
`...ProcessDefinitionBuilderCustomComponentTest` lock the rename and the always-present contract.

---

## 5. The JS-bearing fields (utility of each)

Each field below holds a string compiled into a function (Section 6). The signatures use the canonical
**`view`** argument described in Section 7.

### 5.1 `em_etmeta_onload` — process `onLoad`

- **JS key:** `etmetaOnload` · **Entity:** process.
- **Signature:** `async (process, view) => { … }` — `process` is the process-definition metadata;
  `view` is the canonical view proxy.
- **Fires:** once per dialog open, before the parameter form is interactive.
- **Gating:** runs only when there is at least one onLoad script *and* a tab context is present
  (`onLoadScripts.length > 0 && tab`). See the nested-modal nuance in Section 6.5.
- **Returns (optional):** a map applied to the dialog — recognized keys include `_dynamicParameters`,
  `_gridSelection`, `_filterExpressions`, and arbitrary `paramName: value` pairs used to seed fields. A
  falsy return is a no-op.
- **Purpose:** seed/compute default values, hide or require fields, pre-select grid rows, gate opening
  behind a `confirm`, or (with `etmetaCustomComponent`) return a schema for a custom UI.

### 5.2 `em_etmeta_onprocess` — process `onProcess`

- **JS key:** `etmetaOnprocess` · **Entity:** process.
- **Signature:** `async (process, view) => { … }`.
- **Fires:** when the user presses the execute button.
- **Gating:** early-returns if the body is empty or there is no tab context (`!etmetaOnprocess || !tab`).
- **Returns (optional):** a result object such as `{ success, msgText, msgType, linkTabId, … }` and/or
  response actions dispatched through the action pipeline (Section 8.9).
- **Purpose:** client-side validation before submit, calling the backend (via `view.executeProcess()`
  or `callAction`), and post-processing the response.

#### 5.2.1 `view.executeProcess()` — the `actionHandlerCall()` equivalent

In Classic, a `clientsidevalidation` (`onProcess`) function receives two callbacks,
`actionHandlerCall` and `clientSideValidationFail`, and decides which to run
(`ob-parameter-window-view.js` `doProcess`). `actionHandlerCall()` submits the **standard execution
payload** — `getUnderLyingRecordContext()` (the launching record's full context: `inpadOrgId`,
`inp<col>` session inputs, the bare primary key, …) plus `_params` (the process form values) — to the
process's configured Java class. **The Classic script never builds that payload; the framework does.**

The new UI reproduces this with `await view.executeProcess(actionValue?)`:

- It builds the same standard payload through `buildProcessPayload(record, tab, …)` (top-level record
  context, including the bare PK via `systemContext[keyColumnName] = record.id`) + `_params` (the
  current form values), and POSTs it to the process's configured `javaClassName`.
- It dispatches any server `responseActions` registry-first (Section 8.9) and resolves with the parsed
  server response, e.g. `{ message: { severity, text } }`.
- It is side-effect-light: it does **not** show a toast or close the modal. The migrated `onProcess`
  returns the response (commonly `return response && response.message`) and the standard `onProcess`
  return flow surfaces the message exactly once.

Migration mapping — a Classic `onProcess` that does `actionHandlerCall()` on the valid branch becomes:

```js
async (process, view) => {
  // …client-side validation…
  if (invalid) {
    view.messageBar.setMessage(isc.OBMessageBar.TYPE_ERROR, null, text);
    return { severity: 'error', text };   // = clientSideValidationFail()
  }
  const response = await view.executeProcess();   // = actionHandlerCall()
  return response && response.message;
};
```

Prefer `view.executeProcess()` over hand-building a payload for `callAction(<class>, …)`: it avoids a
hardcoded handler name, guarantees the legacy context keys the handler reads, and matches Classic
exactly. Reach for `callAction` directly only when the script must call a **different** handler than the
process's own Java class.

#### 5.2.2 `onProcess` on Pick&Execute / Window-Reference processes — a pre-submit validation hook

For a process whose `uipattern` is `OBUIAPP_PickAndExecute` **or** which has a Window Reference grid
parameter (`hasWindowReference === true`), the Done button does **not** run the standard `onProcess`
execution path: the platform posts the grid selection directly to the Java handler
(`handleWindowReferenceExecute` in `useProcessExecution.ts`). For these processes the migrated
`em_etmeta_onprocess` runs as a **pre-submit validation hook** — it is evaluated *before* the platform
submits, and is the faithful equivalent of the Classic `clientSideValidationFail()` guards:

```js
async (process, view) => {
  // …client-side validation reading the grids via view.theForm.getItem('<grid>').canvas.viewGrid…
  if (invalid) {
    view.messageBar.setMessage(isc.OBMessageBar.TYPE_ERROR, null, text);
    return { severity: 'error', text };   // aborts the submit
  }
  // return undefined → the platform proceeds to post to the Java handler
};
```

Rules for this case: return `{ severity: 'error', text }` (or any `error` severity) to **abort** the
submit; return `undefined` to **proceed**. Do **not** call `view.executeProcess()` here — the platform
performs the submit itself, so calling it would double-submit. (On non-Window-Reference processes,
`onProcess` keeps its full Section 5.2.1 behavior, including `view.executeProcess()`.)

### 5.3 `em_etmeta_on_refresh` — process `onRefresh`

- **JS key:** `etmetaOnRefresh` · **Entity:** process.
- **Signature:** `(view) => { … }`.
- **Behavior:** compiled once and attached to the view as `view.onRefreshFunction`. Scripts call
  `view.onRefreshFunction(view)` to re-pull data; the nested-process stack auto-invokes it on the
  parent when a child closes (Section 8.3).
- **Purpose:** refresh grid/form data after an external change.

### 5.4 `em_etmeta_payscript_logic` — shared module scope / PayScript DSL

- **JS key:** `etmetaPayscriptLogic` · **Entity:** process.
- **Dual role, resolved by a classifier (Section 6.4):**
  - **JS module body** — declarations, constants, closure state, and helper functions, ending with
    `return { helperA, helperB, … };`. Evaluated once per dialog open; the returned helpers are spread
    into the context of *all five* hooks so they resolve by bare name.
  - **PayScript DSL** — a JSON-like configuration object registered with the PayScript engine
    (`packages/MainUI/payscript/engine/LogicEngine.ts`), loaded dynamically by the process UUID.
- **Purpose:** hold everything a Classic file declared at module level that the entry points share.

### 5.5 `em_etmeta_on_parameter_change` — parameter `onChange`

- **JS key:** `etmetaOnParameterChange` · **Entity:** parameter.
- **Signature:** `(item, view, form, grid) => { … }` — `item` is the changed field proxy; `grid` is
  `null` for scalar parameters.
- **Fires:** when the parameter's value is *committed* (Section 6.6 covers the diff + re-entrancy +
  debounce semantics).
- **Purpose:** react to a value change — recompute dependent fields, toggle required/disabled, refresh
  a value map, show a banner.

### 5.6 `em_etmeta_on_grid_load` — parameter `onGridLoad`

- **JS key:** `etmetaOnGridLoad` · **Entity:** parameter.
- **Signature:** `(grid, view, parameters) => { … }` (the Classic `function(grid)` form also works).
- **Fires:** each time the embedded grid parameter receives a datasource payload.
- **Purpose:** post-process loaded rows — default selection, per-row components, derived columns.

### 5.7 `em_etmeta_custom_component` — rendering flag

- **JS key:** `etmetaCustomComponent` · **Entity:** process · **Type:** boolean.
- **Behavior:** when `true`, the dialog renders a **custom component** built from the schema returned by
  `onLoad`, instead of the standard parameter form. When `false`/absent, the standard form renders. See
  Section 9.

---

## 6. Execution model

### 6.1 The bare-arrow-function contract

A column value is compiled by `compileStringFunction(code, context)`
(`packages/MainUI/utils/functions.ts`):

```ts
const factory = new Function(...Object.keys(context), `return ${code.trim()}`);
const fn = factory(...Object.values(context));
// fn must be a function, or a TypeError is thrown.
```

Therefore a column value **must be a bare arrow-function expression**, e.g.
`async (process, view) => { … }`. It must **not** be an IIFE (`(async () => { … })()`) or an object
literal — anything that does not evaluate to a function throws:
*"Script did not return a callable function … Ensure the script is a bare arrow-function expression,
not an IIFE or object literal."*

`executeStringFunction(code, context, ...args)` compiles then calls the function with positional
arguments and `await`s the result, so hooks may be `async`.

The keys of `context` become **in-scope identifiers inside the body** — this is how globals like `OB`,
`callAction`, and `messageBar` (Section 7) are injected. Parameter-level hooks are compiled through the
same primitive via `packages/MainUI/utils/processes/definition/compileParameterHook.ts`, which logs and
returns `null` on a compile error instead of throwing.

### 6.2 One shared context for all hooks

`ProcessDefinitionModal` builds a single `scriptHookContext`:

```
scriptHookContext = { Metadata, ...processScriptContext, ...moduleScope }
```

- `processScriptContext` comes from `buildProcessScriptContext` (HTTP helpers, the `OB` shim, dialog
  helpers, message bar — Section 7).
- `moduleScope` is the evaluated `etmetaPayscriptLogic` helper object (spread **last**, so helpers
  resolve by bare name).

This same object feeds all five hooks, so a helper declared in module scope is reachable from `onLoad`,
`onProcess`, `onRefresh`, `onChange`, and `onGridLoad` identically.

### 6.3 Where each hook is compiled and run

| Hook | Compiled/run in |
|---|---|
| `onLoad` | `ProcessDefinitionModal.tsx` (via `executeStringFunction`) |
| `onProcess` | `hooks/useProcessExecution.ts` |
| `onRefresh` | `processView.ts` (`compileOnRefreshFunction`), attached to `view` |
| `onChange` | `hooks/useParameterChangeHooks.ts` (one `form.watch` subscription) |
| `onGridLoad` | bound to the embedded grid's data-arrived effect (`WindowReferenceGrid.tsx`) |

### 6.4 Module-scope evaluation & the PayScript classifier

`etmetaPayscriptLogic` may be either a JS module body or a PayScript DSL object. The runtime decides
with `classifyPayscriptBody(body)` in
`packages/MainUI/utils/processes/definition/moduleScope.ts`, using two tiers:

1. **Explicit marker (wins):** a first significant line of `// @payscript` (or block form) forces DSL;
   `// @module-scope` forces module body.
2. **Structural fallback:** strip leading whitespace/comments and inspect the first significant
   character. `{`, `(`, or a leading `export` → **DSL**; anything else (`const`, `let`, `function`,
   `class`, `"use strict"`, …) → **module body**.

A module body is evaluated **once per dialog open** by `evaluateModuleScope(body, context)` via
`new Function(...keys, body)(...values)`; it must `return { … }`. A non-object/no-return result yields
an empty scope and a logged warning (it never throws). Re-evaluating per open means module-level state
does not leak across dialog sessions.

**Edge case:** a module body that *starts* with a parenthesized expression (e.g. a leading IIFE) is
misclassified as DSL by tier 2; add `// @module-scope` to disambiguate. This is rare — migrated bodies
start with declarations.

### 6.5 Lifecycle & the nested-modal tab gating

`onLoad` runs once per open (tracked by an identity ref) and is gated on `tab`; `onProcess` is gated on
`tab`. The nested-process stack (Section 8.3) renders its modals from a root-level host that sits
**outside** the tab context, so a nested modal has `tab === undefined` — meaning **`onLoad`/`onProcess`
do not run in a nested modal**. By contrast, parameter `onChange` is bound to `form.watch` and is *not*
tab-gated, so it **does** run inside a nested modal. Migration logic that must execute in a nested
launch should live in a parameter `onChange`, not in `onLoad`/`onProcess`.

### 6.6 `onChange` firing semantics

Classic fires onChange on blur. The new form runs in `onChange` mode, but real commit timing comes from
each selector (numeric commits on blur; select/boolean/date/tabledir/list commit per discrete
selection; free text commits per keystroke). Three guards make this faithful and loop-free:

1. **Value diff** — fire only when the committed value actually changed.
2. **Re-entrancy guard** — a hook's own `item.setValue` does not recursively re-fire that parameter.
3. **Trailing ~250 ms debounce** — coalesces free-text keystroke bursts.

Net effect: discrete selectors fire once immediately, numeric on blur, text once typing settles, and
script-driven value writes cannot cause infinite loops.

---

## 7. Execution context: globals and proxies

### 7.1 Injected globals

`buildProcessScriptContext` (`packages/MainUI/utils/processes/definition/utils.ts`) provides these
identifiers inside every hook body (alongside `Metadata` and any module-scope helpers):

| Global | What it is |
|---|---|
| `Metadata` | Kernel/metadata client. |
| `callAction(handler, payload, options?)` | POST to the kernel action handler; returns `Promise<{ data }>`. |
| `callDatasource(entity, payload?, options?)` | POST to a datasource; returns `Promise<{ data }>`. |
| `callServlet(path, payload?, options?)` | POST/GET to an arbitrary servlet. |
| `OB` | The `OB.*` shim (Section 8.6). |
| `confirm` / `warn` / `say` | Promise-based modal dialogs (Section 8.1). |
| `isc` | Classic alias namespace: `{ confirm, ask, warn, say, OBMessageBar }`. |
| `messageBar` | In-dialog banner handle (Section 8.2); also reachable as `view.messageBar`. |
| `BigDecimal` | Decimal arithmetic class mirroring the Classic global (Section 8.11). |
| module-scope helpers | Whatever `etmetaPayscriptLogic` returned (Section 6.4). |

All HTTP helpers attach auth headers (bearer token + CSRF) automatically. They are routed through the
client's `/api` proxy, which injects the CSRF token server-side.

### 7.2 The `view` proxy

`view` is the canonical object passed as the second positional argument to `onLoad`/`onProcess`/
`onChange` (and produced for `onRefresh`/`onGridLoad`). It is built by `createViewProxy` in
`packages/MainUI/utils/processes/definition/scriptProxies.ts` and mirrors SmartClient's
`OBStandardView`. It has two tiers:

- **Read-only environment — always present:** `view.theForm`, `view.messageBar`, `view.viewGrid`,
  `view.windowId`, `view.callerField`, `view.parentWindow`, `view.sourceView`, `view.activeView.tabId`,
  `view.getContextInfo()`, `view.getView(tabId?)`. The parent context is reachable both as
  `view.getContextInfo()` and through the Classic SmartClient idiom
  `view.parentWindow.view.getContextInfo()` (alias of the same accessor; `view.parentWindow.view` also
  exposes `getView`), so a migrated script can keep the literal Classic call. `getContextInfo()` returns
  the launching record's fields (keyed by `inputName`, e.g. `inpbpCurrencyId`) overlaid with the current
  parameter values.
- **Action methods — live only when a controller is injected by the modal:** `view.refresh()`,
  `view.handleReadOnlyLogic()`, `view.handleButtonsStatus()`, `view.fireOnPause()`,
  `view.selectAllRecords()`, `view.getSelection()`, `view.openProcess(params)`,
  `view.standardWindow.openProcess(params)`, plus footer chrome (`view.popupButtons.members`,
  `view.cancelButton`, `view.parentElement…closeButton`) and the execute button
  (`view.okButton.isEnabled()` / `view.okButton.enable()`). Without the controller these are deferred and
  throw `"<api> is not implemented yet"`.
  - **`view.okButton`.** `isEnabled()` reads the live enabled state of the execute/OK button; `enable()`
    force-enables it. The button already enables itself reactively once mandatory parameters have values,
    so `enable()` exists for parity with Classic (e.g. `ProcessOrders.onLoad`) and overrides **only** the
    "mandatory empty" reason — it does not bypass `isPending` / submit-in-progress / final-success states.
- **onLoad data fields.** An `onLoad` script reads the launch context directly off `view`:
  `view.selectedRecords` (the launching grid's selection), `view.tabId`, `view.tableId`,
  `view.parentRecord`. Use these instead of the Classic `view.parentWindow.view.viewGrid
  .getSelectedRecords()` / `view.processOwnerView.tabId` DOM walks.
- **Server execution — live only in the `onProcess` path:** `await view.executeProcess(actionValue?)`.
  This is the new-UI reproduction of Classic's `actionHandlerCall()` (see Section 5.2.1). It is deferred
  (throws `"view.executeProcess is not implemented yet"`) in the other hooks, where pressing the execute
  button is not what triggered them.

This deferral is intentional: read-only data is always safe, and any unported action surfaces loudly.

### 7.3 `form`, `item`, and `grid` proxies

- **Form** (`view.theForm`): `getItem(name)`, `getValues()`/`values`, `getField(i)`/`getFields()`,
  `hideItem(name)`, `addField(field)`/`removeField(target)`, `focusInItem(name)`,
  `redraw()`/`markForRedraw()`. Mutations delegate to the modal's `FieldController` and reuse the
  existing reactive mechanisms (e.g. `setRequired` → the parameter's `mandatory`, `show`/`hide` → the
  script-logic field store, where the script wins).
- **Item** (`form.getItem(name)`): `getValue()`/`setValue(v)`, `setValueFromRecord(record)`,
  `setValueProgrammatically(v)`, `getFirstOptionValue()`, `setRequired(bool)`/`setDisabled(bool)`,
  `show()`/`hide()`, `setValueMap(map)`/`getValueMap()`, `clearValue()`, `name`, and `canvas.viewGrid`
  for grid parameters. Items resolve by `name`, `dBColumnName`, or the parameter map key, so
  `getItem('Column1')` and `getItem('<Display Name>')` both work — and `setValueMap` / `getValueMap` /
  `setRequired` update the parameter under its real map key regardless of which form you address it by.
  - **`getValue()` is type-faithful to Classic.** For numeric parameters (Integer / Number / Quantity /
    Decimal references) it returns a **`number`**, mirroring SmartClient — so a migrated comparison like
    `a < b` is numeric, not lexicographic (`90 < 120`, never `"90" < "120"`). Empty/`null` values pass
    through unchanged. Non-numeric parameters return their raw value (usually a string). Do **not** wrap
    numeric reads in `Number(...)`; the platform already coerces.
  - **Setting a selector value + its label.** To set a reference/selector field to a value that is not in
    the loaded option list (e.g. a value resolved by an action handler), use
    `item.setValueFromRecord({ id, _identifier })`. This sets both the value and the displayed identifier
    in one call — the new-UI equivalent of the Classic `item.valueMap[id] = label; item.setValue(id)`
    idiom. A bare `setValue(id)` only sets the value, so the selector would not render a label for an
    unknown id.
  - **Selecting an existing option / reading the first option.** `item.setValueProgrammatically(value)`
    selects an option already present in the field's value map (sets value + label, like Classic's
    homonym); `item.getFirstOptionValue()` returns the `value` of the first option in the current value
    map (or `undefined` when there are none). Both are the new-UI equivalents used by the `processRecords`
    family (`ProcessOrders/Invoices/Shipment.onLoad`).
  - **`getValueMap()` returns a `ListOption[]` array** (`{ id, value, label }`), **not** a Classic
    `{ id: label }` object. Port the Classic lookup `valueMap[action]` to
    `getValueMap().find(o => o.value === action || o.id === action)`. `setValueMap(map)` still accepts
    either an array or a plain `{ id: label }` object and normalizes it.
- **Grid** (`view.theForm.getItem('<param>').canvas.viewGrid`, or the `grid` argument of `onGridLoad`):
  selection (`getSelectedRecords`, `selectRecord`, `deselectRecord`, `selectSingleRecord`,
  `deselectAllRecords`, `userSelectAllRecords`), row access (`getRecord`, `getRecordIndex`,
  `getEditedRecord`), edit values (`setEditValue`, `getEditValues`, `getEditedCell`), data/lifecycle
  (`invalidateCache`, `fetchData`, `getCriteria`, `addSelectedIDsToCriteria`, `data.{localData,
  allRows, totalRows}`, `getTotalRows`), **visibility (`show()` / `hide()`)**, per-row plugins
  (`setRowActions`/`setRecordComponent`), and chained lifecycle callbacks (`dataArrived`,
  `selectionChanged`). Methods backed by the grid controller are live only when a `GridController` is
  present; the read-only subset (selection/row reads) always works. `show()` / `hide()` are live when a
  `FieldController` is present (the modal injects one for both the `onGridLoad` grid arg and
  `canvas.viewGrid`); they toggle the grid **parameter's** visibility through the same field-display
  store as `item.show()/hide()` — see Section 8.5. A few filter-editor methods (`filterByEditor`,
  `setFilterEditorCriteria`, `removeRecordClick`, `transformData`) are best-effort.

### 7.4 `callerField` and nested launches

`view.callerField` carries the field/button that launched the dialog: `{ id, name, columnId, record,
view }`. The `view` member points back to the **launcher's** view, so a nested process can reach its
parent's context as `view.callerField.view`. The launcher's view is stamped onto the nested launch
request and forwarded by `ProcessStackHost` to the nested `ProcessDefinitionModal`, which prefers the
forwarded `callerField` over the one derived from its own button. Top-level opens derive `callerField`
from the launching button.

---

## 8. Capabilities: what migrated JS can do, and how

Each capability below states the Classic surface, the new-UI contract, and the implementing files.
Anything not implemented throws a clear error rather than failing silently.

### 8.1 Modal dialogs — `confirm` / `warn` / `say` / `isc.ask`

- **Classic:** `isc.confirm(message, callback)` (and `warn`/`say`); the callback receives `true`/`false`.
- **New UI:** Promise-based helpers that also accept the Classic callback shape.
  `confirm(message)` → `Promise<boolean>`; `confirm(message, callback)` and
  `confirm(message, options, callback)` both work; `options.title` is honored. `warn`/`say` resolve to
  `void`. `ask` is an alias of `confirm`.
- **How:** a React-free singleton FIFO queue (`packages/MainUI/utils/processes/definition/dialogs.ts`)
  holds one request at a time; `ProcessDialogHost` (mounted inside the modal) renders it. Safe defaults:
  if no host is mounted, or the modal unmounts with a pending dialog, the promise resolves to `false`
  (never confirms a destructive branch). Messages are plain text; advanced toolbar buttons are not
  carried.

### 8.2 In-dialog message bar + severity constants

- **Classic:** `view.messageBar.setMessage(severity, title, text)` and `view.messageBar.hide()`, with
  `OB.MessageBar.TYPE_*` / `isc.OBMessageBar.TYPE_*` severities.
- **New UI signature:**
  ```ts
  view.messageBar.setMessage(
    severity: "info" | "success" | "warning" | "error",
    title: string | null,
    text: string,                                   // sanitized HTML (formatting tags only)
    actions?: Array<{ label: string; onClick: () => void }>
  ): void;
  view.messageBar.hide(): void;
  ```
- **Severity constants:** a single source of truth `MESSAGE_BAR_TYPES`
  (`{ TYPE_INFO: "info", TYPE_SUCCESS: "success", TYPE_WARNING: "warning", TYPE_ERROR: "error" }`) is
  exposed on both `OB.MessageBar.TYPE_*` and `isc.OBMessageBar.TYPE_*`. The values are the canonical
  severities and pass straight through severity normalization.
- **How:** a React-free singleton store
  (`packages/MainUI/utils/processes/definition/messageBarStore.ts`) consumed by `ProcessMessageBar` via
  `useSyncExternalStore`; mounted at the top of the modal body and cleared on each open. The same handle
  is injected both as the top-level `messageBar` global and as `view.messageBar`.
- **Sanitization:** `text` is sanitized by a single DOMPurify wrapper with a locked allowlist
  (formatting tags `b i em strong br span p ul ol li code`; `class` the only attribute; no `<a>`,
  `<script>`, inputs, `style`, or `on*` handlers). Clickable affordances must use the structured
  `actions` array (real React buttons whose `onClick` is a closure with access to `view`/`form`/`OB`),
  **not** Classic inline `<a href="#" onclick="…">` markup.

### 8.3 Nested-process modal stack

- **Classic:** `standardWindow.openProcess({ callerField, paramWindow, processId, windowId,
  externalParams, windowTitle })`, layered on top of the current dialog; the parent's `onRefresh` fires
  when the child closes.
- **New UI:** `view.openProcess(params)` (and `view.standardWindow.openProcess`) pushes onto a
  React-free LIFO stack (`packages/MainUI/utils/processes/definition/processStack.ts`); the root-level
  `ProcessStackHost` (`packages/MainUI/components/ProcessModal/ProcessStackHost.tsx`) renders one
  `ProcessDefinitionModal` per entry (layered by MUI). On child close/success the parent's
  `onRefreshFunction(parentView)` auto-fires, and `callerField` (with its `view`) is forwarded to the
  child (Section 7.4). These methods are live only with a `ViewController`.
- **Note:** recall the tab-gating nuance in Section 6.5 for what runs inside a nested modal.

### 8.4 Per-row grid plugin

- **Classic:** a custom row component via `isc.ClassFactory.defineClass` rendering inline icon-buttons
  per row.
- **New UI:** declarative `grid.setRowActions(renderer)` (alias `setRecordComponent`). The renderer
  receives `{ record, view, grid }` and returns `{ buttons: [{ icon, prompt, action: (ctx) => void }] }`
  or `null`. Icon presets: `search`, `add`, `clearRight`. Buttons render in the grid's leading
  "Actions" column; a click never toggles row selection; throwing renderers/actions are caught and
  logged. No arbitrary React from compiled strings.

### 8.5 Embedded interactive grid

Covered by the grid proxy in Section 7.3. The same live grid handle is reached two ways — through
`view.theForm.getItem('<param>').canvas.viewGrid` and as the `onGridLoad` argument — and the controller
reuses the grid's own handlers, so a script acts exactly as a user would. Edit-value writes overlay
through the grid's change handler; `dataArrived`/`selectionChanged` are chained subscribers.

**Cell-edit, per-toggle and per-column hooks (register from `onGridLoad`).** Beyond `selectionChanged`
(which fires with the full selection array, `fn(selection)`), the grid handle exposes additional
**additive** subscription points. Register them from the grid's `onGridLoad` body:

| Grid method | Fires | Classic equivalent |
|---|---|---|
| `grid.onRecordChange((record, changes) => …)` | on every in-place cell edit | a field-level `realPaymentOnChange`-style recompute |
| `grid.onSelectionToggle((record, state) => …)` | once per row added/removed, with the toggled record + its new boolean | the Classic `selectionChanged(record, state)` per-toggle signature |
| `grid.setColumnOnChange('<col>', (item, view, form, grid) => …)` | when that column's cell changes; `item.getValue()` is the new value, `item.record` the row | `AD_FIELD.ONCHANGEFUNCTION` on a grid column |
| `grid.setColumnValidator('<col>', (item, validator, value, record) => boolean)` | on edit; return `false` to reject (the edited cell reverts) | `AD_FIELD.EM_OBUIAPP_VALIDATOR` on a grid column |
| `grid.fireOnPause(id, fn, ms)` | trailing-debounced run (per `id`) | the Classic `this.fireOnPause` reachable on the grid `this` |

Notes: `onSelectionToggle` is computed by diffing the previous vs current selection — it complements,
and does not replace, the full-array `selectionChanged` subscriber. A `setColumnOnChange` body may call
`grid.setEditValue(...)`; the platform guards against re-entrancy so a recompute that writes sibling
columns does not loop. There is **no** new DB column for the per-column hooks — they are registered at
runtime from the existing `onGridLoad` body. `grid.getEditedCell(...)` accepts either a row index or a
record, and either a column name (string) or a Classic field object.

**Read-only amount columns survive selection changes.** When the selection changes, the substrate zeroes
the editable amount field of every **unselected** row (correct for payment grids, where an unselected row
pays nothing). It now skips any `amount`/`paymentAmount` column that is **read-only** for the grid (per the
grid's read-only logic). So a migrated validation that reads `record.amount` as a read-only cap (e.g. *Add
Invoices*, where `amount` is the invoice amount and `settlementAmount` is the editable field) keeps seeing
the real value on every row — it is no longer forced to `0` on open. No script change is required to opt
in; it follows the field's read-only metadata.

**Row-click selection registers in the canonical store.** A user can select a grid row either by ticking
its checkbox or by clicking the row body. Both paths now feed the same canonical selection store, so
`grid.getSelectedRecords()` returns every selected row and `grid.onSelectionToggle((record, state) => …)`
fires for it, regardless of how the row was selected. A migrated script that reads selection through
`grid.getSelectedRecords()` (e.g. *Add Invoices* summing `settlementAmount` over the picked invoices)
therefore sees the user's picks immediately — no script change is required.

**Grid visibility.** A Classic process can hide/show the whole grid widget
(`item.theForm.getField('<grid>').canvas.viewGrid.hide()` / `.show()`) — e.g. to keep a results grid
hidden until a search runs. The new UI supports this on the grid proxy as `viewGrid.hide()` /
`viewGrid.show()`. Because a grid is a **parameter** here (not a free-floating widget), these delegate
to the field-display store via the `FieldController` (`setDisplayed('<grid>', false/true)`) — the same
store behind `item.hide()/show()` — and the grid parameter's `WindowReferenceGrid` honors that flag
when it has no static `displayLogic` of its own. Equivalent and interchangeable:
`view.theForm.getItem('<grid>').canvas.viewGrid.hide()` and `view.theForm.getItem('<grid>').hide()`
both hide the grid parameter.

**Yes/No defaults and display logic.** A Yes/No (boolean, reference `20`) parameter with no
`defaultValue` is initialized to `false`, matching the Classic unchecked checkbox. This is what makes
static display logic such as `@SomeFlag@=false` evaluate correctly on open (an unset boolean would
otherwise stay `undefined`, and `undefined == 'N'` is false, wrongly hiding the field). Handled by
`seedBooleanParameterDefaults` (`utils/process/evaluateParameterDefaults.ts`) when the modal builds its
form defaults; no script action is needed.

### 8.6 The `OB.*` namespace shim

`createOBShim(deps)` (`packages/MainUI/utils/ob/obShim.ts`, one file per namespace) builds one shared,
React-free `OB` per modal:

| Namespace | Surface |
|---|---|
| `OB.PropertyStore` | `get(key, windowId?)`, `set(key, value)` (case-insensitive). |
| `OB.I18N` | `getLabel(labelId, paramsArray?)` with Classic `%n` positional substitution; unknown keys fall back to the key. |
| `OB.Format` | `defaultDecimalSymbol`, `defaultGroupingSymbol`, `defaultGroupingSize`, `defaultNumericMask`, derived from the active language. |
| `OB.Utilities.Number` | `JSToOBMasked(value, mask, …)` for standard `#,##0.00` masks. Accepts a `number` **or** a decimal-like value (a `BigDecimal`/`BigNumber`, via `toNumber()`); any other input is returned unchanged. |
| `OB.Utilities.Action` | `set(name, fn)`, `execute(name, params)`, `executeJSON(...)` (Section 8.9). |
| `OB.Utilities.generateRandomString(length)` | utility. |
| `OB.Styles` | style constants (`MessageBar`, module styles). |
| `OB.Constants` | Classic SmartClient identifiers: `FIELDSEPARATOR` (`"$"`) and `IDENTIFIER` (`"_identifier"`), used to build compound display-field keys (e.g. `'currency' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER` → `'currency$_identifier'`). |
| `OB.MessageBar` | severity constants (Section 8.2). |
| `OB.RemoteCallManager` | `call(...)` callback↔Promise adapter (Section 8.7). |
| `OB.Datasource` | `create(config)` datasource façade (Section 8.8). |
| `OB.TestRegistry` | `register(...)` no-op. |
| `OB.<Module>.<Process>` | module-namespace writes are tolerated, so a module body can self-register `OB.APRM.AddPayment = {…}`. |

### 8.7 `OB.RemoteCallManager.call` — callback↔Promise adapter

Classic scripts call a server action handler with a callback `(response, data, request)`. The shim
(`packages/MainUI/utils/ob/remoteCallManager.ts`) keeps that contract while internally awaiting
`callAction`: on resolve it invokes `callback({ status: 0 }, data, { clientContext })`; on a transport
or non-OK HTTP failure it invokes the error callback (or the callback) with `{ status: -1 }`. A
*business* error (HTTP 200 with `data.message.severity === "error"`) takes the success path so the
script inspects `data`. This adapter is preferred over rewriting every call site to `await`, because
`new Function`-compiled bodies cannot use top-level `await` cleanly and it enables near line-for-line
ports.

### 8.8 `OB.Datasource` access

`OB.Datasource.create(config)` (`packages/MainUI/utils/ob/datasource.ts`) returns
`{ fetchData(criteria, callback), setCacheData(records) }` backed by the api-client `datasource.get`
path (which injects CSRF server-side and builds the full flat request — a raw `callDatasource` proxy is
not used because the Classic datasource servlet rejects the thin request with `InvalidCSRFToken`). The
entity is resolved from the last path segment of the Classic `dataURL` (or an explicit `entity`/
`dataSource`). **Pagination is mandatory** — the server aborts unpaged fetches — so the façade supplies
a bounded default (`_startRow: 0`, `_endRow: 100`), overridable per datasource. `fetchData` keeps the
Classic `(response, data, request)` callback contract; `setCacheData` mirrors a client-only datasource.

### 8.9 Action-JSON dispatcher — `OB.Utilities.Action.executeJSON`

Server action handlers return a `responseActions` array. `OB.Utilities.Action.executeJSON(actions, …)`
iterates and dispatches each by its key. The pure parser/router lives in
`packages/MainUI/components/ProcessModal/utils/responseActionDispatcher.ts`; the active context is held
in a singleton store (`packages/MainUI/utils/processes/definition/actionDispatcherStore.ts`) that the
modal registers on mount and clears on unmount.
`executeJSON` is **registry-first**: an entry runs a function registered via `OB.Utilities.Action.set`
if present, else the built-in handler. Built-in action types map to new-UI effects:

| Action type | New-UI effect |
|---|---|
| `showMsgInProcessView` | in-dialog message bar (Section 8.2) |
| `showMsgInView` | global toast |
| `openDirectTab` | navigate to the target tab |
| `refreshGrid` | targeted refetch of the launching tab's grid (data only — does not re-run `onLoad`) |
| `refreshGridParameter` | refresh the in-modal grid |
| `smartclientSay` | `say` dialog (Section 8.1) |
| `OBUIAPP_browseReport` / `OBUIAPP_downloadReport` | token-authenticated fetch → Blob → open/download |
| `setSelectorValueFromRecord` | best-effort no-op with warning unless launched from a selector |
| `custom` | invokes `paramObj.func` when it is a function (Classic string-eval form is dropped) |

Migrated scripts can call `executeJSON` directly (e.g. inside a `RemoteCallManager` callback); the
`onProcess` return path also dispatches returned actions, but **excludes** `message` and `openDirectTab`
to avoid double effects with the existing flow.

### 8.10 Shared module scope for `etmetaPayscriptLogic`

As described in Sections 5.4 and 6.4: a Classic file is one module mixing entry points with shared
helpers, constants, and closure state. The new UI evaluates the module body once per open and spreads
the returned helpers into every hook's context, so entry points call helpers by bare name; the body may
also self-register `OB.<Module>.<Process>` so namespaced calls keep working. There is no cross-process
global namespace — each process owns its module scope (see the cloning rule in Section 10.5).

### 8.11 Decimal arithmetic — the `BigDecimal` global

- **Classic:** a global `BigDecimal` (Openbravo's GWT/Java decimal port) used for money math that must
  keep the server's rounding/scale, e.g. `new BigDecimal(String(x))`, `BigDecimal.prototype.ZERO`,
  `.add`, `.subtract`, `.compareTo`, `.setScale(2)`.
- **New UI:** `BigDecimal` is injected as a top-level global (Section 7.1), so migrated scripts use it
  **verbatim** — never rewrite money math with `Number`/`parseFloat`, which drifts (`0.1 + 0.2`) and
  breaks parity with the server-side amount check. The class is an immutable wrapper over
  `bignumber.js` (`packages/MainUI/utils/ob/bigDecimal.ts`):

  ```js
  let total = BigDecimal.prototype.ZERO;                 // zero
  total = total.add(new BigDecimal(String(row.amount))); // immutable: returns a new instance
  const diff = total.subtract(other);
  total = total.setScale(2);                             // fix the scale → toString() shows "5.00"
  if (total.compareTo(expected) !== 0) { /* amounts differ */ }
  OB.Utilities.Number.JSToOBMasked(total, OB.Format.defaultNumericMask, …); // formats directly
  ```

  Supported surface: constructor (`string | number | BigDecimal`), `prototype.ZERO`,
  `prototype.ROUND_HALF_UP`, `add`, `subtract`, `multiply`, `compareTo` (`-1 | 0 | 1`),
  `setScale(scale, roundingMode?)`, `toString()`, `toNumber()`. `multiply(other)` is exact (Java
  `BigDecimal.multiply` carries no scale/rounding; re-apply `setScale` afterwards), e.g.
  `unitPrice.multiply(qty).setScale(2, BigDecimal.prototype.ROUND_HALF_UP)`. `setScale(scale)` mirrors
  the Classic `BigDecimal.setScale(scale)`: it returns a **new** instance with a fixed decimal scale
  whose `toString()` renders exactly that many decimals (`"5"` → `"5.00"`); the optional second argument
  accepts the Classic `BigDecimal.prototype.ROUND_HALF_UP` rounding mode and defaults to it. `divide` is
  **not** provided yet: Java `BigDecimal.divide` requires an explicit scale + `RoundingMode` to be
  deterministic, so it will be added with those semantics when a process needs it. `JSToOBMasked` accepts
  a `BigDecimal` directly (Section 8.6), so amounts format without a manual `.toNumber()`.

### 8.12 Action-time dynamic parameter form — `openDynamicForm`

- **Classic:** a backend response action returns field descriptors and the client builds a popup form
  at runtime (`isc.defineClass(..., isc.OBPopup)` + `isc.DynamicForm.create({ fields })` + `isc.OBFormButton`),
  collects the values, and POSTs them to a second handler.
- **New UI:** `openDynamicForm({ title?, fields })` opens a dialog hosting a parameter form built from
  the server field descriptors, reusing the standard parameter selectors (no SmartClient primitives). It
  returns a `Promise<CollectedValue[] | null>` — the collected values, or `null` when the user cancels.
  `fields` are `{ name, inputType: 'TEXT' | 'CHECK', defaultText?, defaultCheck?, id? }`. It is injected
  as a top-level global (Section 7.1) and also exposed as `view.openDynamicForm(...)`.
- **Data-only custom response actions.** A backend `responseActions` entry with a custom key (e.g.
  `EAPM_Popup`) carrying field descriptors is dispatched **registry-first** through
  `OB.Utilities.Action.executeJSON` (Section 8.9). Register a builder for it from
  `em_etmeta_payscript_logic` (module scope), which opens the form and submits the result:

  ```js
  // @module-scope
  OB.Utilities.Action.set('EAPM_Popup', async function (actionData) {
    const collected = await openDynamicForm({ title: actionData.executionProcessName, fields: actionData.processParameters });
    if (!collected) return;                       // cancelled → no-op
    OB.RemoteCallManager.call('<SecondActionHandler>', { _params: actionData, processParameters: collected }, {},
      function (rpcResponse, data) {
        if (data && data.success) {
          OB.Utilities.Action.executeJSON([{ refreshGrid: {} }]);
          messageBar.setMessage('success', null, data.message);
        } else {
          messageBar.setMessage('error', null, (data && data.error) || 'Error');
        }
      });
  });
  ```

  Only `TEXT` / `CHECK` field types are rendered today (what the Classic popup emits); richer types are
  an additive extension. No change to the response-action dispatcher is required — an unregistered custom
  key is still dropped exactly as before.

---

## 9. Custom UI component path

When `etmetaCustomComponent` is `true`, the process does **not** render the standard parameter form.
Instead, `onLoad` returns a schema describing a bespoke UI, and the new UI renders a custom component
from that schema. This is the rendering path for processes whose dialog is not a flat list of fields
(e.g. a specialized picker). When the flag is `false`/absent, the standard metadata-driven parameter
form renders. The flag is read uniformly from the process JSON — there is no per-process gating.

---

## 10. Migration playbook (human & agent)

This section is the operational guide for translating one Classic `.js` file into the metadata columns.

### 10.1 Step sequence

1. **Inventory the hook points.** Identify the file's `onLoad` / `onProcess` / `onRefresh` /
   per-parameter `onChange` / `onGridLoad` entry points, and the shared helpers/constants/state they
   call. (Cross-check the process's expected hook points in
   [`process-definition-js-testing.md`](./process-definition-js-testing.md).)
2. **Map each entry point to its column** (Section 5) and write it as a **bare arrow function** with the
   correct signature (Section 6.1). Do not wrap in an IIFE or return an object.
3. **Move shared code into `em_etmeta_payscript_logic`** as a module body ending in
   `return { …helpers… };` (Section 10.4). Reference helpers from hooks by bare name.
4. **Replace Classic APIs** using the equivalence table (Section 10.2). Most calls map 1:1.
5. **Rewrite inline-onclick links** in messages as structured `actions` entries (Section 8.2).
6. **Keep Classic callbacks or switch to `await`** — both are supported by the dialog and
   `RemoteCallManager`/`Datasource` adapters. Prefer keeping callbacks for line-for-line fidelity.
7. **Drop dead code** (Section 10.3) and **clone shared cluster code** where required (Section 10.5).
8. **Validate** (Section 10.6).

### 10.2 Classic → new equivalence table

| Classic | New UI |
|---|---|
| `function onLoad(view) { … }` | `em_etmeta_onload`: `async (process, view) => { … }` |
| `function onProcess(view) { … }` | `em_etmeta_onprocess`: `async (process, view) => { … }` |
| `onProcess(view, actionHandlerCall, …)` → `actionHandlerCall()` | `return await view.executeProcess()` (Section 5.2.1) — platform builds the standard payload + submits to the configured Java class |
| `onProcess(…, …, clientSideValidationFail)` → `clientSideValidationFail()` | `return { severity: 'error', text }` (aborts; modal stays open) |
| `clientsidevalidation` on a Pick&Execute / Window-Reference process | `em_etmeta_onprocess` as a **pre-submit hook** (Section 5.2.2): `return { severity: 'error', text }` to abort, `undefined` to proceed; do **not** call `view.executeProcess()` |
| `grid.selectionChanged = function(record, state) { … }` (per-toggle) | `grid.onSelectionToggle((record, state) => …)` registered from `onGridLoad` (Section 8.5) |
| `this.fireOnPause(id, fn, ms)` (on the grid) | `grid.fireOnPause(id, fn, ms)` (Section 8.5) |
| `AD_FIELD.ONCHANGEFUNCTION` on a grid column | `grid.setColumnOnChange('<col>', (item, view, form, grid) => …)` from `onGridLoad` (Section 8.5) |
| `AD_FIELD.EM_OBUIAPP_VALIDATOR` on a grid column | `grid.setColumnValidator('<col>', (item, validator, value, record) => boolean)` from `onGridLoad` (Section 8.5) |
| field-level cell `onchangefunction` recompute (e.g. `realPaymentOnChange`) | `grid.onRecordChange((record, changes) => …)` from `onGridLoad` (Section 8.5) |
| `grid.pneSelectedRecords[i].x = …` (staging edited amounts) | drop — the edit is already merged; recompute from `grid.getSelectedRecords()` + the `changes` arg |
| `unitPrice.multiply(qty)` / `.setScale(2, BigDecimal.prototype.ROUND_HALF_UP)` | identical — `multiply` is exact; `setScale` accepts the rounding mode (Section 8.11) |
| `view.parentWindow.activeView.getContextInfo(...)` (+ `.parentView` fallback) | identical — both alias the single context, which carries `inpTabId` (Section 7.2) |
| `grid.getEditedCell(record, fieldObject)` / `(rowIndex, fieldObject)` | identical — `getEditedCell` accepts a record or index, and a column name or field object |
| backend custom popup action (`isc.DynamicForm` in `isc.OBPopup`) | register a builder via `OB.Utilities.Action.set('<key>', …)` calling `openDynamicForm({ fields })` (Section 8.12) |
| `function onRefresh(view) { … }` | `em_etmeta_on_refresh`: `(view) => { … }`; call via `view.onRefreshFunction(view)` |
| `onchangefunction(item, view, form, grid)` | `em_etmeta_on_parameter_change`: `(item, view, form, grid) => { … }` |
| `ongridloadfunction(grid, view, parameters)` | `em_etmeta_on_grid_load`: `(grid, view, parameters) => { … }` |
| `form.getItem('<numeric>').getValue()` → number | identical — numeric params return a `number` (Section 7.3); keep Classic comparisons (`a < b`) as-is, do not add `Number(...)` |
| `gl.valueMap[id] = label; gl.setValue(id)` | `gl.setValueFromRecord({ id, _identifier: label })` — sets value **and** display label (Section 7.3) |
| `item.setValueProgrammatically(v)` | identical — selects an existing option (value + label), Section 7.3 |
| `item.getFirstOptionValue()` | identical — returns the first option `value` of the current value map |
| `var m = item.getValueMap(); m[action]` | `item.getValueMap().find(o => o.value === action \|\| o.id === action)` — `getValueMap()` is a `ListOption[]` array, not an `{id:label}` object |
| `view.okButton.isEnabled()` / `view.okButton.enable()` | identical — `enable()` force-enables, overriding only the "mandatory empty" reason (Section 7.2) |
| `view.parentWindow.view.viewGrid.getSelectedRecords()` (onLoad) | `view.selectedRecords` (onLoad `hookData`) |
| `view.processOwnerView.tabId` / `view.parentWindow.tabId` (onLoad) | `view.tabId` (onLoad `hookData`) |
| `documentStatuses.add(x)` (SmartClient Array) | `documentStatuses.push(x)` — plain JS arrays |
| module-level helpers/state | `em_etmeta_payscript_logic` module body ending in `return { … }` |
| `isc.confirm(msg, cb)` / `isc.warn` / `isc.say` | `confirm(msg, cb)` / `warn` / `say` (or `await confirm(msg)`) |
| `view.parentWindow.view.getContextInfo()` | identical (also `view.getContextInfo()`) — parent record fields by `inputName` overlaid with the current parameter values |
| `view.messageBar.setMessage(OB.MessageBar.TYPE_X, t, html)` | same; `html` is sanitized; links → `actions` |
| `OB.I18N.getLabel(id, params)` | identical |
| `OB.PropertyStore.get/set` | identical |
| `OB.Format.*`, `OB.Utilities.Number.JSToOBMasked` | identical (`JSToOBMasked` also accepts a `BigDecimal`, Section 8.6) |
| `new BigDecimal(String(x))` / `.add` / `.subtract` / `.compareTo` / `.setScale(2)` / `.prototype.ZERO` | identical — injected global (Section 8.11); never rewrite money math with `Number` |
| `OB.Constants.FIELDSEPARATOR` / `OB.Constants.IDENTIFIER` | identical — exposed by the `OB` shim (Section 8.6) |
| `OB.RemoteCallManager.call(handler, params, other, cb)` | identical (callback adapter over `callAction`) |
| `OB.Utilities.Action.set/execute/executeJSON` | identical |
| `OB.Datasource.create({...}).fetchData(cb)` | identical (mandatory pagination defaults applied) |
| `isc.OBRestDataSource.getDummyCriterion()` | unnecessary — `fetchData` always re-queries |
| `standardWindow.openProcess({...})` | `view.openProcess({...})` |
| `getField('<grid>').canvas.viewGrid.hide()` / `.show()` | `getItem('<grid>').canvas.viewGrid.hide()` / `.show()` (or `getItem('<grid>').hide()` / `.show()`) — toggles the grid parameter's visibility |
| per-row `isc.ClassFactory.defineClass` component | `grid.setRowActions(renderer)` returning `{ buttons }` |
| `OB.<Module>.<Process> = {}` namespace | tolerated; self-register inside the module body |

### 10.3 Dead-code rule

Migrate only the code reachable from the in-scope process's hooks. If a function/branch/helper is
unreachable from any hook of any in-scope process, leave it out. Confirm "unreachable" by a static
reference search across the Classic tree and the in-scope process bodies; when in doubt, migrate (be
conservative). The objective is 100% behavioral reproduction of in-scope processes, not a 1:1 port of
every legacy line.

### 10.4 Module-scope conventions

- End the body with `return { helperA, helperB, CONST_C, … };` to expose helpers by bare name.
- For namespaced access (`OB.APRM.AddPayment.updateTotal(...)`), self-register the namespace inside the
  body, exactly as the Classic file does — the shim tolerates `OB.<NS>` writes.
- Do not redeclare reserved context names (`OB`, `callAction`, `messageBar`, `confirm`, …) as helpers.
- If the body must begin with a parenthesized expression, prefix it with `// @module-scope` so the
  classifier treats it as a module body, not DSL (Section 6.4).

### 10.5 Per-process self-containment & cloning

There is no shared-loading mechanism across processes; each process owns its code:

- **Self-contained files** clone straight into their own `em_etmeta_*` columns.
- **The `processRecords` family** (Create Inverse Invoice/Order, Process Orders/Shipment/Invoices):
  clone the migrated body into each of the five process rows.
- **Namespace-sharing clusters** — ETFRA (4 files), OBFBPS (2 files), REM (2 files): produce one
  canonical merged body per cluster and replicate it into each member process's
  `em_etmeta_payscript_logic`. These clusters share *namespace objects*, not function calls, so once
  each process owns its scope the sharing pattern disappears.
- **Trade-off (accepted):** a future fix to cluster/family logic must be applied to each member row.

### 10.6 Out of scope

Processes whose only frontend code lives in minified `dist.js` bundles that turn out to be **React
Native** mobile-app code (various `ETAWIM_*` and `ETCRM_*` processes) are **out of scope** — they have
no Classic SmartClient JavaScript to migrate. They appear in `OBUIAPP_PROCESS` only because the mobile
module reuses the Defined-Process registration; their UI lives in a separate application stack.

### 10.7 Validation

- The compiled body must be a **bare arrow function** (Section 6.1) — verify it evaluates to a function.
- Exercise each migrated hook in the running dialog; confirm parity with Classic behavior.
- For a representative validation matrix and acceptance criteria, use
  [`process-definition-js-testing.md`](./process-definition-js-testing.md).

---

## 11. Legacy Add-Payment exception

The platform is fully generic and metadata-driven **with one exception**: the **Add Payment** process
is currently supported through four process-specific hardcodings in the UI. They predate this migration
work and are retained for traceability and as a cleanup target once Add Payment is itself migrated to
the generic, metadata-driven path.

| # | Location | What it does |
|---|---|---|
| 1 | `PROCESS_DEFINITION_DATA` + per-process IDs in `packages/MainUI/utils/processes/definition/constants.ts` | Static lookup mapping process IDs to payload field/column overrides. |
| 2 | `isAddPayment` branch in `packages/MainUI/components/ProcessModal/hooks/useProcessPayload.ts` | `if (processId === ADD_PAYMENT_ORDER_PROCESS_ID)` bypasses parameter-name mapping. |
| 3 | `SINGLE_RECORD_ONLY_PROCESSES` in `packages/MainUI/hooks/Toolbar/useToolbar.ts` | Hardcodes `"EM_APRM_AddPayment"` as a single-record exception to bulk toolbar logic. |
| 4 | `PROCESS_CALLOUTS` registry in `packages/MainUI/components/ProcessModal/callouts/processCallouts.ts` | Its only entry is Add Payment; processes carrying `em_etmeta_payscript_logic` use the dynamic per-parameter fallback instead. |

**Why this is not a blocker.** The migration runtime itself is generic: hooks load dynamically from the
`em_etmeta_*` columns keyed by the real process UUID, and the backend emits those columns for every
process through the generic converter pass (Section 4). None of the four spots is required by the
migration path; they are the old Add-Payment support, inert for every other process.

**Cleanup direction (future).** When Add Payment is migrated, fold each hardcoding into the generic
mechanism — express payload/column overrides and the single-record exception as metadata (or derive
them from the process definition) rather than by process ID, and drop the static `PROCESS_CALLOUTS`
entry.

**Note.** `packages/MainUI/payscript/rules/AddPaymentRulesClean.js` and
`packages/MainUI/payscript/examples/simpleExample.ts` are development/test fixtures only — imported by
tests and an unused example, never by the live modal path — so they carry no runtime coupling.

---

## 12. References

### 12.1 Companion document

- [`process-definition-js-testing.md`](./process-definition-js-testing.md) — the per-process inventory:
  which processes are in scope, the hook points each uses, and the QA acceptance criteria.

### 12.2 Source-file index

**Client (`client/packages/MainUI`)**

| Responsibility | File |
|---|---|
| Compile/execute string functions | `utils/functions.ts` |
| Parameter-hook compiler | `utils/processes/definition/compileParameterHook.ts` |
| Script context (HTTP helpers, OB, dialogs, message bar) | `utils/processes/definition/utils.ts` |
| `view` / `form` / `item` / `grid` proxies, `CallerField` | `utils/processes/definition/scriptProxies.ts` |
| Module-scope evaluation & classifier | `utils/processes/definition/moduleScope.ts` |
| Dialog queue | `utils/processes/definition/dialogs.ts` |
| Message-bar store + severity constants | `utils/processes/definition/messageBarStore.ts` |
| Nested-process stack | `utils/processes/definition/processStack.ts` |
| Response-action dispatcher | `components/ProcessModal/utils/responseActionDispatcher.ts`, `utils/processes/definition/actionDispatcherStore.ts` |
| `OB.*` shim | `utils/ob/obShim.ts` (+ `i18n.ts`, `format.ts`, `action.ts`, `datasource.ts`, `remoteCallManager.ts`, `styles.ts`, number utilities) |
| Modal: onLoad/onRefresh, module scope, hosts | `components/ProcessModal/ProcessDefinitionModal.tsx` |
| Nested-process host (root layout) | `components/ProcessModal/ProcessStackHost.tsx` |
| In-dialog banner host | `components/ProcessModal/ProcessMessageBar.tsx` |
| onProcess | `components/ProcessModal/hooks/useProcessExecution.ts` |
| onChange | `components/ProcessModal/hooks/useParameterChangeHooks.ts` |
| onRefresh compiler | `components/ProcessModal/processView.ts` |
| Embedded grid + onGridLoad binding | `components/ProcessModal/WindowReferenceGrid.tsx` |
| PayScript engine (DSL) | `payscript/engine/LogicEngine.ts` |

**Backend (`erp/modules/com.etendoerp.metadata`)**

| Responsibility | File |
|---|---|
| Process metadata endpoint routing | `src/com/etendoerp/metadata/http/MetadataFilter.java`, `src/com/etendoerp/metadata/service/ServiceFactory.java` |
| Process metadata service | `src/com/etendoerp/metadata/service/ProcessMetadataService.java` |
| Process JSON builder + key rename | `src/com/etendoerp/metadata/builders/ProcessDefinitionBuilder.java` |
| Generic entity → JSON converter | `org.openbravo.service.json.DataToJsonConverter` (core) |
| Builder tests | `src-test/.../builders/ProcessDefinitionBuilderTest.java`, `...ProcessDefinitionBuilderCustomComponentTest.java` |
