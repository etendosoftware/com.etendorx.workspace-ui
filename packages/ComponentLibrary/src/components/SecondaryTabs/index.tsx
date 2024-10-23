'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo, ReactElement } from 'react';
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
  menuItemTypographyStyles,
  rightButtonStyles,
  rightButtonContainerStyles,
} from './styles';
import { SecondaryTabsProps, TabContent } from './types';

const tabSize = 150;

const renderIcon = (icon: TabContent['icon'], style: React.CSSProperties | undefined): ReactElement => {
  const safeStyle = style || {};
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon, { style: { ...icon.props.style, ...safeStyle } } as any);
  }
  if (typeof icon === 'string') {
    return <Typography style={safeStyle}>{icon}</Typography>;
  }
  if (typeof icon === 'function') {
    return icon({ style: safeStyle });
  }
  return <></>;
};

const SecondaryTabs: React.FC<SecondaryTabsProps> = ({ content, selectedTab, onChange }) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const updateVisibleCount = useCallback(() => {
    if (tabsRef.current) {
      const width = tabsRef.current.clientWidth;
      const tabWidth = tabSize;
      const newVisibleCount = Math.max(1, Math.floor((width - 40) / tabWidth));
      setVisibleCount(newVisibleCount);
    }
  }, []);

  useEffect(() => {
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, [updateVisibleCount]);

  const handleChange = useCallback(
    (event: React.SyntheticEvent, newValue: number) => {
      event.preventDefault();
      onChange(newValue);
      content[newValue].onClick();
    },
    [content, onChange],
  );

  const handleMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const visibleTabs = useMemo(() => content.slice(0, visibleCount), [content, visibleCount]);
  const hiddenTabs = useMemo(() => content.slice(visibleCount), [content, visibleCount]);

  const renderTab = useCallback(
    (tab: TabContent, index: number) => (
      <Tab
        key={index}
        label={
          <TabLabel
            icon={
              <Box component="span" sx={iconContainerStyles}>
                <Box component="span" sx={iconStyles}>
                  {renderIcon(tab.icon, menuItemTypographyStyles)}
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
    ),
    [],
  );

  return (
    <Box sx={containerStyles}>
      <Box ref={tabsRef} sx={tabsContainerStyles}>
        <Tabs value={selectedTab} onChange={handleChange} variant="scrollable" scrollButtons="auto">
          {visibleTabs.map(renderTab)}
        </Tabs>
        {hiddenTabs.length > 0 && (
          <Box sx={rightButtonContainerStyles}>
            <IconButton onClick={handleMenu} sx={rightButtonStyles(Boolean(anchorEl))}>
              <KeyboardDoubleArrowRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: menuPaperProps }}
        slotProps={{ root: { sx: menuItemRootStyles } }}>
        {hiddenTabs.map((tab: TabContent, index: number) => (
          <MenuItem
            key={index}
            onClick={() => {
              onChange(index + visibleCount);
              tab.onClick();
              handleClose();
            }}
            sx={menuItemStyles}>
            {renderIcon(tab.icon, menuItemTypographyStyles)}
            {tab.label}
          </MenuItem>
        ))}
      </Menu>
      {content[selectedTab].content}
    </Box>
  );
};

export default SecondaryTabs;
