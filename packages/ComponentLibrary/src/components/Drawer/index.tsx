import { useCallback, useMemo, useState } from 'react';
import { Drawer as MuiDrawer, Box, Paper } from '@mui/material';
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
      },
    }),
    [],
  );

  return (
    <Paper {...paperProps}>
      <DrawerHeader
        logo={logo}
        title={title}
        open={open}
        onClick={handleHeaderClick}
      />
      <Box sx={styles.subsectionsContainer} className="animated-width">
        {items.map(item => (
          <DrawerSection
            key={item.id}
            item={item}
            onClick={onClick}
            open={open}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default Drawer;
