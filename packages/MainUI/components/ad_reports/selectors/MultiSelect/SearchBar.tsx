import { Typography, Box, useTheme } from "@mui/material";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import { useStyle } from "@/components/Table/styles";
import { ICON_BUTTON_SIZE, ADD_BUTTON_TEXT } from "./constants";
import type { SearchBarProps } from "./types";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";

export const SearchBar: React.FC<SearchBarProps> = ({ readOnly, onClear, onOpen, hasItems }) => {
  const { sx } = useStyle();
  const theme = useTheme();

  const handleClear = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    onClear();
  };

  const searchBarStyles = {
    ...sx.searchBarBase,
    cursor: readOnly ? "default" : "pointer",
    opacity: readOnly ? 0.7 : 1,
    "&:hover": !readOnly
      ? {
          backgroundColor: theme.palette.baselineColor.neutral[10],
          color: theme.palette.baselineColor.neutral[100],
          background: theme.palette.baselineColor.neutral[30],
        }
      : undefined,
  };

  return (
    <Box onClick={() => !readOnly && onOpen()} sx={searchBarStyles}>
      <SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />
      <Typography>{ADD_BUTTON_TEXT}</Typography>
      <IconButton onClick={handleClear} disabled={readOnly || !hasItems}>
        <CloseIcon fontSize={ICON_BUTTON_SIZE} />
      </IconButton>
    </Box>
  );
};
