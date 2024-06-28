import { useState } from 'react';
import { Grid } from '@mui/material';
import SearchInputWithVoice from '../../../../../../../../ComponentLibrary/src/components/Input/TextInput/TextInputAutocomplete/SearchInputWithVoice';

export default {
  title: 'Components/Input/TextInput/SearchInputWithVoice',
  component: SearchInputWithVoice,
};

const TemplateVoice = () => {
  const [value, setValue] = useState("");
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <SearchInputWithVoice
          value={value}
          setValue={setValue}
          placeholder="Search"
          onVoiceClick={() => alert('Voice activated')}
        />
      </Grid>
    </Grid>
  );
};

export const Default = TemplateVoice.bind({});
