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

import { Typography, Box } from '@mui/material';
import SearchModal from '@workspaceui/componentlibrary/src/components/SearchModal';
import { typographyTitleStyles } from '../../Styles/Typography/styles';
import { TABS_CONTENT, DEFAULT_CONTENT } from './mock';

export default {
  title: 'Components/SearchModal',
  component: SearchModal,
};

export const DefaultVariant = () => <SearchModal defaultContent={DEFAULT_CONTENT} variant='default' />;

export const TabsVariant = () => <SearchModal tabsContent={TABS_CONTENT} variant='tabs' />;

export const BothVariants = () => (
  <Box sx={{ display: 'flex', gap: '20px' }}>
    <Box>
      <Typography variant='h6' style={typographyTitleStyles}>
        Default Variant
      </Typography>
      <SearchModal defaultContent={DEFAULT_CONTENT} variant='default' />
    </Box>
    <Box>
      <Typography variant='h6' style={typographyTitleStyles}>
        Tabs Variant
      </Typography>
      <SearchModal tabsContent={TABS_CONTENT} variant='tabs' />
    </Box>
  </Box>
);
