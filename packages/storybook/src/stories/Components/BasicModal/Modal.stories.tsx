import { ReactNode } from 'react';
import Modal from '../../../../../ComponentLibrary/src/components/BasicModal';
import { List, MenuItem, Button } from '@mui/material';
import { Position } from '../../../../../ComponentLibrary/src/components/enums';
import HeaderIcon from '../../../../../ComponentLibrary/src/assets/icons/activity.svg';
import SaveIcon from '../../../../../ComponentLibrary/src/assets/icons/save.svg';
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
  showHeader?: boolean;
  backgroundGradient?: string;
  saveButtonLabel?: string;
  secondaryButtonLabel?: string;
  buttons?: ReactNode;
}

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  argTypes: {
    height: { control: 'number' },
    width: { control: 'number' },
    posX: { control: 'select', options: Object.values(Position) },
    posY: { control: 'select', options: Object.values(Position) },
    showHeader: { control: 'boolean' },
    backgroundGradient: { control: 'text' },
    saveButtonLabel: { control: 'text' },
    secondaryButtonLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<ModalStoryProps>;

const ModalTemplate: Story = {
  render: args => (
    <Modal
      tittleHeader={'Header Title'}
      descriptionText={'This is a generic description'}
      HeaderIcon={HeaderIcon}
      SaveIcon={SaveIcon}
      {...args}>
      <List>
        {args.menuItems.map((item: MenuItem) => (
          <MenuItem key={item.key} sx={sx.menuStyles}>
            <span style={styles.spanStyles}>{item.emoji}</span>
            <span>{item.label}</span>
          </MenuItem>
        ))}
      </List>
    </Modal>
  ),
};

export const DefaultModalAndDivider: Story = {
  ...ModalTemplate,
  args: {
    menuItems: menuItems,
    showHeader: true,
    saveButtonLabel: 'Save',
    secondaryButtonLabel: 'Cancel',
  },
};

export const WithBackgroundGradient: Story = {
  ...ModalTemplate,
  args: {
    menuItems: menuItems,
    showHeader: true,
    backgroundGradient: 'linear-gradient(to bottom, #4CAF50, transparent)',
    saveButtonLabel: 'Save',
    secondaryButtonLabel: 'Cancel',
  },
};

export const WithoutHeader: Story = {
  ...ModalTemplate,
  args: {
    menuItems: menuItems,
    showHeader: false,
    saveButtonLabel: 'Save',
    secondaryButtonLabel: 'Cancel',
  },
};

export const CustomPositionAndSize: Story = {
  ...ModalTemplate,
  args: {
    menuItems: menuItems,
    showHeader: true,
    posX: Position.Left,
    posY: Position.Top,
    width: 400,
    height: 500,
    saveButtonLabel: 'Save',
    secondaryButtonLabel: 'Cancel',
  },
};

export const WithCustomButtons: Story = {
  ...ModalTemplate,
  args: {
    menuItems: menuItems,
    showHeader: true,
    buttons: (
      <>
        <Button variant="outlined">Custom Cancel</Button>
        <Button variant="contained">Custom Save</Button>
      </>
    ),
  },
};

export const CenterPosition: Story = {
  ...ModalTemplate,
  args: {
    posX: Position.Center,
    posY: Position.Center,
    menuItems: menuItems,
    showHeader: true,
    saveButtonLabel: 'Save',
    secondaryButtonLabel: 'Cancel',
  },
};
