import { forwardRef, useCallback } from 'react';
import { MenuOpen } from '@mui/icons-material';
import { Box } from '@mui/material';
import IconButton from '../../IconButton';
import { useStyle } from '../styles';
import { DrawerHeaderProps } from '../types';

const EtendoLink = 'https://docs.etendo.software/latest/';

const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(({ title, logo, open, onClick, tabIndex }, ref) => {
  const { sx } = useStyle();

  const renderLogo = useCallback(() => {
    if (typeof logo === 'string') {
      return <Box component="img" src={logo} alt={`${title} Logo`} sx={sx.drawerHeaderImg} />;
    }
    return <Box sx={sx.drawerHeaderImg}>{logo}</Box>;
  }, [logo, sx.drawerHeaderImg, title]);

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
      <IconButton onClick={onClick} className="animated-transform w-9	h-9" tabIndex={tabIndex}>
        <MenuOpen />
      </IconButton>
    </Box>
  );
});

DrawerHeader.displayName = 'DrawerHeader';

export default DrawerHeader;
