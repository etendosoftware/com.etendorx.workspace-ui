import { useFormContext } from 'react-hook-form';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';

export const BaseSelector = ({ field }: { field: Field }) => {
  const { register } = useFormContext();

  return (
    <div className="w-full rounded-2xl p-2">
      <label htmlFor={field.hqlName} className="block text-sm font-medium text-gray-700 mb-1">
        {field.name}
      </label>
      <input
        {...register(field.hqlName)}
        className="w-full bg-white rounded-2xl border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition"
      />
    </div>
  );
};
