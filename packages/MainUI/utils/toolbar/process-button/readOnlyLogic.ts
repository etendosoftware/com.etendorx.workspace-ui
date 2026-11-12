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
import type { EvaluationContext } from "@/utils/evaluation/buildEvaluationContext";
import { logger } from "@/utils/logger";
import { toClassicBoolean } from "@/utils/toClassicBoolean";

type SelectedRecord = Record<string, unknown>;
type ReadOnlyLogicButton = Pick<Field, "id" | "columnName" | "readOnlyLogicExpression">;

/**
 * Evaluates the read-only logic of a process button over the selected records, as Classic's
 * `OBToolbarActionButton.updateState` does: the button is read-only when the logic is true for ANY of them.
 * A logic that cannot be evaluated makes the button read-only, like a form field with a failing logic.
 *
 * @param button - The process button field
 * @param records - The selected records
 * @param contextForRecord - Builds the evaluation context of a record (the same one display logic uses)
 * @param windowId - AD window id, to resolve window-scoped preferences
 * @returns `true` when the button must be shown disabled
 */
export const isProcessButtonReadOnly = (
  button: ReadOnlyLogicButton,
  records: SelectedRecord[],
  contextForRecord: (record: SelectedRecord) => EvaluationContext,
  windowId?: string
): boolean => {
  if (!button.readOnlyLogicExpression) return false;
  const compiledExpr = compileExpression(button.readOnlyLogicExpression);
  try {
    return records.some((record) => {
      const context = contextForRecord(record);
      return toClassicBoolean(compiledExpr(context, context, windowId));
    });
  } catch (error) {
    logger.warn(`Error evaluating readOnlyLogic for ${button.columnName}:`, error);
    return true;
  }
};

/**
 * Collects the ids of the process buttons whose read-only logic is true for the selected records.
 *
 * @param buttons - The visible process buttons
 * @param records - The selected records
 * @param contextForRecord - Builds the evaluation context of a record
 * @param windowId - AD window id, to resolve window-scoped preferences
 * @returns The ids of the read-only buttons
 */
export const collectReadOnlyButtonIds = (
  buttons: ReadOnlyLogicButton[],
  records: SelectedRecord[],
  contextForRecord: (record: SelectedRecord) => EvaluationContext,
  windowId?: string
): Set<string> =>
  new Set(
    buttons
      .filter((button) => isProcessButtonReadOnly(button, records, contextForRecord, windowId))
      .map((button) => button.id)
  );
