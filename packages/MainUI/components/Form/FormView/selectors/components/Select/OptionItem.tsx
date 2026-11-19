import { memo } from "react";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check-circle-filled.svg";
import { isColorString } from "@/utils/color/utils";
import { SELECTED_CHECK_CLASSES } from "@/utils/iconClasses";

/** Selected option text: the light lilac in dark mode keeps it readable on the dark highlight (7:1). */
export const SELECTED_OPTION_TEXT_CLASSES = "text-dynamic-dark dark:text-(--color-blue-800)";

const OptionItem = memo(
  ({
    id,
    label,
    color,
    index,
    isSelected,
    isHighlighted,
    onOptionClick,
    onMouseEnter,
  }: {
    id: string;
    label: string;
    data?: any;
    color?: string;
    index: number;
    isSelected: boolean;
    isHighlighted: boolean;
    onOptionClick: (id: string, label: string) => void;
    onMouseEnter: (index: number) => void;
  }) => {
    const resolvedColor = color && isColorString(color.trim().toLowerCase()) ? color.trim() : undefined;

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
        className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between focus:outline-none focus:bg-baseline-10 dark:focus:bg-(--ui-chip-hover)
         ${isHighlighted ? "bg-baseline-10 dark:bg-(--ui-chip-hover)" : ""}
         ${isSelected ? "bg-baseline-10 dark:bg-(--ui-chip-hover) font-medium" : ""}
         hover:bg-baseline-10 dark:hover:bg-(--ui-chip-hover)`}>
        <span
          className={`truncate mr-2 flex items-center gap-2 ${isSelected ? SELECTED_OPTION_TEXT_CLASSES : "text-baseline-90"}`}>
          {resolvedColor && (
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: resolvedColor }}
              aria-hidden="true"
            />
          )}
          {label}
        </span>
        {isSelected && (
          <CheckIcon
            alt="Selected Item"
            className={`fade-in-left flex-shrink-0 ${SELECTED_CHECK_CLASSES}`}
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
