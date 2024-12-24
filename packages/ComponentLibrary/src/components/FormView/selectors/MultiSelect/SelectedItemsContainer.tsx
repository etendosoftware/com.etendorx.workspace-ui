import { Typography, IconButton, Box } from '@mui/material';
import CloseIcon from '../../../../assets/icons/x.svg';
import { useStyle } from '@workspaceui/mainui/components/Table/styles';
import { Option } from '../../types';
import { ICON_BUTTON_SIZE } from './constants';

interface SelectedItemProps {
  item: Option;
  onRemove: (id: string) => void;
}

export const SelectedItem: React.FC<SelectedItemProps> = ({ item, onRemove }) => {
  const { sx } = useStyle();

  return (
    <Box key={item.id} sx={sx.selectedItem}>
      <Typography>{item.title}</Typography>
      <IconButton size={ICON_BUTTON_SIZE} onClick={() => onRemove(item.id)}>
        <CloseIcon fontSize={ICON_BUTTON_SIZE} />
      </IconButton>
    </Box>
  );
};

interface SelectedItemsContainerProps {
  items: Option[];
  onRemove: (id: string) => void;
}

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
