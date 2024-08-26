import React, { useCallback, useState, useMemo } from 'react';
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
import { PrimaryTabsProps } from './types';
import { menuStyle, styles, sx, tabIndicatorProps } from './styles';
import IconButton from '../IconButton';

const PrimaryTabs: React.FC<PrimaryTabsProps> = React.memo(
  ({ tabs, onChange, icon }) => {
    const [selectedTab, setSelectedTab] = useState(tabs[0]?.id || '');
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleChange = useCallback(
      (event: React.SyntheticEvent, newValue: string) => {
        event.preventDefault();
        setSelectedTab(newValue);
        if (onChange) {
          onChange(newValue);
        }
      },
      [onChange],
    );

    const handleMenuOpen = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
      },
      [],
    );

    const handleMenuClose = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleMenuItemClick = useCallback(
      (id: string) => {
        setSelectedTab(id);
        handleMenuClose();
        if (onChange) {
          onChange(id);
        }
      },
      [onChange, handleMenuClose],
    );

    const handleMouseEnter = useCallback((id: string) => {
      setHoveredTab(id);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setHoveredTab(null);
    }, []);

    const buildTabs = useMemo(
      () =>
        tabs.map(tab => {
          const isSelected = selectedTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          const showIcon =
            tab.showInTab !== 'label' &&
            tab.icon &&
            (isSelected || tab.showInTab === 'icon');

          return (
            <Tab
              key={tab.id}
              value={tab.id}
              icon={
                showIcon
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
              onMouseEnter={() => handleMouseEnter(tab.id)}
              onMouseLeave={handleMouseLeave}
              sx={sx.tab}
              onClick={event => {
                event.preventDefault();
                handleChange(event, tab.id);
              }}
            />
          );
        }),
      [
        tabs,
        selectedTab,
        hoveredTab,
        handleMouseLeave,
        handleMouseEnter,
        handleChange,
      ],
    );

    return (
      <Box sx={styles.containerBox}>
        <Box sx={styles.tabsContainer}>
          <Tabs
            value={selectedTab}
            onChange={handleChange}
            scrollButtons="auto"
            TabIndicatorProps={tabIndicatorProps}
            aria-label="primary tabs"
            sx={sx.tabs}>
            {buildTabs}
          </Tabs>
        </Box>
        <IconButton onClick={handleMenuOpen} sx={styles.iconButtonMore}>
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
                sx={() => ({
                  ...sx.menuItem,
                  ...(isSelected ? sx.selectedMenuItem : {}),
                })}>
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
  },
);

export default PrimaryTabs;
