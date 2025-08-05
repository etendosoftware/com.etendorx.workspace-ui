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

import { useState } from 'react';
import { Grid } from '@mui/material';
import SearchInputWithVoice from '@workspaceui/componentlibrary/src/components/Input/TextInput/TextInputAutocomplete/SearchInputWithVoice';

export default {
  title: 'Components/Input/TextInput/SearchInputWithVoice',
  component: SearchInputWithVoice,
};

const TemplateVoice = () => {
  const [value, setValue] = useState('');
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <SearchInputWithVoice
          value={value}
          setValue={setValue}
          placeholder='Search'
          onVoiceClick={() => alert('Voice activated')}
        />
      </Grid>
    </Grid>
  );
};

export const Default = TemplateVoice.bind({});
