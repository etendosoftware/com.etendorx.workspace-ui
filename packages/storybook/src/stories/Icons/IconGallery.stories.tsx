/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import React from 'react';
import { Grid, Typography, Card, Box } from '@mui/material';
import { typographyTitleStyles, cardStyles, boxStyles, typographyStyles } from './styles';
import { iconPaths } from './iconPaths';
import { theme } from '../../../../ComponentLibrary/src/theme';

const icons = iconPaths.map((path) =>
  React.lazy(() => import(`../../../../ComponentLibrary/src/assets/icons/${path}.svg`)),
);

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
      <Typography variant='h6' style={typographyTitleStyles}>
        Icon Gallery
      </Typography>
    </Grid>
    <Grid container item spacing={2}>
      {icons.map((IconComponent, index) => (
        <Grid item xs={6} sm={4} md={2} xl={2} key={iconPaths[index]}>
          <Card variant='outlined' style={cardStyles}>
            <Box style={boxStyles}>
              <IconComponent fill={theme.palette.baselineColor.neutral[80]} width='48' height='48' />
            </Box>
            <Typography variant='caption' sx={typographyStyles.caption}>
              {iconPaths[index]}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Grid>
);
