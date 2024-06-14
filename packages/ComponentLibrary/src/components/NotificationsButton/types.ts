import { IconButtonProps } from '@mui/material';

export interface Inotifications {
  id: string;
  message: string;
}

export interface NotificationButtonProps extends IconButtonProps {
  notifications?: Inotifications[];
}
