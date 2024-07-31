import React, { useState } from 'react';
import {
  Tabs,
  Tab,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { PrimaryTabsProps, TabItem } from './types';
import { menuStyle, styles, sx, tabIndicatorProps } from './styles';
import IconButton from '../IconButton';

const PrimaryTabs: React.FC<PrimaryTabsProps> = ({ tabs, onChange, icon }) => {
  const [selectedTab, setSelectedTab] = useState(tabs[0]?.id || '');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (id: string) => {
    setSelectedTab(id);
    if (onChange) {
      onChange(id);
    }
  };

  return (
    <Box style={styles.containerBox}>
      <Box style={styles.tabsContainer}>
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={tabIndicatorProps}
          aria-label="primary tabs"
          sx={sx.tabs}>
          {tabs.map((tab: TabItem) => {
            const isSelected = selectedTab === tab.id;
            const isHovered = hoveredTab === tab.id;

            return (
              <Tab
                key={tab.id}
                value={tab.id}
                icon={
                  tab.showInTab !== 'label' && tab.icon
                    ? React.cloneElement(tab.icon as React.ReactElement, {
                        style: {
                          fill: isSelected
                            ? tab.fill
                            : isHovered
                              ? tab.hoverFill
                              : tab.fill,
                          transition: 'fill 0.3s',
                        },
                      })
                    : undefined
                }
                label={tab.showInTab !== 'icon' ? tab.label : undefined}
                iconPosition="start"
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                sx={sx.tab}
              />
            );
          })}
        </Tabs>
      </Box>
      <IconButton onClick={handleMenuOpen} style={styles.iconButtonMore}>
        {icon}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: { sx: sx.menu },
        }}
        MenuListProps={{ sx: menuStyle }}>
        {tabs.map(tab => {
          const isSelected = selectedTab === tab.id;
          return (
            <MenuItem
              key={tab.id}
              onClick={() => handleMenuItemClick(tab.id)}
              sx={sx.menuItem}>
              <Box sx={sx.iconBox}>
                {tab.icon &&
                  React.cloneElement(tab.icon as React.ReactElement, {
                    style: { fill: tab.fill, flexShrink: 0 },
                  })}
                <Tooltip title={tab.label} enterDelay={500} leaveDelay={100}>
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
};

export default PrimaryTabs;
