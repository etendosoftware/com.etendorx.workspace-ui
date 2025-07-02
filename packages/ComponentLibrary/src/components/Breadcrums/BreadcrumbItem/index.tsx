import { Box, Button, Typography, useTheme } from "@mui/material";
import type { FC } from "react";
import ChevronDown from "../../../assets/icons/chevron-down.svg";
import ArrowLeftIcon from "../../../assets/icons/arrow-left.svg";
import IconButton from "../../IconButton";
import { useStyle } from "../styles";
import type { BreadcrumbItemProps } from "../types";
import { useState, useCallback } from "react";

const BreadcrumbItem: FC<BreadcrumbItemProps> = ({
  item,
  position,
  breadcrumbsSize,
  handleActionMenuOpen,
  handleHomeNavigation,
}) => {
  const [isIconHovered, setIsIconHovered] = useState<boolean>(false);
  const theme = useTheme();
  const { sx } = useStyle();

  const isFirst = position === 0;
  const isLast = position === breadcrumbsSize - 1;

  const handleMouseEnterOnIcon = useCallback(() => setIsIconHovered(true), []);
  const handleMouseLeaveOnIcon = useCallback(() => setIsIconHovered(false), []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (breadcrumbsSize > 1 && item?.onClick) {
        item.onClick();
        return;
      }
      handleHomeNavigation();
    },
    [handleHomeNavigation, breadcrumbsSize, item]
  );

  return (
    <Box key={item.id} sx={sx.breadcrumbItem}>
      {isFirst && (
        <Box sx={sx.iconContainer}>
          <Button
            aria-label="Go back"
            sx={sx.iconButton}
            onClick={handleClick}
            onMouseEnter={handleMouseEnterOnIcon}
            onMouseLeave={handleMouseLeaveOnIcon}>
            {isIconHovered ? (
              <IconButton className="w-10 h-10 text-[1.5rem] bg-(--color-baseline-0) hover:bg-(--color-baseline-0) hover:text-(--color-baseline-80)" aria-label="Go back">
                <ArrowLeftIcon />
              </IconButton>
            ) : (
              <IconButton className="w-10 h-10 text-[1.5rem] bg-(--color-transparent-neutral-5)" aria-label="Go back">📁</IconButton>
            )}
          </Button>
        </Box>
      )}
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
        <Button
          sx={sx.textButton}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            item.onClick?.();
          }}
          aria-label="Go back"
          aria-current="page">
          <Typography noWrap sx={sx.breadcrumbTypography}>
            {item.label}
          </Typography>
        </Button>
      )}
    </Box>
  );
};

export default BreadcrumbItem;
