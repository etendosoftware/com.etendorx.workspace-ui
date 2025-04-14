export default function Label({ htmlFor, name, link }: { htmlFor: string; name: string; link?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium select-none truncate ${link ? 'text-blue-700 cursor-pointer' : 'text-gray-700'}`}>
      {name}
    </label>
  );
}
