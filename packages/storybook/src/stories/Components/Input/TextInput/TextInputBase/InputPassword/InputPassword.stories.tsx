import { useState } from 'react';
import { Grid } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import InputPassword from '../../../../../../../../ComponentLibrary/src/components/Input/TextInput/TextInputBase/InputPassword';

export default {
  title: 'Components/Input/TextInput/TextInputBase/InputPassword',
  component: InputPassword,
};

const TemplatePassword = () => {
  const [value, setValue] = useState("");
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <InputPassword
          leftIcon={<LockOutlined />}
          value={value}
          setValue={setValue}
          label="Password"
        />
      </Grid>
    </Grid>
  );
};

export const Default = TemplatePassword.bind({});
