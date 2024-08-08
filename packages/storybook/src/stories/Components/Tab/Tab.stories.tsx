import { Meta, StoryObj } from '@storybook/react';
import Tabs from '../../../../../ComponentLibrary/src/components/Tab';
import {
  mockTabs,
  singleTab,
  manyTabs,
  longTabNames,
  icons,
  customIcons,
} from './mock';

const meta: Meta<typeof Tabs> = {
  title: 'Components/Tabs',
  component: Tabs,
  argTypes: {
    tabArray: { control: 'object' },
    homeIcon: { control: 'object' },
    moreIcon: { control: 'object' },
    closeIcon: { control: 'object' },
  },
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#C6D3FF',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {
    tabArray: mockTabs,
    homeIcon: icons.homeIcon,
    moreIcon: icons.moreIcon,
    closeIcon: icons.closeIcon,
    homeTooltip: 'Home Button',
  },
};

export const CustomIcons: Story = {
  args: {
    ...Default.args,
    homeIcon: customIcons.homeIcon,
    moreIcon: customIcons.moreIcon,
    closeIcon: customIcons.closeIcon,
    tabArray: mockTabs.map(tab => ({
      ...tab,
      fill: customIcons.homeIcon.props.fill,
      hoverFill: customIcons.moreIcon.props.fill,
    })),
  },
};

export const SingleTab: Story = {
  args: {
    ...Default.args,
    tabArray: singleTab,
  },
};

export const ManyTabs: Story = {
  args: {
    ...Default.args,
    tabArray: manyTabs,
  },
};

export const LongTabNames: Story = {
  args: {
    ...Default.args,
    tabArray: longTabNames,
  },
};
