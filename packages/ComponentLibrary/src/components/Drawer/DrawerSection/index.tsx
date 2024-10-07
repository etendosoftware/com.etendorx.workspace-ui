import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Collapse,
  Popper,
  Paper,
  ClickAwayListener,
  Grow,
} from '@mui/material';
import { styles } from '../styles';
import MenuTitle from '../MenuTitle';
import { theme } from '../../../theme';
import { DrawerSectionProps } from '../types';
import { useParams } from 'react-router-dom';
import { findActive } from '../../../utils/drawerUtils';

const DrawerSection: React.FC<DrawerSectionProps> = ({
  item,
  onClick,
  open,
  isSearchActive,
  onToggleExpand,
  hasChildren,
  isExpandable,
}) => {
  const { windowId } = useParams();
  const isSelected = Boolean(windowId?.length && item.windowId === windowId);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(
    isSelected || findActive(windowId, item.children),
  );

  const popperOpen = Boolean(anchorEl);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!open) {
        setAnchorEl(anchorEl ? null : event.currentTarget);
      } else if (hasChildren && isExpandable) {
        setExpanded(prev => !prev);
        onToggleExpand();
      } else if (item.windowId) {
        onClick(`/window/${item.windowId}`);
      } else {
        console.error('DrawerSection: unexpected type');
      }
    },
    [item, onClick, open, anchorEl, hasChildren, isExpandable, onToggleExpand],
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
      background: expanded
        ? theme.palette.dynamicColor.contrastText
        : 'transparent',
    }),
    [expanded, open],
  );

  const shouldShowChildren = isSearchActive || expanded;

  useEffect(() => {
    setExpanded(isSelected || findActive(windowId, item.children));
  }, [isSelected, item.children, windowId]);

  return (
    <div style={mainStyle}>
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
              onToggleExpand={onToggleExpand}
              hasChildren={Boolean(subitem.children?.length)}
              isExpandable={isExpandable && !isSearchActive}
              isExpanded={false}
            />
          ))}
        </Collapse>
      )}
      <Popper
        open={popperOpen}
        anchorEl={anchorEl}
        placement="right-start"
        transition>
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
                      onToggleExpand={onToggleExpand}
                      hasChildren={Boolean(subitem.children?.length)}
                      isExpandable={isExpandable && !isSearchActive}
                      isExpanded={false}
                    />
                  ))}
                </div>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
};

export default DrawerSection;
