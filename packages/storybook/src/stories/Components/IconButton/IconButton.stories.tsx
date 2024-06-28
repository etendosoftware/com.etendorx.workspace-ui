import IconButton from '../../../../../ComponentLibrary/src/components/IconButton';
import { Favorite as FavoriteIcon } from '@mui/icons-material';
import { DEFAULT_SIZE } from '../../../../../ComponentLibrary/src/components/IconButton/default';

export default {
  title: 'Components/IconButton',
  component: IconButton,
  argTypes: {
    icon: { control: 'text' },
    alt: { control: 'text' },
    styleIcon: { control: 'object' },
  },
};

const Template = args => <IconButton {...args} />;

export const Default = Template.bind({});
Default.args = {
  icon: <FavoriteIcon />,
  alt: 'search icon',
  styleIcon: DEFAULT_SIZE,
};
