import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { StringSelector } from './StringSelector';
import { BooleanSelector } from './BooleanSelector';
import { DateSelector } from './DateSelector';
import { SelectSelector } from './SelectSelector';
import { useFormContext } from 'react-hook-form';
import { TableDirSelector } from './TableDirSelector';
import QuantitySelector from './QuantitySelector';
import { ListSelector } from './ListSelector';
import { NumericSelector } from './NumericSelector';

export type GenericSelectorProps = {
  field: Field;
  isReadOnly: boolean;
};

export const GenericSelector = ({ field, isReadOnly }: GenericSelectorProps) => {
  const { watch } = useFormContext();
  const value = watch(field.hqlName);
  const { reference } = field.column;

  switch (reference) {
    case '19':
    case '95E2A8B50A254B2AAE6774B8C2F28120':
    case '18':
      return <TableDirSelector field={field} isReadOnly={isReadOnly} />;
    case '15':
    case '16':
      return <DateSelector field={field} isReadOnly={isReadOnly} />;
    case '20':
      return <BooleanSelector field={field} isReadOnly={isReadOnly} />;
    case '29':
    case '22':
      return (
        <QuantitySelector
          name={field.hqlName}
          value={value}
          min={field.column.minValue}
          max={field.column.maxValue}
          readOnly={isReadOnly}
          maxLength={field.column.length}
        />
      );
    case '17':
    case '13':
      return <ListSelector field={field} isReadOnly={isReadOnly} />;
    case '30':
      return <SelectSelector field={field} isReadOnly={isReadOnly} />;
    case '800008':
      return <NumericSelector field={field} readOnly={isReadOnly} required={field.isMandatory} />;
    case '11':
    case '12':
    default:
      return <StringSelector field={field} readOnly={isReadOnly} required={field.isMandatory} />;
  }
};
