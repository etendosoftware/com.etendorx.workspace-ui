import { theme } from '@workspaceui/componentlibrary/theme';
import { useMemo } from 'react';

const useStyles = () => {
  return useMemo(
    () => ({
      mainContainer: {
        overflow: 'hidden',
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      },
      container: {
        marginTop: '0.25rem',
        overflow: 'hidden',
        display: 'flex',
        flexGrow: '1',
      },
      sidebarPaper: {
        right: 4,
        maxWidth: '32%',
        position: 'absolute',
        backgroundColor: theme.palette.baselineColor.neutral[10],
        boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.1)',
        padding: '0.5rem',
        borderRadius: '1rem',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflowY: 'auto',
        height: '50rem',
        transition: 'transform 0.5s ease',
        '&::-webkit-scrollbar': {
          width: '0px',
        },
        scrollbarWidth: 'none',
        '-ms-overflow-style': 'none',
      },
      tablePaper: {
        borderRadius: '1rem 1rem 0 0',
        overflow: 'hidden',
        height: '100%',
        transition: 'width 0.5s ease',
      },
    }),
    [],
  );
};

export default useStyles;
