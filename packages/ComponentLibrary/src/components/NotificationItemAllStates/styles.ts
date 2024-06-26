import {
  PRIMARY_CONTRAST,
  NEUTRAL_10,
  PRIMARY_MAIN,
  NEUTRAL_100,
  NEUTRAL_50,
  PRIMARY_1000,
  PRIMARY_50,
} from '../../colors';
import { SxProps, Theme } from '@mui/material';

export const sx: { [key: string]: SxProps<Theme> } = {
  rightButton: {
    background: NEUTRAL_100,
    color: NEUTRAL_50,
    height: '2rem',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
    '&:hover': {
      border: 'none',
      background: PRIMARY_MAIN,
      color: PRIMARY_CONTRAST,
    },
  },
  leftButton: {
    background: PRIMARY_50,
    color: PRIMARY_1000,
    height: '2rem',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
    border: `1px solid ${NEUTRAL_10}`,
    '&:hover': {
      border: 'none',
      background: PRIMARY_MAIN,
      color: PRIMARY_CONTRAST,
    },
  },
};
