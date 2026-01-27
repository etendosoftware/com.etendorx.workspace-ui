import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserContext } from "./useUserContext";
import { useTabContext } from "@/contexts/tab";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { logger } from "@/utils/logger";
import { createSmartContext } from "@/utils/expressions";

interface UseDisplayLogicProps {
  field: Field;
  values?: any; // Changed from Field to any/Record to be safer with spread, though original was Field
}

export default function useDisplayLogic({ field, values }: UseDisplayLogicProps) {
  const { session } = useUserContext();
  const { tab, record, parentRecord, parentTab } = useTabContext();

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
      const currentValues = { ...record, ...formValues, ...values };

      const smartContext = createSmartContext({
        values: currentValues,
        fields: tab.fields,
        parentValues: parentRecord || undefined,
        parentFields: parentTab?.fields,
        context: session,
      });

      const result = compiledExpr(smartContext, smartContext);

      return result;
    } catch (error) {
      console.error(`[DisplayLogic Error] Field: ${field.name}`, error);
      return logger.error("Unexpected error", error);
    }
  }, [
    field.displayLogicExpression,
    field.displayed,
    field.name,
    formValues,
    record,
    session,
    tab,
    values,
    parentRecord,
    parentTab,
  ]);

  return isDisplayed;
}
