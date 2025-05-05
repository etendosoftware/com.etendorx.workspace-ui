import { compileExpression } from '@/components/Form/FormView/selectors/BaseSelector';
import { useUserContext } from './useUserContext';
import { useTabContext } from '@/contexts/tab';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo } from 'react';
import { useSelected } from '@/contexts/selected';

export default function useDisplayLogic(field: Field) {
  const { session } = useUserContext();
  const { selected } = useSelected();
  const { tab } = useTabContext();

  const isDisplayed: boolean = useMemo(() => {
    if (!tab) {
      return false;
    }

    if (!field.displayed) return false;

    if (!field.displayLogicExpression) return true;

    const compiledExpr = compileExpression(field.displayLogicExpression);

    try {
      const values = selected[tab.id];
      return compiledExpr(session, values);
    } catch (error) {
      return true;
    }
  }, [tab, selected, field, session]);

  return isDisplayed;
}
