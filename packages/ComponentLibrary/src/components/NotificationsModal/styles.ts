import { CSSProperties } from 'react';

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
    background: '#FCFCFD',
    borderBottom: '1px solid #F5F6FA',
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
    background: '#F5F8FF',
    borderRadius: '2rem',
    marginRight: '0.25rem',
  },
  titleButton: {
    color: '#004ACA',
  },
  rigthContainer: { alignItems: 'center', display: 'flex' },
  titleModal: {
    fontSize: '1rem',
    fontWeight: '600',
  },
  listContainer: {},
  emptyState: {
    width: '28.75rem',
    background: '#F5F6FA',
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
    color: '#2E365C',
  },
  emptyText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
    paddingBottom: '0.5rem',
    textAlign: 'center',
    color: '#00030DB2',
  },
  actionButton: {
    border: '1px solid #00030D33',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
  },
  actionButtonText: {
    fontSize: '0.875rem',
    lineHeight: '1.25rem  ',
  },
  paperStyleMenu: {
    borderRadius: '0.75rem',
    background: '#F5F6FA',
  },
};
