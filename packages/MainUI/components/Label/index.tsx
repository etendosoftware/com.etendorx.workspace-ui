export default function Label({
  htmlFor,
  name,
  handleOnClick,
  handleKeyDown,
  link,
}: {
  htmlFor: string;
  name: string;
  handleOnClick?: (e: React.MouseEvent) => void;
  handleKeyDown?: (e: React.KeyboardEvent) => void;
  link?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium select-none truncate ${link ? "text-blue-700 cursor-pointer" : "text-gray-700"}`}
      onClick={(e) => handleOnClick?.(e)}
      onKeyDown={(e) => handleKeyDown?.(e)}>
      {name}
    </label>
  );
}
