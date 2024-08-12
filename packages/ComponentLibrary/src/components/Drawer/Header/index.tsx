import { MenuOpen } from '@mui/icons-material';
import Box from '@mui/material/Box';
import { IconButton } from '../..';
import { styles } from '../styles';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';

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
  const sx = useMemo(
    () => ({
      transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
      transition: 'transform 300ms ease',
    }),
    [open],
  );

  return (
    <Box sx={styles.drawerHeader}>
      {open ? (
        <Box sx={styles.drawerHeaderImgBox}>
          <img src={logo} alt={`${title} Logo`} style={styles.drawerHeaderImg} />
          <Typography sx={styles.drawerHeaderTitle}>{title}</Typography>
        </Box>
      ) : null}
      <IconButton onClick={onClick}>
        <MenuOpen sx={sx} />
      </IconButton>
    </Box>
  );
}
