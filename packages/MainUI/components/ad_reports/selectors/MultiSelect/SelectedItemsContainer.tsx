import { Typography, Box } from '@mui/material';
import CloseIcon from '@workspaceui/componentlibrary/src/assets/icons/x.svg';
import { useStyle } from '@/components/Table/styles';
import { ICON_BUTTON_SIZE } from './constants';
import { SelectedItemProps, SelectedItemsContainerProps } from './types';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';

export const SelectedItem: React.FC<SelectedItemProps> = ({ item, onRemove }) => {
  const { sx } = useStyle();

  return (
    <Box key={item.id} sx={sx.selectedItem}>
      <Typography>{item.title}</Typography>
      <IconButton onClick={() => onRemove(item.id)}>
        <CloseIcon fontSize={ICON_BUTTON_SIZE} />
      </IconButton>
    </Box>
  );
};

export const SelectedItemsContainer: React.FC<SelectedItemsContainerProps> = ({ items, onRemove }) => {
  const { sx } = useStyle();

  return (
    <Box sx={sx.selectedContainer}>
      {items.map(item => (
        <SelectedItem key={item.id} item={item} onRemove={onRemove} />
      ))}
      {items.length === 0 && <Box sx={sx.emptyState}>No items selected</Box>}
    </Box>
  );
};
