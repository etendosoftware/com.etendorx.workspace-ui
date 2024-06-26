import { MenuProps, SvgIconProps } from '@mui/material';
import { Inotifications } from '../../commons';
import { ReactElement } from 'react';

export interface NotificationButtonProps {
  children?: ReactElement<NotificationModalProps>;
  notifications: Inotifications[];
}

export interface NotificationModalProps extends Omit<MenuProps, 'open'> {
  notifications: Inotifications[];
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}
export interface ExtendedNotificationButtonProps
  extends NotificationButtonProps {
  icon?: React.ReactElement<SvgIconProps>;
  tooltipTitle?: string;
  renderMenuContent?: (
    notifications: Inotifications[],
    handleClose: () => void,
  ) => React.ReactNode;
}
