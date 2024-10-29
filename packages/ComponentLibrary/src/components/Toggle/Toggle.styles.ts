import { Theme } from '@mui/material/styles';
import { theme } from '../../theme';

const switchStyles = (themeParam: Theme) => ({
  width: '2.5rem',
  height: '1.25rem',
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: '0.125rem',
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(1.25rem)',
      color: theme.palette.baselineColor.neutral[0],
      '& + .MuiSwitch-track': {
        backgroundColor:
          themeParam.palette.mode === 'dark'
            ? theme.palette.specificColor.warning
            : theme.palette.baselineColor.neutral[80],
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: theme.palette.specificColor.warning,
      border: `0.375rem solid ${theme.palette.baselineColor.neutral[0]}`,
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: themeParam.palette.mode === 'light' ? themeParam.palette.grey[100] : themeParam.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: themeParam.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: '1rem',
    height: '1rem',
    boxShadow: 'none',
  },
  '& .MuiSwitch-track': {
    borderRadius: '1.625rem',
    backgroundColor:
      themeParam.palette.mode === 'light'
        ? theme.palette.baselineColor.neutral[30]
        : theme.palette.specificColor.draft.contrastText,
    opacity: 1,
    transition: themeParam.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
});

export default switchStyles;
