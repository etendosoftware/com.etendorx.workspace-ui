import logoUrl from '../../../../../MainUI/src/assets/react.svg';
import image from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/theme-light.svg';
import image1 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/theme-dark.svg';
import image2 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/theme-automatic.svg';
import image3 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/density-compact.svg';
import image4 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/density-standard.svg';
import image5 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/density-comfortable.svg';
import image6 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-icon.svg';
import image7 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-text.svg';
import image8 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/common-toolbar-buttons-icon-and-text.svg';
import image9 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-icon.svg';
import image10 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-icon-and-text.svg';
import image11 from '../../../../../ComponentLibrary/src/assets/images/ConfigurationModal/specific-toolbar buttons-text.svg';

export const modalConfig = {
  icon: logoUrl,
  title: { icon: image, label: 'Appearance' },
  linkTitle: { label: 'View all settings', url: '/settings' },
  sections: [
    {
      name: 'Theme',
      items: [
        { img: image, id: '0', label: 'Light' },
        { img: image1, id: '1', label: 'Dark' },
        { img: image2, id: '2', label: 'Automatic' },
      ],
      selectedItem: 0,
    },
    {
      name: 'Table Density',
      items: [
        { img: image3, id: '3', label: 'Compact' },
        { img: image4, id: '4', label: 'Standard' },
        { img: image5, id: '5', label: 'Comfortable' },
      ],
      selectedItem: 0,
    },
    {
      name: 'Common Toolbar Buttons',
      items: [
        { img: image6, id: '6', label: 'Icon' },
        { img: image7, id: '7', label: 'Text' },
        { img: image8, id: '8', label: 'Icon and Text' },
      ],
      selectedItem: 0,
    },
    {
      name: 'Specific Toolbar Buttons',
      items: [
        { img: image9, id: '9', label: 'Icon' },
        { img: image10, id: '10', label: 'Text' },
        { img: image11, id: '11', label: 'Icon and Text' },
      ],
      selectedItem: 0,
    },
  ],
  onChangeSelect: console.log,
};
