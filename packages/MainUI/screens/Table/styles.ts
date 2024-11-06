import { useMemo } from 'react';
import { Theme, useTheme, SxProps } from '@mui/material';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

type StylesType = {
  sx: {
    container: SxProps<Theme>;
    button: (tab: Tab, activeKey?: string) => SxProps<Theme>;
  };
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        container: {
          padding: '0.5rem',
        },
        button: (tab: Tab, activeKey?: string) => ({
          margin: '0.25rem',
          color: tab.id === activeKey ? theme.palette.text.primary : theme.palette.text.secondary,
          backgroundColor: tab.id === activeKey ? theme.palette.background.default : theme.palette.action.disabled,
          border: '1px solid transparent',
          transition: theme.transitions.create(['color', 'background-color'], {
            duration: theme.transitions.duration.short,
          }),
          '&:hover': {
            background: theme.palette.baselineColor.neutral[80],
            color: theme.palette.baselineColor.neutral[0],
            borderRadius: '0.5rem',
            border: '1px solid transparent',
          },
        }),
      },
    }),
    [theme],
  );
};
