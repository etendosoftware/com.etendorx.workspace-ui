import { useFormContext } from 'react-hook-form';
import Label from '@/components/Label';

const BaseSelector = (props: { description?: string; isMandatory?: boolean; name: string }) => {
  const { register } = useFormContext();

  return (
    <div className="grid grid-cols-3 auto-rows-auto gap-4 items-center" title={props.description}>
      <div className="relative">
        {props.isMandatory && (
          <span className="absolute -top-4 right-0 text-[#DC143C] font-bold" aria-required>
            *
          </span>
        )}
        <Label htmlFor={props.name} name={props.name} />
      </div>
      <div className="col-span-2">
        <input {...register(props.name)} />
      </div>
    </div>
  );
};

export default BaseSelector;
