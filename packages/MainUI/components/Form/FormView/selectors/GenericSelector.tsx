import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { StringSelector } from './StringSelector';
import { BooleanSelector } from './BooleanSelector';
import { DateSelector } from './DateSelector';
import { SelectSelector } from './SelectSelector';
import ListSelector from '../oldSelectors/ListSelector';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import QuantitySelector from '../oldSelectors/QuantitySelector';
import TableDirSelector from '../oldSelectors/TableDirSelector';

export const GenericSelector = ({ field }: { field: Field }) => {
  const { watch, setValue } = useFormContext();
  const value = watch(field.hqlName);
  const { reference } = field.column;

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(field.hqlName, newValue);
    },
    [field.hqlName, setValue],
  );

  switch (reference) {
    case '19':
    case '95E2A8B50A254B2AAE6774B8C2F28120':
    case '18':
      return (
        <TableDirSelector
          entity={field.referencedEntity}
          label={field.name}
          name={field.hqlName}
          onChange={handleChange}
          value={value}
        />
      );
    case '15':
    case '16':
      return <DateSelector field={field} />;
    case '20':
      return <BooleanSelector field={field} />;
    case '29':
      return (
        <QuantitySelector name={field.hqlName} value={value} min={field.column.minValue} max={field.column.maxValue} />
      );
    case '17':
    case '13':
      return <ListSelector name={field.hqlName} field={field} onChange={handleChange} value={value} />;
    case '30':
      return <SelectSelector field={field} />;
    case '12':
    case '11':
    case '22':
    default:
      return <StringSelector field={field} />;
  }
};
