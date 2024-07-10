import React, { useEffect, useState } from 'react';
import {
  Drawer as MuiDrawer,
  AppBar as MuiAppBar,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { MenuOpen } from '@mui/icons-material';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps, SectionGroup, Section } from './types';

const Drawer: React.FC<DrawerProps> = ({
  children,
  sectionGroups,
  headerImage,
  headerTitle,
}) => {
  // States
  const [open, setOpen] = useState<boolean>(false);
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

  const handleSectionSelect = (
    sectionId: string,
    parentId: string | null = null,
  ): void => {
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
  };

  // Main Effects
  const updateSectionsWithSelection = (
    sections: Section[],
    selectedId: string | null,
  ): Section[] => {
    return sections.map(section => ({
      ...section,
      isSelected: section.id === selectedId,
      isExpanded: isExpanded(section.id),
      subSections: section.subSections
        ? updateSectionsWithSelection(section.subSections, selectedId)
        : undefined,
    }));
  };

  const updatedSectionGroups: SectionGroup[] = sectionGroups.map(group => ({
    ...group,
    sections: updateSectionsWithSelection(group.sections, selectedSection),
  }));

  // Secondary Effects
  useEffect(() => {
    if (!open) {
      setSelectedSection(null);
      setExpandedSections({});
    }
  }, [open]);

  return (
    <>
      <MuiDrawer
        variant="permanent"
        open={open}
        sx={{
          ...styles.drawer,
          '& .MuiDrawer-paper': {
            ...styles.drawerPaper,
            width: open ? styles.drawerWidth : styles.drawerWidthClosed,
            overflowX: 'hidden',
            transition: theme =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
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
          {updatedSectionGroups.map(group => (
            <React.Fragment key={group.id}>
              {group.sections.map(section => (
                <DrawerSection
                  key={section.id}
                  section={section}
                  open={open}
                  onSelect={handleSectionSelect}
                  onExpand={(sectionId: string) =>
                    handleSectionSelect(sectionId, section.id)
                  }
                  isExpanded={isExpanded}
                />
              ))}
            </React.Fragment>
          ))}
        </Box>
      </MuiDrawer>
      <MuiAppBar
        position="fixed"
        sx={{
          ...styles.appBar,
          backgroundColor: 'transparent',
          width: `calc(100% - ${open ? styles.drawerWidth : styles.drawerWidthClosed}px)`,
          marginLeft: open ? styles.drawerWidth : styles.drawerWidthClosed,
        }}>
        {children}
      </MuiAppBar>
    </>
  );
};

export default Drawer;
