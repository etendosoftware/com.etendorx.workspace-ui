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

      // DEBUG: Tax Category display logic
      if (field.name?.toLowerCase().includes("tax") || field.hqlName?.toLowerCase().includes("tax")) {
        console.warn(`[DEBUG DisplayLogic] Field: ${field.name} (${field.hqlName})`);
        console.warn(`  Expression: ${field.displayLogicExpression}`);
        console.warn(`  Result: ${result}`);
        console.warn(`  sale (raw):`, currentValues.sale, `type:`, typeof currentValues.sale);
        console.warn(`  purchase (raw):`, currentValues.purchase, `type:`, typeof currentValues.purchase);
        console.warn(`  summaryLevel (raw):`, currentValues.summaryLevel, `type:`, typeof currentValues.summaryLevel);
        console.warn(`  sale (context):`, smartContext.sale, `type:`, typeof smartContext.sale);
        console.warn(`  purchase (context):`, smartContext.purchase, `type:`, typeof smartContext.purchase);
        console.warn(`  summaryLevel (context):`, smartContext.summaryLevel, `type:`, typeof smartContext.summaryLevel);
        console.warn(
          `  record:`,
          JSON.stringify({ sale: record?.sale, purchase: record?.purchase, summaryLevel: record?.summaryLevel })
        );
        console.warn(
          `  formValues:`,
          JSON.stringify({
            sale: formValues?.sale,
            purchase: formValues?.purchase,
            summaryLevel: formValues?.summaryLevel,
          })
        );
      }

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
