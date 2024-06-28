import { theme } from '../../../../ComponentLibrary/src/theme';
import { CSSProperties } from 'react';

export const cardStyles: CSSProperties = {
  margin: '0.25rem',
  padding: '0.5rem',
  width: '10.75rem',
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
};

export const boxStyles: CSSProperties = {
  height: '5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius,
};

export const typographyStyles = {
  caption: {
    fontWeight: 600,
    fontSize: '0.75rem',
  }
};

export const typographyTitleStyles = {
  margin: 16,
  marginBottom: 0,
  color: theme.palette.baselineColor.neutral[90],
  fontWeight: 500,
  fontSize: '1.5rem'
};
