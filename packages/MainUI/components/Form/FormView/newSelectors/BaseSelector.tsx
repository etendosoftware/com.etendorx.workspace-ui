import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { GenericSelector } from './GenericSelector';

export const BaseSelector = ({ field }: { field: Field }) => {
  return (
    <div className="w-full rounded-2xl p-2">
      <label htmlFor={field.hqlName} className="block text-sm font-medium text-gray-700 mb-1">
        {field.name}
      </label>
      <GenericSelector field={field} />
    </div>
  );
};
