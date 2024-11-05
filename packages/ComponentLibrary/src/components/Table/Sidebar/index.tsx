import SidebarContent from './SidebarContent';
import type { SidebarProps } from '@workspaceui/storybook/src/stories/Components/Table/types';
import { useTranslation } from '@workspaceui/mainui/hooks/useTranslation';

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, selectedItem, widgets }) => {
  const { t } = useTranslation();

  return (
    <div className={`sidebar ${isOpen && 'open'}`}>
      <SidebarContent
        icon={selectedItem.icon}
        identifier={selectedItem.identifier ?? t('table.labels.noIdentifier')}
        title={selectedItem.title ?? t('table.labels.noTitle')}
        widgets={widgets}
        onClose={onClose}
      />
    </div>
  );
};

export default Sidebar;
