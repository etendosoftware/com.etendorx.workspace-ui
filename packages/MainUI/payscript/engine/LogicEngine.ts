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
  // biome-ignore lint/suspicious/noExplicitAny: Returns generic grid rows with dynamic fields
  getAllGridRows: (fieldsToParse?: string[], gridNames?: string[]) => any[];
  // biome-ignore lint/suspicious/noExplicitAny: Generic distribution logic
  distributeAmount: (
    items: any[],
    totalAmount: number | BigNumber,
    amountField?: string,
    outstandingField?: string
  ) => any[];
}

/**
 * Declarative reactive rules a payscript can attach to grid cell edits. The UI
 * reads this synchronously inside the grid's record-change handler and applies
 * the resulting patch in the same React update cycle as the edit, so the user
 * never sees an intermediate frame with the pre-rule state.
 */
export interface FieldInteractionsConfig {
  /**
   * Keyed by `gridName` = the `dBColumnName` of the window-reference parameter
   * that owns the grid (e.g. `glitem`, `order_invoice`).
   */
  [gridName: string]: {
    /**
     * Mutually-exclusive column pairs. Editing either side of a pair with a
     * non-zero value forces the other side to 0 in the same row.
     *
     * Each string may be either the DB column name (e.g. `received_in`) or the
     * HQL camelCase name (e.g. `receivedIn`). `GridCellEditor` mirrors writes
     * to both keys on `row.original`, but `onRecordChange` only carries the
     * HQL key, so declaring both pairs keeps the matching robust.
     */
    mutualExclusion?: [string, string][];
  };
}

/**
 * PayScript rules definition
 */
export interface PayScriptRules {
  id: string;
  /** Synchronous UI-level reactive rules (see `FieldInteractionsConfig`). */
  fieldInteractions?: FieldInteractionsConfig;
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

// Source of rows to read from each grid entry in `_gridSelection`:
//   - "selection" → entityData._selection (user-picked rows in Pick & Execute grids)
//   - "all"       → entityData._allRows   (every row present, incl. locally added ones)
type GridRowSource = "selection" | "all";

const collectGridRows = (
  // biome-ignore lint/suspicious/noExplicitAny: Generic grid selection structure shared with the UI layer
  gridSelection: Record<string, any>,
  fieldsToParse: string[],
  gridNames: string[],
  source: GridRowSource
  // biome-ignore lint/suspicious/noExplicitAny: Generic grid row shape determined by the process metadata
): any[] => {
  // biome-ignore lint/suspicious/noExplicitAny: Same as the return type
  const out: any[] = [];
  for (const [gridName, entityData] of Object.entries(gridSelection)) {
    if (gridNames.length > 0 && !gridNames.includes(gridName)) continue;
    const rows = source === "all" ? entityData?._allRows : entityData?._selection;
    if (Array.isArray(rows)) {
      for (const row of rows) out.push(processGridRow(row, fieldsToParse));
    }
  }
  return out;
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
    /**
     * Returns the rows the user has actively picked from each grid (`_selection`).
     * Use this for Pick & Execute grids where selection is the meaningful subset
     * (e.g. `order_invoice`, `credit_to_use`).
     */
    getGridItems: (fieldsToParse: string[] = [], gridNames: string[] = []) =>
      collectGridRows(context._gridSelection || {}, fieldsToParse, gridNames, "selection"),

    /**
     * Returns every row present in each grid (`_allRows`), regardless of selection.
     * Use this for input-style grids where every row is meaningful and there is
     * no explicit selection mechanism — typically grids with `obuiappShowSelect=false`
     * such as the GL Items grid in Add Payment.
     */
    getAllGridRows: (fieldsToParse: string[] = [], gridNames: string[] = []) =>
      collectGridRows(context._gridSelection || {}, fieldsToParse, gridNames, "all"),
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

const isNonZero = (v: unknown): boolean => {
  if (v === null || v === undefined || v === "") return false;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n !== 0;
};

/**
 * Given the `changes` patch a grid cell-edit just produced, returns an extra
 * patch that zeroes any sibling column declared as mutually-exclusive in
 * `rules.fieldInteractions[gridName].mutualExclusion`. Pure, no side effects.
 *
 * Only emits a sibling when the edited value is non-zero — clearing a cell to
 * 0 leaves the sibling untouched (matches classic `signum() !== 0` semantics).
 */
export function resolveMutualExclusion(
  rules: PayScriptRules,
  gridName: string,
  changes: Record<string, unknown>
): Record<string, number> {
  const pairs = rules.fieldInteractions?.[gridName]?.mutualExclusion;
  if (!pairs || pairs.length === 0) return {};

  const patch: Record<string, number> = {};
  for (const [key, value] of Object.entries(changes)) {
    if (!isNonZero(value)) continue;
    for (const [a, b] of pairs) {
      if (key === a) patch[b] = 0;
      else if (key === b) patch[a] = 0;
    }
  }
  return patch;
}

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
