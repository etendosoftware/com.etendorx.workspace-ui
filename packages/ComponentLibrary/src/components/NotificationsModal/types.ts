import { IconButtonProps, SvgIconProps } from '@mui/material';

export interface Inotifications {
  id: string;
  message: string;
}

export interface NotificationButtonProps extends IconButtonProps {
  notifications?: Inotifications[];
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

export interface INotificationModalProps {
  notifications: Inotifications[];
  handleClose: () => void;
  title: { icon: string; label: string };
  linkTitle: { label: string; url: string };
  anchorEl: HTMLElement | null;
  open: boolean;
  emptyStateImage: string;
  emptyStateImageAlt: string;
  emptyStateMessage: string;
  emptyStateDescription: string;
  actionButtonLabel: string;
}
