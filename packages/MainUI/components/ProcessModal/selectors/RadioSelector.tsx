import type { ProcessParameter } from "@workspaceui/api-client/src/api/types";
import { RadioGrid } from "@workspaceui/componentlibrary/src/components";
import type { RadioGridOption } from "@workspaceui/componentlibrary/src/components/RadioGrid";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

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

  const radioOptions: RadioGridOption[] = parameter.refList.map((option) => ({
    value: option.value,
    label: option.label,
    description: option.value !== option.label ? option.value : undefined,
  }));

  return (
    <div>
      <RadioGrid
        options={radioOptions}
        selectedValue={selectedOption || null}
        onSelect={handleSelect}
        columns={parameter.refList.length <= 2 ? (parameter.refList.length as 1 | 2) : 3}
        name={parameter.dBColumnName}
        className="grid-flow-col"
      />
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
