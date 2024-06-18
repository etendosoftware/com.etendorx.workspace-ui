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
    anchorEl: HTMLElement | null,
    open: boolean,
  ) => React.ReactNode;
}
