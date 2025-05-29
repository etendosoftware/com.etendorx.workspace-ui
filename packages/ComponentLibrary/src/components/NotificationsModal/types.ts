import type { ReactNode } from 'react';
import type { Inotifications } from '../../commons';

export interface INotificationModalProps {
  icon?: string;
  title?: { icon?: ReactNode | string; label?: string };
  linkTitle?: { url?: string; label?: string };
  notifications?: Inotifications[];
  emptyStateImageAlt?: string;
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  actionButtonLabel?: string;
}
