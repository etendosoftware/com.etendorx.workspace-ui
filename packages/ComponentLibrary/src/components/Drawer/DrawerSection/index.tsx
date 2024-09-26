import { useCallback, useMemo, useState } from 'react';
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

export default function DrawerSection({
  item,
  onClick,
  open,
}: DrawerSectionProps) {
  const { id } = useParams();
  const isSelected = Boolean(id?.length && item.window?.id === id);
  const [expanded, setExpanded] = useState(false);
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
      background: expanded
        ? theme.palette.dynamicColor.contrastText
        : 'transparent',
    }),
    [expanded, open],
  );

  return (
    <div style={mainStyle}>
      <MenuTitle
        item={item}
        onClick={handleClick}
        selected={isSelected}
        expanded={expanded}
        open={open}
      />
      {item.children && open && (
        <Collapse in={expanded} timeout="auto">
          {item.children.map(subitem => (
            <DrawerSection
              key={subitem.id}
              item={subitem}
              onClick={onClick}
              open={open}
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
                    expanded={expanded}
                    open={true}
                  />
                  {item.children?.map(subitem => (
                    <DrawerSection
                      key={subitem.id}
                      item={subitem}
                      onClick={handleClickAndClose}
                      open={true}
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
}
