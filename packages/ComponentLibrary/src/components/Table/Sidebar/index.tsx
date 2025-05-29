import SidebarContent from './SidebarContent';
import type { SidebarProps } from './types';

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, selectedItem, widgets, translations }) => {
  return (
    <div className={`sidebar ${isOpen && 'open'}`}>
      <SidebarContent
        icon={selectedItem.icon}
        identifier={selectedItem.identifier ?? translations.noIdentifier}
        title={selectedItem.title ?? translations.noTitle}
        widgets={widgets}
        onClose={onClose}
        translations={translations}
      />
    </div>
  );
};

export default Sidebar;
