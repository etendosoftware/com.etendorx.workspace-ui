import { create } from '@storybook/theming/create';
import EtendoLogo from '../src/assets/logo/Etendo.png';

export default create({
  base: 'light',
  brandTitle: 'New Etendo UI - Storybook',
  brandUrl: 'https://docs.etendo.software',
  brandImage: EtendoLogo,
  brandTarget: '_blank',
});
