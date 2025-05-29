import { getFieldReference } from '@/utils';
import { FieldType, type ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';
import RadioSelector from './RadioSelector';

const GenericSelector = ({ parameter, readOnly }: { parameter: ProcessParameter; readOnly?: boolean }) => {
  const { register } = useFormContext();
  const reference = getFieldReference(parameter.reference);

  if (reference === FieldType.LIST) {
    return <RadioSelector parameter={parameter} />;
    // return <ListSelector parameter={parameter} />;
  }
  return (
    <input
      readOnly={readOnly}
      className={`w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-(--color-etendo-main) ${readOnly ? 'bg-(--color-baseline-10) font-medium text-zinc-500' : ''}`}
      {...register(parameter.dBColumnName, {
        required: parameter.required,
        disabled: readOnly,
      })}
    />
  );
};

export default GenericSelector;
