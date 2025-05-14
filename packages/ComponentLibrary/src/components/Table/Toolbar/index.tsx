import type { TopToolbarProps } from '@workspaceui/storybook/src/stories/Components/Table/types';
import ToolbarSection from './ToolbarSection';

export const TopToolbar = ({ leftSection, centerSection, rightSection }: TopToolbarProps) => {
  return (
    <div className="flex justify-between items-center gap-1">
      <ToolbarSection {...leftSection} />
      <div className="flex justify-start">
        <ToolbarSection {...centerSection} />
      </div>
      <ToolbarSection {...rightSection} />
    </div>
  );
};

export default TopToolbar;
