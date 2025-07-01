import { Box, MenuItem, useTheme } from "@mui/material";
import { type FC, useCallback, useMemo, useState } from "react";
import MoreHorizIcon from "../../../assets/icons/more-horizontal.svg";
import IconButton from "../../IconButton";
import Menu from "../../Menu";
import { useStyle } from "../styles";
import type { BreadcrumbListProps } from "../types";
import BreadcrumbItem from "../BreadcrumbItem/index.tsx";

const BreadcrumbList: FC<BreadcrumbListProps> = ({ items, handleActionMenuOpen }) => {
  const [middleAnchorEl, setMiddleAnchorEl] = useState<HTMLButtonElement | null>(null);
  const theme = useTheme();
  const { sx } = useStyle();

  const handleMiddleMenuOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setMiddleAnchorEl(event.currentTarget);
  }, []);

  const handleMiddleMenuClose = useCallback(() => {
    setMiddleAnchorEl(null);
  }, []);

  const firstItem = useMemo(() => items[0], [items]);
  const lastItem = useMemo(() => items[items.length - 1], [items]);
  const middleItems = useMemo(() => items.slice(1, -1), [items]);

  if (items.length <= 2) {
    return items.map((item, index) => (
      <BreadcrumbItem
        key={item.id}
        item={item}
        isLast={index === items.length - 1}
        handleActionMenuOpen={handleActionMenuOpen}
      />
    ));
  }

  return (
    <>
      <BreadcrumbItem item={firstItem} isLast={false} handleActionMenuOpen={handleActionMenuOpen} />
      {middleItems.length > 0 && (
        <Box sx={sx.breadcrumbItem}>
          <IconButton onClick={handleMiddleMenuOpen}>
            <MoreHorizIcon fill={theme.palette.baselineColor.neutral[80]} />
          </IconButton>
          <Menu anchorEl={middleAnchorEl} onClose={handleMiddleMenuClose}>
            {middleItems.map((item) => (
              <MenuItem
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  handleMiddleMenuClose();
                }}
                sx={sx.menuItem}>
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      )}
      <BreadcrumbItem item={lastItem} isLast={true} handleActionMenuOpen={handleActionMenuOpen} />
    </>
  );
};

export default BreadcrumbList;
