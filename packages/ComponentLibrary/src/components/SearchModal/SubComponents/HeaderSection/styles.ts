import { theme } from '../../../../theme';

export const styles = {
  headerSection: {
    display: 'flex',
    padding: '0.75rem 1.25rem 0.75rem 0.75rem',
    alignItems: 'center',
    backgroundColor: theme.palette.baselineColor.neutral[0],
  },
  searchIconContainer: {
    position: 'relative',
    backgroundColor: theme.palette.baselineColor.etendoPrimary.contrastText,
    borderRadius: '12.5rem',
    width: '2rem',
    height: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSearchStyles: {
    color: theme.palette.dynamicColor.main,
    height: 20,
    width: 20,
  },
  headerTitle: {
    fontSize: '1rem',
    color: theme.palette.baselineColor.neutral[90],
    marginLeft: 1,
    fontWeight: 600,
  },
};
