import { useCallback, useState } from 'react';
import { Drawer as MuiDrawer, Box } from '@mui/material';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';
import DrawerHeader from './Header';

const paperProps = {
  className: 'animated-width',
};

const Drawer = ({
  items,
  headerImage,
  headerTitle,
}: DrawerProps) => {
  const [open, setOpen] = useState<boolean>(true);
  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

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
        <DrawerHeader
          logo={headerImage}
          title={headerTitle}
          open={open}
          onClick={handleHeaderClick}
        />
        <Box
          sx={styles.subsectionsContainer}>
          {items.map(section => (
            <DrawerSection
              key={section.title}
              section={section}
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
