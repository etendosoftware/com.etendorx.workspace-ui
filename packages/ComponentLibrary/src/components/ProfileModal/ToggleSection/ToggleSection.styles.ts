import { CSSProperties } from 'react';
import { theme } from '../../../theme';

export const toggleContainerStyles: CSSProperties = {
    display: 'flex',
    padding: '0.25rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: '12.5rem',
    background: theme.palette.baselineColor.transparentNeutral[50],
  };
  
  export const toggleButtonStyles: CSSProperties = {
    height: '2.5rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    justifyContent: 'center',
    alignItems: 'center',
    flex: '1 0 0',
    border: '0px solid',
    borderRadius: '12.5rem',
  };
    
  export const toggleSectionStyles: CSSProperties = {
    display: 'flex',
    padding: '1rem 0.75rem 0.5rem 0.75rem',
    alignItems: 'center',
    flexDirection: 'column',
    gap: '0.5rem',
  };
