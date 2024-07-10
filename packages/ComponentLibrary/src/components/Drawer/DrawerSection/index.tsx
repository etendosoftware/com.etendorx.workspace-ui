import React, { useState } from 'react';
import { Collapse, Box, Typography } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { styles } from '../styles';
import { theme } from '../../../theme';
import { Section } from '../types';

const DrawerSection: React.FC<any> = ({
  section,
  open,
  level = 0,
  onSelect,
}) => {
  // Constants
  const isMainSection = level === 0;
  const isSelected =
    section.isSelected ||
    section.subSections?.some((subsection: Section) => subsection.isSelected);

  // States
  const [expanded, setExpanded] = useState(false);

  // Handlers
  const handleClick = () => {
    if (section.subSections) {
      setExpanded(prev => !prev);
    }

    if (section.isSelected || (section.subSections && expanded)) {
      onSelect(null);
    } else {
      onSelect(section.id);
    }
  };

  return (
    <Box
      sx={{
        ...styles.drawerSectionBox,
        backgroundColor:
          isMainSection && isSelected
            ? theme.palette.baselineColor.neutral[10]
            : 'transparent',
        padding:
          isMainSection && !!section.subSections && isSelected && '0.5rem',
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
            <Typography sx={styles.listItemText}>{section.label}</Typography>
          )}
        </Box>

        {open &&
          section.subSections &&
          (expanded ? <ExpandLess /> : <ExpandMore />)}
      </Box>

      {section.subSections && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              ...styles.contentBox,
              alignItems: open ? 'flex-start' : 'center',
            }}>
            {section.subSections.map((subSection: Section) => (
              <DrawerSection
                key={subSection.id}
                section={subSection}
                open={open}
                level={level + 1}
                onSelect={onSelect}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

export default DrawerSection;
