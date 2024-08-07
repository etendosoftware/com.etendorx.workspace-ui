import { Fragment, useCallback, useMemo, useState } from 'react';
import {
  Drawer as MuiDrawer,
  Box,
  Typography,
  IconButton,
  Theme,
} from '@mui/material';
import { MenuOpen } from '@mui/icons-material';
import { DRAWER_WIDTH, DRAWER_WIDTH_CLOSED, styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps, SectionGroup, Section } from './types';

const Drawer: React.FC<DrawerProps> = ({
  sectionGroups,
  headerImage,
  headerTitle,
  children,
}) => {
  // States
  const [open, setOpen] = useState<boolean>(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  // Boolean functions
  const isExpanded = useCallback(
    (sectionId: string): boolean => expandedSections[sectionId] || false,
    [expandedSections],
  );

  // Event handlers
  const handleDrawerToggle = useCallback((): void => {
    setOpen(!open);
    if (open) {
      setSelectedSection(null);
      setExpandedSections({});
    }
  }, [open]);

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

  // Main Effects
  const updateSectionsWithSelection = useCallback(
    (sections: Section[], selectedId: string | null): Section[] => {
      return sections.map(section => ({
        ...section,
        isSelected: section.id === selectedId,
        isExpanded: isExpanded(section.id),
        subSections: section.subSections
          ? updateSectionsWithSelection(section.subSections, selectedId)
          : undefined,
      }));
    },
    [isExpanded],
  );

  const updatedSectionGroups: SectionGroup[] = useMemo(
    () =>
      sectionGroups.map(group => ({
        ...group,
        sections: updateSectionsWithSelection(group.sections, selectedSection),
      })),
    [sectionGroups, selectedSection, updateSectionsWithSelection],
  );

  const drawerStyle = useMemo(
    () => ({
      ...styles.drawer,
      '& .MuiDrawer-paper': {
        ...styles.drawerPaper,
        width: open ? styles.drawerWidth : styles.drawerWidthClosed,
        overflowX: 'hidden',
        transition: (theme: Theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
      },
    }),
    [open],
  );

  const menuIconStyle = useMemo(
    () => ({ transform: open ? 'none' : 'rotate(180deg)' }),
    [open],
  );

  const headerStyle = useMemo(
    () => ({
      ...styles.drawerHeader,
      justifyContent: open ? 'space-between' : 'center',
      padding: open ? '0.5rem 1rem' : '0.5rem 0',
    }),
    [open],
  );

  const contentStyle = useMemo(
    () => ({
      paddingLeft: `${open ? DRAWER_WIDTH : DRAWER_WIDTH_CLOSED}px`,
      flex: 1,
      transition: (theme: Theme) =>
        theme.transitions.create('padding', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
    }),
    [open],
  );

  const subsectionContainerStyle = useMemo(
    () => ({
      ...styles.subsectionsContainer,
      alignItems: open ? 'flex-start' : 'center',
    }),
    [open],
  );

  const handleExpand = useCallback(
    (section: Section) => (sectionId: string) =>
      handleSectionSelect(sectionId, section.id),
    [handleSectionSelect],
  );

  return (
    <Box display="flex" flexDirection="column" maxWidth="100%" sx={contentStyle}>
      <MuiDrawer variant="permanent" anchor="left" open={open} sx={drawerStyle}>
        <Box sx={headerStyle}>
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
            <MenuOpen sx={menuIconStyle} />
          </IconButton>
        </Box>
        <Box sx={subsectionContainerStyle}>
          {updatedSectionGroups.map(group => (
            <Fragment key={group.id}>
              {group.sections.map(section => (
                <DrawerSection
                  key={section.id}
                  section={section}
                  open={open}
                  onSelect={handleSectionSelect}
                  onExpand={handleExpand(section)}
                  isExpanded={isExpanded}
                />
              ))}
            </Fragment>
          ))}
        </Box>
      </MuiDrawer>
      {children}
    </Box>
  );
};

export default Drawer;
