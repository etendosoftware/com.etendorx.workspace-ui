import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar from './sidebar';
import Navigation from './navigation';
import { styles } from './styles';

export default function Layout() {
  return (
    <Box sx={styles.fullScreenBox}>
      <Sidebar />
      <Box overflow="hidden" position="relative" flex={1} padding={1}>
        <Navigation />
        <Outlet />
      </Box>
    </Box>
  );
}
