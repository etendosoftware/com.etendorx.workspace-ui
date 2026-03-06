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

  // Find all tokens shaped like @Token_Name@
  const matches = expression.match(/@([a-zA-Z0-9_#$]+)@/g);
  if (!matches || matches.length === 0) {
    return [];
  }

  const extractedNames = matches.map((match) => match.replace(/@/g, ""));
  const dependencies = new Set<string>();

  for (const token of extractedNames) {
    // 1. Skip basic context variables (#, $) as they are not form fields
    if (token.startsWith("#") || token.startsWith("$")) {
      continue;
    }

    // 2. Direct match with HQL name (highest priority)
    if (fields?.[token]) {
      dependencies.add(token);
      continue;
    }

    // 3. Map DB Column Name to HQL Name if fields metadata is available
    if (fields) {
      const hqlName = findHqlNameByDbColumn(token, fields);
      dependencies.add(hqlName || token);
    } else {
      dependencies.add(token);
    }
  }

  return Array.from(dependencies);
};
