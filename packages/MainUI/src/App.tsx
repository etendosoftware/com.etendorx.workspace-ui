import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet, useNavigate } from 'react-router-dom';
import Navigation from './components/navigation';
import { Drawer } from '@workspaceui/componentlibrary/src/components';
import EtendoLogotype from './assets/etendo-logotype.png';
import Box from '@mui/material/Box';
import { useMenu } from './helpers/menu';

const _App = () => {
  const menu = useMenu();

  return (
    <Box display="flex" minHeight="100%">
      <Drawer
        headerImage={EtendoLogotype}
        headerTitle="Etendo"
        sectionGroups={menu}
      />
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
