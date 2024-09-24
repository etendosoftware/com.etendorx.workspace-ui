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
    transition: 'width 0.3s ease-in-out',
  };

  try {
    return (
      <div style={drawerStyle}>
        <DrawerHeader
          logo={logo}
          title={title}
          open={open}
          onClick={handleHeaderClick}
        />
        {items?.map(item => (
          <DrawerSection
            key={item.id}
            item={item}
            onClick={onClick}
            open={open}
          />
        ))}
      </div>
    );
  } catch (e) {
    console.log(items)
    return null;
  }
};

export default Drawer;
