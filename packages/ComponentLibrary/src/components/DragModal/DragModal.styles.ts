import { CSSProperties } from 'react';

export const listStyles: CSSProperties = {
  margin: '0.5rem',
};

export const menuItemStyles: CSSProperties = {
  height: '2.25rem',
  cursor: 'grab',
  padding: '0.5rem',
};

export const itemsContainer: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
};

export const leftContainer: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
};

export const containerStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.75rem 1.25rem 0 1.25rem',
  maxHeight: '2.25rem',
};

export const showAllStyles: CSSProperties = {
  textDecoration: 'none',
  color: 'blue',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  font: 'inherit',
};

export const personLabelStyles: CSSProperties = {
  display: 'inline-block',
  maxWidth: '8rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
