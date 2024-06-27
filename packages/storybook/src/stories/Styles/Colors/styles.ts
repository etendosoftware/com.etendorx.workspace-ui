import { theme } from '../../../../../ComponentLibrary/src/theme';
import { CSSProperties } from 'react';

export const cardStyles: CSSProperties | undefined = {
  margin: 8,
  padding: 10,
  width: 200,
  textAlign: 'center',
  borderRadius: 4,
};

export const boxStyles: CSSProperties | undefined = {
  height: 100,
  borderRadius: 4,
  marginBottom: 8,
};

export const containerBoxStyles: CSSProperties | undefined = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

export const typographyStyles = {
  caption: {
    fontWeight: 600,
    fontSize: '0.875rem'
  },
  valueCaption: {
    fontWeight: 500,
    fontSize: '0.75rem'
  }
};

export const typographyTitleStyles = {
  margin: 16,
  marginBottom: 0,
  color: theme.palette.baselineColor.neutral[90],
  fontWeight: 500,
  fontSize: '1.5rem'
};