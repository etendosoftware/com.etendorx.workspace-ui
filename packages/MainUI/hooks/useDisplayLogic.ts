/* eslint-disable @typescript-eslint/no-explicit-any */
import { compileExpression } from '@/components/Form/FormView/selectors/BaseSelector';
import { useUserContext } from './useUserContext';
import { useMetadataContext } from './useMetadataContext';
import { useTabContext } from '@/contexts/tab';
import { useMemo } from 'react';

export default function useDisplayLogic(field: any) {
  const { session } = useUserContext();
  const { selected } = useMetadataContext();
  const { tab } = useTabContext();

  const isDisplayed: boolean = useMemo(() => {
    if (!tab) {
      return false;
    }

    if (!field.displayed) return false;

    if (!field.displayLogicExpression) return true;

    const compiledExpr = compileExpression(field.displayLogicExpression);

    try {
      const values = selected[tab.level];
      return compiledExpr(session, values);
    } catch (error) {
      return true;
    }
  }, [tab, selected, field, session]);

  return isDisplayed;
}
