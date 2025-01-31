import { useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import type { FieldDefinition, Tab } from '@workspaceui/etendohookbinder/src/api/types';
import type { FieldValue } from '@workspaceui/componentlibrary/src/components/FormView/types';
import BooleanSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/BooleanSelector';
import NumberSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/NumberSelector';
import DateSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/DateSelector';
import SelectSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/SelectSelector';
import QuantitySelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/QuantitySelector';
import ListSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/ListSelector';
import SearchSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/SearchSelector';
import TableDirSelector from '@workspaceui/componentlibrary/src/components/FormView/selectors/TableDirSelector';
import { StringSelector } from '@workspaceui/componentlibrary/src/components/FormView/selectors/StringSelector';
import { useCallout } from '../../hooks/useCallout';
import { getFieldsByDBColumnName, getInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';
import { CALLOUTS_ENABLED } from '../../constants/config';

interface GenericSelectorProps {
  field: FieldDefinition;
  tab: Tab;
  readOnly?: boolean;
}

export const GenericSelector = ({ field, tab, readOnly }: GenericSelectorProps) => {
  const { watch, setValue, getValues } = useFormContext();
  const name = useRef(getInputName(field.original));
  const value = watch(name.current, field.initialValue);
  const callout = useCallout({ field: field.original, tab });

  const isFieldReadOnly = readOnly || field.original.readOnlyState?.readOnly;
  const readOnlyReason = field.original.readOnlyState?.readOnlyReason;

  console.log(isFieldReadOnly, readOnlyReason)

  const applyCallout = useCallback(
    (data: { [key: string]: unknown }) => {
      const columns = getFieldsByDBColumnName(tab);
      const columnValues = data.columnValues as Record<string, { value: unknown; classicValue: unknown }>;

      Object.entries(columnValues).forEach(([column, valueObj]) => {
        const _field = columns[column];

        if (_field) {
          setValue('inp' + _field.inpName, valueObj.value);
        }
      });
    },
    [setValue, tab],
  );

  const handleChange = useCallback(
    (value: FieldValue) => {
      const f = async () => {
        setValue(name.current, value || "");

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

  switch (field.type) {
    case 'boolean':
      return (
        <BooleanSelector 
          label={field.label} 
          name={name.current} 
          onChange={handleChange} 
          checked={value} 
          readOnly={isFieldReadOnly}
          readOnlyReason={readOnlyReason}
        />
      );
    case 'number':
      return (
        <NumberSelector 
          name={name.current} 
          value={Number(value)} 
          onChange={handleChange} 
          readOnly={isFieldReadOnly}
        />
      );
    case 'date':
      return (
        <DateSelector 
          name={name.current} 
          value={value as string} 
          onChange={handleDateChange} 
          readOnly={isFieldReadOnly}
        />
      );
    case 'select':
      return (
        <SelectSelector
          value={value}
          name={name.current}
          title={field.label}
          onChange={handleChange}
          field={field.original}
          readOnly={isFieldReadOnly}
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
          readOnly={isFieldReadOnly}
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
          readOnly={isFieldReadOnly}
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
          readOnly={isFieldReadOnly}
        />
      );
    case 'list':
      return (
        <ListSelector 
          name={name.current} 
          value={value} 
          field={field} 
          onChange={handleChange} 
          readOnly={isFieldReadOnly}
        />
      );
    default:
      return (
        <StringSelector
          value={value as string}
          setValue={handleChange}
          placeholder={field.value ? String(field.value) : undefined}
          name={name.current}
          readOnly={isFieldReadOnly}
        />
      );
  }
};