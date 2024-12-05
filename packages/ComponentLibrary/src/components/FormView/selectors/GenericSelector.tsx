import { useCallback, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { getInputName } from '@workspaceui/etendohookbinder/src/utils/form';
import type { FieldDefinition } from '@workspaceui/etendohookbinder/src/api/types';
import type { FieldValue } from '../types';
import BooleanSelector from './BooleanSelector';
import NumberSelector from './NumberSelector';
import DateSelector from './DateSelector';
import SelectSelector from './SelectSelector';
import QuantitySelector from './QuantitySelector';
import ListSelector from './ListSelector';
import SearchSelector from './SearchSelector';
import TableDirSelector from './TableDirSelector';
import { StringSelector } from './StringSelector';

export const GenericSelector = ({ field }: { field: FieldDefinition }) => {
  const { watch, setValue } = useFormContext();
  const name = useRef(getInputName(field.original));
  const value = watch(name.current, field.initialValue);

  const handleChange = useCallback(
    (value: FieldValue) => {
      if (field.original?.column?.callout$_identifier) {
        // TODO: Execute callout
      }

      setValue(name.current, value);
    },
    [field.original?.column?.callout$_identifier, setValue],
  );

  switch (field.type) {
    case 'boolean':
      return <BooleanSelector label={field.label} name={name.current} onChange={handleChange} checked={value} />;
    case 'number':
      return <NumberSelector name={name.current} value={Number(value)} onChange={handleChange} />;
    case 'date':
      return <DateSelector name={name.current} value={value as string} onChange={handleChange} />;
    case 'select':
      return <SelectSelector name={field.name} title={field.label} onChange={handleChange} />;
    case 'search':
      return (
        <SearchSelector
          field={field}
          value={field.value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={handleChange}
        />
      );
    case 'tabledir':
      return (
        <TableDirSelector
          value={value}
          label={field.label}
          entity={field.original?.referencedEntity || ''}
          onChange={handleChange}
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
        />
      );
    case 'list':
      return <ListSelector field={field} onChange={handleChange} />;
    default:
      return (
        <StringSelector
          value={value as string}
          setValue={handleChange}
          placeholder={field.value ? String(field.value) : undefined}
        />
      );
  }
};
