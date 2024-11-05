import { useState } from 'react';
import { Grid } from '@mui/material';
import { MOCK_AUTO_COMPLETE_TEXTS } from './mock';
import TextInputAutocomplete from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete';

export default {
  title: 'Components/Input/TextInput/TextInputAutocomplete',
  component: TextInputAutocomplete,
};

const Template = () => {
  const [value, setValue] = useState('');
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextInputAutocomplete
          value={value}
          setValue={setValue}
          placeholder="Search"
          autoCompleteTexts={MOCK_AUTO_COMPLETE_TEXTS}
        />
      </Grid>
      <Grid item xs={12}>
        <TextInputAutocomplete
          value={value}
          setValue={setValue}
          placeholder="Search"
          disabled
          autoCompleteTexts={MOCK_AUTO_COMPLETE_TEXTS}
        />
      </Grid>
    </Grid>
  );
};

export const Default = Template.bind({});
