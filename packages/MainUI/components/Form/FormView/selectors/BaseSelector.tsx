import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, FormInitializationResponse, FormMode } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallout } from '@/hooks/useCallout';
import { logger } from '@/utils/logger';
import { GenericSelector } from './GenericSelector';
import { buildPayloadByInputName, parseDynamicExpression } from '@/utils';
import Label from '../Label';
import { useUserContext } from '@/hooks/useUserContext';
import { useParams } from 'next/navigation';
import { getFieldsByColumnName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { useParentTabContext } from '@/contexts/tab';

const compileExpression = (expression: string) => {
  try {
    return new Function('context', 'currentValues', `return ${parseDynamicExpression(expression)};`);
  } catch (error) {
    logger.error('Error compiling expression:', expression, error);

    return () => true;
  }
};

const BaseSelectorComp = ({ field, formMode = FormMode.EDIT }: { field: Field; formMode?: FormMode }) => {
  const { watch, getValues, setValue, register } = useFormContext();
  const { tab } = useParentTabContext();
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);
  const { recordId } = useParams<{ recordId: string }>();
  const { session } = useUserContext();
  const executeCallout = useCallout({ field, rowId: recordId });
  const value = watch(field.hqlName);
  const valueTracking = useRef(value);
  const values = watch();
  const ready = useRef(false);
  const fieldsByHqlName = useMemo(() => tab?.fields || {}, [tab?.fields]);

  const isDisplayed = useMemo(() => {
    if (!field.displayed) return false;
    if (!field.displayLogicExpression) return true;

    const compiledExpr = compileExpression(field.displayLogicExpression);

    try {
      return compiledExpr(session, values);
    } catch (error) {
      logger.warn('Error executing expression:', compiledExpr, error);

      return true;
    }
  }, [field, values, session]);

  const isReadOnly = useMemo(() => {
    if (field.isReadOnly) return true;
    if (!field.isUpdatable) return FormMode.NEW !== formMode;
    if (!field.readOnlyLogicExpression) return false;
    const compiledExpr = compileExpression(field.readOnlyLogicExpression);

    try {
      return compiledExpr(session, values);
    } catch (error) {
      logger.warn('Error executing expression:', compiledExpr, error);

      return true;
    }
  }, [field, formMode, session, values]);

  const applyColumnValues = useCallback(
    (columnValues: FormInitializationResponse['columnValues']) => {
      Object.entries(columnValues ?? {}).forEach(([column, { value, classicValue, identifier }]) => {
        const targetField = fieldsByColumnName[column];
        const isDate = ['15', '16'].includes(targetField?.column?.reference);

        if (targetField) {
          setValue(targetField.hqlName, isDate ? classicValue : value);

          if (identifier) {
            setValue(targetField.hqlName + '$_identifier', identifier);
          }
        } else {
          setValue(column, isDate ? classicValue : value);
        }
      });
    },
    [fieldsByColumnName, setValue],
  );

  const applyAuxiliaryInputValues = useCallback(
    (auxiliaryInputValues: FormInitializationResponse['auxiliaryInputValues']) => {
      Object.entries(auxiliaryInputValues ?? {}).forEach(([column, { value, classicValue }]) => {
        const targetField = fieldsByColumnName[column];
        const isDate = ['15', '16'].includes(targetField?.column?.reference);

        setValue(targetField?.hqlName || column, isDate ? classicValue : value);
      });
    },
    [fieldsByColumnName, setValue],
  );

  const runCallout = useCallback(async () => {
    valueTracking.current = value;

    if (!tab || !field.column.callout) return;

    try {
      const entityKeyColumn = tab.fields['id'].columnName;
      const payload = buildPayloadByInputName(getValues(), fieldsByHqlName);
      const data = await executeCallout({
        ...session,
        ...payload,
        inpKeyName: fieldsByColumnName[entityKeyColumn].inputName,
        inpTabId: tab.id,
        inpTableId: tab.table,
        inpkeyColumnId: entityKeyColumn,
        keyColumnName: entityKeyColumn,
        _entityName: tab.entityName,
        inpwindowId: tab.windowId,
      });

      if (data) {
        applyColumnValues(data.columnValues);
        applyAuxiliaryInputValues(data.auxiliaryInputValues);
      }
    } catch (err) {
      logger.error('Callout execution failed:', err);
    }
  }, [
    applyAuxiliaryInputValues,
    applyColumnValues,
    executeCallout,
    field.column.callout,
    fieldsByColumnName,
    fieldsByHqlName,
    getValues,
    session,
    tab,
    value,
  ]);

  useEffect(() => {
    if (ready.current && valueTracking.current != value) {
      runCallout();
    } else {
      ready.current = true;
    }
  }, [runCallout, value]);

  if (isDisplayed) {
    return (
      <div className="grid grid-cols-3 auto-rows-auto gap-4 items-center" title={field.helpComment}>
        <div className="relative">
          {field.isMandatory && (
            <span className="absolute -top-4 right-0 text-[#DC143C] font-bold" aria-required>
              *
            </span>
          )}
          <Label field={field} />
        </div>
        <div className="col-span-2">
          <GenericSelector field={field} isReadOnly={isReadOnly} />
        </div>
      </div>
    );
  } else {
    return <input type="hidden" {...register(field.hqlName)} />;
  }
};

const BaseSelector = memo(BaseSelectorComp);
export { BaseSelector };
export default BaseSelector;
