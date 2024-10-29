import { useState } from 'react';
import TableDirSelector from './TableDirSelector';
import BooleanSelector from './BooleanSelector';
import NumberSelector from './NumberSelector';
import DateSelector from './DateSelector';
import SelectSelector from './SelectSelector';
import QuantitySelector from './QuantitySelector';
import ListSelector from './ListSelector';
import { StringSelector } from './StringSelector';
import { FieldDefinition } from '@/screens/Form/types';
import { useMetadataContext } from '../../../hooks/useMetadataContext';

export const GenericSelector = ({ field }: { field: FieldDefinition }) => {
  const { record } = useMetadataContext();
  const [value, setValue] = useState<string | number | null>(() => {
    if (typeof record?.[field.original.fieldName] != 'undefined' && record[field.original.fieldName] !== null) {
      return record[field.original.fieldName] as never;
    } else {
      return null;
    }
  });

  switch (field.type) {
    case 'boolean':
      return <BooleanSelector field={field} />;
    case 'number':
      return (
        <NumberSelector
          name={field.label}
          value={field.value as number}
          onChange={setValue}
          readOnly={field.original.readOnly}
        />
      );
    case 'date':
      return (
        <DateSelector name={field.name} value={String(value)} onChange={setValue} readOnly={field.original.readOnly} />
      );
    case 'select':
      return (
        <SelectSelector name={field.name} title={field.label} onChange={setValue} readOnly={field.original.readOnly} />
      );
    case 'tabledir':
      return (
        <TableDirSelector
          value={field.value}
          label={field.label}
          entity={field.original.referencedEntity}
          onChange={setValue}
        />
      );
    case 'quantity':
      return (
        <QuantitySelector
          value={field.value}
          maxLength={field.original?.column?.length?.toString()}
          min={field.original?.column?.minValue}
          max={field.original?.column?.maxValue}
          onChange={setValue}
          readOnly={field.original.readOnly}
        />
      );
    case 'list':
      return <ListSelector field={field} onChange={setValue} readOnly={field.original.readOnly} />;
    case 'string':
    default:
      return <StringSelector field={field} value={value} setValue={setValue} placeholder={field.original.name} />;
  }
};
