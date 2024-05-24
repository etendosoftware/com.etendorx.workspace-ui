import React from 'react';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToggleChip from '../Toggle/ToggleChip';
import {
  listStyles,
  menuItemStyles,
  personLabelStyles,
} from './DragModal.styles';
import { SortableItemProps } from './types';

const SortableItem: React.FC<SortableItemProps> = ({ id, person }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...menuItemStyles,
  };

  return (
    <List style={listStyles}>
      <MenuItem ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <span style={personLabelStyles}>{person.label}</span>
        <ToggleChip />
      </MenuItem>
    </List>
  );
};

export default SortableItem;
