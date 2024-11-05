import { Meta, StoryObj } from '@storybook/react';
import PrimaryTabs from '@workspaceui/componentlibrary/src/components/PrimaryTab';
import { defaultTabs, onlyIconsTabs, onlyLabelsTabs, defaultIcon } from './mock';

const meta: Meta<typeof PrimaryTabs> = {
  title: 'Components/PrimaryTabs',
  component: PrimaryTabs,
};

export default meta;

type Story = StoryObj<typeof PrimaryTabs>;

export const Default: Story = {
  args: {
    tabs: defaultTabs,
    icon: defaultIcon,
  },
};

export const OnlyIcons: Story = {
  args: {
    tabs: onlyIconsTabs,
    icon: defaultIcon,
  },
};

export const OnlyLabels: Story = {
  args: {
    tabs: onlyLabelsTabs,
    icon: defaultIcon,
  },
};
