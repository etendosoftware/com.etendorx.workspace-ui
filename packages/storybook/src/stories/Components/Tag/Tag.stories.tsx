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
