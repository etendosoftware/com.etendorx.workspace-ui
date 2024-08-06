import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import Home from './screens/Home';
import DynamicTable from './screens/DynamicTable';
import { theme } from '@workspaceui/componentlibrary/src/theme';

export default function App() {
  return (
    <MetadataProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Home>
          <DynamicTable windowId="143" />
        </Home>
      </ThemeProvider>
    </MetadataProvider>
  );
}
