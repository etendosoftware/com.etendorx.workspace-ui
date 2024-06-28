import { CSSProperties } from 'react';

export const styles: { [key: string]: CSSProperties } = {
  CustomizeButton: {
    fontWeight: '500',
    fontSize: '1rem',
    width: '100%',
    height: '2.25rem',
    borderRadius: '0.5rem',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
  },
  StartIconStyles: {
    marginLeft: '0.5rem',
    maxHeight: '1rem',
    maxWidth: '1rem',
  },
  EndIconStyles: {
    position: 'absolute',
    right: '0',
    paddingLeft: '0 0.5rem',
  },
  menuItemStyles: {
    height: '2.25rem',
    cursor: 'grab',
    padding: '0.5rem',
  },
  itemsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  leftContainer: {
    alignItems: 'center',
    display: 'flex',
  },
  containerStyles: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.25rem 0 1.25rem',
    maxHeight: '2.25rem',
  },
  showAllStyles: {
    textDecoration: 'none',
    color: 'blue',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
  },
  personLabelStyles: {
    display: 'inline-block',
    maxWidth: '8rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listStyles: {
    padding: '0.5rem',
  },
  dragStyles: {
    maxWidth: '1rem',
    maxHeight: '1rem',
    marginRight: '0.5rem',
  },
};

export const MODAL_WIDTH = 240;
