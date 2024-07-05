import React, { useState, useRef, useEffect } from 'react';
import { Tabs, Tab, Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

import TabLabel from './components/TabLabel';

import {
  containerStyles,
  menuItemStyles,
  menuPaperProps,
  tabsContainerStyles,
  tabStyles,
  iconContainerStyles,
  iconStyles,
  menuItemRootStyles,
  menuItemIconStyles,
  menuItemTypographyStyles,
  rightButtonStyles,
  rightButtonContainerStyles,
} from './styles';

const SecondaryTabs: React.FC<any> = ({ tabsConfig, selectedTab = 0, onChange }) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = tabsRef.current?.clientWidth || 0;
      const tabWidth = 150;
      const newVisibleCount = Math.floor((width - 40) / tabWidth); // Restamos 40px para el botón de más opciones
      setVisibleCount(newVisibleCount);
    };

    window.addEventListener('resize', updateVisibleCount);
    updateVisibleCount();

    return () => {
      window.removeEventListener('resize', updateVisibleCount);
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    event.preventDefault();
    onChange(newValue);
  };

  const handleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={containerStyles}>
      <Box ref={tabsRef} sx={tabsContainerStyles}>
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: "flex-start",
            width: 'calc(100% - 40px)', // Restamos 40px para el botón de más opciones
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          {tabsConfig.slice(0, visibleCount).map((tab: any, index) => (
            <Tab
              key={index}
              label={
                <TabLabel
                  icon={
                    <Box component="span" sx={iconContainerStyles}>
                      <Box component="span" sx={iconStyles}>
                        {typeof tab.icon === 'string' ? tab.icon : React.cloneElement(tab?.icon, {
                          sx: menuItemIconStyles
                        })}
                      </Box>
                    </Box>
                  }
                  text={tab.label}
                  isLoading={tab.isLoading}
                  count={tab.numberOfItems}
                />
              }
              iconPosition="start"
              sx={tabStyles(tab.numberOfItems, tab.isLoading)}
            />
          ))}
        </Tabs>
        {tabsConfig.length > visibleCount && (
          <Box sx={rightButtonContainerStyles}>
            <IconButton onClick={handleMenu} sx={rightButtonStyles(open)}>
              <KeyboardDoubleArrowRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: menuPaperProps }}
        slotProps={{ root: { sx: menuItemRootStyles } }}
      >
        {tabsConfig.slice(visibleCount).map((tab: any, index) => (
          <MenuItem
            key={index}
            onClick={() => { onChange(index + visibleCount); handleClose(); }}
            sx={menuItemStyles}
          >
            {typeof tab.icon === 'string' ? <Typography style={menuItemTypographyStyles}>{tab.icon}</Typography> : React.cloneElement(tab.icon, {
              style: menuItemTypographyStyles
            })}
            {tab.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default SecondaryTabs;
