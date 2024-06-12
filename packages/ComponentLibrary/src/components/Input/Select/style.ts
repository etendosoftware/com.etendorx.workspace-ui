export const styles = {
    root: {
      '& .MuiInput-root': {
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
        fontSize: 14,
        fontWeight: 500,
        textAlign: 'left',
        color: '#00030D',
        '&:before': {
          borderColor: '#00030D1A',
          borderWidth: '1px',
        },
        ':hover:not(.Mui-focused)': {
          '&:before': {
            borderColor: '#1D223A',
            borderWidth: '1px',
          },
        },
      },
      label: {
        color: '#2e2e2e',
        fontWeight: 'bold',
        '&.Mui-focused': {
          color: 'secondary.main',
        },
      },
    },
    labelProps: {
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25rem',
      color: '#2E365C',
    },
    props: {
      height: '3rem',
    },
    startAdornment: {
      height: '1rem',
      width: '1rem',
      marginRight: '0.5rem',
    },
  };
  