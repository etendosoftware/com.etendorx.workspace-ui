import Tag from '../../../ComponentLibrary/src/components/Tag';

export default {
    title: 'Components/Tag',
    component: Tag,
};

const Template = (args: any) => <Tag {...args} />;

export const Default: any = Template.bind({});
Default.args = {
    label: 'Registrado',
    type: 'success',
};