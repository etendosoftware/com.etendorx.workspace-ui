import { compileExpression } from "@/components/Form/FormView/selectors/BaseSelector";
import { useUserContext } from "./useUserContext";
import { useTabContext } from "@/contexts/tab";
import type { Field } from "@workspaceui/etendohookbinder/src/api/types";
import { useMemo } from "react";

export default function useDisplayLogic(field: Field) {
  const { session } = useUserContext();
  const { tab, record } = useTabContext();

  const isDisplayed: boolean = useMemo(() => {
    if (!tab) {
      return false;
    }

    if (!field.displayed) return false;

    if (!field.displayLogicExpression) return true;

    const compiledExpr = compileExpression(field.displayLogicExpression);

    try {
      return compiledExpr(session, record);
    } catch (error) {
      return true;
    }
  }, [field.displayLogicExpression, field.displayed, record, session, tab]);

  return isDisplayed;
}
