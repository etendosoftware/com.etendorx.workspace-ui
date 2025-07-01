import { Box, Breadcrumbs, Link, MenuItem, Typography, useTheme } from "@mui/material";
import { type FC, useCallback, useMemo, useState } from "react";
import ArrowLeftIcon from "../../assets/icons/arrow-left.svg";
import NavigateNextIcon from "../../assets/icons/chevron-right.svg";
import IconButton from "../IconButton";
import Menu from "../Menu";
import ToggleChip from "../Toggle/ToggleChip";
import { useStyle } from "./styles";
import type { BreadcrumbAction, BreadcrumbProps } from "./types";
import BreadcrumbList from "./BreadcrumbList/index.tsx";

const Breadcrumb: FC<BreadcrumbProps> = ({ items, onHomeClick, homeIcon = null, homeText = "Home", separator }) => {
  const [isHomeHovered, setIsHomeHovered] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [currentActions, setCurrentActions] = useState<BreadcrumbAction[]>([]);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const { sx } = useStyle();

  const defaultSeparator = useMemo(
    () => <NavigateNextIcon fill={theme.palette.baselineColor.transparentNeutral[30]} />,
    [theme]
  );

  const handleMouseEnter = useCallback(() => setIsHomeHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHomeHovered(false), []);

  const handleActionMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, actions: BreadcrumbAction[]) => {
      setAnchorEl(event.currentTarget);
      setCurrentActions(actions);
    },
    []
  );

  const handleActionMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClick = useCallback(
    (e: { preventDefault: () => void }) => {
      e.preventDefault();
      onHomeClick();
    },
    [onHomeClick]
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
        <BreadcrumbList items={items} handleActionMenuOpen={handleActionMenuOpen} />
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
