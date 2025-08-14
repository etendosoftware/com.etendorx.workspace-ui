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

"use client";

import CheckIcon from "@mui/icons-material/Check";
import { Box, ListItemIcon, MenuItem, Tab, Tabs } from "@mui/material";
import React, { useCallback, useState, useMemo } from "react";
import IconButton from "../IconButton";
import Menu from "../Menu";
import Tooltip from "../Tooltip";
import { tabIndicatorProps, useStyle } from "./styles";
import type { PrimaryTabsProps } from "./types";

const PrimaryTabs: React.FC<PrimaryTabsProps> = React.memo(({ tabs, onChange, icon }) => {
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.id || "");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const { sx, styles } = useStyle();

  const handleChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      event.preventDefault();
      setSelectedTab(newValue);
      onChange?.(newValue);
    },
    [onChange]
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    (id: string) => {
      setSelectedTab(id);
      onChange?.(id);
      handleMenuClose();
    },
    [handleMenuClose, onChange]
  );

  const handleMouseEnter = useCallback((id: string) => {
    setHoveredTab(id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredTab(null);
  }, []);

  const buildTabs = useMemo(
    () =>
      tabs.map((tab) => {
        const isSelected = selectedTab === tab.id;
        const isHovered = hoveredTab === tab.id;

        const showIcon = tab.showInTab !== "label" && tab.icon && (isSelected || tab.showInTab === "icon");

        return (
          <Tab
            key={tab.id}
            value={tab.id}
            icon={
              showIcon
                ? React.cloneElement(tab.icon as React.ReactElement, {
                    style: {
                      fill: isSelected ? tab.fill : isHovered ? tab.hoverFill : tab.fill,
                      transition: "fill 0.3s",
                    },
                  })
                : undefined
            }
            label={tab.showInTab !== "icon" ? tab.label : undefined}
            iconPosition="start"
            onMouseEnter={() => handleMouseEnter(tab.id)}
            onMouseLeave={handleMouseLeave}
            sx={sx.tab}
            onClick={(event) => {
              event.preventDefault();
              handleChange(event, tab.id);
            }}
          />
        );
      }),
    [tabs, selectedTab, hoveredTab, handleMouseLeave, sx.tab, handleMouseEnter, handleChange]
  );

  return (
    <Box sx={styles.containerBox}>
      <Box sx={styles.tabsContainer}>
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          scrollButtons="auto"
          variant="scrollable"
          TabIndicatorProps={tabIndicatorProps}
          aria-label="primary tabs"
          sx={sx.tabs}>
          {buildTabs}
        </Tabs>
      </Box>
      <IconButton onClick={handleMenuOpen}>{icon}</IconButton>
      <Menu anchorEl={anchorEl} onClose={handleMenuClose}>
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id;
          return (
            <MenuItem
              key={tab.id}
              onClick={() => handleMenuItemClick(tab.id)}
              sx={() => ({
                ...sx.menuItem,
                ...(isSelected ? sx.selectedMenuItem : {}),
              })}>
              <Box sx={sx.iconBox}>
                {tab.icon &&
                  React.cloneElement(tab.icon as React.ReactElement, {
                    style: { fill: tab.fill, flexShrink: 0 },
                  })}
                <Tooltip title={tab.label}>
                  <span>{tab.label}</span>
                </Tooltip>
              </Box>
              {isSelected && (
                <ListItemIcon
                  sx={{
                    visibility: isSelected ? "visible" : "hidden",
                    flexShrink: 0,
                  }}>
                  <CheckIcon sx={{ color: tab.fill }} />
                </ListItemIcon>
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
});

export default PrimaryTabs;
