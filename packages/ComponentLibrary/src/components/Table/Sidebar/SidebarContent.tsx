import { Box, Typography } from '@mui/material';
import ContentGrid from './WidgetContent';
import { useStyle } from '../styles';
import RegisterModal from '../../RegisterModal';
import { SidebarContentProps } from './types';

export const SidebarContent: React.FC<SidebarContentProps> = ({ icon, identifier, title, widgets, translations }) => {
  const { sx } = useStyle();

  return (
    <Box sx={sx.sidebarContainer}>
      <Box sx={sx.headerContainer}>
        <Box sx={sx.iconContainer}>{icon}</Box>
        <Box>
          <Typography variant="body2" sx={sx.identifier}>
            {identifier}
          </Typography>
          <Typography variant="h5" sx={sx.title}>
            {title}
          </Typography>
        </Box>
      </Box>
      <Box ml={2.5}>
        <RegisterModal registerText={translations.register} translations={translations} />
      </Box>
      <ContentGrid widgets={widgets} />
    </Box>
  );
};

export default SidebarContent;
