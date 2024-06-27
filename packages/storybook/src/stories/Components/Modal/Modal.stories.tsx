import Modal from '../../../../../ComponentLibrary/src/components/Modal';
import ModalDivider from '../../../../../ComponentLibrary/src/components/ModalDivider';
import { List, MenuItem } from '@mui/material';
import { Position } from '../../../../../ComponentLibrary/src/components/enums';
import { styles, sx } from '../../../styles/Modal.stories.styles';
import { menuItems } from '../mock';

interface MenuItem {
  emoji: string;
  label: string;
  key: string;
}

export default {
  title: 'Components/Modal',
  component: Modal,
  argTypes: {
    height: { control: 'text' },
    width: { control: 'text' },
    posX: { control: 'text' },
    posY: { control: 'text' },
    menuItems: { control: 'object' },
  },
};

const Template = args => (
  <Modal {...args}>
    <List>
      {args.menuItems.map((item: MenuItem) => (
        <MenuItem key={item.key} sx={sx.menuStyles}>
          <span style={styles.spanStyles}>{item.emoji}</span>
          <span>{item.label}</span>
        </MenuItem>
      ))}
    </List>
    <ModalDivider />
  </Modal>
);

export const DefaultModalAndDivider = Template.bind({});
DefaultModalAndDivider.args = {
  width: 400,
  height: 300,
  menuItems: menuItems,
};

export const CenterPosition = Template.bind({});
CenterPosition.args = {
  posX: Position.Center,
  posY: Position.Center,
  menuItems: menuItems,
};

export const TopLeftPosition = Template.bind({});
TopLeftPosition.args = {
  posX: Position.Left,
  posY: Position.Top,
  menuItems: menuItems,
};

export const TopRightPosition = Template.bind({});
TopRightPosition.args = {
  posX: Position.Right,
  posY: Position.Top,
  menuItems: menuItems,
};

export const BottomLeftPosition = Template.bind({});
BottomLeftPosition.args = {
  posX: Position.Left,
  posY: Position.Bottom,
  menuItems: menuItems,
};

export const BottomRightPosition = Template.bind({});
BottomRightPosition.args = {
  posX: Position.Right,
  posY: Position.Bottom,
  menuItems: menuItems,
};

export const CustomDimensions = Template.bind({});
CustomDimensions.args = {
  height: 300,
  width: 500,
  menuItems: menuItems,
};
