import { CSSProperties } from 'react';
import { theme } from '../../theme';

export const MODAL_WIDTH = 332;
export const menuSyle = { paddingY: 0 };

export const styles: { [key: string]: CSSProperties } = {
  userProfileStyles: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: '0.75rem',
    background: theme.palette.baselineColor.neutral[0],
    position: 'relative',
    overflow: 'hidden',
  },
  iconButtonStyles: {
    width: '2.5rem',
    height: '2.5rem',
    color: theme.palette.baselineColor.neutral[80],
  },
  iconStyles: {
    width: '1.25rem',
    height: '1.25rem',
    color: theme.palette.baselineColor.neutral[80],
  },
  profileImageContainerStyles: {
    position: 'relative',
    marginTop: '1rem',
    width: '4.5rem',
    height: '4.5rem',
    zIndex: '2',
    borderRadius: '4.5rem',
    border: `4px solid ${theme.palette.baselineColor.neutral[0]}`,
  },
  logoutButtonStyles: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    height: '2rem',
    width: '2rem',
    zIndex: '1',
  },
  profileImageStyles: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    position: 'relative',
    zIndex: 2,
  },
  svgContainerStyles: {
    display: 'flex',
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 1,
  },
  profileDetailsStyles: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 2,
    padding: '0rem 0.5rem',
    background: theme.palette.dynamicColor.light,
    borderRadius: '12.5rem',
  },
  nameStyles: {
    margin: 0,
    zIndex: 2,
    padding: '0 0 0.25rem 0',
  },
  emailStyles: {
    margin: 0,
    color: theme.palette.dynamicColor.main,
    zIndex: 2,
  },
  paperStyleMenu: {
    borderRadius: '0.75rem',
  },
  //Toggle Styles
  toggleContainerStyles: {
    display: 'flex',
    padding: '0.25rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: '12.5rem',
  },
  toggleButtonStyles: {
    height: '2.5rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    justifyContent: 'center',
    alignItems: 'center',
    flex: '1 0 0',
    border: '0px solid',
    borderRadius: '12.5rem',
  },
  toggleSectionStyles: {
    display: 'flex',
    padding: '1rem 0.75rem 0.5rem 0.75rem',
    alignItems: 'center',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  // Button Container
  buttonContainerStyles: {
    display: 'flex',
    padding: '0rem 0.75rem 0.75rem 0.75rem',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    flex: '1 0 0',
  },
  buttonStyles: {
    fontWeight: '600',
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    height: '2.5rem',
    borderRadius: '6.25rem',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[80]}`,
    flex: '1 0 0',
    color: 'black',
    background: 'white',
  },
  saveButtonStyles: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: 'white',
    padding: '0.5rem 1rem',
    background: 'black',
    flex: '1 0 0',
    borderRadius: '6.25rem',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[80]}`,
    height: '2.5rem',
  },
};
