import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { TextInput } from './components/TextInput';
import { useFormContext } from 'react-hook-form';

export const StringSelector = ({ field, ...props }: { field: Field } & React.ComponentProps<typeof TextInput>) => {
  const { register } = useFormContext();

  return <TextInput {...props} {...register(field.hqlName)} />;
};
