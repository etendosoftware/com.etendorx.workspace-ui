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
          color: tab.id === activeKey ? theme.palette.text.primary : theme.palette.text.secondary,
          backgroundColor: tab.id === activeKey ? theme.palette.background.default : theme.palette.action.disabled,
          borderRadius: '0.5rem',
          border: `1px solid ${theme.palette.divider}`,
          padding: theme.spacing(1),
          margin: '0 0.5rem 0.25rem 0',
          transition: theme.transitions.create(['color', 'background-color'], {
            duration: theme.transitions.duration.short,
          }),
          '&:hover': {
            borderRadius: '0.5rem',
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.baselineColor.neutral[20],
          },
        }),
      },
    }),
    [theme],
  );
};
