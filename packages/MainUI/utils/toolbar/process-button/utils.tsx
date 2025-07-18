import ProcessIcon from "@workspaceui/componentlibrary/src/assets/icons/close-record.svg";
import ChevronDownIcon from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import type { TranslateFunction } from "@/hooks/types";
import type { ProcessAvailableButton } from "@/components/Toolbar/types";

const getProcessButtonStyles = (anchorEl: HTMLElement | null): string => {
  const baseClasses = "disabled:bg-[var(--color-baseline-0)] disabled:opacity-20 h-8 py-1 px-4";

  const conditionalClasses = anchorEl
    ? "bg-[var(--color-etendo-dark)] border-none !text-[var(--color-baseline-0)]"
    : "bg-[var(--color-transparent-neutral-0)]";

  return `${conditionalClasses} ${baseClasses}`;
};

export const createProcessMenuButton = (
  processCount: number,
  hasSelectedRecord: boolean,
  onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>) => void,
  t: TranslateFunction,
  anchorEl: HTMLElement | null
): ProcessAvailableButton => ({
  key: "process-menu",
  leftIcon: <ProcessIcon width="1rem" height="1rem" />,
  rightIcon: <ChevronDownIcon width="1rem" height="1rem" />,
  text: t("common.processes"),
  anchorEl: anchorEl,
  disabled: !hasSelectedRecord,
  customContainerStyles: getProcessButtonStyles(anchorEl),
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (hasSelectedRecord && event && processCount > 0) {
      onMenuOpen(event);
    }
  },
});
