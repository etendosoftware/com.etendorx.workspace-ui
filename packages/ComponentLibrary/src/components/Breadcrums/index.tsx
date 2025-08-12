/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { Box, MenuItem, useTheme } from "@mui/material";
import { type FC, useCallback, useMemo, useState } from "react";
import NavigateNextIcon from "../../assets/icons/chevron-right.svg";
import Menu from "../Menu";
import ToggleChip from "../Toggle/ToggleChip";
import { useStyle } from "./styles";
import type { BreadcrumbAction, BreadcrumbProps } from "./types";
import BreadcrumbList from "./BreadcrumbList/index";

const Breadcrumb: FC<BreadcrumbProps> = ({ items, separator, onHomeClick }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const [currentActions, setCurrentActions] = useState<BreadcrumbAction[]>([]);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const { sx } = useStyle();

  const defaultSeparator = useMemo(
    () => (
      <NavigateNextIcon width="1.25rem" height="1.25rem" fill={theme.palette.baselineColor.transparentNeutral[30]} />
    ),
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
