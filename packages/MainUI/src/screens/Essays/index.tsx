import {
  DataGrid,
  TableV2,
  Button,
  Grid,
  Tab,
} from '@workspaceui/componentlibrary/src/components';
import { TabContent } from '@workspaceui/componentlibrary/src/interfaces';

const Tests = () => {
  const tabArray: TabContent[] = [
    {
      title: '🎹 Buttons',
      children: (
        <Grid container spacing={2}>
          <Grid item xs={12} spacing={2}>
            <Button
              sx={{ margin: '1rem' }}
              variant="text"
              onClick={() => console.log('click')}>
              Primary
            </Button>
            <Button sx={{ margin: '1rem' }} variant="contained">
              Primary
            </Button>
            <Button sx={{ margin: '1rem' }} disabled={true} variant="contained">
              Primary
            </Button>
            <Button sx={{ margin: '1rem' }} variant="outlined">
              Primary
            </Button>
            <Button sx={{ margin: '1rem' }} disabled={true} variant="outlined">
              Primary
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              sx={{ margin: '1rem' }}
              variant="contained"
              color="secondary"
              onClick={() => console.log('token')}>
              Secondary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              disabled={true}
              variant="contained"
              color="secondary">
              Secondary
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button
              sx={{ margin: '1rem' }}
              variant="contained"
              color="tertiary">
              Tertiary
            </Button>
            <Button
              sx={{ margin: '1rem' }}
              disabled={true}
              variant="contained"
              color="tertiary">
              Tertiary
            </Button>
          </Grid>
        </Grid>
      ),
    },
    {
      title: '⚡️ Data Grid',
      children: <DataGrid />,
    },
    {
      title: '🧩 TableV2',
      children: <TableV2 />,
    },
  ];

  return (
    <div className="container">
      <Tab tabArray={tabArray} />
    </div>
  );
};

export default Tests;
