export const TextInput = (props: React.HTMLProps<HTMLInputElement>) => {
  return (
    <input
      className="w-full h-12 bg-white rounded-2xl border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:outline-none transition"
      {...props}
    />
  );
};
