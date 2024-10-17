import { theme } from '../../../../../ComponentLibrary/src/theme';
import { CSSProperties } from 'react';

export const styles: { [key: string]: CSSProperties } = {
  checkboxContainer: {
    position: 'relative',
    height: '4rem',
    display: 'flex',
    alignItems: 'center',
  },
  checkboxBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    backgroundColor: theme.palette.baselineColor.transparentNeutral[10],
    transition: 'height 0.2s ease-in-out',
  },
  checkboxBorderHover: {
    backgroundColor: theme.palette.baselineColor.neutral[90],
    height: '2px',
  },
  checkboxLabel: {
    display: 'inline-block',
    position: 'relative',
    paddingLeft: '2rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  hiddenCheckbox: {
    position: 'absolute',
    opacity: 0,
    cursor: 'pointer',
    height: 0,
    width: 0,
  },
  styledCheckbox: {
    position: 'absolute',
    top: '2px',
    left: 0,
    height: '1.25rem',
    width: '1.25rem',
    backgroundColor: theme.palette.dynamicColor.contrastText,
    transition: 'background-color 0.25s ease',
    borderRadius: '0.375rem',
  },
  styledCheckboxChecked: {
    backgroundColor: theme.palette.dynamicColor.main,
  },
  styledCheckboxAfter: {
    content: '""',
    position: 'absolute',
    left: '0.5rem',
    top: '0.25rem',
    width: '0.375rem',
    height: '0.625rem',
    border: `solid ${theme.palette.dynamicColor.contrastText}`,
    borderWidth: '0 2px 2px 0',
    borderRadius: '1px',
    transform: 'rotate(45deg)',
    opacity: 0,
    transition: 'opacity 0.25s ease',
  },
  styledCheckboxCheckedAfter: {
    opacity: 1,
  },
  labelText: {
    color: theme.palette.baselineColor.neutral[90],
    lineHeight: 1.4,
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
