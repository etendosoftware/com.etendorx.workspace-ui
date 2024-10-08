import { MenuProps } from '@mui/material';
import { Inotifications } from '../../commons';
import { ReactNode } from 'react';

export interface INotificationModalProps
  extends Omit<MenuProps, 'open' | 'title'> {
  icon?: string;
  title?: { icon?: ReactNode | string; label?: string };
  linkTitle?: { url?: string; label?: string };
  notifications?: Inotifications[];
  emptyStateImageAlt?: string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  actionButtonLabel?: string;
}
