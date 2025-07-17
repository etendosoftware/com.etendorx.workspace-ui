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
    icon: <SettingIcon fill='#2E365C' />,
    label: 'Appearance',
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
