import { CSSProperties } from 'react';
import { useTheme } from '@mui/material';

type toggleSection = {
  [key: string]: CSSProperties;
};

export const useStyle = () => {
  const theme = useTheme();
  const defaultFill = theme.palette.baselineColor.neutral[60];

  const styles: toggleSection = {
    selectorListStyles: {
      padding: '0rem 1rem 0.75rem 1rem',
    },
    formStyle: {
      margin: '0rem 0rem 1rem 0rem',
    },
    labelStyles: {
      color: theme.palette.baselineColor.neutral[80],
      fontWeight: '600',
    },
    iconStyles: {
      paddingLeft: '0.5rem',
    },
  };

  return { styles, defaultFill };
};
