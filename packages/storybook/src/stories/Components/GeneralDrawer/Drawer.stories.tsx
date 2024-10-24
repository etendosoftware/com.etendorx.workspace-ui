import { Meta, StoryObj } from '@storybook/react';
import DrawerComponent from '../../../../../ComponentLibrary/src/components/Drawer';
import { menuMock } from '../../../../../MainUI/src/mocks/Drawer/index';
import logo from '../../../../../ComponentLibrary/public/images/logo.svg';

const meta: Meta<typeof DrawerComponent> = {
  title: 'Components/Drawer',
  component: DrawerComponent,
  argTypes: {
    logo: { control: 'text' },
    title: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof DrawerComponent>;

export const Default: Story = {
  args: {
    items: menuMock,
    logo: logo,
    title: 'Etendo',
    onClick: (pathname: string) => console.log(`Navigating to: ${pathname}`),
  },
};
