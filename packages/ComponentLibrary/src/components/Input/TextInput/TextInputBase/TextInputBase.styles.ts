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
    padding: '8px 0', // Adjust the vertical padding here
    fontSize: '14px', // Set font size of the input
    color: NEUTRAL_100, // Set the color of the input
    fontFamily: 'Inter, sans-serif', // Set font family of the input
    fontWeight: 500, // Set font weight of the input
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
