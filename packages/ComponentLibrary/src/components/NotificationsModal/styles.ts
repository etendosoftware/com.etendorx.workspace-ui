import { CSSProperties } from 'react';

const NEUTRAL_10 = '#F5F6FA';
const NEUTRAL_0 = '#FCFCFD';

export const PRIMARY_CONTRAST = '#F5F8FF';
export const TRANSPARENT_NEUTRAL_5 = '#00030D1A';
export const DYNAMIC_COLOR_MAIN = '#004ACA';
export const NEUTRAL_90 = '#1D223A';
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
    background: NEUTRAL_0,
    borderBottom: `1px solid ${NEUTRAL_10}`,
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
    color: DYNAMIC_COLOR_MAIN,
  },
  rigthContainer: { alignItems: 'center', display: 'flex' },
  titleModal: {
    fontSize: '1rem',
    fontWeight: '600',
  },
  listContainer: {},
  emptyState: {
    width: '28.75rem',
    background: NEUTRAL_10,
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
    color: NEUTRAL_90,
  },
  emptyText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
    paddingBottom: '0.5rem',
    textAlign: 'center',
    color: TRANSPARENT_NEUTRAL_5,
  },
  actionButton: {
    border: `1px solid ${TRANSPARENT_NEUTRAL_5}`,
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
  },
  actionButtonText: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem  ',
  },
  paperStyleMenu: {
    borderRadius: '0.75rem',
    background: NEUTRAL_10,
  },
};
