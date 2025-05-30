import { Grid } from '@mui/material';
import { InfoOutlined, CheckOutlined, Error } from '@mui/icons-material';
import Tag from '@workspaceui/componentlibrary/src/components/Tag';

export default {
  title: 'Components/Tag',
  component: Tag,
};

const Template = () => (
  <Grid container spacing={2}>
    <Grid item>
      <Tag type='success' icon={<InfoOutlined />} label='Registered' />
    </Grid>
    <Grid item>
      <Tag type='primary' label='Registered' />
    </Grid>
    <Grid item>
      <Tag type='warning' icon={<CheckOutlined />} label='Period Closed' />
    </Grid>
    <Grid item>
      <Tag type='error' icon={<Error />} label='Canceled' />
    </Grid>
    <Grid item>
      <Tag type='draft' label='In Draft' />
    </Grid>
  </Grid>
);

export const Variants = Template.bind({});
