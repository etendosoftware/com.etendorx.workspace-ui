import Modal from '../../../../../ComponentLibrary/src/components/BasicModal';
import ModalDivider from '../../../../../ComponentLibrary/src/components/ModalDivider';
import { List, MenuItem } from '@mui/material';
import { Position } from '../../../../../ComponentLibrary/src/components/enums';
import HeaderIcon from '../../../../../ComponentLibrary/src/assets/icons/activity.svg';
import { styles, sx } from '../../../styles/Modal.stories.styles';
import { menuItems } from '../mock';
import type { Meta, StoryObj } from '@storybook/react';

interface MenuItem {
  emoji: string;
  label: string;
  key: string;
}

interface ModalStoryProps {
  menuItems: MenuItem[];
  width?: number;
  height?: number;
  posX?: Position;
  posY?: Position;
}

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  argTypes: {
    height: { control: 'number' },
    width: { control: 'number' },
    posX: { control: 'select', options: Object.values(Position) },
    posY: { control: 'select', options: Object.values(Position) },
  },
};

export default meta;

type Story = StoryObj<ModalStoryProps>;

const ModalTemplate: Story = {
  render: args => (
    <Modal
      tittleHeader={'Header Tittle'}
      descriptionText={'This is a generic description'}
      headerIcon={<HeaderIcon />}
      {...args}>
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
  ),
};

export const DefaultModalAndDivider: Story = {
  ...ModalTemplate,
  args: {
    menuItems: menuItems,
  },
};

export const CenterPosition: Story = {
  ...ModalTemplate,
  args: {
    posX: Position.Center,
    posY: Position.Center,
    menuItems: menuItems,
  },
};

export const TopLeftPosition: Story = {
  ...ModalTemplate,
  args: {
    posX: Position.Left,
    posY: Position.Top,
    menuItems: menuItems,
  },
};

export const TopRightPosition: Story = {
  ...ModalTemplate,
  args: {
    posX: Position.Right,
    posY: Position.Top,
    menuItems: menuItems,
  },
};

export const BottomLeftPosition: Story = {
  ...ModalTemplate,
  args: {
    posX: Position.Left,
    posY: Position.Bottom,
    menuItems: menuItems,
  },
};

export const BottomRightPosition: Story = {
  ...ModalTemplate,
  args: {
    posX: Position.Right,
    posY: Position.Bottom,
    menuItems: menuItems,
  },
};

export const CustomDimensions: Story = {
  ...ModalTemplate,
  args: {
    height: 400,
    width: 500,
    menuItems: menuItems,
  },
};
