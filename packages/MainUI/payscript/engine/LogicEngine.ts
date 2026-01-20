import BigNumber from "bignumber.js";

/**
 * Validation result from PayScript rules
 */
export interface Validation {
  id: string;
  isValid: boolean;
  message: string;
  severity: "error" | "warning" | "info";
  // biome-ignore lint/suspicious/noExplicitAny: Generic context for validation metadata
  context?: Record<string, any>;
}

/**
 * Result from executing PayScript rules
 */
export interface ExecutionResult {
  success: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: Generic computed fields from PayScript rules
  computed?: Record<string, any>;
  validations?: Validation[];
  error?: string;
  // biome-ignore lint/suspicious/noExplicitAny: Generic invoice data structure
  invoices?: Record<string, any>;
  // biome-ignore lint/suspicious/noExplicitAny: Generic GL items structure
  glItems?: Record<string, any>;
  // biome-ignore lint/suspicious/noExplicitAny: Generic credit structure
  creditToUse?: Record<string, any>;
}

/**
 * Utility functions available in PayScript rules
 */
export interface UtilType {
  BigNumber: typeof BigNumber;
  // biome-ignore lint/suspicious/noExplicitAny: Accepts any value type for numeric conversion
  num: (v: any) => BigNumber;
  // biome-ignore lint/suspicious/noExplicitAny: Generic array and field accessor for sum operation
  sum: (arr: any[], field: string | ((item: any) => any)) => BigNumber;
  // biome-ignore lint/suspicious/noExplicitAny: Generic currency conversion accepts any numeric type
  convert: (amount: any, fromRate: any, toRate: any, precision?: number) => BigNumber;
  // biome-ignore lint/suspicious/noExplicitAny: Returns raw value from context (any type)
  val: (...keys: string[]) => any;
  valNum: (...keys: string[]) => number;
  valStr: (...keys: string[]) => string;
  valBool: (...keys: string[]) => boolean;
  // biome-ignore lint/suspicious/noExplicitAny: Returns generic grid items with dynamic fields
  getGridItems: (fieldsToParse?: string[], gridNames?: string[]) => any[];
  // biome-ignore lint/suspicious/noExplicitAny: Generic distribution logic
  distributeAmount: (
    items: any[],
    totalAmount: number | BigNumber,
    amountField?: string,
    outstandingField?: string
  ) => any[];
}

/**
 * PayScript rules definition
 */
export interface PayScriptRules {
  id: string;
  // biome-ignore lint/suspicious/noExplicitAny: Generic context and return values for compute phase
  compute?: (context: Record<string, any>, util: UtilType) => Record<string, any>;
  // biome-ignore lint/suspicious/noExplicitAny: Generic context and computed values for transform phase
  transform?: (context: Record<string, any>, computed: Record<string, any>, util: UtilType) => Record<string, any>;
  // biome-ignore lint/suspicious/noExplicitAny: Generic context and computed values for validate phase
  validate?: (context: Record<string, any>, computed: Record<string, any>, util: UtilType) => Validation[];
}

// biome-ignore lint/suspicious/noExplicitAny: Accepts any value type for numeric parsing
const parseNum = (val: any): number => {
  if (typeof val === "number") return val;
  if (val instanceof BigNumber) return val.toNumber();
  if (typeof val === "string") {
    const clean = val.replace(/,/g, "");
    const parsed = Number.parseFloat(clean);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper for distributeAmount to calculate initial remaining amount
const calculateRemainingAmount = (items: any[], totalAmount: BigNumber, amountField: string): BigNumber => {
  return items.reduce((acc, item) => {
    const currentAmt = parseNum(item[amountField]);
    return currentAmt !== 0 ? acc.minus(currentAmt) : acc;
  }, totalAmount);
};

// Helper for getGridItems to process a single row
const processGridRow = (row: any, fieldsToParse: string[]) => {
  const cleanRow = { ...row };
  for (const field of fieldsToParse) {
    if (cleanRow[field] !== undefined) {
      cleanRow[field] = parseNum(cleanRow[field]);
    }
  }
  cleanRow.selected = true;
  cleanRow.obSelected = true;
  return cleanRow;
};

// Helper for distributeAmount to process a single item
const distributeToItem = (
  item: any,
  remaining: BigNumber,
  amountField: string,
  outstandingField: string
): BigNumber => {
  const currentAmt = parseNum(item[amountField]);
  if (currentAmt !== 0) return remaining;

  const outstanding = parseNum(item[outstandingField]);
  if (outstanding <= 0) return remaining;

  const alloc = remaining.gt(outstanding) ? outstanding : remaining.toNumber();
  item[amountField] = alloc;
  return remaining.minus(alloc);
};

/**
 * Factory to create a context-aware utility object.
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic context for PayScript execution
const createUtil = (context: Record<string, any>): UtilType => {
  // biome-ignore lint/suspicious/noExplicitAny: Returns raw value of any type from context
  const getRawValue = (...keys: string[]): any => {
    for (const key of keys) {
      if (context[key] !== undefined && context[key] !== null) return context[key];
      const inpKey = `inp${key}`;
      if (context[inpKey] !== undefined && context[inpKey] !== null) return context[inpKey];
    }
    return undefined;
  };

  return {
    BigNumber,
    num: (v: any) => new BigNumber(parseNum(v)),
    sum: (arr: any[], field: string | ((item: any) => any)) =>
      (arr || []).reduce((acc: BigNumber, item: any) => {
        const val = typeof field === "function" ? field(item) : item[field];
        return acc.plus(parseNum(val));
      }, new BigNumber(0)),
    convert: (amount: any, fromRate: any, toRate: any, precision = 2) => {
      const from = new BigNumber(fromRate || 1);
      const to = new BigNumber(toRate || 1);
      return new BigNumber(amount || 0).times(from).div(to).decimalPlaces(precision);
    },
    val: (...keys: string[]) => getRawValue(...keys),
    valNum: (...keys: string[]) => parseNum(getRawValue(...keys)),
    valStr: (...keys: string[]) => {
      const v = getRawValue(...keys);
      return v === undefined || v === null ? "" : String(v);
    },
    valBool: (...keys: string[]) => {
      const v = getRawValue(...keys);
      if (typeof v === "boolean") return v;
      if (typeof v === "string") {
        const low = v.toLowerCase();
        return low === "y" || low === "true" || low === "yes";
      }
      return false;
    },
    getGridItems: (fieldsToParse: string[] = [], gridNames: string[] = []) => {
      const gridSelection: any = context._gridSelection || {};
      const allItems: any[] = [];

      // biome-ignore lint/complexity/noForEach: Iterating map entries
      Object.entries(gridSelection).forEach(([gridName, entityData]: [string, any]) => {
        // Filter by grid name if specified
        if (gridNames.length > 0 && !gridNames.includes(gridName)) {
          return;
        }

        const selection = entityData?._selection || [];
        if (Array.isArray(selection)) {
          // Process rows using helper to reduce nesting
          const processedRows = selection.map((row) => processGridRow(row, fieldsToParse));
          allItems.push(...processedRows);
        }
      });
      return allItems;
    },
    // Generic logic to distribute an amount across a list of items
    distributeAmount: (
      items: any[],
      totalAmount: number | BigNumber,
      amountField = "amount",
      outstandingField = "outstandingAmount"
    ) => {
      // 1. Calculate remaining amount after checking manual allocations
      let remaining = calculateRemainingAmount(items, new BigNumber(totalAmount), amountField);

      // 2. Distribute remaining amount to items with 0 amount
      if (remaining.gt(0)) {
        for (const item of items) {
          // Skip if already allocated or no remaining funds
          if (remaining.lte(0)) break;
          remaining = distributeToItem(item, remaining, amountField, outstandingField);
        }
      }
      return items;
    },
  };
};

/**
 * Main entry point to execute PayScript rules.
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic context for PayScript execution
export const executeLogic = (rules: PayScriptRules, context: Record<string, any>): ExecutionResult => {
  try {
    const util = createUtil(context);

    const computed = rules.compute ? rules.compute(context, util) : {};
    const transformations = rules.transform ? rules.transform(context, computed, util) : {};
    const validations = rules.validate ? rules.validate(context, computed, util) : [];

    return { success: true, computed, ...transformations, validations };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("PayScript Execution Error:", error);
    return { success: false, error: msg };
  }
};
