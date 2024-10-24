import React from 'react';
import { Grid, Typography, Card, Box } from '@mui/material';
import { typographyTitleStyles, cardStyles, boxStyles, typographyStyles } from './styles';
import { iconPaths } from './iconPaths';
import { theme } from '../../../../ComponentLibrary/src/theme';

const icons = iconPaths.map(path => React.lazy(() => import(`../../../../ComponentLibrary/public/icons/${path}.svg`)));

export default {
  title: 'Design System/Icon Gallery',
  component: Grid,
  decorators: [
    (Story: React.FC) => (
      <React.Suspense>
        <Story />
      </React.Suspense>
    ),
  ],
};

export const IconGallery = () => (
  <Grid container spacing={2}>
    <Grid item xs={12}>
      <Typography variant="h6" style={typographyTitleStyles}>
        Icon Gallery
      </Typography>
    </Grid>
    <Grid container item spacing={2}>
      {icons.map((IconComponent, index) => (
        <Grid item xs={6} sm={4} md={2} xl={2} key={iconPaths[index]}>
          <Card variant="outlined" style={cardStyles}>
            <Box style={boxStyles}>
              <IconComponent fill={theme.palette.baselineColor.neutral[80]} width="48" height="48" />
            </Box>
            <Typography variant="caption" sx={typographyStyles.caption}>
              {iconPaths[index]}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Grid>
);
