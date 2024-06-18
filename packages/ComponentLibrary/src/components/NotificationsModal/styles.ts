import { CSSProperties } from 'react';

import {
  PRIMARY_50,
  PRIMARY_CONTRAST,
  TERTIARY_50,
  NEUTRAL_10,
  PRIMARY_MAIN,
  PRIMARY_500,
} from '../../colors';
import { SxProps, Theme } from '@mui/material';

export const menuSyle = { padding: 0 };

export const styles: { [key: string]: CSSProperties } = {
  menuContainer: {},
  titleModalContainer: {
    width: '28.75rem',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem',
    background: PRIMARY_50,
    borderBottom: `1px solid ${TERTIARY_50}`,
  },
  titleModalImageContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleModalImageRadius: {
    width: '2rem',
    height: '2rem',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    background: PRIMARY_CONTRAST,
    borderRadius: '2rem',
    marginRight: '0.25rem',
  },
  titleButton: {
    color: PRIMARY_MAIN,
  },
  rigthContainer: {
    alignItems: 'center',
    display: 'flex',
  },
  titleModal: {
    fontSize: '1rem',
    fontWeight: '600',
  },
  listContainer: {},
  emptyState: {
    width: '28.75rem',
    background: TERTIARY_50,
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyStateImage: {
    width: '12.5rem',
    height: '12.5rem',
    marginBottom: '1rem',
  },
  emptyTextContainer: {
    maxWidth: '24.75rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyHeader: {
    padding: '0.5rem',
    fontSize: '1.375rem',
    fontWeight: '600',
    color: PRIMARY_500,
  },
  emptyText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
    paddingBottom: '0.5rem',
    textAlign: 'center',
    color: NEUTRAL_10,
  },
  actionButton: {
    border: `1px solid ${NEUTRAL_10}`,
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
  },
  actionButtonText: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem  ',
  },
  paperStyleMenu: {
    borderRadius: '0.75rem',
    background: TERTIARY_50,
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  actionButton: {
    background: PRIMARY_CONTRAST,
    color: NEUTRAL_10,
    '&:hover': {
      border: 'none',
      background: PRIMARY_MAIN,
      color: PRIMARY_CONTRAST,
    },
  },
  vertHover: {
    '&:hover': {
      color: NEUTRAL_10,
    },
  },
  badgeStyles: {
    '.MuiBadge-badge': {
      fontSize: '0.75rem',
    },
  },
};
