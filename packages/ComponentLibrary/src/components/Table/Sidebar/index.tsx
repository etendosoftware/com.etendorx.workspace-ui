import React from 'react';
import SidebarContent from './SidebarContent';
import type { SidebarProps } from '../../../../../storybook/src/stories/Components/Table/types';

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  selectedItem,
  widgets,
  noIdentifierLabel = '',
  noTitleLabel = '',
}) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <SidebarContent
        icon={selectedItem.icon}
        identifier={selectedItem.identifier ?? noIdentifierLabel}
        title={selectedItem.title ?? noTitleLabel}
        widgets={widgets}
        onClose={onClose}
      />
    </div>
  );
};

export default Sidebar;
