import { Typography, IconButton, Box, useTheme } from '@mui/material';
import CloseIcon from '../../../../assets/icons/x.svg';
import SearchOutlined from '../../../../assets/icons/search.svg';
import { useStyle } from '@workspaceui/mainui/components/Table/styles';
import { ICON_BUTTON_SIZE, ADD_BUTTON_TEXT } from './constants';

export const SearchBar: React.FC<SearchBarProps> = ({ readOnly, onClear, onOpen, hasItems }) => {
  const { sx } = useStyle();
  const theme = useTheme();

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClear();
  };

  const searchBarStyles = {
    ...sx.searchBarBase,
    cursor: readOnly ? 'default' : 'pointer',
    opacity: readOnly ? 0.7 : 1,
    '&:hover': !readOnly
      ? {
          backgroundColor: theme.palette.baselineColor.neutral[10],
          color: theme.palette.baselineColor.neutral[100],
          background: theme.palette.baselineColor.neutral[30],
        }
      : undefined,
  };

  const iconButtonStyles = {
    visibility: hasItems ? 'visible' : 'hidden',
    backgroundColor: theme.palette.baselineColor.neutral[10],
    '&:hover': {
      backgroundColor: theme.palette.baselineColor.neutral[50],
    },
  };

  return (
    <Box onClick={() => !readOnly && onOpen()} sx={searchBarStyles}>
      <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />
      <Typography>{ADD_BUTTON_TEXT}</Typography>
      <IconButton size={ICON_BUTTON_SIZE} onClick={handleClear} disabled={readOnly || !hasItems} sx={iconButtonStyles}>
        <CloseIcon fontSize={ICON_BUTTON_SIZE} />
      </IconButton>
    </Box>
  );
};
