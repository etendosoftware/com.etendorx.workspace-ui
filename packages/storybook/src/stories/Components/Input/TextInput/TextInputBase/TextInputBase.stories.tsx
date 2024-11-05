import { useState } from 'react';
import { Grid } from '@mui/material';
import { Search, LockOutlined } from '@mui/icons-material';
import TextInputBase from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputBase';

export default {
  title: 'Components/Input/TextInput/TextInputBase',
  component: TextInputBase,
};

const TemplateBase = () => {
  const [value, setValue] = useState('');
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextInputBase
          leftIcon={<LockOutlined />}
          rightIcon={<Search />}
          onRightIconClick={() => alert('Icon clicked')}
          value={value}
          setValue={setValue}
          placeholder="Search"
        />
      </Grid>
    </Grid>
  );
};

export const Default = TemplateBase.bind({});
