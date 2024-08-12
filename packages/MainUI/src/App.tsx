import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet } from 'react-router-dom';
import Navigation from './components/navigation';
import Box from '@mui/material/Box';
import Sidebar from "./components/sidebar";

const _App = () => {
  return (
    <Box display="flex" minHeight="100%">
      <Sidebar />
      <Box
        flexDirection="column"
        display="flex"
        overflow="hidden"
        flex={1}
        padding={1}>
        <Navigation />
        <Outlet />
      </Box>
    </Box>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MetadataProvider>
        <_App />
      </MetadataProvider>
    </ThemeProvider>
  );
}
