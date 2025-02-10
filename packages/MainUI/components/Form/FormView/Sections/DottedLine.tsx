import { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';

const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      dottedLine: {
        backgroundImage: `radial-gradient(circle, ${theme.palette.divider} 1px, transparent 1px)`,
        backgroundSize: '8px 8px',
        backgroundPosition: 'right',
        backgroundRepeat: 'repeat-y',
        width: '8px',
        height: '100%',
        margin: '0 1rem',
      },
    }),
    [theme.palette.divider],
  );
};

const DottedLine = ({
  fields,
  dottedLineInterval,
  index,
}: {
  fields: unknown[];
  dottedLineInterval: number;
  index: number;
}) => {
  const { dottedLine } = useStyle();
  const shouldRenderDottedLine = index < fields.length && (index + 1) % dottedLineInterval !== 0;

  if (shouldRenderDottedLine) {
    return <Box sx={dottedLine} />;
  }

  return null;
};

export default DottedLine;
