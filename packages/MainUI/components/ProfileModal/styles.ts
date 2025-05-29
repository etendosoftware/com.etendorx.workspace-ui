import { type CSSProperties, useMemo } from 'react';
import { type SxProps, type Theme, useTheme } from '@mui/material';

export const MODAL_WIDTH = 332;
export const menuSyle = { paddingY: 0 };
export const TEXT_LOGO = 'Etendo';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
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

        profileImageStyles: {
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          position: 'relative',
          zIndex: 2,
        },
        profileWithoutImage: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.palette.baselineColor.neutral[0],
          backgroundColor: theme.palette.baselineColor.neutral[80],
          fontWeight: 'bold',
          fontSize: '1rem',
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
          margin: '0.5rem 0',
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
      } as { [key: string]: CSSProperties },
      sx: {
        buttonStyles: {
          fontWeight: '600',
          fontSize: '0.875rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          height: '2.5rem',
          borderRadius: '6.25rem',
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[20]}`,
          flex: '1 0 0',
          color: theme.palette.baselineColor.transparentNeutral[70],
          background: theme.palette.baselineColor.neutral[0],
          '&:hover': {
            borderRadius: '6.25rem',
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[0],
          },
        },
        saveButtonStyles: {
          fontWeight: '600',
          fontSize: '0.875rem',
          color: theme.palette.baselineColor.neutral[0],
          padding: '0.5rem 1rem',
          background: theme.palette.baselineColor.neutral[100],
          flex: '1 0 0',
          borderRadius: '6.25rem',
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[80]}`,
          height: '2.5rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderRadius: '6.25rem',
            background: theme.palette.dynamicColor.main,
            color: theme.palette.baselineColor.neutral[0],
          },
          '&:disabled': {
            background: theme.palette.baselineColor.neutral[80],
            color: theme.palette.baselineColor.neutral[60],
            border: `1px solid ${theme.palette.baselineColor.transparentNeutral[60]}`,
            opacity: 0.7,
            cursor: 'not-allowed',
            boxShadow: 'none',
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme],
  );
};
