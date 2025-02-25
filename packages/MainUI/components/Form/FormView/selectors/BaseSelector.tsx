import { useCallback, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, FormInitializationResponse } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallout } from '@/hooks/useCallout';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { logger } from '@/utils/logger';
import { GenericSelector } from './GenericSelector';
import { buildCalloutPayload } from '@/utils';

export const BaseSelector = ({ field }: { field: Field }) => {
  const { watch, getValues, setValue } = useFormContext();
  const { fieldsByColumnName, fieldsByHqlName } = useMetadataContext();
  const executeCallout = useCallout({ field });
  const value = watch(field.hqlName);
  const ready = useRef(false);

  const applyColumnValues = useCallback(
    (columnValues: FormInitializationResponse['columnValues']) => {
      Object.entries(columnValues ?? {}).forEach(([column, { value }]) => {
        const targetField = fieldsByColumnName[column];
        if (targetField) setValue(targetField.hqlName, value);
      });
    },
    [fieldsByColumnName, setValue],
  );

  const runCallout = useCallback(async () => {
    if (!field.column.callout) return;

    try {
      const payload = buildCalloutPayload(getValues(), fieldsByHqlName);
      const data = await executeCallout(payload);

      if (data) {
        applyColumnValues(data.columnValues);
      }
    } catch (err) {
      logger.error('Callout execution failed:', err);
    }
  }, [field.column.callout, executeCallout, getValues, fieldsByHqlName, applyColumnValues]);

  useEffect(() => {
    if (ready.current) {
      runCallout();
    } else {
      ready.current = true;
    }
  }, [runCallout, value]);

  return (
    <div className="w-full rounded-2xl p-2">
      <label htmlFor={field.hqlName} className="block text-sm font-medium text-gray-700 mb-1">
        {field.name} ({String(value)} - {String(field.column.callout)})
      </label>
      <GenericSelector field={field} />
    </div>
  );
};
