import React from 'react';
import { Box, Button, Grid } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';

const TooltipDemo: React.FC = () => {
  return (
    <Box sx={{ margin: '10rem 35rem', width: 500 }}>
      <Grid container justifyContent="center">
        <Grid item>
          <Tooltip title="Add" placement="top-start" arrow>
            <Button>top-start</Button>
          </Tooltip>
          <Tooltip title="Add" placement="top" arrow>
            <Button>top</Button>
          </Tooltip>
          <Tooltip title="Add" placement="top-end" arrow>
            <Button>top-end</Button>
          </Tooltip>
        </Grid>
      </Grid>
      <Grid container justifyContent="center">
        <Grid item xs={6}>
          <Tooltip title="Add" placement="left-start" arrow>
            <Button>left-start</Button>
          </Tooltip>
          <br />
          <Tooltip title="Add" placement="left" arrow>
            <Button>left</Button>
          </Tooltip>
          <br />
          <Tooltip title="Add" placement="left-end" arrow>
            <Button>left-end</Button>
          </Tooltip>
        </Grid>
        <Grid item container xs={6} alignItems="flex-end" direction="column">
          <Grid item>
            <Tooltip title="Add" placement="right-start" arrow>
              <Button>right-start</Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip title="Add" placement="right" arrow>
              <Button>right</Button>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip title="Add" placement="right-end" arrow>
              <Button>right-end</Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Grid>
      <Grid container justifyContent="center">
        <Grid item>
          <Tooltip title="Add" placement="bottom-start" arrow>
            <Button>bottom-start</Button>
          </Tooltip>
          <Tooltip title="Add" placement="bottom" arrow>
            <Button>bottom</Button>
          </Tooltip>
          <Tooltip title="Add" placement="bottom-end" arrow>
            <Button>bottom-end</Button>
          </Tooltip>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TooltipDemo;
