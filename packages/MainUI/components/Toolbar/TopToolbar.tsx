import type { TopToolbarProps } from './types';
import ToolbarSection from './ToolbarSection';

export const TopToolbar = ({ leftSection, centerSection, rightSection }: TopToolbarProps) => {
  return (
    <div className="flex justify-between items-center gap-2">
      <ToolbarSection {...leftSection} className="bg-white rounded-4xl p-1" />
      <ToolbarSection {...centerSection} className="bg-transparent-neutral-5 rounded-4xl p-1 w-full" />
      <ToolbarSection {...rightSection} className="bg-transparent-neutral-5 rounded-4xl p-1" />
    </div>
  );
};

export default TopToolbar;
