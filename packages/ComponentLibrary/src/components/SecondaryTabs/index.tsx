'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo, ReactElement } from 'react';
import { Tabs, Tab, Box, IconButton, Menu, MenuItem, Typography, useTheme } from '@mui/material';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import TabLabel from './components/TabLabel';
import { getRightButtonStyles, useStyle } from './styles';
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
  const { styles, sx } = useStyle();
  const theme = useTheme();

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
              <Box component="span" sx={sx.iconContainer}>
                {renderIcon(tab.icon, styles.menuItemIcon)}
              </Box>
            }
            text={tab.label}
            isLoading={tab.isLoading}
            count={tab.numberOfItems}
          />
        }
        iconPosition="start"
        sx={sx.tab}
      />
    ),
    [sx.iconContainer, styles.menuItemIcon, sx.tab],
  );

  return (
    <Box sx={sx.container}>
      <Box ref={tabsRef} sx={sx.tabsContainer}>
        <Tabs value={selectedTab} onChange={handleChange} variant="scrollable" scrollButtons="auto">
          {visibleTabs.map(renderTab)}
        </Tabs>
        {hiddenTabs.length > 0 && (
          <Box sx={sx.rightButtonContainer}>
            <IconButton onClick={handleMenu} sx={getRightButtonStyles(Boolean(anchorEl), theme)}>
              <KeyboardDoubleArrowRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: sx.menuPaper }}
        slotProps={{ root: { sx: sx.menuItemRoot } }}>
        {hiddenTabs.map((tab: TabContent, index: number) => (
          <MenuItem
            key={index}
            onClick={() => {
              onChange(index + visibleCount);
              tab.onClick();
              handleClose();
            }}
            sx={sx.menuItem}>
            {renderIcon(tab.icon, styles.menuItemTypography)}
            {tab.label}
          </MenuItem>
        ))}
      </Menu>
      {content[selectedTab].content}
    </Box>
  );
};

export default SecondaryTabs;
