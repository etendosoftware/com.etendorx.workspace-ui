import { useCallback, useState } from 'react';
import { Collapse, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { theme } from '../../../theme';
import { DrawerSubsectionProps } from '../types';

const open = true;

const DrawerSubsection = ({ item, onClick }: DrawerSubsectionProps) => {
  const isMainSection = item.type === 'folder';
  const isSelected = false;
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (item.type === 'folder') {
      setExpanded(prev => !prev);
    } else if (item.type === 'window') {
      onClick(`/window/${item.windowId}`);
    }
  }, [item.type, item.windowId, onClick]);

  return (
    <Box
      sx={{
        ...styles.drawerSectionBox,
        backgroundColor:
          isMainSection && isSelected
            ? theme.palette.baselineColor.neutral[10]
            : 'transparent',
        padding:
          isMainSection && !!item.submenu && isSelected ? '0.5rem' : undefined,
      }}>
      <Box
        onClick={handleClick}
        sx={{
          ...styles.listItemButton,
          ...(isSelected ? styles.listItemButtonSelected : undefined),
          ...styles.listItemContentText,
          borderRadius: open ? '0.5rem' : '12.5rem',
          fontSize: open ? '1.5rem' : '1rem',
          justifyContent: open ? 'space-between' : 'center',
        }}>
        <Box
          sx={{
            ...styles.listItemInnerContentText,
            justifyContent: open ? 'flex-start' : 'center',
          }}>
          {open && (
            <Typography sx={styles.listItemText}>{item.title}</Typography>
          )}
        </Box>

        {open && item.submenu && (expanded ? <ExpandLess /> : <ExpandMore />)}
      </Box>

      {item.submenu && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              ...styles.contentBox,
              alignItems: open ? 'flex-start' : 'center',
            }}>
            {item.submenu.map(subSection => (
              <DrawerSubsection
                key={subSection.title}
                item={subSection}
                onClick={onClick}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default DrawerSubsection;
