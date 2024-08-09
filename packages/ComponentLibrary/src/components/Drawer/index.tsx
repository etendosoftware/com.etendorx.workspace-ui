import React, { useCallback, useState } from 'react';
import {
  Drawer as MuiDrawer,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { MenuOpen } from '@mui/icons-material';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';

const paperProps = {
  className: 'animated-width',
};

const Drawer: React.FC<DrawerProps> = ({
  sectionGroups,
  headerImage,
  headerTitle,
}) => {
  // States
  const [open, setOpen] = useState<boolean>(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  // Boolean functions
  const isExpanded = (sectionId: string): boolean =>
    expandedSections[sectionId] || false;

  // Event handlers
  const handleDrawerToggle = (): void => {
    setOpen(!open);
    if (open) {
      setSelectedSection(null);
      setExpandedSections({});
    }
  };

  const handleSectionSelect = useCallback(
    (sectionId: string, parentId: string | null = null): void => {
      if (parentId === null) {
        if (selectedSection === sectionId) {
          setSelectedSection(null);
          setExpandedSections(prev => ({ ...prev, [sectionId]: false }));
        } else {
          setSelectedSection(sectionId);
          setExpandedSections({ [sectionId]: true });
        }
      } else {
        setSelectedSection(sectionId);
        setExpandedSections(prev => ({ ...prev, [parentId]: true }));
      }
    },
    [selectedSection],
  );
  const handleExpand = useCallback(
    (section: string) => (sectionId: string) =>
      handleSectionSelect(sectionId, section),
    [handleSectionSelect],
  );

  return (
    <Box>
      <MuiDrawer
        variant="permanent"
        open={open}
        PaperProps={paperProps}
        sx={{
          ...styles.drawer,
          '& .MuiDrawer-paper': {
            ...styles.drawerPaper,
            width: open ? styles.drawerWidth : styles.drawerWidthClosed,
            overflowX: 'hidden',
          },
        }}>
        <Box
          sx={{
            ...styles.drawerHeader,
            justifyContent: open ? 'space-between' : 'center',
            padding: open ? '0.5rem 1rem' : '0.5rem 0',
          }}>
          {open && (
            <Box sx={styles.drawerHeaderImgBox}>
              <img
                src={headerImage}
                alt={`${headerTitle} Logo`}
                style={styles.drawerHeaderImg}
              />
              <Typography sx={styles.drawerHeaderTitle}>
                {headerTitle}
              </Typography>
            </Box>
          )}
          <IconButton
            onClick={handleDrawerToggle}
            sx={styles.iconButtonBoxStyles}>
            <MenuOpen sx={{ transform: open ? 'none' : 'rotate(180deg)' }} />
          </IconButton>
        </Box>
        <Box
          sx={{
            ...styles.subsectionsContainer,
            alignItems: open ? 'flex-start' : 'center',
          }}>
          {sectionGroups.map(section => (
            <DrawerSection
              key={section.title}
              section={section}
              open={open}
              onSelect={handleSectionSelect}
              onExpand={handleExpand(section.title)}
              isExpanded={isExpanded}
            />
          ))}
        </Box>
      </MuiDrawer>
      <Box
        width={open ? styles.drawerWidth : styles.drawerWidthClosed}
        className="animated-width"
      />
    </Box>
  );
};

export default Drawer;
