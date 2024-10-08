import { forwardRef } from 'react';
import { MenuOpen } from '@mui/icons-material';
import { IconButton } from '../..';
import { styles } from '../styles';

const openSx = {
  transform: 'rotate(0deg)',
};

const closedSx = {
  transform: 'rotate(180deg)',
};

const DrawerHeader = forwardRef<
  HTMLDivElement,
  {
    title: string;
    logo: string;
    open?: boolean;
    onClick: () => unknown;
    tabIndex?: number;
  }
>(({ title, logo, open, onClick, tabIndex }, ref) => {
  return (
    <div style={styles.drawerHeader} ref={ref}>
      {open ? (
        <div style={styles.drawerHeaderImgBox}>
          <img src={logo} alt={`${title} Logo`} style={styles.drawerHeaderImg} />
          <span style={styles.drawerHeaderTitle}>{title}</span>
        </div>
      ) : null}
      <IconButton
        onClick={onClick}
        sx={open ? openSx : closedSx}
        className="animated-transform"
        height={20}
        width={20}
        tabIndex={tabIndex}>
        <MenuOpen />
      </IconButton>
    </div>
  );
});

export default DrawerHeader;
