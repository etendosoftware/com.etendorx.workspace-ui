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
 * Type guard to check if a parameter has the required properties for mapping
 */
export function isValidProcessParameter(param: unknown): param is ExtendedProcessParameter {
  return (
    typeof param === 'object' &&
    param !== null &&
    'id' in param &&
    'name' in param &&
    typeof (param as any).id === 'string' &&
    typeof (param as any).name === 'string'
  );
}