import React from 'react';
import MenuItem from '@mui/material/MenuItem';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToggleChip from '../Toggle/ToggleChip';
import { useStyle } from './styles';
import type { SortableItemProps } from './DragModal.types';
import type { SxProps, Theme } from '@mui/material/styles';

const SortableItem: React.FC<SortableItemProps> = ({ id, person, onToggle, icon }) => {
  const { sx, styles } = useStyle();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const menuItemSx = {
    ...sx.menuItemStyles,
    ...(isDragging ? sx.menuItemDragging : {}),
  } as SxProps<Theme>;

  return (
    <MenuItem ref={setNodeRef} style={style} sx={menuItemSx} {...attributes} {...listeners} disableRipple>
      <div style={styles.sortableItemContainer}>
        <div style={styles.sortableItemLeftContainer}>
          {React.cloneElement(icon as React.ReactElement, {
            style: styles.dragStyles,
          })}
          <span className='person-label' style={styles.sortableItemLabel} title={person.label}>
            {person.label}
          </span>
        </div>
        <ToggleChip isActive={person.isActive} onToggle={onToggle} />
      </div>
    </MenuItem>
  );
};

export default SortableItem;
