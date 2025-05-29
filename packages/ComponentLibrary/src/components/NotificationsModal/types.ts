import type { Inotifications } from '../../commons';
import type { ReactNode } from 'react';
import type { IMenuProps } from '../Menu';

export interface INotificationModalProps extends Omit<IMenuProps, 'open' | 'title'> {
  icon?: string;
  title?: { icon?: ReactNode | string; label?: string };
  linkTitle?: { url?: string; label?: string };
  notifications?: Inotifications[];
  emptyStateImageAlt?: string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  actionButtonLabel?: string;
}
