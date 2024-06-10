import image from '../../assets/images/ConfigurationModal/theme-light.svg'
import image1 from '../../assets/images/ConfigurationModal/theme-dark.svg';
import image2 from '../../assets/images/ConfigurationModal/theme-automatic.svg';

import image3 from '../../assets/images/ConfigurationModal/density-compact.svg';
import image4 from '../../assets/images/ConfigurationModal/density-standard.svg';
import image5 from '../../assets/images/ConfigurationModal/density-comfortable.svg';

import image6 from '../../assets/images/ConfigurationModal/common-toolbar-buttons-icon.svg';
import image7 from '../../assets/images/ConfigurationModal/common-toolbar-buttons-text.svg';
import image8 from '../../assets/images/ConfigurationModal/common-toolbar-buttons-icon-and-text.svg';

import image9 from '../../assets/images/ConfigurationModal/specific-toolbar buttons-icon.svg';
import image10 from '../../assets/images/ConfigurationModal/specific-toolbar buttons-icon-and-text.svg';
import image11 from '../../assets/images/ConfigurationModal/specific-toolbar buttons-text.svg';

import { ISection } from './types';

export const sectionsModal: ISection[] = [
  {
    name: 'Tema',
    items: [
      { img: image, id: '0', label: 'Claro' },
      { img: image1, id: '1', label: 'Obscuro' },
      { img: image2, id: '2', label: 'Automático' },
    ],
    selectedItem: 0,
  },
  {
    name: 'Densidad de la tabla',
    items: [
      { img: image3, id: '3', label: 'Compacta' },
      { img: image4, id: '4', label: 'Estándar' },
      { img: image5, id: '5', label: 'Cómoda' },
    ],
    selectedItem: 0,
  },
  {
    name: 'Botones comunes en la barra de herramientas',
    items: [
      { img: image6, id: '6', label: 'Ícono' },
      { img: image7, id: '7', label: 'Texto' },
      { img: image8, id: '8', label: 'Ícono y texto' },
    ],
    selectedItem: 0,
  },
  {
    name: 'Botones específicos en la barra de herramientas',
    items: [
      { img: image9, id: '9', label: 'Ícono' },
      { img: image10, id: '10', label: 'Texto' },
      { img: image11, id: '11', label: 'Ícono y texto' },
    ],
    selectedItem: 0,
  },
];
