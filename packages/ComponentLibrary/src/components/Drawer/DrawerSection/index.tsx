import { useCallback, useEffect, useMemo, useState } from 'react';
import { Collapse, Popper, Paper, ClickAwayListener, Grow } from '@mui/material';
import { styles } from '../styles';
import MenuTitle from '../MenuTitle';
import { theme } from '../../../theme';
import { DrawerSectionProps } from '../types';
import { useParams } from 'react-router-dom';
import { Menu } from '@workspaceui/etendohookbinder/api/types';

const findActive = (windowId: string | undefined, items: Menu[] | undefined = []): boolean => {
  if (!items || !windowId) return false;

  const stack: Menu[] = [...items];

  while (stack.length > 0) {
    const item = stack.pop();

    if (item) {
      if (item.windowId === windowId) return true;
      if (item.children) stack.push(...item.children);
    }
  }

  return false;
};

export default function DrawerSection({ item, onClick, open }: DrawerSectionProps) {
  const { windowId } = useParams();
  const isSelected = Boolean(windowId?.length && item.windowId === windowId);
  const [expanded, setExpanded] = useState(isSelected || findActive(windowId, item.children));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const popperOpen = Boolean(anchorEl);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!open) {
        setAnchorEl(anchorEl ? null : event.currentTarget);
      } else if (item.children?.length) {
        setExpanded(prev => !prev);
      } else if (item.windowId) {
        onClick(`/window/${item.windowId}`);
      } else {
        console.error('DrawerSection: unexpected type');
      }
    },
    [item, onClick, open, anchorEl],
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

  useEffect(() => {
    setExpanded(isSelected || findActive(windowId, item.children));
  }, [isSelected, item.children, windowId]);

  return (
    <div style={mainStyle}>
      <MenuTitle item={item} onClick={handleClick} selected={isSelected} expanded={expanded} open={open} />
      {item.children && open && (
        <Collapse in={expanded} timeout="auto">
          {item.children.map(subitem => (
            <DrawerSection key={subitem.id} item={subitem} onClick={onClick} open={open} />
          ))}
        </Collapse>
      )}
      <Popper open={popperOpen} anchorEl={anchorEl} placement="right-start" transition>
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={300}>
            <Paper style={styles.popper}>
              <ClickAwayListener onClickAway={handleClose}>
                <div style={styles.popperContent}>
                  <MenuTitle item={item} onClick={handleClick} selected={isSelected} expanded={expanded} open={true} />
                  {item.children?.map(subitem => (
                    <DrawerSection key={subitem.id} item={subitem} onClick={handleClickAndClose} open={true} />
                  ))}
                </div>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
}
