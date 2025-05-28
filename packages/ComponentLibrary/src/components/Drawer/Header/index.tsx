'use client';

import { forwardRef, useCallback } from 'react';
import { MenuOpen } from '@mui/icons-material';
import { Box } from '@mui/material';
import IconButton from '../../IconButton';
import { useStyle } from '../styles';
import { DrawerHeaderProps } from '../types';

const DrawerHeader = forwardRef<HTMLDivElement, DrawerHeaderProps>(({ title, logo, open, onClick, tabIndex }, ref) => {
  const { sx } = useStyle();

  const Logo = useCallback(() => {
    if (typeof logo === 'string') {
      return <Box component="img" src={logo} alt={`${title} Logo`} sx={sx.drawerHeaderImg} />;
    }
    return <Box sx={sx.drawerHeaderImg}>{logo}</Box>;
  }, [logo, sx.drawerHeaderImg, title]);

  return (
    <Box sx={sx.drawerHeader} ref={ref}>
      {open ? (
        <div className="w-full">
          <a href="/" className="flex items-center gap-1" title="Etendo">
            <Logo />
            <Box component="span" sx={sx.drawerHeaderTitle}>
              {title}
            </Box>
          </a>
        </div>
      ) : null}
      <IconButton onClick={onClick} className="animated-transform w-full max-w-9 h-9" tabIndex={tabIndex}>
        <MenuOpen />
      </IconButton>
    </Box>
  );
});

DrawerHeader.displayName = 'DrawerHeader';

export { DrawerHeader };

export default DrawerHeader;
