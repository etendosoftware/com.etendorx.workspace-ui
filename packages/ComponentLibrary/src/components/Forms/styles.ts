import { useMemo } from 'react';
import { useTheme } from '@mui/material';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        container: {
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: theme.palette.dynamicColor.light,
          padding: '2rem',
        },
        contentWrapper: {
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          maxWidth: '90rem',
          gap: '15rem',
        },
        leftSection: {
          flex: '2',
          display: 'flex',
          alignItems: 'center',
        },
        rightSection: {
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        paper: {
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          border: 'none',
          boxShadow: 'none',
        },
        title: {
          color: theme.palette.baselineColor.neutral[80],
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '1rem',
          textAlign: 'left',
        },
        subtitle: {
          color: theme.palette.baselineColor.neutral[80],
          marginBottom: '1rem',
          textAlign: 'left',
        },
        input: {
          transition: 'border-color 0.2s',
          '& input': {
            padding: '0.5rem',
            color: theme.palette.baselineColor.neutral[100],
            '&::placeholder': {
              color: theme.palette.baselineColor.neutral[100],
              opacity: 1,
            },
          },
          '&:hover': {
            borderColor: theme.palette.baselineColor.neutral[100],
          },
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            outline: 'none',
          },
        },
        button: {
          marginTop: '1rem',
          backgroundColor: theme.palette.baselineColor.neutral[80],
          color: theme.palette.baselineColor.neutral[0],
          padding: '0.75rem',
          borderRadius: '0.5rem',
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: theme.palette.baselineColor.neutral[60],
          },
        },
        error: {
          color: theme.palette.error.main,
          marginTop: '1rem',
          fontSize: '0.875rem',
        },
        // Grid Layout Styles
        gridContainer: {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.5rem',
          width: '100%',
          aspectRatio: '1/1',
          padding: '2rem',
          background: `linear-gradient(135deg, ${theme.palette.baselineColor.neutral[40]} 0%, ${theme.palette.baselineColor.neutral[90]} 100%)`,
          borderRadius: '1.5rem',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.baselineColor.neutral[50]} 100%)`,
            borderRadius: '1.75rem',
            zIndex: -1,
          },
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        },
        gridItem: {
          aspectRatio: '1/1',
          borderRadius: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          border: `1px solid ${theme.palette.baselineColor.neutral[90]}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(145deg, rgba(159, 203, 209, 0.28) 0%, rgba(255,255,255,0) 100%)`,
            opacity: 0.5,
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(10px)',
            zIndex: -1,
          },
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        gridItemWithBg: {
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1), inset 0 2px 1px rgba(255, 255, 255, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 40px rgba(0, 0, 0, 0.2), inset 0 2px 1px rgba(255, 255, 255, 0.1)',
          },
        },
        gridItemContent: {
          position: 'relative',
          zIndex: 2,
        },
        gridText: {
          color: theme.palette.baselineColor.neutral[0],
          textAlign: 'left',
          fontSize: '1.1rem',
          fontWeight: 500,
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
        gridTextYellow: {
          color: 'rgba(0, 0, 0, 0.8)',
          textAlign: 'left',
          fontSize: '1rem',
          fontWeight: 500,
        },
        gridImage: {
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        },
      },
    }),
    [theme],
  );
};
