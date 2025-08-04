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

import type { FC } from 'react';
import { Grid, Tooltip, Button, Box } from '@mui/material';

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
};

const TooltipDemo: FC = () => {
  return (
    <Box sx={{ margin: '10rem 35rem', width: 500 }}>
      <Grid container justifyContent='center'>
        <Grid item>
          <Tooltip title='Add' placement='top-start' arrow>
            <Button>top-start</Button>
          </Tooltip>
          <Tooltip title='Add' placement='top' arrow>
            <Button>top</Button>
          </Tooltip>
          <Tooltip title='Add' placement='top-end' arrow>
            <Button>top-end</Button>
          </Tooltip>
        </Grid>
      </Grid>
      <Grid container justifyContent='center'>
        <Grid item xs={6}>
          <Tooltip title='Add' placement='left-start' arrow>
            <Button>left-start</Button>
          </Tooltip>
          <br />
          <Tooltip title='Add' placement='left' arrow>
            <Button>left</Button>
          </Tooltip>
          <br />
          <Tooltip title='Add' placement='left-end' arrow>
            <Button>left-end</Button>
          </Tooltip>
        </Grid>
        <Grid item container xs={6} alignItems='flex-end' direction='column'>
          <Grid item>
            <Tooltip title='Add' placement='right-start' arrow>
              <Button>right-start</Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip title='Add' placement='right' arrow>
              <Button>right</Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip title='Add' placement='right-end' arrow>
              <Button>right-end</Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Grid>
      <Grid container justifyContent='center'>
        <Grid item>
          <Tooltip title='Add' placement='bottom-start' arrow>
            <Button>bottom-start</Button>
          </Tooltip>
          <Tooltip title='Add' placement='bottom' arrow>
            <Button>bottom</Button>
          </Tooltip>
          <Tooltip title='Add' placement='bottom-end' arrow>
            <Button>bottom-end</Button>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

const Template = () => <TooltipDemo />;

export const Default = Template.bind({});
