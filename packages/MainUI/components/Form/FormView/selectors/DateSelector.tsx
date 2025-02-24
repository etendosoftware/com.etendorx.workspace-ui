import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import { DateInput } from './components/DateInput';

export const DateSelector = ({ field }: { field: Field }) => {
  const { register } = useFormContext();

  return <DateInput {...register(field.hqlName)} />;
};
