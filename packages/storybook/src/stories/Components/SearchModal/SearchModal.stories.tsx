import { Typography, Box } from '@mui/material';
import SearchModal from '@workspaceui/componentlibrary/src/components/SearchModal';
import { typographyTitleStyles } from '../../Styles/Typography/styles';
import { TABS_CONTENT, DEFAULT_CONTENT } from './mock';

export default {
  title: 'Components/SearchModal',
  component: SearchModal,
};

export const DefaultVariant = () => <SearchModal defaultContent={DEFAULT_CONTENT} variant="default" />;

export const TabsVariant = () => <SearchModal tabsContent={TABS_CONTENT} variant="tabs" />;

export const BothVariants = () => (
  <Box sx={{ display: 'flex', gap: '20px' }}>
    <Box>
      <Typography variant="h6" style={typographyTitleStyles}>
        Default Variant
      </Typography>
      <SearchModal defaultContent={DEFAULT_CONTENT} variant="default" />
    </Box>
    <Box>
      <Typography variant="h6" style={typographyTitleStyles}>
        Tabs Variant
      </Typography>
      <SearchModal tabsContent={TABS_CONTENT} variant="tabs" />
    </Box>
  </Box>
);
