import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import { DateInput } from './components/DateInput';

export const DateSelector = ({ field, isReadOnly }: { field: Field; isReadOnly?: boolean }) => {
  const { register } = useFormContext();

  return <DateInput field={field} isReadOnly={isReadOnly} {...register(field.hqlName)} />;
};

export default DateSelector;
