import SettingIcon from '@workspaceui/componentlibrary/src/assets/icons/settings.svg';
import ThemeLightUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/theme-light.svg?url';
import ThemeDarkUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/theme-dark.svg?url';
import ThemeAutomaticUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/theme-automatic.svg?url';
import DensityCompactUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/density-compact.svg?url';
import DensityStandardUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/density-standard.svg?url';
import DensityComfortableUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/density-comfortable.svg?url';
import CommonToolbarIconUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-icon.svg?url';
import CommonToolbarTextUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-text.svg?url';
import CommonToolbarIconTextUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-icon-and-text.svg?url';
import SpecificToolbarIconUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-icon.svg?url';
import SpecificToolbarIconTextUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-icon-and-text.svg?url';
import SpecificToolbarTextUrl from '@workspaceui/componentlibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-text.svg?url';

export const modalConfig = {
  icon: <SettingIcon />,
  title: {
    icon: <SettingIcon fill="#2E365C" />,
    label: 'Appearance',
  },
  linkTitle: { label: 'View all settings', url: '/settings' },
  sections: [
    {
      name: 'Theme',
      items: [
        { img: ThemeLightUrl, id: '0', label: 'Light' },
        { img: ThemeDarkUrl, id: '1', label: 'Dark' },
        { img: ThemeAutomaticUrl, id: '2', label: 'Automatic' },
      ],
      selectedItem: 0,
    },
    {
      name: 'Table Density',
      items: [
        { img: DensityCompactUrl, id: '3', label: 'Compact' },
        { img: DensityStandardUrl, id: '4', label: 'Standard' },
        { img: DensityComfortableUrl, id: '5', label: 'Comfortable' },
      ],
      selectedItem: 0,
    },
    {
      name: 'Common Toolbar Buttons',
      items: [
        { img: CommonToolbarIconUrl, id: '6', label: 'Icon' },
        { img: CommonToolbarTextUrl, id: '7', label: 'Text' },
        { img: CommonToolbarIconTextUrl, id: '8', label: 'Icon and Text' },
      ],
      selectedItem: 0,
    },
    {
      name: 'Specific Toolbar Buttons',
      items: [
        { img: SpecificToolbarIconUrl, id: '9', label: 'Icon' },
        { img: SpecificToolbarIconTextUrl, id: '10', label: 'Text' },
        { img: SpecificToolbarTextUrl, id: '11', label: 'Icon and Text' },
      ],
      selectedItem: 0,
    },
  ],
  onChangeSelect: console.log,
};
