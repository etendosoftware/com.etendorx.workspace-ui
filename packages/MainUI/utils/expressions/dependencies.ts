import type { Field } from "@workspaceui/api-client/src/api/types";

/**
 * Finds the HQL property name for a given database column name by searching through field metadata.
 * It handles both exact matches and normalized matches (removing underscores).
 */
const findHqlNameByDbColumn = (token: string, fields: Record<string, Field>): string | null => {
  const lowerToken = token.toLowerCase();
  const normalizedToken = lowerToken.replace(/_/g, "");

  for (const field of Object.values(fields)) {
    const dbCol = field.column?.dBColumnName || field.columnName;
    const hqlName = field.hqlName;

    if (dbCol && hqlName) {
      const lowerDbCol = dbCol.toLowerCase();
      // Match exact lowercase or normalized (no underscores)
      if (lowerDbCol === lowerToken || lowerDbCol.replace(/_/g, "") === normalizedToken) {
        return hqlName;
      }
    }
  }
  return null;
};

/**
 * Extracts dependency field names from an Etendo Classic expression.
 * It looks for variables bounded by `@` (e.g., `@C_BPartner_ID@`, `@#User_Client@`).
 * It maps database column names back to their HQL form names using the provided fields metadata.
 *
 * @param expression The expression string (e.g., from displayLogic or readOnlyLogic)
 * @param fields Record of fields from the current tab metadata
 * @returns Array of unique HQL field names that this expression depends on
 */
export const extractDependenciesFromExpression = (expression?: string, fields?: Record<string, Field>): string[] => {
  if (!expression || typeof expression !== "string") {
    return [];
  }

  const dependencies = new Set<string>();

  // 1. Classic Etendo tokens: @Field_Name@
  const classicMatches = expression.match(/@([a-zA-Z0-9_#$]+)@/g);
  if (classicMatches) {
    for (const match of classicMatches) {
      const token = match.replace(/@/g, "");
      if (token.startsWith("#") || token.startsWith("$")) continue;
      if (fields?.[token]) {
        dependencies.add(token);
      } else if (fields) {
        const hqlName = findHqlNameByDbColumn(token, fields);
        dependencies.add(hqlName || token);
      } else {
        dependencies.add(token);
      }
    }
  }

  // 2. JavaScript Direct Accessors: currentValues.fieldName or currentValues["fieldName"]
  const jsDirectMatches = expression.match(/currentValues(?:\[\s*['"]|(?:\.))([a-zA-Z0-9_]+)(?:['"]\s*\])?/g);
  if (jsDirectMatches) {
    for (const match of jsDirectMatches) {
      const fieldNameMatch = match.match(/currentValues(?:\[\s*['"]|(?:\.))([a-zA-Z0-9_]+)/);
      if (fieldNameMatch?.[1]) {
        dependencies.add(fieldNameMatch[1]);
      }
    }
  }

  // 3. OB/Etendo Utility: OB.Utilities.getValue(currentValues, 'fieldName')
  const obMatches = expression.match(/getValue\(\s*currentValues\s*,\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g);
  if (obMatches) {
    for (const match of obMatches) {
      const fieldNameMatch = match.match(/getValue\(\s*currentValues\s*,\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/);
      if (fieldNameMatch?.[1]) {
        dependencies.add(fieldNameMatch[1]);
      }
    }
  }

  // Map any found dependencies back to HQL names if they were DB columns
  const finalDependencies = new Set<string>();
  for (const token of dependencies) {
    if (fields?.[token]) {
      finalDependencies.add(token);
    } else if (fields) {
      const hqlName = findHqlNameByDbColumn(token, fields);
      finalDependencies.add(hqlName || token);
    } else {
      finalDependencies.add(token);
    }
  }

  return Array.from(finalDependencies);
};
