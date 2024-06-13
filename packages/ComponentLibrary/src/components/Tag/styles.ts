import { ERROR_MAIN, WARNING_MAIN, PRIMARY_MAIN, SUCCESS_MAIN, DRAFT_MAIN, PRIMARY_CONTRAST, NEUTRAL_100 } from '../../colors';
import { TagType } from './types';

export const getColor = (type: TagType): string => {
  switch (type) {
    case 'primary':
      return PRIMARY_MAIN;
    case 'success':
      return SUCCESS_MAIN;
    case 'warning':
      return WARNING_MAIN;
    case 'error':
      return ERROR_MAIN;
    case 'draft':
      return DRAFT_MAIN;
    default:
      return PRIMARY_MAIN;
  }
};

export const getTextColor = (type: TagType): string => {
  switch (type) {
    case 'primary':
    case 'success':
    case 'error':
      return PRIMARY_CONTRAST;
    case 'warning':
    case 'draft':
      return NEUTRAL_100;
    default:
      return PRIMARY_CONTRAST;
  }
};

export const chipStyles = (type: TagType) => ({
  backgroundColor: getColor(type),
  color: getTextColor(type),
  height: '1.5rem',
  fontWeight: 500,
  cursor: 'default' as const,
  padding: '0 0.5rem',
  fontFamily: 'Inter, sans-serif',
  border: 'none',
});

export const chipLabelStyles = (icon?: React.ReactElement) => ({
  '& .MuiChip-label': {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    padding: '0',
    margin: '0',
    paddingLeft: icon ? '0.25rem' : '0',
  },
});