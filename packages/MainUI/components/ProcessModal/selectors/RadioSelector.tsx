import React, { useEffect } from 'react';
import { ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';
import { useFormContext } from 'react-hook-form';

const RadioSelector = ({ parameter }: { parameter: ProcessParameter }) => {
  const { register, setValue, watch } = useFormContext();
  const selectedOption = watch(parameter.dBColumnName);

  useEffect(() => {
    if (parameter.defaultValue && !selectedOption) {
      setValue(parameter.dBColumnName, parameter.defaultValue);
    }
  }, [parameter, selectedOption, setValue]);

  const handleSelect = (value: string) => {
    setValue(parameter.dBColumnName, value);
  };

  return (
    <div className="flex flex-row gap-4">
      {parameter.refList.map(option => (
        <div
          key={option.value}
          className={`rounded-lg flex flex-col cursor-pointer min-w-[180px] ${
            selectedOption === option.value
              ? 'bg-(--color-transparent-neutral-5) border border-(--color-etendo-main) hover:bg-(--color-transparent-neutral-10)'
              : 'bg-(--color-baseline-10) border border-(--color-baseline-30) hover:bg-(--color-transparent-neutral-5)'
          }`}
          onClick={() => handleSelect(option.value)}>
          <div className="flex items-start p-4">
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mr-3 ${
                selectedOption === option.value ? 'border-(--color-etendo-main)' : 'border-gray-400'
              }`}>
              {selectedOption === option.value && <div className="w-3 h-3 rounded-full bg-(--color-etendo-main)"></div>}
            </div>
            <div className="w-full">
              <h4
                className={`font-bold text-base ${selectedOption === option.value ? 'text-(--color-etendo-main)' : 'text-gray-800'}`}>
                {option.label}
              </h4>
              {option.value !== option.label && <p className="text-xs text-gray-500 mt-1">{option.value}</p>}
            </div>
          </div>
        </div>
      ))}
      <input
        type="hidden"
        {...register(parameter.dBColumnName, {
          required: parameter.required,
        })}
      />
    </div>
  );
};

export default RadioSelector;
