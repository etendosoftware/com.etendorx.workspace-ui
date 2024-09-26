import { useCallback, useMemo, useState } from 'react';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';
import DrawerHeader from './Header';
import { Box } from '..';

const Drawer = ({ items, logo, title, onClick }: DrawerProps) => {
  const [open, setOpen] = useState<boolean>(true);
  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  const drawerStyle = useMemo(
    () => ({
      ...styles.drawerPaper,
      width: open ? '16.25rem' : '3.5rem',
      height: '100vh',
      transition: 'width 0.5s ease-in-out',
      display: 'flex',
    }),
    [open],
  );

  return (
    <div style={drawerStyle}>
      <DrawerHeader
        logo={logo}
        title={title}
        open={open}
        onClick={handleHeaderClick}
      />
      <Box sx={styles.drawerContent}>
        {Array.isArray(items)
          ? items.map(item => (
              <DrawerSection
                key={item.id}
                item={item}
                onClick={onClick}
                open={open}
              />
            ))
          : null}
      </Box>
    </div>
  );
};

export default Drawer;
