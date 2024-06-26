import { SxProps, Theme } from '@mui/material';
import { theme } from '../../../../theme';

// Font sizes
const FONT_SIZE_14 = 14;

// Widths
const WIDTH_FULL = '100%';

// Styles
export const CSS_STYLES: { [key: string]: any } = {
  inputProps: {
    position: 'relative',
    color: theme.palette.baselineColor.neutral[100],
    fontSize: FONT_SIZE_14,
  },
  input: {
    padding: '0.5rem 0.75rem 0.5rem 0.75rem',
    height: '2.5rem',
    borderRadius: '6.25rem',
    backgroundColor: theme.palette.baselineColor.neutral[0],
    transition: 'background-color 0.5s ease',
    '&:hover': {
      backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
    },
    '&.Mui-disabled': {
      backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
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
      backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
    },
  },
  tabText: {
    fontSize: FONT_SIZE_14,
    fontWeight: 500,
    color: theme.palette.baselineColor.transparentNeutral[5],
    marginLeft: '0.25rem',
  },
  suggestionText: {
    color: theme.palette.baselineColor.neutral[20],
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
    backgroundColor: theme.palette.baselineColor.neutral[5],
    height: '1.5rem',
    padding: '0.5rem',
    borderRadius: 100,
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,

  },
  suggestionBox: {
    position: 'absolute',
    top: '50%',
    left: 44,
    transform: 'translateY(-50%)',
    color: theme.palette.baselineColor.transparentNeutral[70],
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
    color: theme.palette.baselineColor.transparentNeutral[5],
  },
  clearButtonHover: {
    width: '2rem',
    height: '2rem',
    transition: 'background-color 0.3s, color 0.3s',
    '&:hover': {
      backgroundColor: theme.palette.baselineColor.neutral[0],
      borderRadius: '50%',
      '& .MuiSvgIcon-root': {
        color: theme.palette.baselineColor.neutral[100],
      },
    },
  },
  rightButtonHover: {
    backgroundColor: theme.palette.baselineColor.neutral[0],
    borderRadius: '50%',
    width: '2rem',
    height: '2rem',
    transition: 'background-color 0.3s, color 0.3s',
    '&:hover': {
      backgroundColor: theme.palette.baselineColor.neutral[0],
      borderRadius: '50%',
      '& .MuiSvgIcon-root': {
        color: theme.palette.baselineColor.neutral[100],
      },
    },
  },
  iconDefault: {
    color: theme.palette.baselineColor.neutral[70],
  },
};

export const containerIconStyle: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
};