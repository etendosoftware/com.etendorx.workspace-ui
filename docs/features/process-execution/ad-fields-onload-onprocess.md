# AD Fields: `onLoad` and `onProcess` — Developer Reference

## Overview

`onLoad` and `onProcess` are JavaScript fields defined in the Etendo Application Dictionary (AD) on a **ProcessDefinition** record. They allow module developers to configure custom process behavior entirely from the AD, without modifying the WorkspaceUI codebase.

- **`onLoad`** — Evaluated when the process modal opens. Controls initial UI state, parameter filtering, and special rendering modes.
- **`onProcess`** — Evaluated when the user clicks the Execute ("Done") button. Contains the actual business logic: calls to Java action handlers, URL opening, etc.

Both fields store the **body of a JavaScript function expression** — not a full `function` declaration, but an arrow function value that `executeStringFunction` wraps and calls.

---

## How Evaluation Works Internally

Both fields are evaluated by `packages/MainUI/utils/functions.ts`:

```typescript
export async function executeStringFunction(code: string, context = {}, ...args: unknown[]) {
  const contextKeys = Object.keys(context);      // e.g. ["Metadata", "callAction"]
  const contextValues = Object.values(context);  // the actual objects

  // The code string is returned as an expression (an arrow function)
  const fn = new Function(...contextKeys, `return ${code.trim()}`);

  // contextValues are injected as closure variables — like "imports"
  const evaluatedFn = fn(...contextValues);

  // The function is called with positional arguments
  return await evaluatedFn(...args);
}
```

**Key concept**: context variables (`Metadata`, `callAction`) are **not parameters** of your function — they are closure-scoped variables available anywhere in your function body, just like imported modules. The positional `args` are what you declare as function parameters.

---

## `onLoad` Field

### Call signature

```typescript
executeStringFunction(
  onLoad,
  { Metadata },                  // context → closure variables
  button.processDefinition,      // arg[0]
  {                              // arg[1]
    selectedRecords,
    tabId,
    tableId,
  }
)
```

### Function template

```javascript
async (processDefinition, { selectedRecords, tabId, tableId }) => {
  // Metadata is available as a closure variable
  // Return an object to control modal behavior, or undefined for no-op
}
```

### Available in scope

| Name | Type | Description |
|---|---|---|
| `Metadata` | API client | Fetch metadata: tabs, fields, processes. Use `Metadata.client.get/post(...)` |
| `processDefinition` | `object` | The AD ProcessDefinition object (`id`, `name`, `parameters`, `javaClassName`, ...) |
| `selectedRecords` | `{ id: string }[]` | Records currently selected in the parent grid/tab |
| `tabId` | `string` | ID of the tab from which the process was triggered |
| `tableId` | `string` | ID of the AD table associated with the tab |

### Return values

| Return value | Effect |
|---|---|
| `undefined` / `null` | No-op — modal renders normally with its AD parameters |
| `{ type: "directExecute" }` | Skip modal UI, auto-fire `onProcess` immediately (loading overlay only) |
| `{ type: "warehouseProcess", schema, ... }` | Render `GenericWarehouseProcess` component (complex schema-driven UI) |
| `{ parameterName: ["val1", "val2"] }` | Filter the `refList` of the named parameter to those values |
| `{ _gridSelection: { gridKey: ["id1", "id2"] } }` | Pre-select rows in a `WindowReference` grid |
| `{ autoSelectConfig: { table, logic } }` | Declarative row auto-selection in a `WindowReference` grid |

### Examples

**Filter parameter options based on selected record:**
```javascript
async (processDefinition, { selectedRecords }) => {
  const record = selectedRecords[0];
  // Only show payment methods valid for this record's currency
  if (record.currency === "USD") {
    return { paymentMethod: ["WIRE", "CHECK"] };
  }
  return { paymentMethod: ["SEPA", "WIRE"] };
}
```

**Pre-select related records in a grid:**
```javascript
async (processDefinition, { selectedRecords }) => {
  return {
    _gridSelection: {
      order_invoice: [selectedRecords[0].id]
    }
  };
}
```

**Trigger direct execution without showing modal UI:**
```javascript
async () => {
  return { type: "directExecute" };
}
```

---

## `onProcess` Field

### Call signature

```typescript
executeStringFunction(
  onProcess,
  { Metadata, callAction },      // context → closure variables
  button.processDefinition,      // arg[0]
  {                              // arg[1] — stringFunctionPayload
    _buttonValue,
    buttonValue,
    windowId,
    tabId,
    entityName,
    recordIds,                   // string[] — IDs of selected records
    ...recordFields,             // all fields of the current record (from buildProcessPayload)
    ...formValues,               // current values from the process parameter form
  }
)
```

### Function template

```javascript
async (processDefinition, payload) => {
  // Metadata and callAction are available as closure variables
  // Use payload.recordIds[0] to get the selected record's ID
  // Use callAction(...) to call a Java action handler
}
```

### Available in scope

| Name | Type | Description |
|---|---|---|
| `Metadata` | API client | Fetch metadata. Use `Metadata.client.get/post(...)` |
| `callAction` | `async (handler, params) => any` | Call a Java `ActionHandler` via HTTP POST |
| `processDefinition` | `object` | The AD ProcessDefinition object |
| `payload.recordIds` | `string[]` | IDs of the selected records |
| `payload.windowId` | `string` | ID of the parent window |
| `payload.tabId` | `string` | ID of the parent tab |
| `payload.entityName` | `string` | Entity name of the parent tab |
| `payload._buttonValue` | `string` | Value of the clicked button (`"DONE"` or custom) |
| `payload.*` | `unknown` | All current record fields + form parameter values |

### `callAction` usage

```javascript
const result = await callAction(
  "com.example.mymodule.MyActionHandler",  // Java class implementing ActionHandler
  {
    _topLevel: true,        // send body flat (no _params wrapper) — use for most handlers
    id: payload.recordIds[0],
    someParam: "value",
  }
);
```

> **`_topLevel: true`**: sends the body as `{ _buttonValue: "DONE", id: "...", someParam: "..." }`.
> **Without `_topLevel`**: wraps params as `{ _buttonValue: "DONE", _params: { id: "...", someParam: "..." } }`.
> Check which format your Java handler expects.

### Return values

| Return value | Effect |
|---|---|
| `{ responseActions: [{ showMsgInProcessView: { msgType, msgText } }] }` | Standard response — shows success/error message in modal |
| `{ type: "openUrl", url, closeModal?, refreshRecord?, windowFeatures? }` | Open a URL in a popup window |
| *(throw an Error)* | Shows the error message in the modal without closing it |

#### `openUrl` options

| Field | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | required | URL to open in `window.open` |
| `closeModal` | `boolean` | `true` | Whether to close the process modal after opening |
| `refreshRecord` | `boolean` | `false` | Whether to trigger a refresh of the parent record/grid |
| `windowFeatures` | `string` | `"width=800,height=600,noopener,noreferrer"` | `window.open` features string |

### Examples

**Call a Java handler and show the response message:**
```javascript
async (processDefinition, payload) => {
  const result = await callAction(
    "com.example.mymodule.GenerateReportHandler",
    { _topLevel: true, recordId: payload.recordIds[0] }
  );
  // result must contain responseActions with showMsgInProcessView
  return result;
}
```

**Call a Java handler and open the returned URL:**
```javascript
async (processDefinition, payload) => {
  const result = await callAction(
    "com.etendoerp.psd2.bank.integration.actionhandler.GenerateBankPayment",
    { _topLevel: true, id: payload.recordIds[0] }
  );
  if (result?.message?.severity === "error") {
    throw new Error(result.message.text || "Process failed");
  }
  return {
    type: "openUrl",
    url: result.pdfUrl,
    closeModal: true,
    refreshRecord: false,
    windowFeatures: `width=${Math.round(screen.width * 0.7)},height=${Math.round(screen.height * 0.7)}`,
  };
}
```

**Call a Java handler, open URL, and refresh the parent record:**
```javascript
async (processDefinition, payload) => {
  const result = await callAction(
    "com.etendoerp.psd2.bank.integration.actionhandler.GetConsents",
    { _topLevel: true, id: payload.recordIds[0] }
  );
  if (result?.message?.severity === "error") {
    throw new Error(result.message.text || "GetConsents failed");
  }
  return {
    type: "openUrl",
    url: result.consentUrl,
    refreshRecord: true,   // parent grid refreshes after popup opens
    closeModal: true,
  };
}
```

**Use form parameter values in the payload:**
```javascript
async (processDefinition, payload) => {
  // payload contains form values by their dBColumnName
  const quantity = payload.quantity;
  const warehouseId = payload.M_Warehouse_ID;

  const result = await callAction(
    "com.example.mymodule.ReserveStockHandler",
    { _topLevel: true, quantity, warehouseId, recordId: payload.recordIds[0] }
  );
  return result;
}
```

---

## `directExecute` Pattern

When `onLoad` returns `{ type: "directExecute" }`, the modal skips its normal UI and immediately fires `onProcess` when the modal opens. The user sees only a brief loading overlay.

This is ideal for processes that:
- Don't need any parameter input from the user
- Execute a Java handler directly with data from the selected record
- Are type **M** (Manual) in the AD — which cannot have AD Parameters

```
User clicks button
      ↓
Modal opens → onLoad evaluates → { type: "directExecute" }
      ↓
Loading overlay shown
      ↓
onProcess fires automatically
      ↓
{ type: "openUrl" } → window.open() → modal closes
```

**AD field configuration for a direct-execute process:**

`onLoad`:
```javascript
async () => {
  return { type: "directExecute" };
}
```

`onProcess`:
```javascript
async (processDefinition, payload) => {
  const result = await callAction(
    "com.example.MyActionHandler",
    { _topLevel: true, id: payload.recordIds[0] }
  );
  if (result?.message?.severity === "error") {
    throw new Error(result.message.text);
  }
  return {
    type: "openUrl",
    url: result.generatedUrl,
    refreshRecord: true,
    closeModal: true,
  };
}
```

---

## Argument Flexibility

You never have to declare all arguments. JavaScript ignores undeclared trailing arguments:

```javascript
// Only need callAction and the record ID — declare only what you use
async (_, payload) => {
  const result = await callAction("com.example.Handler", {
    _topLevel: true,
    id: payload.recordIds[0],
  });
  return result;
}

// Need nothing from args, only closure variables
async () => {
  const metadata = await Metadata.client.get("meta/some-endpoint");
  // ...
}

// Need everything
async (processDefinition, payload) => {
  const pid = processDefinition.id;
  const rid = payload.recordIds[0];
  // ...
}
```

---

## Error Handling

Throwing an error in either `onLoad` or `onProcess` is the standard way to surface errors to the user:

```javascript
async (processDefinition, payload) => {
  if (!payload.recordIds?.length) {
    throw new Error("No record selected");
  }
  const result = await callAction("com.example.Handler", {
    _topLevel: true,
    id: payload.recordIds[0],
  });
  if (result?.message?.severity === "error") {
    throw new Error(result.message.text || "Unknown error from handler");
  }
  return result;
}
```

Thrown errors are caught by `handleExecute` and displayed in the modal as an error message. The modal stays open so the user can retry or cancel.

---

## Related Files

| File | Purpose |
|---|---|
| `packages/MainUI/utils/functions.ts` | `executeStringFunction` — core evaluation engine |
| `packages/MainUI/components/ProcessModal/ProcessDefinitionModal.tsx` | Where `onLoad` and `onProcess` are called |
| `packages/MainUI/components/ProcessModal/Custom/GenericWarehouseProcess/warehouseApiHelpers.ts` | `createCallAction` / `createFetchDatasource` factories |
| `packages/MainUI/components/ProcessModal/Custom/GenericWarehouseProcess/useWarehousePlugin.ts` | `warehouseProcess` schema evaluation from `onLoad` |

## See Also

- [Process Definition Modal](./process-definition-modal.md)
- [Process Execution Architecture](../../architecture/process-execution-architecture.md)
- [Manual Processes (legacy iframe)](../../manual-processes.md)
