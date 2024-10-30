import { useTheme } from '@mui/material';

export const useStyle = () => {
  const theme = useTheme();

  return {
    styles: {
      itemBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.5rem',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'background-color 500ms, color 500ms',
        '&:hover': {
          backgroundColor: theme.palette.dynamicColor.contrastText,
          color: theme.palette.dynamicColor.main,
        },
      },
      itemIcon: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        fontWeight: 500,
      },
      itemText: {
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        fontWeight: 500,
        opacity: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
      newLabel: {
        backgroundColor: theme.palette.baselineColor.etendoPrimary.main,
        color: theme.palette.baselineColor.neutral[0],
        borderRadius: '6.25rem',
        padding: '0 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
      },
    },
  };
};
