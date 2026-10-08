import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserStore } from "@/stores/userStore";
import { useTabContext } from "@/contexts/tab";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useMemo } from "react";
import { logger } from "@/utils/logger";
import { createSmartContext } from "@/utils/expressions";
import { useExpressionDependencies } from "./useExpressionDependencies";
import { toClassicBoolean } from "@/utils/toClassicBoolean";
import { mergeDefinedValues } from "@/utils/expressions/mergeLiveValues";

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
      // Undefined form values are skipped so they don't shadow valid record values (see mergeDefinedValues).
      const currentValues = { ...mergeDefinedValues(record, formValues), ...values };

      const smartContext = createSmartContext({
        values: currentValues,
        fields: tab.fields,
        auxiliaryInputs,
        parentValues: parentRecord || undefined,
        parentFields: parentTab?.fields,
        context: session,
        windowId: tab.window,
      });

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
