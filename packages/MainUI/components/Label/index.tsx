interface LabelProps {
  htmlFor: string;
  name: string;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  link?: boolean;
}

export default function Label({ htmlFor, name, onClick, onKeyDown, link }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium select-none truncate ${link ? "text-blue-700 cursor-pointer" : "text-gray-700"}`}
      onClick={(e) => onClick?.(e)}
      onKeyDown={(e) => onKeyDown?.(e)}
      {...(link ? { role: "button", tabIndex: 0, "aria-label": "Navigate to referenced window" } : {})}>
      {name}
    </label>
  );
}
