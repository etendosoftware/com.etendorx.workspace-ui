import type { Inotifications } from '../../commons';
import type { ReactElement } from 'react';
import type { IMenuProps } from '../Menu';

export interface NotificationButtonProps {
  children?: ReactElement<NotificationModalProps>;
  notifications: Inotifications[];
}

export interface NotificationModalProps extends Omit<IMenuProps, 'open'> {
  notifications: Inotifications[];
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}
export interface ExtendedNotificationButtonProps extends NotificationButtonProps {
  icon: string | React.ReactNode;
  tooltipTitle?: string;
  renderMenuContent?: (notifications: Inotifications[], handleClose: () => void) => React.ReactNode;
}
