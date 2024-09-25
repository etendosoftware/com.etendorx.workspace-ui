import { useCallback, useState } from 'react';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';
import DrawerHeader from './Header';

const Drawer = ({ items, logo, title, onClick }: DrawerProps) => {
  const [open, setOpen] = useState<boolean>(true);
  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  const drawerStyle = {
    ...styles.drawerPaper,
    width: open ? '16.25rem' : '3.5rem',
    transition: 'width 0.5s ease-in-out',
  };

  return (
    <div style={drawerStyle}>
      <DrawerHeader
        logo={logo}
        title={title}
        open={open}
        onClick={handleHeaderClick}
      />
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
    </div>
  );
};

export default Drawer;
