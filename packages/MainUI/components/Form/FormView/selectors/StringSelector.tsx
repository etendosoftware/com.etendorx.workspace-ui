import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { TextInput } from './components/TextInput';
import { useFormContext } from 'react-hook-form';

export const StringSelector = ({ field }: { field: Field }) => {
  const { register } = useFormContext();

  return <TextInput {...register(field.hqlName)} />;
};
