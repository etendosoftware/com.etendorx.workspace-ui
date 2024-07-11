import { theme } from '../../../theme';

const TRASNPARENT_NEUTRAL_10 = '#00030D1A';
const TRASNPARENT_NEUTRAL_50 = '#00030D80';
const PRIMARY_MAIN = '#004ACA';
const NEUTRAL_80 = '#2E365C';
export const PRIMARY_CONTRAST = '#F5F8FF';
export const styles = {
  root: {
    '& .MuiInput-root': {
      fontSize: '0.875rem',
      fontWeight: 500,
      textAlign: 'left',
      color: theme.palette.baselineColor.neutral[100],
      borderRadius: '0.75rem 0.75rem 0 0',
      '&:before': {
        borderColor: TRASNPARENT_NEUTRAL_10,
        borderWidth: '1px',
      },
      '&:after': {
        borderColor: TRASNPARENT_NEUTRAL_10,
        borderWidth: '0 0 2px',
      },
      '&.Mui-disabled': {
        color: TRASNPARENT_NEUTRAL_50,
        backgroundColor: TRASNPARENT_NEUTRAL_10,
        '&:before': {
          borderColor: TRASNPARENT_NEUTRAL_10,
        },
        '&:after': {
          borderColor: TRASNPARENT_NEUTRAL_10,
        },
      },
      '&:focus-within': {
        '&:before': {
          borderColor: PRIMARY_MAIN,
          borderWidth: '1px',
        },
        '&:after': {
          borderColor: PRIMARY_MAIN,
          borderWidth: '0 0 2px',
        },
      },
    },
    label: {
      color: NEUTRAL_80,
      fontWeight: 'bold',
    },
  },
  labelProps: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
    color: NEUTRAL_80,
    overflow: 'hidden',
  },
  props: {
    height: '3rem',
    padding: '0px 0.5rem',
  },
  startAdornment: {
    height: '1rem',
    width: '1rem',
    marginRight: '0.5rem',
  },
  imgIconLeft: {
    width: '1rem',
    height: '1rem',
    marginRight: '0.5rem',
  },
  buttonsContainer: { display: 'flex', alignItems: 'center' },
  helperTextContainer: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '0.25rem',
    overflow: 'hidden',
  },
  helperText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
    color: TRASNPARENT_NEUTRAL_50,
  },
  helperTextIcon: {
    width: '0.875rem',
    height: '0.875rem',
    marginRight: '0.188rem',
  },
  optionsContainer: {
    borderRadius: '0.75rem',
    border: '1px',
    boxShadow: `0px 0.25rem 0.625rem 0px ${TRASNPARENT_NEUTRAL_10}`,
    padding: '0.5rem',
    '& .MuiAutocomplete-listbox .MuiAutocomplete-option.Mui-focused': {
      bgcolor: PRIMARY_CONTRAST,
    },
    '& .MuiAutocomplete-listbox .MuiAutocomplete-option.Mui-focused .textOption':
      {
        color: theme.palette.dynamicColor.dark,
      },
  },
  optionContainer: {
    padding: '0.5rem',
    marginRight: '0.5rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  optionText: {
    flex: 1,
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
  },
  dropdownIcons: {
    width: '0.938rem',
    height: '0.938rem',
  },
  checkIcon: { width: '0.875rem', height: '0.875rem', marginLeft: '0.5rem' },
  autocomplete: {
    '& .MuiAutocomplete-endAdornment': { marginRight: '0.5rem' },
    '& .MuiAutocomplete-clearIndicator': {
      marginRight: '0.063rem',
    },
  },
  listBox: {
    '&::-webkit-scrollbar': {
      width: '0.375rem',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: TRASNPARENT_NEUTRAL_10,
      borderRadius: '0.625rem',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: TRASNPARENT_NEUTRAL_50,
    },
  },
};
