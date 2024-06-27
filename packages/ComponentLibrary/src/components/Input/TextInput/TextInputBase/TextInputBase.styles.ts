// TextInputBaseStyles.ts
import { SxProps } from '@mui/system';
import { theme } from '../../../../theme';

export const inputBaseStyles = {
  inputBase: {
    '& .MuiInput-underline:before': {
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
    },
    '& .MuiInput-underline:hover:before': {
      borderBottomColor: theme.palette.baselineColor.neutral[80],
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: theme.palette.baselineColor.neutral[80],
    },
    '& .MuiInputBase-input': {
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
    },
  } as SxProps,
  inputAdornment: {
    paddingY: '4px',
  } as SxProps,
  inputStyle: {
    padding: '0.25rem 0',
    fontSize: '14px',
    color: theme.palette.baselineColor.transparentNeutral[100],
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
  },
  cssStyles: `
    #password-input::placeholder {
      color: transparent;
    }
    #password-input-label {
      font-weight: 500;
      font-size: 18px;
      font-family: 'Inter', sans-serif;
    }
    .MuiFormLabel-root {
      color: ${theme.palette.baselineColor.neutral[80]};
    }
    .MuiFormLabel-root.Mui-focused {
      color: ${theme.palette.baselineColor.neutral[80]};
    }
    .MuiFormLabel-asterisk {
      color: ${theme.palette.specificColor.error.main};
    }
    #password-input {
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
    }
  `,
};
