import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Sidebar from './sidebar';
import Navigation from './navigation';
import { styles } from './styles';

export default function Layout() {
  return (
    <Box sx={styles.fullScreenBox}>
      <Sidebar />
      <Box sx={styles.content}>
        <Navigation />
        <Outlet />
      </Box>
    </Box>
  );
}
