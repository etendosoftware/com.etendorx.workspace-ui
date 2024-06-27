import React from 'react';
import { Box, Typography, Card } from '@mui/material';
import { ColorSwatchProps } from './ColorSwatch.types';
import { boxStyles, cardStyles, containerBoxStyles, typographyStyles } from './styles';

const ColorSwatch: React.FC<ColorSwatchProps> = ({ colorName, colorValue }) => {
  return (
    <Card variant="outlined" style={cardStyles}>
      <Box style={{ backgroundColor: colorValue, ...boxStyles }} />
      <Box style={containerBoxStyles} >
        <Typography variant="caption" sx={typographyStyles.caption}>{colorName}</Typography>
        <Typography variant="caption" sx={typographyStyles.valueCaption}>{colorValue}</Typography>
      </Box>
    </Card>
  );
};

export default ColorSwatch;
