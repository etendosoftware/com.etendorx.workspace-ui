import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import type { Field, FormInitializationResponse, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallout } from '../../hooks/useCallout';
import { CALLOUTS_ENABLED } from '../../constants/config';
import { FieldValue } from './FormView/types';
import BooleanSelector from './FormView/oldSelectors/BooleanSelector';
import NumberSelector from './FormView/oldSelectors/NumberSelector';
import DateSelector from './FormView/oldSelectors/DateSelector';
import SelectSelector from './FormView/oldSelectors/SelectSelector';
import SearchSelector from './FormView/oldSelectors/SearchSelector';
import TableDirSelector from './FormView/oldSelectors/TableDirSelector';
import QuantitySelector from './FormView/oldSelectors/QuantitySelector';
import ListSelector from './FormView/oldSelectors/ListSelector';
import { StringSelector } from './FormView/oldSelectors/StringSelector';
import { useMetadataContext } from '@/hooks/useMetadataContext';

interface GenericSelectorProps {
  field: Field;
  tab: Tab;
  isReadOnly?: boolean;
  isDisplayed?: boolean;
}

export const GenericSelector = ({ field, isReadOnly }: GenericSelectorProps) => {
  const { watch, setValue, getValues } = useFormContext();
  const { fieldsByColumnName } = useMetadataContext();
  const value = watch(field.hqlName);
  const callout = useCallout({ field });

  const applyCallout = useCallback(
    (data: FormInitializationResponse) => {
      const columnValues = data.columnValues as Record<string, { value: unknown; classicValue: unknown }>;

      Object.entries(columnValues).forEach(([column, valueObj]) => {
        const _field = fieldsByColumnName[column];

        if (_field) {
          setValue(field.inputName, valueObj.value);
        }
      });
    },
    [field.inputName, fieldsByColumnName, setValue],
  );

  const handleChange = useCallback(
    (value: FieldValue) => {
      const f = async () => {
        setValue(field.hqlName, value || '');

        if (CALLOUTS_ENABLED && field.column?.callout$_identifier) {
          const data = await callout(getValues());

          if (data) {
            applyCallout(data);
          }
        }
      };

      return f();
    },
    [applyCallout, callout, field.column?.callout$_identifier, field.hqlName, getValues, setValue],
  );

  const handleDateChange = useCallback(
    (event: unknown) => {
      if (
        event &&
        typeof event === 'object' &&
        'target' in event &&
        event.target &&
        typeof event.target === 'object' &&
        'value' in event.target
      ) {
        const dateEvent = event as { target: { value: string; name: string } };
        handleChange(dateEvent.target.value);
      }
    },
    [handleChange],
  );

  switch (field.type) {
    case 'boolean':
      return (
        <BooleanSelector
          label={field.name}
          name={field.hqlName}
          onChange={handleChange}
          checked={value}
          readOnly={isReadOnly}
          disabled={!!isReadOnly}
        />
      );
    case 'number':
      return (
        <NumberSelector name={field.hqlName} value={Number(value)} onChange={handleChange} readOnly={isReadOnly} />
      );
    case 'date':
      return (
        <DateSelector name={field.hqlName} value={value as string} onChange={handleDateChange} readOnly={isReadOnly} />
      );
    case 'select':
      return (
        <SelectSelector
          value={value}
          name={field.hqlName}
          title={field.name}
          onChange={handleChange}
          field={field}
          readOnly={isReadOnly}
        />
      );
    case 'search':
      return (
        <SearchSelector
          field={field}
          value={value}
          label={field.name}
          entity={field.referencedEntity || ''}
          onChange={handleChange}
          name={field.hqlName}
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
      );
    case 'tabledir':
      return (
        <TableDirSelector
          value={value}
          label={field.name}
          entity={field.referencedEntity || ''}
          onChange={handleChange}
          name={field.hqlName}
          isReadOnly={isReadOnly}
          disabled={isReadOnly}
        />
      );
    case 'quantity':
      return (
        <QuantitySelector
          value={value}
          maxLength={field.column?.length}
          min={field.column?.minValue ?? null}
          max={field.column?.maxValue ?? null}
          onChange={handleChange}
          name={field.hqlName}
          readOnly={isReadOnly}
        />
      );
    case 'list':
      return (
        <ListSelector name={field.hqlName} value={value} field={field} onChange={handleChange} readOnly={isReadOnly} />
      );
    default:
      return (
        <StringSelector
          value={value as string}
          setValue={handleChange}
          placeholder={field.name}
          name={field.hqlName}
          readOnly={isReadOnly}
        />
      );
  }
};
