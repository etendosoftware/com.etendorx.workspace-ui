import { useFormContext } from 'react-hook-form';
import { getFieldReference } from '@/utils';
import { FieldType, ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';
import RadioSelector from './RadioSelector';

const GenericSelector = ({ parameter }: { parameter: ProcessParameter }) => {
  const { register } = useFormContext();
  const reference = getFieldReference(parameter.reference);

  if (reference === FieldType.LIST) {
    return <RadioSelector parameter={parameter} />;
    // return <ListSelector parameter={parameter} />;
  } else {
    return (
      <input
        className="w-full px-3 py-2 border-(--color-baseline-60) rounded-md focus:outline-none focus:border-(--color-etendo-main)"
        {...register(parameter.dBColumnName, {
          required: parameter.required,
        })}
      />
    );
  }
};

export default GenericSelector;
