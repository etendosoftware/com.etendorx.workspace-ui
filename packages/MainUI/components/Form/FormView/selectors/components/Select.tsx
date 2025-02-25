import { useFormContext } from "react-hook-form";

export interface Option {
  id: string;
  label: string;
}

export interface SelectProps {
  name: string;
  options: Option[];
}

export default function Select({ name, options }: SelectProps) {
  const { register } = useFormContext();

  return (
    <div className="flex flex-col gap-2">
      <select
        {...register(name)}
        className="w-full p-2 border rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
