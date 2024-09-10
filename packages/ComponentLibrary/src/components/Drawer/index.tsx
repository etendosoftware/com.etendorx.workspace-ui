import { useCallback, useMemo, useState } from 'react';
import { Drawer as MuiDrawer, Box } from '@mui/material';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';
import DrawerHeader from './Header';

const Drawer = ({ items, logo, title, onClick }: DrawerProps) => {
  const [open, setOpen] = useState<boolean>(true);
  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  const paperProps = useMemo(
    () => ({
      className: 'animated-width',
      sx: {
        ...styles.drawerPaper,
        width: open ? styles.drawerWidth : styles.drawerWidthClosed,
        overflowX: 'hidden',
      },
    }),
    [open],
  );

  return (
    <>
      <MuiDrawer
        variant="permanent"
        open={open}
        PaperProps={paperProps}
        sx={styles.drawer}>
        <DrawerHeader
          logo={logo}
          title={title}
          open={open}
          onClick={handleHeaderClick}
        />
        <Box sx={styles.subsectionsContainer}>
          {items.map(item => (
            <DrawerSection key={item.id} item={item} onClick={onClick} />
          ))}
        </Box>
      </MuiDrawer>
      <Box
        width={open ? styles.drawerWidth : styles.drawerWidthClosed}
        className="animated-width"
      />
    </>
  );
};

export default Drawer;
