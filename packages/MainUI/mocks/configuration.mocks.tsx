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

import SettingIcon from '@workspaceui/componentlibrary/src/assets/icons/settings.svg';
import {
  SECTION_THEME_ID,
  SECTION_TABLE_DENSITY_ID,
  SECTION_COMMON_TOOLBAR_BUTTONS_ID,
  SECTION_SPECIFIC_TOOLBAR_BUTTONS_ID,
  SECTION_DENSITY_ID,
  INTERFACE_SCALE_ITEMS,
  THEME_ITEMS,
  TABLE_DENSITY_ITEMS,
  COMMON_TOOLBAR_BUTTONS_ITEMS,
  SPECIFIC_TOOLBAR_BUTTONS_ITEMS,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/constants";

export const modalConfig = {
  icon: <SettingIcon />,
  title: {
    icon: <SettingIcon fill='var(--color-dynamic-main)' />,
    label: 'Quick Setup',
  },
  linkTitle: { label: 'View all settings', url: '/settings' },
  sections: [
    {
      id: SECTION_THEME_ID,
      name: 'Theme',
      items: THEME_ITEMS,
      selectedItem: 0,
      isDisabled: true,
    },
    {
      id: SECTION_TABLE_DENSITY_ID,
      name: 'Table Density',
      items: TABLE_DENSITY_ITEMS,
      selectedItem: 0,
      isDisabled: true,
    },
    {
      id: SECTION_COMMON_TOOLBAR_BUTTONS_ID,
      name: 'Common Toolbar Buttons',
      items: COMMON_TOOLBAR_BUTTONS_ITEMS,
      selectedItem: 0,
      isDisabled: true,
    },
    {
      id: SECTION_SPECIFIC_TOOLBAR_BUTTONS_ID,
      name: 'Specific Toolbar Buttons',
      items: SPECIFIC_TOOLBAR_BUTTONS_ITEMS,
      selectedItem: 0,
      isDisabled: true,
    },
    {
      id: SECTION_DENSITY_ID,
      name: "Interface scale",
      items: INTERFACE_SCALE_ITEMS,
      selectedItem: 1,
      isDisabled: false,
    },
  ],
  onChangeSelect: console.log,
};
