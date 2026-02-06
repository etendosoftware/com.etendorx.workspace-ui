import type { ProcessParameter, Field } from "@workspaceui/api-client/src/api/types";
import { createSmartContext } from "@/utils/expressions";

export interface CreateProcessExpressionContextOptions {
  values: Record<string, unknown>;
  parameters?: Record<string, ProcessParameter>;
  recordValues?: Record<string, unknown> | null;
  parentFields?: Record<string, Field>;
  session?: Record<string, unknown>;
}

/**
 * Creates a SmartContext for evaluating expressions (Display Logic, ReadOnly Logic)
 * within the context of a Process Definition.
 *
 * It automatically:
 * 1. Maps sibling parameters to field structures (allowing access by dBColumnName)
 * 2. Maps parent fields (allowing access to parent record values by dBColumnName)
 * 3. sets up the context with session and record values
 */
export const createProcessExpressionContext = (options: CreateProcessExpressionContextOptions) => {
  const { values, parameters, recordValues, parentFields, session } = options;

  // 1. Map all parameters to fields structure for smart mapping (dBColumnName -> hqlName)
  const paramFields = parameters
    ? Object.values(parameters).reduce(
        (acc, p) => {
          acc[p.name] = {
            hqlName: p.name,
            columnName: p.dBColumnName,
            column: { dBColumnName: p.dBColumnName },
          } as any;

          if (p.dBColumnName && p.dBColumnName !== p.name) {
            acc[p.dBColumnName] = {
              hqlName: p.name,
              columnName: p.dBColumnName,
              column: { dBColumnName: p.dBColumnName },
            } as any;
          }
          return acc;
        },
        {} as Record<string, any>
      )
    : undefined;

  // 2. Create SmartContext
  return createSmartContext({
    values: values,
    fields: paramFields,
    parentValues: recordValues || {},
    parentFields: parentFields,
    context: { ...(session || {}), ...(recordValues || {}) },
  });
};
