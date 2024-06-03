import { CSSProperties } from 'react';
import { NEUTRAL_50, PRIMARY_500, START_100, START_700 } from "../../colors";

export const userProfileStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: '0.75rem',
  background: NEUTRAL_50,
  position: 'relative',
  overflow: 'hidden', 
};

export const profileImageContainerStyles: CSSProperties = {
  position: 'relative',
  marginTop: '1rem',
  width: '4.5rem',
  height: '4.5rem',
  zIndex: '2',
  borderRadius: '4.5rem',
  border: `4px solid ${NEUTRAL_50}`,
};

export const logoutButtonStyles: CSSProperties = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  height: '2rem',
  width: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  color: PRIMARY_500,
  background: 'white',
  borderRadius: '50%',
  zIndex: '1',
};

export const profileImageStyles: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  position: 'relative',
  zIndex: 2, 
};

export const svgContainerStyles: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  position: 'absolute',
  zIndex: 1,
};

export const profileDetailsStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  zIndex: 2, 
  padding: '0rem 0.5rem',
  background: START_100,
  borderRadius: '12.5rem',
};

export const nameStyles: CSSProperties = {
  margin: 0,
  zIndex: 2, 
  padding: '0 0 0.25rem 0'
};

export const emailStyles: CSSProperties = {
  margin: 0,
  color: START_700,
  zIndex: 2, 
};

//Toggle Styles

export const toggleContainerStyles: CSSProperties = {
  display: 'flex',
  padding: '0.25rem',
  justifyContent: 'space-between',
  alignItems: 'center',
  alignSelf: 'stretch',
  borderRadius: '12.5rem',
  background: 'rgba(0, 3, 13, 0.05)',
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

// Button Container

export const buttonContainerStyles: CSSProperties = {
  display: 'flex',
  padding: '0rem 0.75rem 0.75rem 0.75rem',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: '0.5rem',
  flex: '1 0 0',
};

export const buttonStyles: CSSProperties = {
  fontWeight: '600',
  fontSize: '0.875rem',
  padding: '0.5rem 1rem',
  cursor: 'pointer',
  height: '2.5rem',
  borderRadius: '6.25rem',
  border: '1px solid rgba(0, 3, 13, 0.20)',
  flex: '1 0 0',
  color: 'black',
  background: 'white',
};
  
export const saveButtonStyles: CSSProperties = {
  fontWeight: '600',
  fontSize: '0.875rem',
  color: 'white',
  padding: '0.5rem 1rem',
  background: 'black',
  flex: '1 0 0',
  borderRadius: '6.25rem',
  border: '1px solid rgba(0, 3, 13, 0.20)',
  height: '2.5rem',
}