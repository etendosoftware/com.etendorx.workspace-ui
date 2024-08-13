import { MenuOpen } from '@mui/icons-material';
import Box from '@mui/material/Box';
import { IconButton } from '../..';
import { styles } from '../styles';
import Typography from '@mui/material/Typography';

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
    <Box sx={styles.drawerHeader}>
      {open ? (
        <Box sx={styles.drawerHeaderImgBox}>
          <img
            src={logo}
            alt={`${title} Logo`}
            style={styles.drawerHeaderImg}
          />
          <Typography sx={styles.drawerHeaderTitle}>{title}</Typography>
        </Box>
      ) : null}
      <IconButton
        onClick={onClick}
        sx={open ? openSx : closedSx}
        className="animated-transform">
        <MenuOpen />
      </IconButton>
    </Box>
  );
}
