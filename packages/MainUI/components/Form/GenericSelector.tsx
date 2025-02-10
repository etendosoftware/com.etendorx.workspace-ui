import { useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallout } from '../../hooks/useCallout';
import { getInpName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { CALLOUTS_ENABLED } from '../../constants/config';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { FieldValue } from './FormView/types';
import BooleanSelector from './FormView/selectors/BooleanSelector';
import NumberSelector from './FormView/selectors/NumberSelector';
import DateSelector from './FormView/selectors/DateSelector';
import SelectSelector from './FormView/selectors/SelectSelector';
import SearchSelector from './FormView/selectors/SearchSelector';
import TableDirSelector from './FormView/selectors/TableDirSelector';
import QuantitySelector from './FormView/selectors/QuantitySelector';
import ListSelector from './FormView/selectors/ListSelector';
import { StringSelector } from './FormView/selectors/StringSelector';

interface GenericSelectorProps {
  field: FieldDefinition;
  tab: Tab;
  isReadOnly: boolean;
  isDisplayed: boolean;
}

export const GenericSelector = ({ field, tab, isDisplayed, isReadOnly }: GenericSelectorProps) => {
  const { watch, setValue, getValues } = useFormContext();
  const { fieldsByColumnName } = useMetadataContext();
  const name = useRef(getInpName(field.original));
  const value = watch(name.current, field.initialValue);
  const callout = useCallout({ field: field.original, tab });

  const applyCallout = useCallback(
    (data: { [key: string]: unknown }) => {
      const columnValues = data.columnValues as Record<string, { value: unknown; classicValue: unknown }>;

      Object.entries(columnValues).forEach(([column, valueObj]) => {
        const _field = fieldsByColumnName[column];

        if (_field) {
          setValue('inp' + _field.inpName, valueObj.value);
        }
      });
    },
    [fieldsByColumnName, setValue],
  );

  const handleChange = useCallback(
    (value: FieldValue) => {
      const f = async () => {
        setValue(name.current, value || '');

        if (CALLOUTS_ENABLED && field.original?.column?.callout$_identifier) {
          const { data } = await callout(getValues());

          if (data.response?.status === -1) {
            console.warn('Callout execution error', data);
          } else {
            applyCallout(data);
          }
        }
      };

      return f();
    },
    [applyCallout, callout, field.original?.column?.callout$_identifier, getValues, setValue],
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

  if (!isDisplayed) {
    return null;
  }

  switch (field.type) {
    case 'boolean':
      return (
        <BooleanSelector
          label={field.label}
          name={name.current}
          onChange={handleChange}
          checked={value}
          readOnly={isReadOnly}
          disabled={!!isReadOnly}
        />
      );
    case 'number':
      return <NumberSelector name={name.current} value={Number(value)} onChange={handleChange} readOnly={isReadOnly} />;
    case 'date':
      return (
        <DateSelector name={name.current} value={value as string} onChange={handleDateChange} readOnly={isReadOnly} />
      );
    case 'select':
      return (
        <SelectSelector
          value={value}
          name={name.current}
          title={field.label}
          onChange={handleChange}
          field={field.original}
          readOnly={isReadOnly}
        />
      );
    case 'search':
      return (
        <SearchSelector
          field={field}
          value={value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={handleChange}
          name={name.current}
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
      );
    case 'tabledir':
      return (
        <TableDirSelector
          value={value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={handleChange}
          name={name.current}
          readOnly={isReadOnly}
          disabled={isReadOnly}
        />
      );
    case 'quantity':
      return (
        <QuantitySelector
          value={value}
          maxLength={field.original?.column?.length}
          min={field.original?.column?.minValue ?? null}
          max={field.original?.column?.maxValue ?? null}
          onChange={handleChange}
          name={name.current}
          readOnly={isReadOnly}
        />
      );
    case 'list':
      return (
        <ListSelector name={name.current} value={value} field={field} onChange={handleChange} readOnly={isReadOnly} />
      );
    default:
      return (
        <StringSelector
          value={value as string}
          setValue={handleChange}
          placeholder={field.value ? String(field.value) : undefined}
          name={name.current}
          readOnly={isReadOnly}
        />
      );
  }
};
