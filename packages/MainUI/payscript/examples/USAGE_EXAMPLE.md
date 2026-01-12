# PayScript Engine - Usage Example

This document shows how to integrate the PayScript Engine in a process component.

## Basic Integration

```typescript
import { usePayScriptEngine } from "../hooks/usePayScriptEngine";
import { AddPaymentRulesGeneric } from "../rules/AddPaymentRulesGeneric";

// In your process component
function MyProcessComponent() {
  const [formValues, setFormValues] = useState({
    actual_payment: 0,
    issotrx: true,
    received_from: "",
    // ... other form fields
  });

  const [gridSelection, setGridSelection] = useState({
    invoices: {
      _selection: [
        { id: "1", amount: 0, outstandingAmount: 500 },
        { id: "2", amount: 0, outstandingAmount: 300 },
      ]
    }
  });

  // Build context for PayScript
  const context = {
    ...formValues,
    _gridSelection: gridSelection,
    _processId: "APRM_ADD_PAYMENT",
  };

  // Execute PayScript rules
  const { computed, validations, hasErrors, isExecuting } = usePayScriptEngine(
    AddPaymentRulesGeneric,
    context,
    {
      autoExecute: true,
      debounceMs: 300,
      onSuccess: (result) => {
        console.log("PayScript computed:", result.computed);
        // Update form fields with computed values
        if (result.computed) {
          setFormValues(prev => ({
            ...prev,
            total: result.computed.total,
            difference: result.computed.difference,
            expected_payment: result.computed.expected_payment,
          }));
        }
      },
      onError: (error) => {
        console.error("PayScript error:", error);
      },
    }
  );

  // Display computed values
  return (
    <div>
      <p>Total: {computed?.total}</p>
      <p>Difference: {computed?.difference}</p>
      <p>Expected Payment: {computed?.expected_payment}</p>

      {hasErrors && (
        <div>
          {validations.map(v => (
            <p key={v.id}>{v.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Using with Generic Callout System

The generic callout system automatically executes PayScript rules when form fields or grid selection changes:

```typescript
// In processCallouts.ts
import { registerPayScriptRules } from "./genericPayScriptCallout";
import { AddPaymentRulesGeneric } from "@/payscript/rules/AddPaymentRulesGeneric";

// Register rules for a process
registerPayScriptRules("APRM_ADD_PAYMENT", AddPaymentRulesGeneric);

// Add to callouts configuration
export const PROCESS_CALLOUTS: ProcessCalloutsConfig = {
  ["APRM_ADD_PAYMENT"]: [
    createPayScriptCallout("_internalGridSelectionTrigger"),
    createPayScriptCallout("actual_payment"),
    createPayScriptCallout("amount_gl_items"),
  ],
};
```

## Context Structure

The PayScript context includes:

```typescript
interface PayScriptContext {
  // Form field values (with or without 'inp' prefix)
  actual_payment?: number;
  issotrx?: boolean;
  received_from?: string;
  // ... all form fields

  // Grid selection
  _gridSelection?: {
    [entityName: string]: {
      _selection: Array<{
        id: string;
        [key: string]: any;
      }>;
    };
  };

  // Process metadata
  _processId?: string;
}
```

## Available Utility Functions

The `util` object provided to PayScript rules includes:

```typescript
interface UtilType {
  // BigNumber operations
  BigNumber: typeof BigNumber;
  num: (v: any) => BigNumber;
  sum: (arr: any[], field: string | ((item: any) => any)) => BigNumber;
  convert: (amount: any, fromRate: any, toRate: any, precision?: number) => BigNumber;

  // Context-aware helpers (auto-handle 'inp' prefix)
  val: (...keys: string[]) => any;
  valNum: (...keys: string[]) => number;
  valStr: (...keys: string[]) => string;
  valBool: (...keys: string[]) => boolean;
  getGridItems: (fieldsToParse?: string[]) => any[];
}
```

## Example: Custom Rules

```typescript
import type { PayScriptRules } from "../engine/LogicEngine";

export const MyCustomRules: PayScriptRules = {
  id: "MY_CUSTOM_PROCESS_V1",

  compute: (context, util) => {
    // Extract values using context-aware helpers
    const amount = util.valNum("amount", "Amount");
    const quantity = util.valNum("quantity", "Quantity");

    // Get items from grid
    const items = util.getGridItems(["price", "quantity"]);

    // Calculate total
    const total = util.sum(items, (item) =>
      util.num(item.price).times(item.quantity)
    );

    // Return computed fields
    return {
      total: total.toFixed(2),
      average: total.div(items.length).toFixed(2),
      count: items.length,
    };
  },

  validate: (context, computed, util) => {
    const validations = [];

    const total = util.num(computed.total || 0);

    if (total.lt(0)) {
      validations.push({
        id: "NEGATIVE_TOTAL",
        isValid: false,
        message: "Total cannot be negative",
        severity: "error" as const,
      });
    }

    return validations;
  },
};
```

## Testing

```typescript
import { executeLogic } from "../engine/LogicEngine";
import { MyCustomRules } from "./MyCustomRules";

describe("MyCustomRules", () => {
  it("should calculate total correctly", () => {
    const context = {
      amount: 100,
      quantity: 5,
      _gridSelection: {
        items: {
          _selection: [
            { id: "1", price: 10, quantity: 2 },
            { id: "2", price: 20, quantity: 3 },
          ],
        },
      },
    };

    const result = executeLogic(MyCustomRules, context);

    expect(result.success).toBe(true);
    expect(result.computed?.total).toBe("80.00");
    expect(result.computed?.count).toBe(2);
  });
});
```
