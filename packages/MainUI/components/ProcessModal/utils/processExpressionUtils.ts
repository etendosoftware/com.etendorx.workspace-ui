import type { ProcessParameter, Field } from "@workspaceui/api-client/src/api/types";
import { createSmartContext } from "@/utils/expressions";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { logger } from "@/utils/logger";

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

export interface IsParameterDisplayedOptions {
  parameter: ProcessParameter;
  /** Merged display/readonly flags (static + callout + script `setDisplayed`). */
  logicFields?: Record<string, boolean>;
  /** Current form values; used as the fail-safe gate before evaluating expressions. */
  values?: Record<string, unknown>;
  /** Prebuilt context from {@link createProcessExpressionContext} for expression evaluation. */
  evaluationContext: ReturnType<typeof createProcessExpressionContext>;
}

/**
 * Resolves whether a process parameter is currently displayed, returning a strict
 * boolean. This is the single source of truth for parameter visibility, shared by
 * the rendered selector (`ProcessParameterSelector`) and the script-facing
 * `item.isVisible()` proxy so both always agree on what the user sees.
 *
 * Precedence (mirrors the rendered selector):
 * 1. Explicit `logicFields[`${name}.display`]` override (script `setDisplayed` /
 *    callout / static defaults) wins.
 * 2. The parameter's own `displayLogic` expression, compiled and evaluated.
 * 3. A field with display logic stays HIDDEN until form data exists (fail-safe, so
 *    server-driven fields do not flash on open); fields without display logic are visible.
 *
 * @param options - parameter, merged logic flags, current values and the evaluation context
 * @returns true when the parameter must be visible
 */
export const isParameterDisplayed = ({
  parameter,
  logicFields,
  values,
  evaluationContext,
}: IsParameterDisplayedOptions): boolean => {
  // 1. Process defaults / script override takes precedence.
  const displayOverride = logicFields?.[`${parameter.name}.display`];
  if (displayOverride !== undefined) {
    return Boolean(displayOverride);
  }

  // 2. Fall back to the parameter's own display logic.
  if (!parameter.displayLogic) return true;

  // Skip compilation if display logic looks like a bare field name (malformed).
  if (parameter.displayLogic.includes("_logic") && !parameter.displayLogic.includes("@")) {
    logger.warn("Invalid display logic expression - looks like field name:", parameter.displayLogic);
    return true; // Default to visible for malformed expressions.
  }

  // 3. Fail-safe: a field gated by display logic stays hidden until its logic can be
  // evaluated, so server-driven fields do not flash visible on open.
  if (!values || Object.keys(values).length === 0) {
    return false;
  }

  try {
    const compiledExpr = compileExpression(parameter.displayLogic);
    return Boolean(compiledExpr(evaluationContext, evaluationContext));
  } catch (error) {
    logger.warn("Error executing display logic expression:", parameter.displayLogic, error);
    return true; // Default to visible on error.
  }
};
