import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserStore } from "@/stores/userStore";
import { useTabContext } from "@/contexts/tab";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { logger } from "@/utils/logger";
import { getEvaluationContext } from "@/utils/evaluation/sharedEvaluationContext";
import { useExpressionDependencies } from "./useExpressionDependencies";
import { toClassicBoolean } from "@/utils/toClassicBoolean";

interface UseDisplayLogicProps {
  field: Field;
  values?: any;
}

export default function useDisplayLogic({ field, values }: UseDisplayLogicProps) {
  const session = useUserStore((s) => s.session);
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

      // Same context as building it from { ...record, ...definedFormValues, ...values }, shared with the
      // other fields of the form that resolve to the same values.
      const smartContext = getEvaluationContext(
        {
          values: record || undefined,
          fields: tab.fields,
          auxiliaryInputs,
          parentValues: parentRecord || undefined,
          parentFields: parentTab?.fields,
          context: session,
          windowId: tab.window,
        },
        { ...definedFormValues, ...values }
      );

      return toClassicBoolean(compiledExpr(smartContext, smartContext, tab.window));
    } catch (error) {
      console.error(`[DisplayLogic Error] Field: ${field.name}`, error);
      logger.error("Unexpected error", error);
      return false;
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
