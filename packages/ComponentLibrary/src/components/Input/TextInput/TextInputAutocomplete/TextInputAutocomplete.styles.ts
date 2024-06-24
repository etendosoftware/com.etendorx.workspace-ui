import { SxProps, Theme } from '@mui/material';
import { NEUTRAL_200, NEUTRAL_850, NEUTRAL_1000, PRIMARY_450, PRIMARY_50, PRIMARY_950, TERTIARY_950, NEUTRAL_5, PRIMARY_150, PRIMARY_1000, NEUTRAL_150, NEUTRAL_10, PRIMARY_0 } from '../../../../colors';

// Font sizes
const FONT_SIZE_14 = 14;

// Widths
const WIDTH_FULL = '100%';

// Styles
export const CSS_STYLES: { [key: string]: any } = {
  inputProps: {
    position: 'relative',
    color: PRIMARY_450,
    fontSize: FONT_SIZE_14,
  },
  input: {
    padding: '0.5rem 0.75rem 0.5rem 0.75rem',
    height: '2.5rem',
    borderRadius: '6.25rem',
    backgroundColor: PRIMARY_50,
    transition: 'background-color 0.5s ease',
    '&:hover': {
      // backgroundColor: NEUTRAL_5,
    },
    '&.Mui-disabled': {
      backgroundColor: PRIMARY_950,
    },
    '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
      // borderColor: "transparent",
    },
  },
  inputCommon: {
    borderRadius: '6.25rem',
    position: 'relative',
    transition: 'background-color 0.3s, border-color 0.3s',
    '&:hover': {
      backgroundColor: PRIMARY_950,
    },
  },
  tabText: {
    fontSize: FONT_SIZE_14,
    fontWeight: 500,
    color: NEUTRAL_850,
    marginLeft: '0.25rem',
  },
  suggestionText: {
    color: PRIMARY_150,
  },
  spanOpacity: {
    opacity: 0,
  },
};

export const SX_STYLES: { [key: string]: SxProps<Theme> } = {
  containerBox: {
    position: 'relative',
    width: WIDTH_FULL,
  },
  innerBox: {
    position: 'relative',
  },
  startAdornment: {
    width: '1.5rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  tabBox: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '0.25rem',
    backgroundColor: NEUTRAL_150,
    height: '1.5rem',
    padding: '0.5rem',
    borderRadius: 100,
    border: `1px solid ${NEUTRAL_10}`,
  },
  suggestionBox: {
    position: 'absolute',
    top: '50%',
    left: 44,
    transform: 'translateY(-50%)',
    color: PRIMARY_1000,
    fontSize: FONT_SIZE_14,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center'
  },
  iconWidth: {
    width: '1.375rem',
  },
  clearButton: {
    '&:hover': {
      backgroundColor: 'transparent',
      textDecoration: 'underline',
    },
  },
  rightButton: {
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  tabIcon: {
    fontSize: FONT_SIZE_14,
    color: NEUTRAL_850,
  },
  clearButtonHover: {
    width: '2rem',
    height: '2rem',
    transition: 'background-color 0.3s, color 0.3s',
    '&:hover': {
      backgroundColor: NEUTRAL_200,
      borderRadius: '50%',
      '& .MuiSvgIcon-root': {
        color: NEUTRAL_1000,
      },
    },
  },
  rightButtonHover: {
    backgroundColor: PRIMARY_0,
    borderRadius: '50%',
    width: '2rem',
    height: '2rem',
    transition: 'background-color 0.3s, color 0.3s',
    '&:hover': {
      backgroundColor: NEUTRAL_200,
      borderRadius: '50%',
      '& .MuiSvgIcon-root': {
        color: NEUTRAL_1000,
      },
    },
  },
};

export const containerIconStyle: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};