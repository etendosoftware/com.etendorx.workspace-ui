import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { StringSelector } from './StringSelector';
import { BooleanSelector } from './BooleanSelector';
import { DateSelector } from './DateSelector';
import { SelectSelector } from './SelectSelector';

export const GenericSelector = ({ field }: { field: Field }) => {
  const { reference } = field.column;

  switch (reference) {
    case '19':
    case '95E2A8B50A254B2AAE6774B8C2F28120':
    case '18':
      return 'tabledir';
    case '15':
    case '16':
      return <DateSelector field={field} />;
    case '20':
      return <BooleanSelector field={field} />;
    case '29':
      return 'quantity';
    case '17':
    case '13':
      return 'list';
    case '30':
      return <SelectSelector field={field} />
    case '12':
    case '11':
    case '22':
    default:
      return <StringSelector field={field} />;
  }
};
