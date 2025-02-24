import { useFormContext } from 'react-hook-form';
import { Field } from '@workspaceui/etendohookbinder/src/api/types';

export const StringSelector = ({ field }: { field: Field }) => {
  const { register } = useFormContext();

  return (
    <input
      {...register(field.hqlName)}
      className="w-full bg-white rounded-2xl border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition"
    />
  );
};
