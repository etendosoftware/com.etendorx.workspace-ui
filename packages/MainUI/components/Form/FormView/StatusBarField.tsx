import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';

export default function StatusBarField({ field }: { field: Field }) {
  const { register, watch } = useFormContext();
  const [value, identifier] = watch([field.hqlName, field.hqlName + '$_identifier']);

  return (
    <div className="inline-flex gap-1">
      <label htmlFor={field.hqlName}>{field.name}:</label>
      <span className="font-bold" {...register(field.hqlName)}>
        {identifier ?? value}
      </span>
    </div>
  );
}
