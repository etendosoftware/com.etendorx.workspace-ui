import ConfigurationModal from '@workspaceui/componentlibrary/src/components//ConfigurationModal';
import { modalConfig } from './mock';

export default {
  title: 'Components/ConfigurationModal',
  component: ConfigurationModal,
};

const Template = () => <ConfigurationModal {...modalConfig} />;

export const Default = Template.bind({});
