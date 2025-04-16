import { useFormContext } from 'react-hook-form';
import { getFieldReference } from '@/utils';
import { FieldType, ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';
import ListSelector from './ListSelector';

const GenericSelector = ({ parameter }: { parameter: ProcessParameter }) => {
  const { register } = useFormContext();
  const reference = getFieldReference(parameter.reference);

  if (reference == FieldType.LIST) {
    return <ListSelector parameter={parameter} />;
  } else {
    return <input {...register(parameter.dBColumnName)} />;
  }
};

export default GenericSelector;
