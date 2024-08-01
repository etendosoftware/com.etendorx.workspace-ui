import { cloneElement, useCallback, useRef, useState } from 'react';
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

  const handleChange = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      setSelectedTab(newValue);
      if (onChange && typeof onChange === 'function') {
        onChange(newValue);
      }
    },
    [onChange],
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    (id: string) => {
      setSelectedTab(id);
      if (onChange) {
        onChange(id);
      }
    },
    [onChange],
  );

  const refs = useRef<Record<string, () => void>>({});

  const hadleMouseEnter = useCallback((id: string) => {
    if (!refs.current[id]) {
      refs.current[id] = () => setHoveredTab(id);
    }

    return refs.current[id];
  }, []);
  const handleLeave = useCallback(() => setHoveredTab(null), []);

  const buildTabs = useCallback(
    (tab: TabItem) => {
      const isSelected = selectedTab === tab.id;
      const isHovered = hoveredTab === tab.id;

      return (
        <Tab
          key={tab.id}
          value={tab.id}
          icon={
            tab.showInTab !== 'label' && tab.icon
              ? cloneElement(tab.icon as React.ReactElement, {
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
          onMouseEnter={hadleMouseEnter(tab.id)}
          onMouseLeave={handleLeave}
          sx={sx.tab}
        />
      );
    },
    [hadleMouseEnter, handleLeave, hoveredTab, selectedTab],
  );

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
          {tabs.map(buildTabs)}
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
                  cloneElement(tab.icon as React.ReactElement, {
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
