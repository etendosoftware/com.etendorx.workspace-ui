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
        title='Películas'
        helperText={{
          label: 'Top 15',
          icon: <CheckCircleIcon sx={{ width: "1rem", height: "1rem" }} />,
        }}
        options={topFilms}
        getOptionLabel={(option) => option.title}
      />
    </Grid>
  </Grid>
);

export const Default = Template.bind({});
