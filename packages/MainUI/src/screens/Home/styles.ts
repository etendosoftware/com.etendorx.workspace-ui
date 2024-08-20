import { css } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';

const styles = {
  container: css({
    overflow: 'hidden',
    flex: 1,
    padding: theme.spacing(1),
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  }),
};

export default styles;
