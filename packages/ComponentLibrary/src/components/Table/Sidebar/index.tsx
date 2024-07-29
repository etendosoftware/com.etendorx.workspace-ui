import React from 'react';
import SidebarContent from './SidebarContent';
import { SidebarProps } from '../../../../../storybook/src/stories/Components/Table/types';

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  selectedItem,
  widgets,
}) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <SidebarContent
        icon={selectedItem.icon}
        identifier={selectedItem.identifier ?? 'No identifier'}
        title={selectedItem.title ?? 'No title'}
        widgets={widgets}
        onClose={onClose}
      />
    </div>
  );
};

export default Sidebar;
