import React, { useState } from 'react';
import {
  Drawer as MuiDrawer,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { CSSObject, styled, Theme } from '@mui/material/styles';
import { MenuOpen } from '@mui/icons-material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styles, sx } from './styles';
import { DrawerProps } from './types';
import ModalDivider from '../ModalDivider';

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const drawerWidth = 260;

const openedMixin = (theme: Theme): CSSObject => ({
  borderRadius: '0 1rem 0 0',
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  borderRadius: '0 1rem 0 0',
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: prop => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  background: theme.palette.dynamicColor.contrastText,
  boxShadow: 'none',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: prop => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    ...openedMixin(theme),
    '& .MuiDrawer-paper': openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    '& .MuiDrawer-paper': closedMixin(theme),
  }),
}));

const DrawerComponent: React.FC<DrawerProps> = ({
  children,
  companyName,
  companyLogo,
  sectionGroups,
}) => {
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        open={open}
        sx={{ paddingLeft: open ? 0 : '3rem' }}>
        <Toolbar>{children}</Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
        }}>
        <DrawerHeader style={{ paddingRight: '0.75rem' }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%">
            <Box
              display="flex"
              alignItems="center"
              sx={{ opacity: open ? 1 : 0 }}>
              <img
                src={companyLogo}
                alt={`${companyName} Logo`}
                style={styles.logoStyles}
              />
              {open && <Typography variant="h6">{companyName}</Typography>}
            </Box>
          </Box>
          <IconButton
            color="inherit"
            aria-label={open ? 'Close drawer' : 'Open drawer'}
            sx={{
              ...styles.iconButtonStyles,
              ...sx.hoverStyles,
            }}
            onClick={open ? handleDrawerClose : handleDrawerOpen}>
            {open ? <ChevronRightIcon /> : <MenuOpen />}
          </IconButton>
        </DrawerHeader>
        <ModalDivider />
        {sectionGroups.map((group, index) => (
          <div key={group.id}>
            <List>
              {group.sections.map(section => (
                <ListItem
                  key={section.id}
                  disablePadding
                  sx={{ display: 'block' }}>
                  <ListItemButton
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}>
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}>
                      {section.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={section.label}
                      sx={{ opacity: open ? 1 : 0 }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            {index !== sectionGroups.length - 1 && <ModalDivider />}
          </div>
        ))}
      </Drawer>
    </Box>
  );
};

export default DrawerComponent;
