/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { getEvaluationContext } from "@/utils/evaluation/sharedEvaluationContext";
import { logger } from "@/utils/logger";
import { toClassicBoolean } from "@/utils/toClassicBoolean";

/** The record of the parent tab and its fields, which the expressions of a child tab can read as the form does. */
export interface ParentRecordContext {
  values?: Record<string, unknown> | null;
  fields?: Record<string, Field>;
}

/**
 * Evaluates a display or read-only logic expression of a field for the values of a row edited inline.
 *
 * With the fields of the tab it builds the same context as the form view: the expressions name the columns
 * (`@Financial_Invoice_Line@`) while the row stores its values by property name, and only that context resolves
 * both. Without them the row values are used as they are.
 */
const evaluateRowLogic = (
  expression: string,
  rowValues: Record<string, unknown>,
  session: Record<string, unknown> | undefined,
  windowId: string | undefined,
  tabFields: Record<string, Field> | undefined,
  parent?: ParentRecordContext
): boolean => {
  const compiled = compileExpression(expression);
  if (!tabFields) {
    return Boolean(compiled(session || {}, rowValues, windowId));
  }
  const context = getEvaluationContext({
    values: rowValues,
    fields: tabFields,
    parentValues: parent?.values || undefined,
    parentFields: parent?.fields,
    context: session,
    windowId,
  });
  return toClassicBoolean(compiled(context, context, windowId));
};

/**
 * Whether the field's display logic hides it for these row values. A hidden field is neither
 * editable nor required in the grid, as in the form view. An expression that fails to evaluate
 * keeps the field visible.
 */
export const isHiddenByDisplayLogic = (
  field: Pick<Field, "displayLogicExpression" | "name">,
  rowValues: Record<string, unknown>,
  session?: Record<string, unknown>,
  windowId?: string,
  tabFields?: Record<string, Field>,
  parent?: ParentRecordContext
): boolean => {
  if (!field.displayLogicExpression) return false;
  try {
    return !evaluateRowLogic(field.displayLogicExpression, rowValues, session, windowId, tabFields, parent);
  } catch (error) {
    logger.warn(`Error evaluating displayLogicExpression for field ${field.name}:`, error);
    return false;
  }
};

/** Whether a field is read-only in inline editing, for these row values. */
export const isFieldReadOnly = (
  field: Field,
  isNewRow = false,
  rowValues?: Record<string, unknown>,
  session?: Record<string, unknown>,
  windowId?: string,
  tabFields?: Record<string, Field>,
  parent?: ParentRecordContext
): boolean => {
  // Field explicitly marked as readonly
  if (field.isReadOnly) return true;

  // Field not updatable (readonly except for new rows)
  if (!field.isUpdatable && !isNewRow) return true;

  if (rowValues && isHiddenByDisplayLogic(field, rowValues, session, windowId, tabFields, parent)) return true;

  // Evaluate readOnlyLogicExpression if present
  if (field.readOnlyLogicExpression && rowValues) {
    try {
      return evaluateRowLogic(field.readOnlyLogicExpression, rowValues, session, windowId, tabFields, parent);
    } catch (error) {
      logger.warn(`Error evaluating readOnlyLogicExpression for field ${field.name}:`, error);
      // On error, default to readonly for safety
      return true;
    }
  }

  return false;
};
