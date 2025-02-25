import { useFormContext } from 'react-hook-form';

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
        className="w-full h-12 bg-white rounded-2xl border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:outline-none transition">
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
