import React from 'react';
import { Tabs, Tab, Box, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import TabPanel from './components/TabPanel';
import TabLabel from './components/TabLabel';
import { SecondaryTabsProps } from './types';
import {
  containerStyles, menuItemStyles, menuPaperProps, tabsContainerStyles,
  tabStyles, iconContainerStyles, iconStyles, menuItemRootStyles,
  menuItemIconStyles, menuItemTypographyStyles, rightButtonStyles,
  rightButtonContainerStyles
} from './styles';

const SearchModalAtFinish: React.FC<SecondaryTabsProps> = ({ tabsConfig }) => {
  const [value, setValue] = React.useState(0);
  const [visibleCount, setVisibleCount] = React.useState(5);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const tabsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateVisibleCount = () => {
      const width = tabsRef.current?.clientWidth || 0;
      const tabWidth = 150;
      const newVisibleCount = Math.floor(width / tabWidth);
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
    setValue(newValue);
    tabsConfig[newValue].onClick();
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', height: '100%' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ minHeight: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: "space-between", width: '100%' }}
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
                    isSelected={index === value}
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
              onClick={() => { setValue(index + visibleCount); handleClose(); }}
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
      {
        tabsConfig.map((tab, index) => (
          <TabPanel value={value} index={index} key={index}>
            {tab.content}
          </TabPanel>
        ))
      }
    </Box>
  );
};

export default SearchModalAtFinish;
