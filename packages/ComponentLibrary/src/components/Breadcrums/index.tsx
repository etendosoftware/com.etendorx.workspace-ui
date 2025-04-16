import { FC, useState, useCallback, useEffect, useMemo } from 'react';
import { Tabs, Tab, Typography, Box, IconButton, useTheme, Menu, MenuItem } from '@mui/material';
import HomeIcon from '../../assets/icons/home.svg?url';
import XIcon from '../../assets/icons/x.svg?url';
import { menuStyle, useStyle } from './styles';
import {
  tabsContainerStyle,
  homeIconStyle,
  tabBaseStyle,
  tabLabelStyle,
} from './styles';
import { BreadcrumbProps, BreadcrumbAction } from './types';
import ToggleChip from '../Toggle/ToggleChip';

const Breadcrumb: FC<BreadcrumbProps> = ({ items, activeTabId, onTabChange }) => {
  const theme = useTheme();
  const { sx } = useStyle();

  // Resolve initial tab: fallback to first if 'home'
  const initialTabId = useMemo(
    () => (activeTabId === 'home' && items.length > 0 ? items[0].id : activeTabId),
    [activeTabId, items]
  );

  const [localActiveTabId, setLocalActiveTabId] = useState(initialTabId);

  // Sync local tab state on external change
  useEffect(() => {
    setLocalActiveTabId(initialTabId);
  }, [initialTabId]);

  // Fallback if current tab is no longer available
  const effectiveActiveTabId = useMemo(
    () => (items.some(item => item.id === localActiveTabId) ? localActiveTabId : items[0]?.id ?? 0),
    [items, localActiveTabId]
  );

  // Menu state for actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentActions, setCurrentActions] = useState<BreadcrumbAction[]>([]);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});

  const menuProps = useCallback(() => ({ sx: menuStyle }), []);

  const closeActionMenu = useCallback(() => setAnchorEl(null), []);

  const toggleAction = useCallback(
    (actionId: string) => setToggleStates(prev => ({ ...prev, [actionId]: !prev[actionId] })),
    []
  );

  // Change active tab and trigger callback
  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newTabId: string) => {
      if (newTabId === localActiveTabId) return;
      items.find(item => item.id === newTabId)?.onClick?.();
      setLocalActiveTabId(newTabId);
    },
    [items, localActiveTabId]
  );

  // Close tab logic: fallback or redirect
  const handleTabClose = useCallback(
    (tabId: string) => {
      const isLastTab = items.length === 1 && items[0].id === tabId;
      if (isLastTab) return onTabChange('/');

      const remaining = items.filter(item => item.id !== tabId);
      if (tabId === localActiveTabId) {
        const nextTabId = remaining[0]?.id;
        setLocalActiveTabId(nextTabId);
        onTabChange(nextTabId);
      }
    },
    [items, localActiveTabId, onTabChange]
  );

  return (
    <Box>
      <Tabs
        value={items.some(i => i.id === effectiveActiveTabId) ? effectiveActiveTabId : false}
        onChange={handleTabChange}
        aria-label="navigation tabs"
        sx={tabsContainerStyle(theme)}
      >
        {/* Home icon (not a tab) */}
        <img alt="Home Icon" src={HomeIcon} style={homeIconStyle} />

        {/* Render each dynamic tab */}
        {items.map(item => (
          <Tab
            key={item.id}
            value={item.id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', ...sx.tabLabelContainer }}>
                <Typography noWrap sx={tabLabelStyle(theme)}>
                  {item.label}
                </Typography>
                <IconButton
                  size="small"
                  onClick={e => {
                    e.stopPropagation();
                    item.onClose?.();
                    handleTabClose(item.id);
                  }}
                  sx={{ ml: 1.25, p: 0 }}
                >
                  <img
                    alt="Close Tab"
                    src={XIcon}
                    style={{ cursor: 'pointer', height: '1.15rem', width: '1.15rem' }}
                  />
                </IconButton>
              </Box>
            }
            sx={tabBaseStyle(theme, effectiveActiveTabId === item.id, effectiveActiveTabId === '/')}
          />
        ))}
      </Tabs>

      {/* Dropdown action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeActionMenu}
        MenuListProps={menuProps()}
      >
        {currentActions.map(action => (
          <MenuItem key={action.id} onClick={() => { }} sx={sx.menuItem}>
            <Box sx={sx.iconBox}>
              {action.icon}
              <span>{action.label}</span>
            </Box>
            {action.toggle && (
              <Box sx={sx.toggleContainer}>
                <ToggleChip
                  isActive={toggleStates[action.id] ?? false}
                  onToggle={() => toggleAction(action.id)}
                />
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default Breadcrumb;
