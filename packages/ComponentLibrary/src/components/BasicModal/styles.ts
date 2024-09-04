import { CSSProperties } from 'react';
import { theme } from '../../theme';
import { SxProps, Theme } from '@mui/material';

export const IconSize = 20;

export const styles: { [key: string]: CSSProperties } = {
  boxStyles: {
    position: 'absolute',
    width: '18.75rem',
    backgroundColor: theme.palette.baselineColor.neutral[0],
    border: `2px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    borderRadius: '1rem',
    boxShadow: `0px 0.25rem 0.625rem 0px ${theme.palette.baselineColor.neutral[90]}`,
  },
  modalStyles: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainerStyles: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    flex: '1 0 0',
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    background: 'none',
    '&:hover': {
      background: theme.palette.baselineColor.transparentNeutral[5],
    },
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  closeRecordButton: {
    width: '2.5rem',
    height: '2.5rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: theme.palette.dynamicColor.contrastText,
    borderRadius: '2rem',
    marginRight: '0.5rem',
    '&:hover': {
      borderRadius: '2rem',
      background: theme.palette.dynamicColor.contrastText,
    },
  },
  modalContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: '2.5rem',
  },
  registerText: { fontSize: '1.275rem', fontWeight: '600' },
  descriptionText: {
    marginBottom: '1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: theme.palette.baselineColor.transparentNeutral[60],
  },
  saveButton: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: theme.palette.baselineColor.neutral[0],
    padding: '0.5rem 1rem',
    background: theme.palette.baselineColor.neutral[100],
    flex: '1 0 0',
    borderRadius: '6.25rem',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[80]}`,
    height: '2.5rem',
    '&:hover': {
      borderRadius: '6.25rem',
      background: theme.palette.dynamicColor.main,
      color: theme.palette.baselineColor.neutral[0],
    },
    '&:disabled': {
      border: 'none',
      color: theme.palette.baselineColor.neutral[0],
      background: theme.palette.baselineColor.transparentNeutral[10],
    },
  },
  cancelButton: {
    fontWeight: '600',
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    height: '2.5rem',
    borderRadius: '6.25rem',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[20]}`,
    flex: '1 0 0',
    color: theme.palette.baselineColor.transparentNeutral[70],
    background: theme.palette.baselineColor.neutral[0],
    '&:hover': {
      borderRadius: '6.25rem',
      background: theme.palette.dynamicColor.main,
      color: theme.palette.baselineColor.neutral[0],
    },
  },
};
