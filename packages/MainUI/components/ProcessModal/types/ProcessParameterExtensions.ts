import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

/**
 * Extended ProcessParameter interface that includes properties found in actual API responses
 * but not covered by the base ProcessParameter type
 */
export interface ExtendedProcessParameter extends Omit<ProcessParameter, keyof Record<string, string>> {
  // Core ProcessParameter properties
  id: string;
  name: string;
  reference: string;
  mandatory: boolean;
  defaultValue: string;
  refList: Array<{ id: string; label: string; value: string }>;
  readOnlyLogicExpression?: string;
  window?: any; // WindowMetadata type

  // Additional properties found in API responses
  dBColumnName?: string;
  displayLogic?: string;
  description?: string;
  help?: string;
  sequenceNumber?: number;
  length?: number;

  // Allow additional string properties for flexibility
  [key: string]: any;
}

/**
 * Process defaults response from DefaultsProcessActionHandler
 * This structure is different from FormInitializationResponse
 */
export interface ProcessDefaultsResponse {
  defaults: Record<string, ProcessDefaultValue>;
  filterExpressions: Record<string, Record<string, any>>;
  refreshParent: boolean;
}

/**
 * Union type for process default values
 * Can be simple string/number/boolean or complex object with value/identifier
 */
export type ProcessDefaultValue =
  | string
  | number
  | boolean
  | {
      value: string;
      identifier: string;
    };

/**
 * Type guard to check if a value is a reference object with value/identifier
 */
export function isReferenceValue(value: ProcessDefaultValue): value is { value: string; identifier: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "identifier" in value &&
    typeof value.value === "string" &&
    typeof value.identifier === "string"
  );
}

/**
 * Type guard to check if a value is a simple string/number/boolean
 */
export function isSimpleValue(value: ProcessDefaultValue): value is string | number | boolean {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

/**
 * Interface for logic field values (display_logic, readonly_logic)
 * These are string values that can be "Y" or "N"
 */
export interface ProcessLogicFields {
  [key: `${string}_display_logic`]: "Y" | "N";
  [key: `${string}_readonly_logic`]: "Y" | "N";
}

/**
 * Type guard to check if a parameter has the required properties for mapping
 */
export function isValidProcessParameter(param: unknown): param is ExtendedProcessParameter {
  return (
    typeof param === "object" &&
    param !== null &&
    "id" in param &&
    "name" in param &&
    typeof (param as any).id === "string" &&
    typeof (param as any).name === "string"
  );
}
