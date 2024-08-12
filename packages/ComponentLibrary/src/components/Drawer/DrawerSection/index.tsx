import { useCallback, useMemo, useState } from 'react';
import { Collapse, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { theme } from '../../../theme';
import DrawerSubsection from '../DrawerSubsection';
import { DrawerSectionProps } from '../types';

const DrawerSection = ({ item, onClick }: DrawerSectionProps) => {
  const isMainSection = item.type === 'folder';
  const isSelected = false;
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (item.type === 'folder') {
      setExpanded(prev => !prev);
    } else {
      console.warn('DrawerSection: unexpected type');
    }
  }, [item]);

  const mainStyle = useMemo(
    () => ({
      ...styles.drawerSectionBox,
      backgroundColor:
        isMainSection && isSelected
          ? theme.palette.baselineColor.neutral[10]
          : 'transparent',
      padding:
        isMainSection && !!item.submenu && isSelected ? '0.5rem' : undefined,
    }),
    [isMainSection, isSelected, item.submenu],
  );

  const titleContainerStyle = useMemo(
    () => ({
      ...styles.listItemButton,
      ...(isSelected ? styles.listItemButtonSelected : undefined),
      ...styles.listItemContentText,
      borderRadius: '0.5rem',
      fontSize: '1.5rem',
      justifyContent: 'space-between',
    }),
    [isSelected],
  );

  const titleStyle = useMemo(
    () => ({
      ...styles.listItemInnerContentText,
      justifyContent: 'flex-start',
    }),
    [],
  );

  const submenuStyle = useMemo(
    () => ({
      ...styles.contentBox,
      alignItems: 'flex-start',
    }),
    [],
  );

  return (
    <Box sx={mainStyle}>
      <Box onClick={handleClick} sx={titleContainerStyle}>
        <Box sx={titleStyle}>
          <Typography sx={styles.listItemText}>{item.title}</Typography>
        </Box>
        {expanded ? <ExpandLess /> : <ExpandMore />}
      </Box>

      {item.submenu && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={submenuStyle}>
            {item.submenu.map(subitem => (
              <DrawerSubsection
                key={subitem.title}
                item={subitem}
                onClick={onClick}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default DrawerSection;
