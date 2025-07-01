import { Box, MenuItem, useTheme } from "@mui/material";
import { type FC, useCallback, useMemo, useState } from "react";
import NavigateNextIcon from "../../assets/icons/chevron-right.svg";
import Menu from "../Menu";
import ToggleChip from "../Toggle/ToggleChip";
import { useStyle } from "./styles";
import type { BreadcrumbAction, BreadcrumbProps } from "./types";
import BreadcrumbList from "./BreadcrumbList/index.tsx";

const Breadcrumb: FC<BreadcrumbProps> = ({ items, separator, onHomeClick }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [currentActions, setCurrentActions] = useState<BreadcrumbAction[]>([]);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const { sx } = useStyle();

  const defaultSeparator = useMemo(
    () => <NavigateNextIcon fill={theme.palette.baselineColor.transparentNeutral[30]} />,
    [theme]
  );

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

  const handleToggle = useCallback((actionId: string) => {
    setToggleStates((prevStates) => ({
      ...prevStates,
      [actionId]: !prevStates[actionId],
    }));
  }, []);

  const activeSeparator = separator ?? defaultSeparator;

  return (
    <Box sx={sx.container}>
      <BreadcrumbList
        items={items}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={onHomeClick}
        separator={activeSeparator}
      />
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
