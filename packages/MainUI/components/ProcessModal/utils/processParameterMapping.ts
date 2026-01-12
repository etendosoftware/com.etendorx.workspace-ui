import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";

/**
 * Utility to map form values (using parameter names) to context values (using DB column names)
 * and vice-versa. This ensures the DSL (which uses DB column names) can interact
 * with the form (which uses parameter names).
 */

/**
 * Maps form values to context values using DB column names
 * @param formValues - Dictionary of form values where keys are parameter names
 * @param parameters - Dictionary of process parameters
 * @returns Dictionary of values where keys are DB column names (where applicable)
 */
export const mapFormValuesToContext = (
  formValues: Record<string, unknown>,
  parameters: Record<string, ProcessParameter>
): Record<string, unknown> => {
  const context: Record<string, unknown> = {};
  const paramsList = Object.values(parameters);

  // Create a map of name -> dbColumnName for faster lookups
  const nameToDbMap = new Map<string, string>();
  for (const param of paramsList) {
    if (param.name && param.dBColumnName && param.name !== param.dBColumnName) {
      nameToDbMap.set(param.name, param.dBColumnName);
    }
  }

  for (const [key, value] of Object.entries(formValues)) {
    // 1. Try to map using parameter name
    const dbColumnName = nameToDbMap.get(key);

    // Use mapped name if available, otherwise keep original key
    // This preserves keys that don't match parameters (like internal flags)
    // AND keys where name == dBColumnName
    const contextKey = dbColumnName || key;
    context[contextKey] = value;

    // Also include the original key if it was mapped, just in case DSL expects the name
    if (dbColumnName && contextKey !== key) {
      context[key] = value;
    }
  }

  return context;
};

/**
 * Maps DSL result updates (DB column names) to form field names
 * @param updates - Dictionary of updates where keys are DB column names
 * @param parameters - Dictionary of process parameters
 * @returns Dictionary of updates where keys are form field names
 */
export const mapUpdatesToFormFields = (
  updates: Record<string, unknown>,
  parameters: Record<string, ProcessParameter>
): Record<string, unknown> => {
  const formUpdates: Record<string, unknown> = {};
  const paramsList = Object.values(parameters);

  // Create a map of dbColumnName -> name
  const dbToNameMap = new Map<string, string>();

  // Also map common variations that DSL might output
  for (const param of paramsList) {
    if (!param.name) continue;

    // Map DB Column Name -> Name
    if (param.dBColumnName) {
      dbToNameMap.set(param.dBColumnName, param.name);
      // Also lowercase version of db column
      dbToNameMap.set(param.dBColumnName.toLowerCase(), param.name);
    }

    // Map Name itself (if DSL outputs Name) -> Name
    dbToNameMap.set(param.name, param.name);

    // Map common variations to Name
    // e.g. "AmountInvOrds" -> "Amount on Invoices..."
    // This relies on the fact that we can't easily guess the variation,
    // but we can try to match if the DSL outputs exact matches of what it thinks the key is.
    // But the robust way is relying on dBColumnName.
  }

  for (const [key, value] of Object.entries(updates)) {
    // Try to find the parameter name for this key
    // 1. Direct lookup in map (matches dbColumnName or name)
    let formFieldName = dbToNameMap.get(key);

    // 2. If not found, try case-insensitive match against dbColumnNames if exact match failed
    if (!formFieldName) {
      const lowerKey = key.toLowerCase();
      formFieldName = dbToNameMap.get(lowerKey);
    }

    if (formFieldName) {
      formUpdates[formFieldName] = value;
      // ALSO keep the original key (dbColumnName) if it's different
      // This is CRITICAL for Display Logic expressions that might reference the DB name
      if (formFieldName !== key) {
        formUpdates[key] = value;
      }
    } else {
      // If no mapping found, pass it through
      // This might be an internal field or already correct
      formUpdates[key] = value;
    }
  }

  return formUpdates;
};

/**
 * Finds the DB Column Name for a given field name (trigger field)
 * @param fieldName - The name of the field that changed
 * @param parameters - Dictionary of process parameters
 * @returns The DB Column Name if found, otherwise the original field name
 */
export const getDbColumnName = (fieldName: string, parameters: Record<string, ProcessParameter>): string => {
  const paramsList = Object.values(parameters);
  const param = paramsList.find((p) => p.name === fieldName);
  return param?.dBColumnName || fieldName;
};
