import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserContext } from "./useUserContext";
import { useTabContext } from "@/contexts/tab";
import type { Field } from "@workspaceui/etendohookbinder/src/api/types";
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
