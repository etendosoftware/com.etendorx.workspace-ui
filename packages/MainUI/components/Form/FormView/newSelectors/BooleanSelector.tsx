import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import { Switch } from '../components/Switch';

export const BooleanSelector = ({ field }: { field: Field }) => {
  const { register } = useFormContext();

  return <Switch {...register(field.hqlName)} />;
};
