import type { TopToolbarProps } from "../types";
import ToolbarSection from "../ToolbarSection";

export const TopToolbar = ({ leftSection, centerSection, rightSection, processButton }: TopToolbarProps) => {
  const isCenterSectionsDisabled = centerSection.buttons.every((button) => button.disabled) && processButton.disabled;
  return (
    <div className="h-10 flex justify-between items-center gap-1">
      <ToolbarSection {...leftSection} className="bg-white rounded-4xl p-1" />
      <ToolbarSection
        {...centerSection}
        processButton={processButton}
        className={`${isCenterSectionsDisabled ? "bg-transparent-neutral-5" : "bg-white"} rounded-4xl p-1 w-full flex`}
      />
      <ToolbarSection {...rightSection} className="bg-transparent-neutral-5 rounded-4xl p-1" />
    </div>
  );
};

export default TopToolbar;
