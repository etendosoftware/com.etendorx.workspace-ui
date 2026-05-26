import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { logger } from "@/utils/logger";

/**
 * Evaluates defaultValue expressions for process parameters.
 *
 * This function iterates through parameters that have a `defaultValue` expression
 * and evaluates them against the provided context and current form values.
 * Used when parameters have static options (selector.response) and the API
 * isn't called to provide default values.
 *
 * @param parameters - Record of process parameters to evaluate
 * @param context - Session context (typically from useUserContext)
 * @param currentValues - Current form values
 * @returns Object with evaluated default values keyed by parameter name
 *
 * @example
 * const defaults = evaluateParameterDefaults(parameters, session, formValues);
 * // Returns: { adOrgId: "0", someField: "defaultValue" }
 */
export function evaluateParameterDefaults(
  parameters: Record<string, ProcessParameter>,
  context: Record<string, unknown>,
  currentValues: Record<string, unknown>
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};

  for (const param of Object.values(parameters)) {
    // Skip if no defaultValue expression
    if (!param.defaultValue) continue;

    // Multi-record selectors only accept CSV-of-IDs values, never scalar
    // literals like "N" / "Y" that some processes carry as a legacy
    // `defaultValue` expression (e.g. NotPostedDocuments.accounting_status).
    // Classic's OBMultiSelectorItem silently drops such values; we do the
    // same here so the picker starts empty as it does in Classic.
    if (param.reference === FIELD_REFERENCE_CODES.MULTI_SELECTOR.id) continue;

    // Skip if already has a non-empty value in form
    const existingValue = currentValues[param.name];
    if (existingValue !== undefined && existingValue !== null && existingValue !== "") continue;

    try {
      const compiledExpr = compileExpression(param.defaultValue);
      const value = compiledExpr(context, currentValues);

      if (value !== undefined && value !== null && value !== "") {
        defaults[param.name] = value;
        logger.debug(`Evaluated defaultValue for ${param.name}:`, {
          expression: param.defaultValue,
          result: value,
        });
      }
    } catch (error) {
      logger.warn(`Error evaluating defaultValue for ${param.name}:`, param.defaultValue, error);
    }
  }

  return defaults;
}
