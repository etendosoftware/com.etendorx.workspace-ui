import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallout } from '@/hooks/useCallout';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { logger } from '@/utils/logger';
import { GenericSelector } from './GenericSelector';
import { buildPayloadByInputName, parseDynamicExpression } from '@/utils';
import Label from '../Label';
import { useUserContext } from '@/hooks/useUserContext';

const compileExpression = (expression: string) => {
  try {
    return new Function('context', 'currentValues', `return ${parseDynamicExpression(expression)};`);
  } catch (error) {
    logger.warn('Error compiling expression:', expression, error);

    return () => true;
  }
};

export const BaseSelector = ({ field }: { field: Field }) => {
  const { watch, getValues, setValue } = useFormContext();
  const { fieldsByColumnName, fieldsByHqlName, tab } = useMetadataContext();
  const { session } = useUserContext();
  const executeCallout = useCallout({ field });
  const value = watch(field.hqlName);
  const ready = useRef(false);

  const isDisplayed = useMemo(() => {
    if (!tab || !field.displayLogicExpression) return true;

    const compiledExpr = compileExpression(field.displayLogicExpression);
    const currentValues = getValues();

    try {
      return compiledExpr(session, currentValues);
    } catch (error) {
      logger.warn('Error executing expression:', compiledExpr, error);

      return true;
    }
  }, [field, session, tab, getValues]);

  const isReadyOnly = useMemo(() => {
    if (!tab || !field.readOnlyLogicExpression) return true;

    const compiledExpr = compileExpression(field.readOnlyLogicExpression);
    const currentValues = getValues();

    try {
      return compiledExpr(session, currentValues);
    } catch (error) {
      logger.warn('Error executing expression:', compiledExpr, error);

      return true;
    }
  }, [field, session, tab, getValues]);

  const applyColumnValues = useCallback(
    (columnValues: FormInitializationResponse['columnValues']) => {
      Object.entries(columnValues ?? {}).forEach(([column, { value, classicValue }]) => {
        const targetField = fieldsByColumnName[column];
        const isDate = ['15', '16'].includes(targetField?.column?.reference);

        setValue(targetField?.hqlName || column, isDate ? classicValue : value);
      });
    },
    [fieldsByColumnName, setValue],
  );

  const runCallout = useCallback(async () => {
    if (!field.column.callout) return;

    try {
      const payload = buildPayloadByInputName(getValues(), fieldsByHqlName);
      const data = await executeCallout(payload);

      if (data) {
        applyColumnValues(data.columnValues);
      }
    } catch (err) {
      logger.error('Callout execution failed:', err);
    }
  }, [field, executeCallout, getValues, fieldsByHqlName, applyColumnValues]);

  useEffect(() => {
    if (ready.current) {
      runCallout();
    } else {
      ready.current = true;
    }
  }, [runCallout, value]);

  if (isDisplayed) {
    return (
      <div className="grid grid-cols-3 auto-rows-auto gap-4 items-center">
        <Label field={field} />
        <div className="col-span-2">{isReadyOnly ? null : <GenericSelector field={field} />}</div>
      </div>
    );
  }

  return null;
};
