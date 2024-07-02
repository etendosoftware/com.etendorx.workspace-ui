import Nav from '../../../../../ComponentLibrary/src/components/Nav/Nav';
import NotificationModal from '../../../../../ComponentLibrary/src/components/NotificationsModal';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import ProfileModal from '../../../../../ComponentLibrary/src/components/ProfileModal/ProfileModal';
import WaterfallModal from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal';
import ConfigurationModal from '../../../../../ComponentLibrary/src/components/ConfigurationModal';
import { NOTIFICATIONS } from '../notifications.mock';
import logo from '../../../../../MainUI/src/assets/react.svg';
import { modalConfig } from '../ConfigurationModal/mock';
import { menuItems, initialPeople } from '../mock';
import { NavArgs } from './types';
import { AutoAwesome } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import {
  sx,
  styles,
} from '../../../../../ComponentLibrary/src/components/Waterfall/WaterfallModal.styles';

export default {
  title: 'Components/Nav',
  component: Nav,
};

const Template = (args: NavArgs) => (
  <Nav>
    <div style={{ gap: '4px', display: 'flex' }}>
      <WaterfallModal
        menuItems={menuItems}
        initialPeople={initialPeople}
        backButtonText={args.backButtonText}
        activateAllText={args.activateAllText}
        deactivateAllText={args.deactivateAllText}
        buttonText={args.buttonText}
        customizeText={args.customizeText}
        people={[]}
      />
      <ConfigurationModal {...modalConfig} />
      <IconButton style={styles.iconButtonStyles} sx={sx.hoverStyles}>
        <AutoAwesome sx={sx.iconStyles} />
      </IconButton>
      <NotificationButton notifications={args.notifications}>
        <NotificationModal
          notifications={args.notifications}
          anchorEl={args.anchorEl}
          open={args.open}
          onClose={args.onClose}
          title={args.title}
          linkTitle={args.linkTitle}
          emptyStateImageAlt={args.emptyStateImageAlt}
          emptyStateMessage={args.emptyStateMessage}
          emptyStateDescription={args.emptyStateDescription}
          actionButtonLabel={args.actionButtonLabel}
        />
      </NotificationButton>
      <ProfileModal
        cancelButtonText={args.cancelButtonText}
        saveButtonText={args.saveButtonText}
        tooltipModal={args.tooltipModal}
      />
    </div>
  </Nav>
);

export const DefaultNav = Template.bind({});
DefaultNav.args = {
  //Notification Modal
  notifications: NOTIFICATIONS,
  anchorEl: null,
  open: true,
  onClose: () => console.log('Modal closed'),
  title: { icon: logo, label: 'Notifications' },
  linkTitle: { label: 'Mark all as read', url: '/home' },
  emptyStateImageAlt: 'No Notifications',
  emptyStateMessage: 'You have no notifications',
  emptyStateDescription:
    'Great! You are up to date with everything. We will notify you here if there is anything new.',
  actionButtonLabel: 'Configure notifications',
  // Waterfall
  backButtonText: 'Back',
  activateAllText: 'Activate all',
  deactivateAllText: 'Deactivate all',
  buttonText: 'Buttons',
  customizeText: 'Customize',
  //Profile Modal
  cancelButtonText: 'Cancelar',
  saveButtonText: 'Guardar',
  tooltipModal: 'Account Settings',
};
