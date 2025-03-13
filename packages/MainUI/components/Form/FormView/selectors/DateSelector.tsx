import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import { DateInput } from './components/DateInput';

export const DateSelector = ({ field, isReadOnly }: { field: Field; isReadOnly?: boolean }) => {
  const { register } = useFormContext();
  const { ref, ...rest } = register(field.hqlName);

  return <DateInput {...rest} ref={ref} isReadOnly={isReadOnly} />;
};

export default DateSelector;
