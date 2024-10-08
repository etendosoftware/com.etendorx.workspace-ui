import { CSSProperties } from 'react';
import { theme } from '../../../theme';

export const defaultFill = theme.palette.baselineColor.neutral[60];

export const selectorListStyles: CSSProperties = {
  padding: '0rem 1rem 0.75rem 1rem',
};

export const formStyle: CSSProperties = {
  margin: '0rem 0rem 1rem 0rem',
};

export const labelStyles: CSSProperties = {
  color: theme.palette.baselineColor.neutral[80],
  fontWeight: '600',
};

export const iconStyles: CSSProperties = {
  paddingLeft: '0.5rem',
};
