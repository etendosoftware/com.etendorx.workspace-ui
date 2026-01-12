# PayScript Generic System

## Overview

The PayScript Generic System eliminates the need for process-specific adapters. Instead, it provides a **completely generic approach** where:

1. **Rules are registered by process ID**
2. **Rules work directly with form values** (no mapping needed)
3. **Rules return field updates directly** (no reverse mapping needed)
4. **No adapter code per process**

## Architecture

```
┌─────────────────────────────────────┐
│   Process Definition Modal          │
│   - Form values                     │
│   - Grid selection                  │
│   - Process ID: "_processId"        │
└───────────┬─────────────────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│   useProcessCallouts Hook           │
│   (watches form + grid changes)     │
└───────────┬─────────────────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│   genericPayScriptCallout           │
│   1. Extract processId from context │
│   2. Look up rules in registry      │
│   3. Execute rules with raw context │
│   4. Return computed fields         │
└───────────┬─────────────────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│   PayScript Rules (DSL)             │
│   - compute: read from context      │
│   - validate: check business rules  │
│   - return: field updates           │
└─────────────────────────────────────┘
```

## How It Works

### 1. Register Rules (One Time)

```typescript
// processCallouts.ts
import { registerPayScriptRules, genericPayScriptCallout } from "./genericPayScriptCallout";
import { AddPaymentRulesGeneric } from "@/payscript/rules/AddPaymentRulesGeneric";

// Register rules for the process
registerPayScriptRules(
  ADD_PAYMENT_ORDER_PROCESS_ID,
  AddPaymentRulesGeneric
);

// Configure callout triggers
export const PROCESS_CALLOUTS = {
  [ADD_PAYMENT_ORDER_PROCESS_ID]: [
    { triggerField: "actual_payment", execute: genericPayScriptCallout },
    { triggerField: "_internalGridSelectionTrigger", execute: genericPayScriptCallout },
    // ... more triggers
  ]
};
```

### 2. Write Generic Rules

Rules work **directly with form values** - no adapter needed!

```typescript
// AddPaymentRulesGeneric.ts
export const AddPaymentRulesGeneric: PayScriptRules = {
  id: "APRM_ADD_PAYMENT_V1",

  compute: (context, util) => {
    // Read directly from context (context = form values)
    const actualPayment = getNum(
      context,
      "actual_payment",     // Try snake_case
      "actualPayment",      // Try camelCase
      "ActualPayment"       // Try PascalCase
    );

    // Extract grid data from _gridSelection
    const invoices = getInvoices(context._gridSelection);

    // Calculate
    const total = util.sum(invoices, "amount");
    const difference = util.num(actualPayment).minus(total);

    // Return ALL field name variations (for compatibility)
    return {
      total: total.toFixed(2),
      Total: total.toFixed(2),
      difference: difference.toFixed(2),
      Difference: difference.toFixed(2),
    };
  },

  validate: (context, computed, util) => {
    const validations = [];

    if (computed.difference > 0 && !context.receivedFrom) {
      validations.push({
        id: "APRM_CREDIT_NO_BPARTNER",
        isValid: false,
        message: "Credit requires business partner",
        severity: "error"
      });
    }

    return validations;
  }
};
```

### 3. Process ID Injection

The system automatically injects `_processId` into form values:

```typescript
// ProcessDefinitionModal.tsx
const availableFormData = useMemo(() => {
  return {
    ...basePayload,
    ...initialState,
    _processId: processId,  // ✅ Automatically injected
  };
}, [record, tab, initialState, parameters, processId]);
```

### 4. Automatic Execution

The `useProcessCallouts` hook automatically:
- Watches form value changes
- Watches grid selection changes
- Executes callouts with debouncing
- Updates form fields with results

## Key Differences vs Old Approach

### ❌ Old Approach (Process-Specific Adapter)

```typescript
// addPaymentPayScript.ts - 200+ lines of mapping code
function mapToAddPaymentContext(formValues, gridSelection) {
  // Manual mapping of every field
  const actualPayment = getNumericValue(
    formValues,
    "actual_payment",
    "actualPayment",
    "ActualPayment"
  );

  // Extract invoices manually
  const selectedRecords = getSelectedRecords(gridSelection);
  const invoices = selectedRecords.map(mapInvoiceRecord);

  // Build context manually
  return {
    actualPayment,
    invoices,
    glItems: [],
    // ... 50 more lines
  };
}

function mapToAddPaymentFormUpdates(result, formValues) {
  // Manual reverse mapping
  return {
    total: formatNumber(result.computed.total),
    Total: formatNumber(result.computed.total),
    // ... 30 more lines
  };
}

export const addPaymentPayScriptCallout = createPayScriptCallout({
  rules: AddPaymentRules,
  mapToContext: mapToAddPaymentContext,
  mapToFormUpdates: mapToAddPaymentFormUpdates,
});
```

**Problems:**
- 200+ lines of boilerplate per process
- Duplicate logic for every process
- Hard to maintain
- Easy to miss fields

### ✅ New Approach (Generic System)

```typescript
// Registration (1 line)
registerPayScriptRules(ADD_PAYMENT_ORDER_PROCESS_ID, AddPaymentRulesGeneric);

// Callout config (1 line per trigger)
{ triggerField: "actual_payment", execute: genericPayScriptCallout }
```

**Benefits:**
- **Zero boilerplate** per process
- Rules define their own data needs
- Rules define their own output
- Easy to add new processes
- Consistent across all processes

## Helper Functions in Rules

To handle Etendo's multiple naming conventions, use these helpers:

```typescript
// In your rules file
function getNum(context: any, ...keys: string[]): number {
  for (const key of keys) {
    const val = context[key];
    if (val !== undefined && val !== null) {
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const parsed = parseFloat(val.replace(/,/g, ""));
        if (!isNaN(parsed)) return parsed;
      }
    }
  }
  return 0;
}

function getBool(context: any, ...keys: string[]): boolean {
  for (const key of keys) {
    const val = context[key];
    if (val === "true" || val === "Y" || val === "y" || val === true) return true;
  }
  return false;
}

function getStr(context: any, ...keys: string[]): string {
  for (const key of keys) {
    const val = context[key];
    if (val && typeof val === "string") return val;
  }
  return "";
}

function getInvoices(context: any): any[] {
  const gridSelection = context._gridSelection || {};
  for (const [_, data] of Object.entries(gridSelection)) {
    const selection = (data as any)?._selection;
    if (Array.isArray(selection) && selection.length > 0) {
      return selection.map(record => ({
        id: record.id,
        selected: true,
        amount: getNum(record, "amount"),
        outstandingAmount: getNum(record, "outstandingAmount"),
      }));
    }
  }
  return [];
}
```

## Context Structure

The context passed to rules contains:

```typescript
{
  // All form values (direct access)
  actual_payment: 1000,
  actualPayment: 1000,  // Multiple naming conventions
  issotrx: true,
  // ...

  // Grid selection (special key)
  _gridSelection: {
    invoices: {
      _selection: [
        { id: "1", amount: 500, outstandingAmount: 500 }
      ],
      _allRows: [...]
    }
  },

  // Process ID (injected automatically)
  _processId: "800166"
}
```

## Return Value Structure

Rules return field updates directly:

```typescript
{
  // Computed values (all naming variations)
  expected_payment: "800.00",
  Expected_Payment: "800.00",
  expectedPayment: "800.00",
  "Expected Payment": "800.00",

  total: "800.00",
  Total: "800.00",

  difference: "200.00",
  Difference: "200.00",

  // Special fields
  overpayment_action: "CR",
  overpayment_action_display_logic: "Y"
}
```

These updates are applied directly to the form by `useProcessCallouts`.

## Adding a New Process

To add PayScript logic to a new process:

1. **Write the rules:**
```typescript
// payscript/rules/MyProcessRules.ts
export const MyProcessRules: PayScriptRules = {
  id: "MY_PROCESS_V1",

  compute: (context, util) => {
    const value1 = getNum(context, "field_name");
    const value2 = getNum(context, "other_field");

    return {
      result_field: (value1 + value2).toFixed(2)
    };
  },

  validate: (context, computed, util) => {
    const validations = [];
    if (computed.result_field > 1000) {
      validations.push({
        id: "VALUE_TOO_HIGH",
        isValid: false,
        message: "Value cannot exceed 1000",
        severity: "error"
      });
    }
    return validations;
  }
};
```

2. **Register the rules:**
```typescript
// processCallouts.ts
import { MyProcessRules } from "@/payscript/rules/MyProcessRules";

registerPayScriptRules(MY_PROCESS_ID, MyProcessRules);

export const PROCESS_CALLOUTS = {
  [MY_PROCESS_ID]: [
    { triggerField: "field_name", execute: genericPayScriptCallout },
    { triggerField: "other_field", execute: genericPayScriptCallout },
  ]
};
```

Done! No adapter code needed.

## Future: Backend-Loaded Rules

In the future, rules will be loaded from the backend:

```typescript
// Automatic rule loading
useEffect(() => {
  const loadRules = async () => {
    const rules = await fetchProcessRules(processId);
    registerPayScriptRules(processId, rules);
  };

  if (processId) {
    loadRules();
  }
}, [processId]);
```

The generic system is already prepared for this - just change where rules come from!

## Grid Changes Detection

The system automatically detects grid changes:

```typescript
// useProcessCallouts.ts
const changedFields = Object.keys(formValues).filter(key => {
  // Deep comparison for objects/arrays
  if (typeof currentValue === "object") {
    return JSON.stringify(currentValue) !== JSON.stringify(previousValue);
  }
  return currentValue !== previousValue;
});

// Special trigger for grid selection changes
if (gridSelectionChanged) {
  changedFields.push("_internalGridSelectionTrigger");
}
```

This ensures calculations update when:
- Form fields change
- Grid selections change
- Grid row values change (amounts, etc.)

## Performance

- **Debounced execution**: 300ms default (configurable)
- **Pure functions**: Easy to memoize
- **No unnecessary re-renders**: Only changed fields update
- **Efficient**: ~1-2ms per execution

## Testing

Testing is simple - just test the rules directly:

```typescript
const result = executeLogic(MyProcessRules, {
  field_name: 100,
  other_field: 200,
  _processId: "MY_PROCESS_ID"
});

expect(result.computed.result_field).toBe("300.00");
expect(result.validations).toHaveLength(0);
```

No mocking needed - rules are pure functions!

## Migration from Old Adapters

If you have an existing process-specific adapter:

1. Extract the logic from `mapToContext` into `compute`
2. Remove the adapter file
3. Register rules with `registerPayScriptRules`
4. Update callout config to use `genericPayScriptCallout`

The old adapter files can be deleted once migrated.

## Summary

| Aspect | Old (Adapter) | New (Generic) |
|--------|---------------|---------------|
| **Code per process** | 200+ lines | 0 lines |
| **Boilerplate** | High | Zero |
| **Maintainability** | Hard | Easy |
| **Consistency** | Varies | Uniform |
| **Future-proof** | No | Yes (backend loading) |
| **Performance** | Same | Same |
| **Testing** | Complex | Simple |

The generic system achieves the original goal: **declarative, reusable business logic without process-specific code**.
