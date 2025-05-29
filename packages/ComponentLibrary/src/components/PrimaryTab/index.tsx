'use client';

import React, { useCallback, useState, useMemo, useRef } from 'react';
import { Tabs, Tab, Box, MenuItem, ListItemIcon } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import type { PrimaryTabsProps } from './types';
import { tabIndicatorProps, useStyle } from './styles';
import IconButton from '../IconButton';
import Menu from '../Menu';
import Tooltip from '../Tooltip';

const PrimaryTabs: React.FC<PrimaryTabsProps> = React.memo(({ tabs, onChange, icon }) => {
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.id || '');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
  const { sx, styles } = useStyle();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handleChange = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      event.preventDefault();
      setSelectedTab(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );

  const handleMenuOpen = useCallback(() => {
    setIsOpenMenu(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsOpenMenu(false);
  }, []);

  const handleMenuItemClick = useCallback(
    (id: string) => {
      setSelectedTab(id);
      onChange?.(id);
      handleMenuClose();
    },
    [handleMenuClose, onChange],
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

        const showIcon = tab.showInTab !== 'label' && tab.icon && (isSelected || tab.showInTab === 'icon');

        return (
          <Tab
            key={tab.id}
            value={tab.id}
            icon={
              showIcon
                ? React.cloneElement(tab.icon as React.ReactElement, {
                    style: {
                      fill: isSelected ? tab.fill : isHovered ? tab.hoverFill : tab.fill,
                      transition: 'fill 0.3s',
                    },
                  })
                : undefined
            }
            label={tab.showInTab !== 'icon' ? tab.label : undefined}
            iconPosition='start'
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
    [tabs, selectedTab, hoveredTab, handleMouseLeave, sx.tab, handleMouseEnter, handleChange],
  );

  return (
    <Box sx={styles.containerBox}>
      <Box sx={styles.tabsContainer}>
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          scrollButtons='auto'
          variant='scrollable'
          TabIndicatorProps={tabIndicatorProps}
          aria-label='primary tabs'
          sx={sx.tabs}>
          {buildTabs}
        </Tabs>
      </Box>
      <IconButton onClick={handleMenuOpen} ref={buttonRef}>
        {icon}
      </IconButton>
      <Menu anchorRef={buttonRef} open={isOpenMenu} onClose={handleMenuClose}>
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
                    visibility: isSelected ? 'visible' : 'hidden',
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
