export const TextInput = (props: React.HTMLProps<HTMLInputElement>) => {
  return (
    <input
      className="w-full bg-white rounded-2xl border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition"
      {...props}
    />
  );
};
