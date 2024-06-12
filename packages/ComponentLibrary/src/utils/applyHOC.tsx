/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';

import "../App.css";
import '../declarations.d.ts';
import { CssBaseline } from '@mui/material';

interface ApplyHOCProps {
  [key: string]: any;
}

function ApplyHOC<T extends ApplyHOCProps>(Component: React.ComponentType<T>) {
  const WithTheme: React.FC<T> = props => {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...props} />
      </ThemeProvider>
    );
  };

  return WithTheme;
}

export default ApplyHOC;
