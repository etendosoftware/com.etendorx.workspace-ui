/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import '../declarations.d.ts';

interface ApplyHOCProps {
  [key: string]: any;
}

function ApplyHOC<T extends ApplyHOCProps>(Component: React.ComponentType<T>) {
  const WithTheme: React.FC<T> = props => {
    return (
      <ThemeProvider theme={theme}>
        <Component {...props} />
      </ThemeProvider>
    );
  };

  return WithTheme;
}

export default ApplyHOC;
