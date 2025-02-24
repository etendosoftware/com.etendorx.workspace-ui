import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { GenericSelector } from './GenericSelector';
import { useFormContext } from 'react-hook-form';

export const BaseSelector = ({ field }: { field: Field }) => {
  const { watch } = useFormContext();
  const value = watch(field.hqlName);

  return (
    <div className="w-full rounded-2xl p-2">
      <label htmlFor={field.hqlName} className="block text-sm font-medium text-gray-700 mb-1">
        {field.name} ({String(value)})
      </label>
      <GenericSelector field={field} />
    </div>
  );
};
