import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import { logger } from "@/utils/logger";

// Matches SQL expression patterns like: @SQL=SELECT ... or plain SELECT ...
const SQL_EXPRESSION_RE = /^(@SQL=|SELECT\s)/i;

/**
 * Returns today's date as ISO string (YYYY-MM-DD).
 */
function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converts a Classic column name like C_BPartner_ID to its inp-prefixed form
 * used in the process payload (e.g. inpcBPartnerId).
 * Mirrors Classic's Sqlc.TransformaNombreColumna: strips underscores and
 * capitalises the first letter after each underscore, then lowercases the
 * first character of the whole result before prepending "inp".
 */
function columnNameToInpKey(columnName: string): string {
  const camel = columnName
    .split("_")
    .map((seg, i) => (i === 0 ? seg.toLowerCase() : seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase()))
    .join("");
  return `inp${camel}`;
}

/**
 * Evaluates simple Etendo system-variable expressions that the backend
 * DefaultsProcessActionHandler may not return for every parameter.
 *
 * Handles:
 *   @#Date@          → today in YYYY-MM-DD (ISO date for HTML date inputs)
 *   @#AD_Org_ID@     → current org ID from session context
 *   @#AD_Client_ID@  → current client ID from session context
 *   @#AD_User_ID@    → current user ID from session context
 *   @C_BPartner_ID@  → resolved from currentValues using inp-key lookup
 *
 * Returns undefined for expressions it cannot resolve (SQL, unknown variables).
 */
function evaluateSystemExpression(
  expr: string,
  context: Record<string, unknown>,
  currentValues: Record<string, unknown>
): unknown {
  const trimmed = expr.trim();

  // SQL expressions can only be evaluated server-side — skip them
  if (SQL_EXPRESSION_RE.test(trimmed)) return undefined;

  // Well-known system-date variable
  if (trimmed === "@#Date@") return todayISO();

  // Single-token variable: @#VARNAME@ (session) or @COLUMN_NAME@ (parent record field)
  const singleToken = /^@(#?[A-Za-z_]\w*)@$/.exec(trimmed);
  if (singleToken) {
    const key = singleToken[1];

    if (key.startsWith("#")) {
      // Session variable: look up in context
      const val = context[key] ?? context[key.slice(1)];
      if (val !== undefined && val !== null && val !== "") return val;
    } else {
      // Parent record field reference (e.g. C_BPartner_ID):
      // currentValues already has inp* keys built by buildProcessPayload.
      const inpKey = columnNameToInpKey(key);
      const val = currentValues[inpKey] ?? currentValues[inpKey.toLowerCase()] ?? currentValues[key];
      if (val !== undefined && val !== null && val !== "") return val;
    }
  }

  return undefined;
}

/**
 * Builds an enriched context that always includes common system variables
 * so that expressions like @#Date@ resolve correctly even when the session
 * object does not include them.
 */
function buildEnrichedContext(context: Record<string, unknown>): Record<string, unknown> {
  const today = todayISO();
  return {
    // Inject #Date as today's date if not already set
    "#Date": today,
    "#CurrentDate": today,
    ...context,
  };
}

/**
 * Evaluates defaultValue expressions for process parameters.
 *
 * This function iterates through parameters that have a `defaultValue` expression
 * and evaluates them against the provided context and current form values.
 * Used when parameters have static options (selector.response) and the API
 * isn't called to provide default values.
 *
 * @param parameters - Record of process parameters to evaluate
 * @param context - Session context (typically from useUserStore)
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
  const enrichedContext = buildEnrichedContext(context);

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

    const expr = param.defaultValue;

    // Fast path: try to resolve simple system-variable expressions first,
    // before spinning up the JS compiler (cheaper and avoids parse errors for SQL).
    const systemValue = evaluateSystemExpression(expr, enrichedContext, currentValues);
    if (systemValue !== undefined) {
      defaults[param.name] = systemValue;
      logger.debug(`Evaluated system expression for ${param.name}:`, { expression: expr, result: systemValue });
      continue;
    }

    // Skip SQL expressions — they require server-side evaluation
    if (SQL_EXPRESSION_RE.test(expr.trim())) {
      logger.debug(`Skipping SQL defaultValue for ${param.name} (server-side only):`, expr);
      continue;
    }

    try {
      const compiledExpr = compileExpression(expr);
      const value = compiledExpr(enrichedContext, currentValues);

      if (value !== undefined && value !== null && value !== "") {
        defaults[param.name] = value;
        logger.debug(`Evaluated defaultValue for ${param.name}:`, {
          expression: expr,
          result: value,
        });
      }
    } catch (error) {
      logger.warn(`Error evaluating defaultValue for ${param.name}:`, expr, error);
    }
  }

  return defaults;
}
