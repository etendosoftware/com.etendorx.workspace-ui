import { DataGrid, Table } from '@workspaceui/componentlibrary/src/components';
import { TabContent } from '@workspaceui/componentlibrary/src/Interfaces';
import {
  Button,
  Grid,
} from '@workspaceui/componentlibrary/src/components//MUI';
import { Tab } from '@workspaceui/componentlibrary/src/components';

const Home = () => {
  const tabArray: TabContent[] = [
    {
      title: '🎹 Buttons',
      children: (
        <Grid container spacing={2}>
          <Grid xs={12} spacing={2}>
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
          <Grid xs={12}>
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
          <Grid xs={12}>
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
      title: '📦 Simple Table',
      children: <Table />,
    },
    { title: '⚡️ Data Grid', children: <DataGrid /> },
  ];

  return (
    <div className="container">
      <Tab tabArray={tabArray} />
    </div>
  );
};

export default Home;
