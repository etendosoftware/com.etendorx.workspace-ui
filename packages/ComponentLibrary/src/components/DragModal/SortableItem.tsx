import React from 'react';
import List from '@mui/material/List';
import MenuItem from '@mui/material/MenuItem';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToggleChip from '../Toggle/ToggleChip';
import { DragIndicator } from '@mui/icons-material';
import {
  itemsContainer,
  leftContainer,
  listStyles,
  menuItemStyles,
  personLabelStyles,
} from './DragModal.styles';
import { SortableItemProps } from './DragModal.types';
import { theme } from '../../theme';

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  person,
  onToggle,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...menuItemStyles,
  };

  return (
    <List style={listStyles}>
      <MenuItem
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        sx={{
          '&:hover': {
            borderRadius: '0.5rem',
            color: theme.palette.baselineColor.neutral[80],
          },
        }}>
        <div style={itemsContainer}>
          <div style={leftContainer}>
            <DragIndicator
              style={{
                maxWidth: '1rem',
                maxHeight: '1rem',
                marginRight: '0.5rem',
              }}
            />
            <span style={personLabelStyles} title={person.label}>
              {person.label}
            </span>
          </div>
          <ToggleChip isActive={person.isActive} onToggle={onToggle} />
        </div>
      </MenuItem>
    </List>
  );
};

export default SortableItem;
