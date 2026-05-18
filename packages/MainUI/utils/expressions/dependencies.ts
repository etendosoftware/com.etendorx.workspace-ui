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
 * Maps a token (which could be a DB column name) back to its HQL field name.
 */
const resolveHqlName = (token: string, fields?: Record<string, Field>): string => {
  if (!fields || fields[token]) return token;
  return findHqlNameByDbColumn(token, fields) || token;
};

/**
 * Extracts patterns like @FieldName@ from Classic Etendo expressions.
 */
const extractClassicTokens = (expression: string, fields?: Record<string, Field>): string[] => {
  const matches = expression.match(/@([\w#$]+)@/g) || [];
  return matches
    .map((m) => m.replace(/@/g, ""))
    .filter((token) => !token.startsWith("#") && !token.startsWith("$"))
    .map((token) => resolveHqlName(token, fields));
};

/**
 * Extracts patterns like currentValues.fieldName or currentValues["fieldName"].
 */
const extractJsAccessors = (expression: string): string[] => {
  const matches = expression.match(/currentValues(?:\[\s*['"]|(?:\.))(\w+)(?:['"]\s*\])?/g) || [];
  const results: string[] = [];
  for (const match of matches) {
    const fieldNameMatch = match.match(/currentValues(?:\[\s*['"]|(?:\.))(\w+)/);
    if (fieldNameMatch?.[1]) results.push(fieldNameMatch[1]);
  }
  return results;
};

/**
 * Extracts patterns like OB.Utilities.getValue(currentValues, 'fieldName').
 */
const extractObUtilityAccessors = (expression: string): string[] => {
  const matches = expression.match(/getValue\(\s*[\w#$]+\s*,\s*['"]([\w#$]+)['"]\s*\)/gi) || [];
  const results: string[] = [];
  for (const match of matches) {
    const fieldNameMatch = match.match(/getValue\(\s*[\w#$]+\s*,\s*['"]([\w#$]+)['"]\s*\)/i);
    if (fieldNameMatch?.[1]) results.push(fieldNameMatch[1]);
  }
  return results;
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
  if (!expression || typeof expression !== "string") return [];

  const dependencies = new Set<string>([
    ...extractClassicTokens(expression, fields),
    ...extractJsAccessors(expression),
    ...extractObUtilityAccessors(expression),
  ]);

  // Ensure all extracted dependencies are resolved to HQL names if possible
  const finalDependencies = new Set<string>();
  for (const dep of dependencies) {
    finalDependencies.add(resolveHqlName(dep, fields));
  }

  return Array.from(finalDependencies);
};
