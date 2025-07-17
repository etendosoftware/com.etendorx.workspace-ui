import type { TopToolbarProps } from "../types";
import ToolbarSection from "../ToolbarSection";

export const TopToolbar = ({ leftSection, centerSection, rightSection, processButton }: TopToolbarProps) => {
  const isCenterSectionsDisabled = centerSection.buttons.every((button) => button.disabled) && processButton.disabled;
  return (
    <div className="h-10 flex justify-between items-center gap-1">
      <ToolbarSection {...leftSection} className="bg-[var(--color-baseline-0)] rounded-4xl p-1" />
      <ToolbarSection
        {...centerSection}
        processButton={processButton}
        className={`bg-[var(--color-baseline-0)] rounded-4xl p-1 w-full flex ${isCenterSectionsDisabled ? "opacity-40" : ""}`}
        style={{
          boxShadow: "0px 4px 10px var(--color-transparent-neutral-10)",
        }}
      />
      <ToolbarSection {...rightSection} className="bg-transparent-neutral-5 rounded-4xl p-1" />
    </div>
  );
};

export default TopToolbar;
