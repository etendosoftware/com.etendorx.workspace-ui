import { CSSProperties } from 'react';

const NEUTRAL_10 = '#F5F6FA';
const NEUTRAL_0 = '#FCFCFD';
const TRANSPARENT_NEUTRAL_5 = '#00030D1A';
const PRIMARY_CONTRAST = '#F5F8FF';

export const menuSyle = { paddingY: 0 };
export const COLUMN_SPACING = '0.75rem';
export const NEUTRAL_30 = '#B1B8D8';
export const FIRST_MARGIN_TOP = '0.75rem';
export const BORDER_SELECT_1 = '1px solid ';
export const BORDER_SELECT_2 = '2px solid ';
export const DYNAMIC_COLOR_MAIN = '#004ACA';
export const NEUTRAL_90 = '#1D223A';

export const styles: { [key: string]: CSSProperties } = {
  titleModalContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: NEUTRAL_0,
    padding: '0.75rem',
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
  titleModalImage: {
    width: '1rem',
    height: '1rem',
  },
  titleModal: {
    fontSize: '1rem',
    fontWeight: '600',
    lineHeight: '1.21rem',
    textAlign: 'left',
  },
  titleButton: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.063rem',
    color: DYNAMIC_COLOR_MAIN,
    textDecoration: 'none',
  },
  imgContainer: {
    borderRadius: '0.75rem',
    width: '7rem',
    height: '4.5rem',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.25s ease',
  },
  img: { width: '100%', height: '100%' },
  title: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.063rem',
    textAlign: 'left',
    marginBottom: '0.75rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.063rem',
    textAlign: 'left',
  },
  labelIcon: {
    width: '1rem',
    height: '1rem',
    marginRight: '0.25rem',
  },
  labelIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '1.25rem',
    marginTop: '0.25rem',
  },
  gridContainer: {
    padding: '0.75rem 1rem',
  },
  gridSectionContainer: {
    border: `1px solid ${TRANSPARENT_NEUTRAL_5}`,
    background: NEUTRAL_0,
    padding: '0.75rem 1rem 0.75rem 1rem',
    borderRadius: '0.75rem',
  },
  paperStyleMenu: { background: NEUTRAL_10, borderRadius: '0.75rem' },
  listContainer: {
    padding: '0.75rem',
  },
};
