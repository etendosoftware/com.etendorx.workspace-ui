import { MenuOpen } from '@mui/icons-material';
import { IconButton } from '../..';
import { styles } from '../styles';

const openSx = {
  transform: 'rotate(0deg)',
};

const closedSx = {
  transform: 'rotate(180deg)',
};

export default function DrawerHeader({
  title,
  logo,
  open,
  onClick,
}: {
  title: string;
  logo: string;
  open?: boolean;
  onClick: () => unknown;
}) {
  return (
    <div style={styles.drawerHeader}>
      <div style={styles.drawerHeaderImgBox}>
        <img
          src={logo}
          alt={`${title} Logo`}
          style={styles.drawerHeaderImg}
        />
        <span style={styles.drawerHeaderTitle}>{title}</span>
      </div>
      <IconButton
        onClick={onClick}
        sx={open ? openSx : closedSx}
        className="animated-transform">
        <MenuOpen />
      </IconButton>
    </div>
  );
}
