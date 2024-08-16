import { css } from '@mui/material';
import { theme } from '../../theme';

const styles = {
  loader: css({
    position: 'absolute',
    flex: 1,
    height: '100%',
    width: '100%',
    zIndex: 2000,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none'
  }),
  container: css({
    overflow: 'auto',
    flex: 1,
    padding: theme.spacing(1),
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  }),
  table: css({
    flex: 1,
  }),
  fetchMore: css({
    alignSelf: 'center',
    margin: theme.spacing(1),
  }),
};

export default styles;
