import { forwardRef } from 'react';
import { MenuOpen } from '@mui/icons-material';
import { Box } from '@mui/material';
import { IconButton } from '../..';
import { useStyle } from '../styles';
import { DrawerHeaderProps } from '../types';

const EtendoLink = 'https://docs.etendo.software/latest/';

const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(({ title, logo, open, onClick, tabIndex }, ref) => {
  const { sx } = useStyle();

  const renderLogo = () => {
    if (typeof logo === 'string') {
      return <Box component="img" src={logo} alt={`${title} Logo`} sx={sx.drawerHeaderImg} />;
    }
    return <Box sx={sx.drawerHeaderImg}>{logo}</Box>;
  };

  return (
    <Box sx={sx.drawerHeader} ref={ref}>
      {open ? (
        <Box component="a" href={EtendoLink} sx={sx.drawerHeaderImgBox} target="_blank" rel="noopener noreferrer">
          {renderLogo()}
          <Box component="span" sx={sx.drawerHeaderTitle}>
            {title}
          </Box>
        </Box>
      ) : null}
      <IconButton
        onClick={onClick}
        sx={{
          transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.3s ease',
        }}
        className="animated-transform"
        height={20}
        width={20}
        tabIndex={tabIndex}>
        <MenuOpen />
      </IconButton>
    </Box>
  );
});

DrawerHeader.displayName = 'DrawerHeader';

export default DrawerHeader;
