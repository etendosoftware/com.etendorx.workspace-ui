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

import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserContext } from "./useUserContext";
import { useTabContext } from "@/contexts/tab";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { logger } from "@/utils/logger";

interface UseDisplayLogicProps {
  field: Field;
  values?: Field;
}

export default function useDisplayLogic({ field, values }: UseDisplayLogicProps) {
  const { session } = useUserContext();
  const { tab, record } = useTabContext();

  const formContext = useFormContext();
  const formValues = formContext?.watch?.();

  const isDisplayed: boolean = useMemo(() => {
    if (!tab) {
      return false;
    }

    if (!field.displayed) return false;

    if (!field.displayLogicExpression) return true;

    const compiledExpr = compileExpression(field.displayLogicExpression);

    try {
      const currentValues = values || formValues || record;
      return compiledExpr(session, currentValues);
    } catch (error) {
      return logger.error("Unexpected error", error);
    }
  }, [field.displayLogicExpression, field.displayed, formValues, record, session, tab, values]);

  return isDisplayed;
}
