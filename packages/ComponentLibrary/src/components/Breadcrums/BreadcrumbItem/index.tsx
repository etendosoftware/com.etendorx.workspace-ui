import { Box, Button, Typography, useTheme } from "@mui/material";
import type { FC } from "react";
import ChevronDown from "../../../assets/icons/chevron-down.svg";
import ArrowLeftIcon from "../../../assets/icons/arrow-left.svg";
import IconButton from "../../IconButton";
import { useStyle } from "../styles";
import type { BreadcrumbItemProps } from "../types";
import { useCallback } from "react";

const BreadcrumbItem: FC<BreadcrumbItemProps> = ({
  item,
  position,
  breadcrumbsSize,
  handleActionMenuOpen,
  handleHomeNavigation,
}) => {
  const theme = useTheme();
  const { sx } = useStyle();

  const isFirst = position === 0;
  const isLast = position === breadcrumbsSize - 1;

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
          <IconButton
            onClick={handleClick}
            className="w-8 h-8 bg-transparent hover:bg-[#00030D0D] hover:text-(--color-baseline-80)"
            aria-label="Go back">
            <ArrowLeftIcon className="h-[1.125rem] w-[1.125rem]" />
          </IconButton>
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
