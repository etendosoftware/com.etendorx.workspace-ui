// TextInputBaseStyles.ts
import { SxProps } from '@mui/system';
import { ERROR_MAIN, NEUTRAL_100, NEUTRAL_80 } from '../../../../colors';

export const inputBaseStyles = {
  inputBase: {
    '& .MuiInput-underline:before': {
      borderBottomColor: 'red',
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid',
    },
    '& .MuiInput-underline:hover:before': {
      borderBottomColor: 'red',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: 'red',
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
    color: NEUTRAL_100,
    fontFamily: 'Inter, sans-serif',
    fontWeight: 500,
  },
  cssStyles: `
    #password-input::placeholder {
      color: transparent;
    }
    #password-input-label {
      font-weight: 500;
      color: ${NEUTRAL_80};
      font-size: 18px;
      font-family: 'Inter', sans-serif;
    }
    .MuiFormLabel-asterisk {
      color: ${ERROR_MAIN};
    }
    #password-input {
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
    }
  `,
};
