import { memo } from "react";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check-circle-filled.svg";

const OptionItem = memo(
  ({
    id,
    label,
    index,
    isSelected,
    isHighlighted,
    onOptionClick,
    onMouseEnter,
  }: {
    id: string;
    label: string;
    data?: any;
    index: number;
    isSelected: boolean;
    isHighlighted: boolean;
    onOptionClick: (id: string, label: string) => void;
    onMouseEnter: (index: number) => void;
  }) => {
    return (
      <li
        data-testid={`OptionItem__${id}`}
        aria-selected={isSelected}
        onClick={(e) => {
          e.stopPropagation();
          onOptionClick(id, label);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOptionClick(id, label);
          }
        }}
        onMouseEnter={() => onMouseEnter(index)}
        className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between focus:outline-none focus:bg-baseline-10
         ${isHighlighted ? "bg-baseline-10" : ""}
         ${isSelected ? "bg-baseline-10 font-medium" : ""}
         hover:bg-baseline-10`}>
        <span className={`truncate mr-2 ${isSelected ? "text-dynamic-dark" : "text-baseline-90"}`}>
          {label}
        </span>
        {isSelected && (
          <CheckIcon
            alt="Selected Item"
            className="fade-in-left flex-shrink-0"
            height={16}
            width={16}
            data-testid={`Image__${id}`}
          />
        )}
      </li>
    );
  }
);
OptionItem.displayName = "OptionItem";

export default OptionItem;
