import React, { useCallback, useState, cloneElement } from 'react';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
  tabsClasses,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import IconButton from '../IconButton';
import { styles } from './styles';
import { sx, menuStyle } from '../PrimaryTab/styles';
import { TabContent, TabsMUIProps } from './types';

const TabsMUI = ({
  tabArray,
  homeTooltip = 'Home Button',
  homeIcon,
  moreIcon,
  closeIcon,
}: TabsMUIProps) => {
  const [tabs] = useState(tabArray);
  const [value, setValue] = useState(tabArray[0]?.id || '');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setValue(newValue);
    },
    [],
  );

  const handleMouseHover = useCallback(
    (id: string | null) => () => setHoveredTab(id),
    [],
  );

  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    (id: string) => {
      setValue(id);
      handleMenuClose();
    },
    [handleMenuClose],
  );

  const handleCloseButtonClick = useCallback(
    // TODO: Implement close function for tabs
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
    },
    [],
  );

  const buildTabs = useCallback(
    (tab: TabContent) => {
      const isSelected = value === tab.id;
      const isHovered = hoveredTab === tab.id;

      return (
        <Tab
          key={tab.id}
          value={tab.id}
          icon={cloneElement(tab.icon as React.ReactElement, {
            style: {
              fill: isSelected
                ? tab.fill
                : isHovered
                  ? tab.hoverFill
                  : tab.fill,
              transition: 'fill 0.3s',
            },
          })}
          label={
            <Box sx={styles.tabLabel}>
              {tab.title}
              <IconButton
                sx={styles.closeButton}
                onClick={handleCloseButtonClick}
                aria-label={tab.title}>
                {closeIcon}
              </IconButton>
            </Box>
          }
          iconPosition="start"
          onMouseEnter={handleMouseHover(tab.id)}
          onMouseLeave={handleMouseHover(null)}
          sx={styles.tab}
          aria-labelledby={`tab-${tab.id}`}
        />
      );
    },
    [closeIcon, handleCloseButtonClick, handleMouseHover, hoveredTab, value],
  );

  return (
    <Box>
      <TabContext value={value}>
        <Box sx={styles.container}>
          <IconButton tooltip={homeTooltip} sx={styles.homeButton}>
            {homeIcon}
          </IconButton>
          <TabList
            onChange={handleChange}
            variant="scrollable"
            scrollButtons={true}
            allowScrollButtonsMobile
            sx={{
              ...styles.tabList,
              [`& .${tabsClasses.scrollButtons}`]: {
                '&.Mui-disabled': { opacity: 0.3 },
              },
            }}>
            {tabs.map(buildTabs)}
          </TabList>
          <IconButton onClick={handleMenuOpen} sx={styles.homeButton}>
            {moreIcon}
          </IconButton>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          slotProps={{
            paper: { sx: sx.menu },
          }}
          MenuListProps={{ sx: menuStyle }}>
          {tabs.map(tab => {
            const isSelected = value === tab.id;
            return (
              <MenuItem
                key={tab.id}
                onClick={() => handleMenuItemClick(tab.id)}
                sx={() => ({
                  ...sx.menuItem,
                  ...(isSelected ? sx.selectedMenuItem : {}),
                })}
                aria-label={tab.title}>
                <Box sx={sx.iconBox}>
                  {React.isValidElement(tab.icon) &&
                    cloneElement(tab.icon as React.ReactElement, {
                      style: { fill: tab.fill, flexShrink: 0 },
                    })}{' '}
                  <Tooltip
                    title={tab.title}
                    enterDelay={500}
                    leaveDelay={100}
                    aria-label={tab.title}>
                    <span>{tab.title}</span>
                  </Tooltip>
                </Box>
                {isSelected && (
                  <ListItemIcon
                    sx={{ visibility: isSelected ? 'visible' : 'hidden' }}
                    aria-hidden={!isSelected}>
                    <CheckIcon sx={{ color: tab.fill }} />
                  </ListItemIcon>
                )}
              </MenuItem>
            );
          })}
        </Menu>
        {tabs.map(tab => (
          <TabPanel
            key={tab.id}
            value={tab.id}
            sx={styles.tabPanel}
            aria-labelledby={`tab-${tab.id}`}>
            {tab.children}
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  );
};

export default TabsMUI;
