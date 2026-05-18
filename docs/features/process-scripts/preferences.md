# Preferences in Process Scripts

> **Last updated:** 2026-03-04
> **Applies to:** onLoad · onProcess · PayscriptLogic · Display Logic

---

## Overview

ERP preferences are loaded from the backend at login and cached in
`localStorage["etendo_preferences"]`. The new UI injects an `OB` shim
into every dynamic script so they can read preferences using the same
`OB.PropertyStore.get()` API as the classic Openbravo/Etendo UI —
no migration of the reading pattern is required.

### Data flow

```
Login
  └── UserProvider.updateSessionInfo()
        └── GET /api/preferences
              └── PreferencesService.java   (resolves per client/org/user/role)
                    └── localStorage["etendo_preferences"]  { KEY: "Y"|"N"|"value", ... }
```

At runtime each script execution receives `OB` as an injected variable:

```
executeStringFunction(code, { OB: createOBShim(), callAction, ... }, ...args)
                                     │
                                     └── OB.PropertyStore.get(key)
                                           ├── 1. exact match in localStorage prefs
                                           ├── 2. case-insensitive fallback
                                           └── 3. undefined (key not found)
```

---

## Availability by script type

| Script type | `OB.PropertyStore.get()` | `context._preferences` |
|---|:---:|:---:|
| **Display Logic** (buttons / fields) | ✅ | — |
| **onLoad** | ✅ | — |
| **onProcess** | ✅ | — |
| **PayscriptLogic** (`compute` / `validate`) | — | ✅ |

---

## Display Logic

Evaluated as a plain expression — no `async`, no `await`.

```javascript
// Show button only when UOM management is active
OB.PropertyStore.get('UomManagement') === 'Y'

// Hide field when exact validation preference is off
OB.PropertyStore.get('MYMOD_ExactValidation') !== 'Y'

// Combine with a form field value
OB.PropertyStore.get('UomManagement') === 'Y' && @isActive@ === 'Y'

// Short-hand using the # prefix (equivalent)
@#UomManagement@ === 'Y'
```

> ⚠️ **Never start a Display Logic expression with a `//` comment.**
> The engine wraps the code as `return <expression>`. A leading comment
> triggers ASI: `return // comment` → implicit `return undefined` → field
> is always hidden.

---

## onLoad

`OB`, `callAction`, `callDatasource`, and `Metadata` are all available.

```javascript
async (_processDefinition, { selectedRecords }) => {

  // --- Read preferences ----------------------------------------------------
  const showUOM   = OB.PropertyStore.get('UomManagement') === 'Y';
  const exactAttr = OB.PropertyStore.get('MYMOD_ExactValidation') === 'Y';
  const maxLines  = Number(OB.PropertyStore.get('MYMOD_MaxLines') || '100');

  // --- Early validation based on a preference ------------------------------
  if (!showUOM && selectedRecords.length > maxLines) {
    return {
      error: {
        message: `Max ${maxLines} records allowed when UOM is disabled.`,
        msgType: "error",
      },
    };
  }

  // --- Backend call ---------------------------------------------------------
  const response = await callAction("com.mymodule.MyActionHandler", {
    processId: "YOUR-PROCESS-UUID",
    recordId: selectedRecords[0]?.id,
    _entityName: "MyEntity",
    _topLevel: true,
  });

  if (!Array.isArray(response?.data)) {
    throw new Error("Unexpected response from MyActionHandler");
  }

  // --- Build columns conditioned on preferences ----------------------------
  const gridColumns = [
    { field: "documentNo", labelKey: "mymod.docNo",   align: "left"  },
    { field: "product",    labelKey: "mymod.product",  align: "left"  },
    ...(showUOM ? [
      { field: "uom",          labelKey: "mymod.uom",          align: "left"  },
      { field: "operativeQty", labelKey: "mymod.operativeQty", align: "right" },
    ] : []),
    { field: "quantity",   labelKey: "mymod.qty",      align: "right" },
    { field: "qtyVerified",labelKey: "mymod.verified", align: "center", editable: true },
  ];

  return {
    type: "warehouseProcess",
    titleKey: "mymod.title",
    inputBar: ["qty", "barcode"],
    gridColumns,
    features: {
      useOperativeQty: showUOM && exactAttr,
      trackScannedInputs: true,
    },
    initialData: { lines: response.data, boxCount: 1 },
    recordId: selectedRecords[0]?.id,
  };
}
```

---

## onProcess

`OB`, `callAction`, `callDatasource`, and `Metadata` are all available.
The second argument (`params`) contains the values the user filled in the modal.

```javascript
async (_processDefinition, params) => {

  // --- Read preferences ----------------------------------------------------
  const useOperativeQty    = OB.PropertyStore.get('UomManagement') === 'Y'
                          && OB.PropertyStore.get('MYMOD_ExactValidation') === 'Y';
  const requireConfirmation = OB.PropertyStore.get('MYMOD_RequireConfirm') === 'Y';

  // --- Read form values ----------------------------------------------------
  const { recordIds, Employee: employee, Group: group = false, lines = [] } = params;

  if (!recordIds?.length) {
    return { error: { msgText: "No records selected", msgType: "error" } };
  }

  // --- Adapt payload according to preferences ------------------------------
  const lineData = lines.map((l) => ({
    shipmentLineId: l.shipmentLineId,
    qty: useOperativeQty ? l.operativeQty : l.quantity,
  }));

  return await callAction("com.mymodule.MyProcessActionHandler", {
    processId: "YOUR-PROCESS-UUID",
    action: requireConfirmation ? "processWithConfirm" : "process",
    pickinglist: recordIds,
    employee,
    group,
    lineData,
    _entityName: "MyEntity",
  });
}
```

---

## PayscriptLogic

Preferences are available via `context._preferences` (a plain object).
The `compute` function runs on every form field change.

```javascript
({
  id: "MYMOD_ProcessRules",

  compute: (context, util) => {
    // --- Read preferences from context ------------------------------------
    const prefs     = context._preferences;
    const showUOM   = prefs['UomManagement'] === 'Y';
    const exactAttr = prefs['MYMOD_ExactValidation'] === 'Y';
    const precision = Number(prefs['MYMOD_ConversionPrecision'] || '2');

    // --- Read live form values -------------------------------------------
    const quantity = util.valNum('quantity', 'Quantity');
    const convRate = util.valNum('conversionRate', 'ConversionRate') || 1;

    // --- Conditional calculation -----------------------------------------
    const operativeQty = showUOM
      ? util.num(quantity).times(convRate).decimalPlaces(precision).toNumber()
      : quantity;

    return {
      // Return "0" as string when zero — React Hook Form treats numeric 0 as falsy
      operativeQty: operativeQty === 0 ? "0" : operativeQty,

      // _display_logic suffix controls field visibility
      operativeQty_display_logic:    showUOM ? "Y" : "N",
      conversionRate_display_logic:  showUOM && exactAttr ? "Y" : "N",
    };
  },

  validate: (context, computed, util) => {
    const strictMode = context._preferences['MYMOD_StrictMode'] === 'Y';
    const quantity   = util.valNum('quantity');

    if (strictMode && quantity <= 0) {
      return [{
        id: "qty_positive",
        isValid: false,
        message: "Quantity must be greater than zero (strict mode is active).",
        severity: "error",
      }];
    }
    return [];
  },
})
```

---

## Common conversion patterns

```javascript
// Boolean (stored as "Y" / "N")
const isEnabled = OB.PropertyStore.get('MY_PREF') === 'Y';

// Number with default
const maxLines = Number(OB.PropertyStore.get('MY_PREF_NUM') || '100');

// String with default
const mode = OB.PropertyStore.get('MY_PREF_MODE') || 'standard';

// Window-scoped preference
// The backend stores it as "KEY_<windowId>"; OB.PropertyStore.get resolves
// it automatically based on the current window context.
const windowPref = OB.PropertyStore.get('MY_PREF');
```

---

## Common mistakes

### 1. Comment at the start of the script

```javascript
// ❌ This comment causes ASI → the script returns undefined → "not a function" error
// My onLoad script
async (_pd, { selectedRecords }) => { ... }

// ✅ Comments are fine inside the function body
async (_pd, { selectedRecords }) => {
  // My onLoad script
  const pref = OB.PropertyStore.get('MY_PREF');
  ...
}
```

### 2. IIFE instead of a bare function expression

```javascript
// ❌ Immediately-invoked — executeStringFunction receives the Promise, not the function
(async (_pd, { selectedRecords }) => {
  ...
})()

// ✅ Bare arrow function — executeStringFunction calls it with the right arguments
async (_pd, { selectedRecords }) => {
  ...
}
```

### 3. Numeric zero not rendered in inputs

```javascript
// ❌ React Hook Form treats numeric 0 as falsy and clears the input
return { quantity: 0 };

// ✅ Return "0" as a string to force the input to display it
return { quantity: total === 0 ? "0" : total };
```

### 4. Wrong response unwrapping in onLoad

```javascript
// callAction (from processScriptContext) returns { data: <backendResponse> }
const response = await callAction("com.mymodule.Handler", { ... });

// ❌ response is { data: { data: [...] } } — response itself is not the array
if (!Array.isArray(response)) throw new Error("No data");

// ✅ Unwrap one level
if (!Array.isArray(response?.data)) throw new Error("No data");
const lines = response.data.map(...);
```

---

## Implementation reference

| File | Role |
|---|---|
| `utils/propertyStore.ts` | `getStoredPreferences()` · `createOBShim()` |
| `utils/functions.ts` | `executeStringFunction()` — injects context into dynamic scripts |
| `utils/processes/definition/utils.ts` | `buildProcessScriptContext()` — builds `callAction` / `callDatasource` / `callServlet` |
| `components/ProcessModal/ProcessDefinitionModal.tsx` | Injects `{ OB, callAction, ... }` for onLoad and onProcess |
| `components/ProcessModal/Custom/GenericWarehouseProcess/useWarehousePlugin.ts` | Injects `{ OB, callAction, fetchDatasource }` for warehouse onLoad |
| `components/ProcessModal/callouts/genericPayScriptCallout.ts` | Adds `_preferences` to PayScript `context` |
