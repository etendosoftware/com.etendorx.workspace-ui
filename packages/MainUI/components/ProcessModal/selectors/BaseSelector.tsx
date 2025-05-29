import Label from '@/components/Label';
import GenericSelector from './GenericSelector';
import type { ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';
import { useMemo } from 'react';
import { useUserContext } from '@/hooks/useUserContext';
import { compileExpression } from '@/components/Form/FormView/selectors/BaseSelector';
import { useForm } from 'react-hook-form';
import { logger } from '@/utils/logger';

const BaseSelector = ({ parameter }: { parameter: ProcessParameter }) => {
  const { session } = useUserContext();
  const { getValues } = useForm();

  const isReadOnly = useMemo(() => {
    if (!parameter.readOnlyLogicExpression) return false;
    const compiledExpr = compileExpression(parameter.readOnlyLogicExpression);

    try {
      return compiledExpr(session, getValues());
    } catch (error) {
      logger.warn('Error executing expression:', compiledExpr, error);

      return true;
    }
  }, [getValues, parameter.readOnlyLogicExpression, session]);

  return (
    <div className='flex flex-col gap-4 items-start justify-start' title={'description'}>
      <div className='relative pr-2'>
        {parameter.mandatory && (
          <span className='absolute -top-1 right-0 text-[#DC143C] font-bold' aria-required>
            *
          </span>
        )}
        <Label htmlFor={parameter.dBColumnName} name={parameter.name} />
      </div>
      <div className='w-full pb-8'>
        <GenericSelector parameter={parameter} readOnly={isReadOnly} />
      </div>
    </div>
  );
};

export default BaseSelector;
