import Label from '@/components/Label';
import GenericSelector from './GenericSelector';
import { ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';

const BaseSelector = ({ parameter }: { parameter: ProcessParameter }) => {
  return (
    <div className="grid gap-4 items-center" title={'description'}>
      <div className="relative pr-2">
        {true && (
          <span className="absolute -top-1 right-0 text-[#DC143C] font-bold" aria-required>
            *
          </span>
        )}
        <Label htmlFor={parameter.dBColumnName} name={parameter.name} />
      </div>
      <div className="col-span-2 p-8">
        <GenericSelector parameter={parameter} />
      </div>
    </div>
  );
};

export default BaseSelector;
