// styles.ts
import { Theme } from '@mui/material/styles';
import { TERTIARY_900, SECONDARY_600, NEUTRAL_50, NEUTRAL_600 } from "../../colors";

const switchStyles = (theme: Theme) => ({
  width: '2.5rem', 
  height: '1.25rem', 
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: '0.125rem',
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(1.25rem)',
      color: NEUTRAL_50,
      '& + .MuiSwitch-track': {
        backgroundColor: theme.palette.mode === 'dark' ? SECONDARY_600 : TERTIARY_900,
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      color: SECONDARY_600,
      border: `0.375rem solid ${NEUTRAL_50}`,
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color: theme.palette.mode === 'light'
        ? theme.palette.grey[100]
        : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: '1rem',
    height: '1rem',
  },
  '& .MuiSwitch-track': {
    borderRadius: '1.625rem',
    backgroundColor: theme.palette.mode === 'light' ? NEUTRAL_50 : NEUTRAL_600,
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
});

export default switchStyles ;
