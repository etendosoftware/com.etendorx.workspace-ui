import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Collapse, Popper, Paper, ClickAwayListener, Grow, Box } from '@mui/material';
import { styles } from '../styles';
import MenuTitle from '../MenuTitle';
import { theme } from '../../../theme';
import { DrawerSectionProps } from '../types';
import { findActive } from '../../../utils/drawerUtils';

const DrawerSection: React.FC<DrawerSectionProps> = ({
  item,
  onClick,
  open,
  isSearchActive,
  onToggleExpand,
  hasChildren,
  isExpandable,
  windowId,
  isExpanded: externalExpanded,
  parentId,
}) => {
  const isSelected = Boolean(windowId?.length && item.windowId === windowId);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [localExpanded, setLocalExpanded] = useState(isSelected || findActive(windowId, item.children));

  const expanded = externalExpanded !== undefined ? externalExpanded : localExpanded;

  const popperOpen = Boolean(anchorEl);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      handleClick(event as unknown as React.MouseEvent<HTMLElement>);
    }
  };

  const handleNestedToggle = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (!open) {
        setAnchorEl(anchorEl ? null : event.currentTarget);
      } else if (hasChildren && isExpandable) {
        const newExpandedState = !expanded;
        setLocalExpanded(newExpandedState);
        if (parentId) {
          handleNestedToggle(item.id);
        }
        onToggleExpand();
      } else if (item.windowId) {
        onClick(`/window/${item.windowId}`);
      } else {
        console.error('DrawerSection: unexpected type');
      }
    },
    [item, onClick, open, anchorEl, hasChildren, isExpandable, onToggleExpand, expanded, parentId, handleNestedToggle],
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleClickAndClose = useCallback(
    (path: string) => {
      onClick(path);
      handleClose();
    },
    [handleClose, onClick],
  );

  const mainStyle = useMemo(
    () => ({
      ...styles.drawerSectionBox,
      ...(!open && styles.closeSection),
      background: expanded ? theme.palette.dynamicColor.contrastText : 'transparent',
    }),
    [expanded, open],
  );

  const shouldShowChildren = isSearchActive || expanded;

  useEffect(() => {
    if (isSelected || findActive(windowId, item.children)) {
      setLocalExpanded(true);
      if (parentId) {
        handleNestedToggle(item.id);
      }
    }
  }, [isSelected, item.children, windowId, parentId, item.id, handleNestedToggle]);

  useEffect(() => {
    if (item.id === 'recently-viewed' && !isSelected && !findActive(windowId, item.children)) {
      setLocalExpanded(false);
    }
  }, [item.id, isSelected, windowId, item.children]);

  return (
    <Box sx={mainStyle} role="button" aria-expanded={expanded} onKeyDown={handleKeyDown} tabIndex={0}>
      <MenuTitle
        item={item}
        onClick={handleClick}
        selected={isSelected}
        expanded={shouldShowChildren}
        open={open}
        isExpandable={isExpandable && !isSearchActive}
      />
      {hasChildren && open && (
        <Collapse in={shouldShowChildren} timeout="auto">
          {item.children?.map(subitem => (
            <DrawerSection
              key={subitem.id}
              item={subitem}
              onClick={onClick}
              open={open}
              isSearchActive={isSearchActive}
              onToggleExpand={() => handleNestedToggle(subitem.id)}
              hasChildren={Boolean(subitem.children?.length)}
              isExpandable={isExpandable && !isSearchActive}
              isExpanded={expandedSections.has(subitem.id)}
              parentId={item.id}
            />
          ))}
        </Collapse>
      )}
      <Popper open={popperOpen} anchorEl={anchorEl} placement="right-start" transition>
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={300}>
            <Paper style={styles.popper}>
              <ClickAwayListener onClickAway={handleClose}>
                <div style={styles.popperContent}>
                  <MenuTitle
                    item={item}
                    onClick={handleClick}
                    selected={isSelected}
                    expanded={shouldShowChildren}
                    open={true}
                    isExpandable={isExpandable && !isSearchActive}
                  />
                  {item.children?.map(subitem => (
                    <DrawerSection
                      key={subitem.id}
                      item={subitem}
                      onClick={handleClickAndClose}
                      open={true}
                      isSearchActive={isSearchActive}
                      onToggleExpand={() => handleNestedToggle(subitem.id)}
                      hasChildren={Boolean(subitem.children?.length)}
                      isExpandable={isExpandable && !isSearchActive}
                      isExpanded={expandedSections.has(subitem.id)}
                      parentId={item.id}
                    />
                  ))}
                </div>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
};

export default DrawerSection;
