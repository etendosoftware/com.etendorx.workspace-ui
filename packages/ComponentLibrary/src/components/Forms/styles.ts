import { css } from '@mui/material';
import { theme } from '../../theme';

export const styles = {
  container: css({
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: theme.spacing(1),
  }),
  paper: css({
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
  }),
};
