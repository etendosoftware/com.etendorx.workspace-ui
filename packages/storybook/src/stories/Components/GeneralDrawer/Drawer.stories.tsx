import { Meta, StoryObj } from '@storybook/react';
import DrawerComponent from '../../../../../ComponentLibrary/src/components/Drawer';
import { menuMock } from '../../../../../MainUI/mocks/Drawer/index';
import logoUrl from '../../../../../ComponentLibrary/src/assets/images/logo.svg?url';

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
    logo: logoUrl,
    title: 'Etendo',
    onClick: (pathname: string) => console.log(`Navigating to: ${pathname}`),
  },
};
