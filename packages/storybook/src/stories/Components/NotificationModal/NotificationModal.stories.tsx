import NotificationModal from '../../../../../ComponentLibrary/src/components/NotificationsModal';
import NotificationButton from '../../../../../ComponentLibrary/src/components/NotificationsButton';
import { NOTIFICATIONS } from '../notifications.mock';
import logo from '../../../../../MainUI/src/assets/react.svg';

export default {
  title: 'Components/NotificationModal',
  component: NotificationButton,
  argTypes: {
    notifications: { control: 'array' },
    title: { control: 'object' },
    linkTitle: { control: 'object' },
    emptyStateImageAlt: { control: 'text' },
    emptyStateMessage: { control: 'text' },
    emptyStateDescription: { control: 'text' },
    actionButtonLabel: { control: 'text' },
  },
};

const Template = args => (
  <NotificationButton notifications={args.notifications}>
    <NotificationModal
      title={{ icon: logo, label: 'Notificaciones' }}
      linkTitle={{ label: 'Marcar todas como leídas', url: '/home' }}
      emptyStateImageAlt="Sin Notificaciones"
      emptyStateMessage="No tienes notificaciones"
      emptyStateDescription="¡Genial! Estás al día con todo. Te notificaremos aquí si hay algo nuevo."
      actionButtonLabel="Configurar notificaciones"
    />
  </NotificationButton>
);

export const NotificationModalDefault = Template.bind({});
NotificationModalDefault.args = {
  notifications: NOTIFICATIONS,
};
