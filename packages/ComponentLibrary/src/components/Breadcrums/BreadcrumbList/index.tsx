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

import { Box, Breadcrumbs, MenuItem, useTheme } from "@mui/material";
import { type FC, useCallback, useMemo, useState } from "react";
import MoreHorizIcon from "../../../assets/icons/more-horizontal.svg";
import IconButton from "../../IconButton";
import Menu from "../../Menu";
import { useStyle } from "../styles";
import type { BreadcrumbListProps } from "../types";
import BreadcrumbItem from "../BreadcrumbItem/index";

const BreadcrumbList: FC<BreadcrumbListProps> = ({ items, handleActionMenuOpen, handleHomeNavigation, separator }) => {
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
    return (
      <Breadcrumbs separator={separator} aria-label="breadcrumb" sx={sx.breadcrumbs}>
        {items.map((item, index) => (
          <BreadcrumbItem
            key={item.id}
            item={item}
            position={index}
            breadcrumbsSize={items.length}
            handleActionMenuOpen={handleActionMenuOpen}
            handleHomeNavigation={handleHomeNavigation}
          />
        ))}
      </Breadcrumbs>
    );
  }

  return (
    <Breadcrumbs separator={separator} aria-label="breadcrumb" sx={sx.breadcrumbs}>
      <BreadcrumbItem
        item={firstItem}
        position={0}
        breadcrumbsSize={items.length}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
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
      <BreadcrumbItem
        item={lastItem}
        position={items.length - 1}
        breadcrumbsSize={items.length}
        handleActionMenuOpen={handleActionMenuOpen}
        handleHomeNavigation={handleHomeNavigation}
      />
    </Breadcrumbs>
  );
};

export default BreadcrumbList;
