import { useCallback, useState } from 'react';
import { Collapse, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { theme } from '../../../theme';
import { Menu } from '../menu';
import DrawerSubsection from '../DrawerSubsection';

const open = true;

const DrawerSection = ({ section }: { section: Menu }) => {
  const isMainSection = section.type === 'folder';
  const isSelected = false;
  const [expanded, setExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (section.type === 'folder') {
      setExpanded(prev => !prev);
    } else {
      console.warn('DrawerSection: unexpected type');
    }
  }, [section]);

  return (
    <Box
      sx={{
        ...styles.drawerSectionBox,
        backgroundColor:
          isMainSection && isSelected
            ? theme.palette.baselineColor.neutral[10]
            : 'transparent',
        padding:
          isMainSection && !!section.submenu && isSelected
            ? '0.5rem'
            : undefined,
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
          <Box sx={styles.listItemIconContent}>
            <Typography sx={styles.listItemIconTypography}>
              {section.icon}
            </Typography>
          </Box>
          <Typography sx={styles.listItemText}>{section.title}</Typography>
        </Box>
        {expanded ? <ExpandLess /> : <ExpandMore />}
      </Box>

      {section.submenu && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              ...styles.contentBox,
              alignItems: open ? 'flex-start' : 'center',
            }}>
            {section.submenu.map(subSection => (
              <DrawerSubsection key={subSection.title} section={subSection} />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default DrawerSection;
