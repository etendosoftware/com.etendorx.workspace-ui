export interface Inotifications {
  id: string;
  message: string;
}

export interface NotificationButtonProps {
  onClick: () => void;
  notifications?: Inotifications[];
}
