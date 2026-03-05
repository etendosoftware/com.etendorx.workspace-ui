import type { Field } from "@workspaceui/api-client/src/api/types";

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

  extractedNames.forEach((token) => {
    // Basic context variables (#, $) are not form fields, they come from session/prefs
    if (token.startsWith("#") || token.startsWith("$")) {
      return;
    }

    // Direct match with HQL name
    if (fields && fields[token]) {
      dependencies.add(token);
      return;
    }

    // Map DB Column Name to HQL Name
    if (fields) {
      const lowerToken = token.toLowerCase();
      const normalizedToken = lowerToken.replace(/_/g, "");

      let foundMatch = false;

      for (const field of Object.values(fields)) {
        const dbCol = field.column?.dBColumnName || field.columnName;
        const hqlName = field.hqlName;

        if (dbCol && hqlName) {
          const lowerDbCol = dbCol.toLowerCase();

          if (lowerDbCol === lowerToken || lowerDbCol.replace(/_/g, "") === normalizedToken) {
            dependencies.add(hqlName);
            foundMatch = true;
            break; // Stop looking if we mapped this token
          }
        }
      }

      if (!foundMatch) {
        // If we couldn't map it, it could be a parent's field or a literal we don't know about.
        // We add the raw token just in case there's an exact form field match.
        dependencies.add(token);
      }
    } else {
      dependencies.add(token);
    }
  });

  return Array.from(dependencies);
};
