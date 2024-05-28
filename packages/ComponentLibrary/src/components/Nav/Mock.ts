import HomeIcon from '@mui/icons-material/Home';
import Settings from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AppsIcon from '@mui/icons-material/Apps';

export const iconActions = [
    // TODO: In the near future, this should be a parameter at rendering in the metadata
  { icon: HomeIcon, label: 'Home', onClick: () => console.log('Home clicked') },
  { icon: Settings, label: 'Settings', onClick: () => console.log('Settings clicked') },
  { icon: NotificationsIcon, label: 'Notifications', onClick: () => console.log('Notifications clicked') },
];

export const appIcon = {
  icon: AppsIcon, label: 'Apps', onClick: () => console.log('Apps clicked')
};