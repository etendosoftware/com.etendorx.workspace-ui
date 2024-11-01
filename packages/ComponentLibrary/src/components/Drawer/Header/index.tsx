import { forwardRef } from 'react';
import { MenuOpen } from '@mui/icons-material';
import { IconButton } from '../..';
import useStyles from '../styles';
import { DrawerHeaderProps } from '../types';

const openSx = {
  transform: 'rotate(0deg)',
};

const closedSx = {
  transform: 'rotate(180deg)',
};

const EtendoLink = 'https://docs.etendo.software/latest/';

const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(({ title, logo, open, onClick, tabIndex }, ref) => {
  const styles = useStyles();

  const renderLogo = () => {
    if (typeof logo === 'string') {
      return <img src={logo} alt={`${title} Logo`} style={styles.drawerHeaderImg} />;
    }
    return <div style={styles.drawerHeaderImg}>{logo}</div>;
  };

  return (
    <div style={styles.drawerHeader} ref={ref}>
      {open ? (
        <a href={EtendoLink} style={styles.drawerHeaderImgBox} target="_blank" rel="noopener noreferrer">
          {renderLogo()}
          <span style={styles.drawerHeaderTitle}>{title}</span>
        </a>
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

DrawerHeader.displayName = 'DrawerHeader';

export default DrawerHeader;
