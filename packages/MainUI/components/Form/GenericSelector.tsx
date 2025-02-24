import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import type { Field, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallout } from '../../hooks/useCallout';
import { CALLOUTS_ENABLED } from '../../constants/config';
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
import { logger } from '@/utils/logger';

interface GenericSelectorProps {
  field: Field;
  tab: Tab;
  isReadOnly?: boolean;
  isDisplayed?: boolean;
}

export const GenericSelector = ({ field, isReadOnly }: GenericSelectorProps) => {
  const { watch, setValue, getValues } = useFormContext();
  const value = watch(field.hqlName);
  const callout = useCallout({ field });

  // const applyCallout = useCallback(
  //   (data: { [key: string]: unknown }) => {
  //     const columnValues = data.columnValues as Record<string, { value: unknown; classicValue: unknown }>;

  //     Object.entries(columnValues).forEach(([column, valueObj]) => {
  //       const _field = fieldsByColumnName[column];

  //       if (_field) {
  //         setValue(field.original.inputName, valueObj.value);
  //       }
  //     });
  //   },
  //   [field.original.inputName, fieldsByColumnName, setValue],
  // );

  const handleChange = useCallback(
    (value: FieldValue) => {
      const f = async () => {
        setValue(field.hqlName, value || '');

        if (CALLOUTS_ENABLED && field.column?.callout$_identifier) {
          const { data } = await callout(getValues());

          if (data.response?.status === -1) {
            logger.warn('Callout execution error', data);
          } else {
            // applyCallout(data);
          }
        }
      };

      return f();
    },
    [callout, field, getValues, setValue],
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
          readOnly={isReadOnly}
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
