import SettingIcon from '../../../../../ComponentLibrary/src/assets/icons/settings.svg';
import ThemeLightUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/theme-light.svg';
import ThemeDarkUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/theme-dark.svg';
import ThemeAutomaticUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/theme-automatic.svg';
import DensityCompactUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/density-compact.svg';
import DensityStandardUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/density-standard.svg';
import DensityComfortableUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/density-comfortable.svg';
import CommonToolbarIconUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-icon.svg';
import CommonToolbarTextUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-text.svg';
import CommonToolbarIconTextUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-icon-and-text.svg';
import SpecificToolbarIconUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-icon.svg';
import SpecificToolbarIconTextUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-icon-and-text.svg';
import SpecificToolbarTextUrl from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-text.svg';

export const modalConfig = {
  icon: SettingIcon,
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
