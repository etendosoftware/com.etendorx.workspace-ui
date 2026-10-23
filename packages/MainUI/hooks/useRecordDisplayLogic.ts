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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import { useCallback } from "react";
import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useTabContext } from "@/contexts/tab";
import { useUserStore } from "@/stores/userStore";
import { getEvaluationContext } from "@/utils/evaluation/sharedEvaluationContext";
import { toClassicBoolean } from "@/utils/toClassicBoolean";
import { logger } from "@/utils/logger";

/**
 * Tells whether a field's display logic holds for the record being edited, from the record as it was
 * loaded. Unlike `useDisplayLogic` it needs no form (no react-hook-form context), so it can be used by
 * the toolbar, which sits outside the form; values changed in the form but not saved are not considered.
 *
 * @returns a function giving true or false for a field with display logic, and true for one without
 */
export function useRecordDisplayLogic(): (field: Field) => boolean {
  const session = useUserStore((s) => s.session);
  const { tab, record, parentRecord, parentTab, auxiliaryInputs } = useTabContext();

  return useCallback(
    (field: Field) => {
      if (!field.displayLogicExpression || !tab) {
        return true;
      }
      try {
        const context = getEvaluationContext(
          {
            values: record || undefined,
            fields: tab.fields,
            auxiliaryInputs,
            parentValues: parentRecord || undefined,
            parentFields: parentTab?.fields,
            context: session,
            windowId: tab.window,
          },
          {}
        );
        return toClassicBoolean(compileExpression(field.displayLogicExpression)(context, context, tab.window));
      } catch (error) {
        logger.warn("[useRecordDisplayLogic] Could not evaluate the display logic of", field.name, error);
        return true;
      }
    },
    [tab, record, parentRecord, parentTab, auxiliaryInputs, session]
  );
}

export default useRecordDisplayLogic;
