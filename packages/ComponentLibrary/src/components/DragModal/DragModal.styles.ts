import { CSSProperties } from 'react';

export const listStyles: CSSProperties = {
  padding: 0,
};

export const menuItemStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: '2.25rem',
  padding: 'var(--Spacing-size-2, 0.5rem)',
  cursor: 'grab',
  listStyleType: 'none',
};

export const personLabelStyles: CSSProperties = {
  marginRight: '0.625rem',
};


export const containerStyles: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--Spacing-size-3, 0.75rem) var(--Spacing-size-5, 1.25rem) 0px var(--Spacing-size-5, 1.25rem)',
};


export const showAllStyles: CSSProperties = {
    textDecoration: 'none',
    color: 'blue',
    cursor: 'pointer',
};