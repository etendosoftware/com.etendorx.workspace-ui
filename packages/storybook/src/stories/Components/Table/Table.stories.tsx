import { Story } from '@storybook/react';
import Table from '../../../../../ComponentLibrary/src/components/Table';
import { TableProps } from '../../../../../ComponentLibrary/src/components/Table/types';
import { FlatData, TreeData } from './mock';

export default {
  title: 'Components/Table',
  component: Table,
  argTypes: {
    isTreeStructure: {
      control: 'boolean',
    },
  },
};

const Template: Story<TableProps> = args => <Table {...args} />;

export const FlatTable = Template.bind({});
FlatTable.args = {
  data: FlatData,
  isTreeStructure: false,
};

export const TreeTable = Template.bind({});
TreeTable.args = {
  data: TreeData,
  isTreeStructure: true,
};
