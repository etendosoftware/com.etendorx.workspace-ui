import { Box, Breadcrumbs, Link, MenuItem, Typography, useTheme } from "@mui/material";
import { type FC, useCallback, useMemo, useState } from "react";
import ArrowLeftIcon from "../../assets/icons/arrow-left.svg";
import ChevronDown from "../../assets/icons/chevron-down.svg";
import NavigateNextIcon from "../../assets/icons/chevron-right.svg";
import MoreHorizIcon from "../../assets/icons/more-horizontal.svg";
import IconButton from "../IconButton";
import Menu from "../Menu";
import ToggleChip from "../Toggle/ToggleChip";
import { useStyle } from "./styles";
import type { BreadcrumbAction, BreadcrumbItem, BreadcrumbProps } from "./types";

const Breadcrumb: FC<BreadcrumbProps> = ({ items, onHomeClick, homeIcon = null, homeText = "Home", separator }) => {
  const [isHomeHovered, setIsHomeHovered] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [middleAnchorEl, setMiddleAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [currentActions, setCurrentActions] = useState<BreadcrumbAction[]>([]);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const { sx } = useStyle();

  const defaultSeparator = useMemo(
    () => <NavigateNextIcon fill={theme.palette.baselineColor.transparentNeutral[30]} />,
    [theme],
  );

  const handleMouseEnter = useCallback(() => setIsHomeHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHomeHovered(false), []);

  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, actions: BreadcrumbAction[]) => {
      setAnchorEl(event.currentTarget);
      setCurrentActions(actions);
    },
    [],
  );

  const handleActionMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMiddleMenuOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setMiddleAnchorEl(event.currentTarget);
  }, []);

  const handleMiddleMenuClose = useCallback(() => {
    setMiddleAnchorEl(null);
  }, []);

  const handleClick = useCallback(
    (e: { preventDefault: () => void }) => {
      e.preventDefault();
      onHomeClick();
    },
    [onHomeClick],
  );

  const handleToggle = useCallback((actionId: string) => {
    setToggleStates((prevStates) => ({
      ...prevStates,
      [actionId]: !prevStates[actionId],
    }));
  }, []);

  const renderHomeIcon = useCallback(() => {
    if (isHomeHovered) {
      return (
        <IconButton className="w-10 h-10 bg-(--color-baseline-0) hover:bg-(--color-baseline-0) hover:text-(--color-baseline-80)">
          <ArrowLeftIcon />
        </IconButton>
      );
    }
    return <IconButton className="w-10 h-10 text-[1.5rem] bg-(--color-transparent-neutral-5)">{homeIcon}</IconButton>;
  }, [homeIcon, isHomeHovered]);

  const renderBreadcrumbItem = useCallback(
    (item: BreadcrumbItem, isLast: boolean) => (
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
            {item.actions && item.actions.length > 0 && (
              <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleActionMenuOpen(e, item.actions!)}>
                <ChevronDown fill={theme.palette.baselineColor.neutral[80]} />
              </IconButton>
            )}
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
    ),
    [
      handleActionMenuOpen,
      sx.breadcrumbItem,
      sx.breadcrumbTypography,
      sx.lastItemTypography,
      sx.link,
      theme.palette.baselineColor.neutral,
    ],
  );

  const renderBreadcrumbItems = useMemo(() => {
    if (items.length <= 2) {
      return items.map((item, index) => renderBreadcrumbItem(item, index === items.length - 1));
    }
    const firstItem = items[0];
    const lastItem = items[items.length - 1];
    const middleItems = items.slice(1, -1);

    return (
      <>
        {renderBreadcrumbItem(firstItem, false)}
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
        {renderBreadcrumbItem(lastItem, true)}
      </>
    );
  }, [
    handleMiddleMenuClose,
    handleMiddleMenuOpen,
    items,
    middleAnchorEl,
    renderBreadcrumbItem,
    sx.breadcrumbItem,
    sx.menuItem,
    theme.palette.baselineColor.neutral,
  ]);

  const activeSeparator = separator ?? defaultSeparator;

  return (
    <Box sx={sx.container}>
      <Breadcrumbs separator={activeSeparator} aria-label="breadcrumb" sx={sx.breadcrumbs}>
        <Box sx={sx.homeContainer}>
          <Link href="#" onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {renderHomeIcon()}
          </Link>
          <Typography onClick={onHomeClick} sx={sx.homeText}>
            {homeText}
          </Typography>
        </Box>
        {renderBreadcrumbItems}
      </Breadcrumbs>
      <Menu anchorEl={anchorEl} onClose={handleActionMenuClose}>
        {currentActions.map((action) => (
          <MenuItem key={action.id} onClick={() => {}} sx={sx.menuItem}>
            <Box sx={sx.iconBox}>
              {action.icon}
              <span>{action.label}</span>
            </Box>
            {action.toggle && (
              <Box sx={sx.toggleContainer}>
                <ToggleChip isActive={toggleStates[action.id] ?? false} onToggle={() => handleToggle(action.id)} />
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Breadcrumb;
