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
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          color: tab.id === activeKey ? theme.palette.text.primary : theme.palette.text.secondary,
          backgroundColor: tab.id === activeKey ? theme.palette.background.default : theme.palette.action.disabled,
          transition: theme.transitions.create(['color', 'background-color'], {
            duration: theme.transitions.duration.short,
          }),
        }),
      },
    }),
    [theme],
  );
};
