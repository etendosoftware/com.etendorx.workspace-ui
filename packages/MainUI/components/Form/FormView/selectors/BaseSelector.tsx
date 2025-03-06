import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallout } from '@/hooks/useCallout';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { logger } from '@/utils/logger';
import { GenericSelector } from './GenericSelector';
import { buildPayloadByInputName } from '@/utils';

export const BaseSelector = ({ field }: { field: Field }) => {
  const { watch, getValues, setValue } = useFormContext();
  const { fieldsByColumnName, fieldsByHqlName } = useMetadataContext();
  const executeCallout = useCallout({ field });
  const value = watch(field.hqlName);
  const ready = useRef(false);

  const isDisplayed = useMemo(() => {
    return true;
  }, []);

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
      <div className="flex flex-col gap-2">
        <label htmlFor={field.hqlName} className="block text-sm font-medium text-gray-700">
          {field.name}
        </label>
        <div className="col-span-2">
          <GenericSelector field={field} />
        </div>
      </div>
    );
  }

  return null;
};
