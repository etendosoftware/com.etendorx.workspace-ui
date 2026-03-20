import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserContext } from "./useUserContext";
import { useTabContext } from "@/contexts/tab";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { logger } from "@/utils/logger";
import { createSmartContext } from "@/utils/expressions";
import { useExpressionDependencies } from "./useExpressionDependencies";

interface UseDisplayLogicProps {
  field: Field;
  values?: any;
}

export default function useDisplayLogic({ field, values }: UseDisplayLogicProps) {
  const { session } = useUserContext();
  const { tab, record, parentRecord, parentTab, auxiliaryInputs } = useTabContext();

  const formValues = useExpressionDependencies(field.displayLogicExpression);

  const isDisplayed: boolean = useMemo(() => {
    if (!tab) {
      return false;
    }

    if (!field.displayed) return false;

    if (!field.displayLogicExpression) return true;

    const compiledExpr = compileExpression(field.displayLogicExpression);

    try {
      // Filter out undefined values from formValues to avoid overriding valid record values.
      // useWatch returns undefined for fields not yet registered or not yet initialized in RHF,
      // which would otherwise shadow the actual boolean values (false) from the record.
      const definedFormValues = Object.fromEntries(Object.entries(formValues || {}).filter(([, v]) => v !== undefined));
      const currentValues = { ...record, ...definedFormValues, ...values };

      const smartContext = createSmartContext({
        values: currentValues,
        fields: tab.fields,
        auxiliaryInputs,
        parentValues: parentRecord || undefined,
        parentFields: parentTab?.fields,
        context: session,
      });

      return compiledExpr(smartContext, smartContext);
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
    auxiliaryInputs,
  ]);

  return isDisplayed;
}
