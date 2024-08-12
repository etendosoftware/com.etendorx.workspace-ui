import { useCallback, useState } from 'react';
import { Collapse, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { theme } from '../../../theme';
import { Section } from '../types';

const DrawerSection = ({
  section,
  open,
  level = 0,
  onSelect,
  onClick,
}: {
  section: Section;
  open: boolean;
  level: number;
  onSelect: (sectionId: string, parentId: string | null) => void;
  onClick: (s: Section) => void;
}) => {
  // Constants
  const isMainSection = section.type === 'folder';
  const isSelected = section.isSelected;

  // States
  const [expanded, setExpanded] = useState(false);

  // Handlers
  const handleClick = useCallback(() => {
    if (section.type === 'folder') {
      setExpanded(prev => !prev);
    } else if (section.type === 'window') {
      onClick(section);
    }
  }, [onClick, section]);

  return (
    <Box
      sx={{
        ...styles.drawerSectionBox,
        backgroundColor:
          isMainSection && isSelected
            ? theme.palette.baselineColor.neutral[10]
            : 'transparent',
        padding:
          isMainSection && !!section.subSections && isSelected
            ? '0.5rem'
            : undefined,
      }}>
      <Box
        onClick={handleClick}
        sx={{
          ...styles.listItemButton,
          ...(section.isSelected && styles.listItemButtonSelected),
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

          {open && (
            <Typography sx={styles.listItemText}>{section.title}</Typography>
          )}
        </Box>

        {open &&
          section.submenu &&
          (expanded ? <ExpandLess /> : <ExpandMore />)}
      </Box>

      {section.submenu && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              ...styles.contentBox,
              alignItems: open ? 'flex-start' : 'center',
            }}>
            {section.submenu.map((subSection: Section) => (
              <DrawerSection
                key={subSection.title}
                section={subSection}
                open={open}
                level={level + 1}
                onSelect={onSelect}
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
