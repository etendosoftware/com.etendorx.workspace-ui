import { Grid } from '@mui/material';
import { SearchOutlined } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Select from '@workspaceui/componentlibrary/src/components/Input/Select';
import { topFilms } from './mock';

export default {
  title: 'Components/Input/Select',
  component: Select,
};

const Template = () => (
  <Grid container spacing={2} style={{ background: 'white', padding: 20, width: 300 }}>
    <Grid item xs={12}>
      <Select
        iconLeft={<SearchOutlined sx={{ width: 24, height: 24 }} />}
        title="Películas"
        helperText={{
          label: 'Top 15',
          icon: <CheckCircleIcon sx={{ width: 16, height: 16 }} />,
        }}
        options={topFilms}
        getOptionLabel={option => option.title}
      />
    </Grid>
  </Grid>
);

export const Default = Template.bind({});
