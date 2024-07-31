import { Meta } from '@storybook/react';
import PrimaryTabs from '../../../../../ComponentLibrary/src/components/PrimaryTab';
import {
  defaultTabs,
  onlyIconsTabs,
  onlyLabelsTabs,
  defaultIcon,
} from './mock';

export default {
  title: 'Components/PrimaryTabs',
  component: PrimaryTabs,
} as Meta;

const Template = args => <PrimaryTabs {...args} />;

export const Default = Template.bind({});
Default.args = {
  tabs: defaultTabs,
  icon: defaultIcon,
};

export const OnlyIcons = Template.bind({});
OnlyIcons.args = {
  tabs: onlyIconsTabs,
  icon: defaultIcon,
};

export const OnlyLabels = Template.bind({});
OnlyLabels.args = {
  tabs: onlyLabelsTabs,
  icon: defaultIcon,
};
