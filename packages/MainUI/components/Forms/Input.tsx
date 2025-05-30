export default function Input(
  props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
) {
  return (
    <div className="relative w-full">
      <input
        {...props}
        placeholder=" "
        className="peer h-12 w-full border-b border-gray-400 text-gray-900 placeholder-transparent focus:outline-none focus:border-blue-800"
      />
      <label
        htmlFor={props.name}
        className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-sm peer-focus:text-blue-800">
        {props.placeholder}
      </label>
    </div>
  );
}
