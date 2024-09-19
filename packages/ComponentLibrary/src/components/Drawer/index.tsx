import { useCallback, useState } from 'react';
import { styles } from './styles';
import DrawerSection from './DrawerSection';
import { DrawerProps } from './types';
import DrawerHeader from './Header';

const Drawer = ({ items, logo, title, onClick }: DrawerProps) => {
  const [open, setOpen] = useState<boolean>(true);
  const handleHeaderClick = useCallback(() => setOpen(prev => !prev), []);

  return (
    <div style={styles.drawerPaper}>
      <DrawerHeader
        logo={logo}
        title={title}
        open={open}
        onClick={handleHeaderClick}
      />
      {items.map(item => (
        <DrawerSection
          key={item.id}
          item={item}
          onClick={onClick}
          open={open}
        />
      ))}
    </div>
  );
};

export default Drawer;
