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

import { useMemo } from "react";
import { createSmartContext, type EvaluationContext, type EvaluationContextOptions } from "@/utils/expressions";
import { logger } from "@/utils/logger";

/**
 * The evaluation context for display/read-only logic, built once per change of its inputs.
 *
 * Never throws: a failed build returns `null`, and callers apply the same per-field fallback they
 * apply when an expression fails. Calls the builder as `createSmartContext` from `@/utils/expressions`
 * on purpose, so tests that mock that module keep intercepting it.
 *
 * Inputs are compared by identity: pass new objects when their contents change (react-hook-form's
 * watch()/getValues() already do).
 *
 * Phase 2 of ETP-5641 replaces the internals with a layered context; the signature stays.
 */
export function useEvaluationContext(options: EvaluationContextOptions): EvaluationContext | null {
  const {
    values,
    fields,
    parentValues,
    parentFields,
    context,
    auxiliaryInputs,
    normalizeValues,
    defaultValue,
    windowId,
  } = options;

  return useMemo(() => {
    try {
      return createSmartContext({
        values,
        fields,
        parentValues,
        parentFields,
        context,
        auxiliaryInputs,
        normalizeValues,
        defaultValue,
        windowId,
      });
    } catch (error) {
      logger.warn("Error building the expression evaluation context:", error);
      return null;
    }
  }, [values, fields, parentValues, parentFields, context, auxiliaryInputs, normalizeValues, defaultValue, windowId]);
}
