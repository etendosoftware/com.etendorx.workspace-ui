import { Box, Link, Typography, useTheme } from "@mui/material";
import type { FC } from "react";
import ChevronDown from "../../../assets/icons/chevron-down.svg";
import IconButton from "../../IconButton";
import { useStyle } from "../styles";
import type { BreadcrumbItemProps } from "../types";

const BreadcrumbItem: FC<BreadcrumbItemProps> = ({ item, isLast, handleActionMenuOpen }) => {
  const theme = useTheme();
  const { sx } = useStyle();

  return (
    <Box key={item.id} sx={sx.breadcrumbItem}>
      {isLast ? (
        <>
          <Typography
            noWrap
            sx={sx.lastItemTypography}
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              if (item.actions && item.actions.length > 0) {
                handleActionMenuOpen(e, item.actions);
              }
            }}>
            {item.label}
          </Typography>
          {item.actions &&
            item.actions.length > 0 &&
            (() => {
              const actions = item.actions;
              return (
                <IconButton onClick={(e) => handleActionMenuOpen(e, actions)}>
                  <ChevronDown fill={theme.palette.baselineColor.neutral[80]} />
                </IconButton>
              );
            })()}
        </>
      ) : (
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            item.onClick?.();
          }}
          sx={sx.link}>
          <Typography noWrap sx={sx.breadcrumbTypography}>
            {item.label}
          </Typography>
        </Link>
      )}
    </Box>
  );
};

export default BreadcrumbItem;
