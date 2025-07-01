import { Box, Button, Link, Typography, useTheme } from "@mui/material";
import type { FC } from "react";
import ChevronDown from "../../../assets/icons/chevron-down.svg";
import ArrowLeftIcon from "../../../assets/icons/arrow-left.svg";
import IconButton from "../../IconButton";
import { useStyle } from "../styles";
import type { BreadcrumbItemProps } from "../types";
import { useState, useCallback } from "react";

const BreadcrumbItem: FC<BreadcrumbItemProps> = ({ item, isLast, handleActionMenuOpen, handleHomeNavigation }) => {
  const [isIconHovered, setIsIconHovered] = useState<boolean>(false);
  const theme = useTheme();
  const { sx } = useStyle();

  const handleMouseEnterOnIcon = useCallback(() => setIsIconHovered(true), []);
  const handleMouseLeaveOnIcon = useCallback(() => setIsIconHovered(false), []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleHomeNavigation();
    },
    [handleHomeNavigation]
  );

  return (
    <Box key={item.id} sx={sx.breadcrumbItem}>
      <Box sx={sx.iconContainer}>
        <Button
          sx={sx.iconButton}
          onClick={handleClick}
          onMouseEnter={handleMouseEnterOnIcon}
          onMouseLeave={handleMouseLeaveOnIcon}>
          {isIconHovered ? (
            <IconButton className="w-10 h-10 bg-(--color-baseline-0) hover:bg-(--color-baseline-0) hover:text-(--color-baseline-80)">
              <ArrowLeftIcon />
            </IconButton>
          ) : (
            <IconButton className="w-10 h-10 text-[1.5rem] bg-(--color-transparent-neutral-5)">📁</IconButton>
          )}
        </Button>
      </Box>
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
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
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
