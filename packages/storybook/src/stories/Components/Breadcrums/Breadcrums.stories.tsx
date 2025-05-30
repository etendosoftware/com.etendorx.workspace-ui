import type { Meta, StoryObj } from '@storybook/react';
import Breadcrumb from '@workspaceui/componentlibrary/src/components/Breadcrums';
import { mockDefaultActions, mockDefaultArgs } from './mock';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  argTypes: {
    onHomeClick: { action: 'Home clicked' },
    homeIcon: { control: 'text' },
    homeText: { control: 'text' },
    separator: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: mockDefaultArgs,
};

export const CustomHomeIcon: Story = {
  args: {
    ...mockDefaultArgs,
    homeIcon: '🏠',
  },
};

export const CustomHomeText: Story = {
  args: {
    ...mockDefaultArgs,
    homeText: 'Custom text',
  },
};

export const SingleLevel: Story = {
  args: {
    ...mockDefaultArgs,
    items: [{ id: '1', label: 'Single Item', actions: mockDefaultActions }],
  },
};

export const TwoLevels: Story = {
  args: {
    ...mockDefaultArgs,
    items: [
      { id: '1', label: 'Two' },
      { id: '2', label: 'Items', actions: mockDefaultActions },
    ],
  },
};

export const Empty: Story = {
  args: {
    ...mockDefaultArgs,
    items: [],
  },
};
