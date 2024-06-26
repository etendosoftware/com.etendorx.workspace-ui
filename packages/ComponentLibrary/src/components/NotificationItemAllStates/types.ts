import { CtaButton } from '../../commons';
import { TagType } from '../Tag/types';

export interface IallNotifications {
  type: string;
  data: {
    id: string;
    description: string;
    date: string;
    priority?: string;
    tagType?: TagType;
    icon: React.ComponentType;
    ctaButtons?: CtaButton[];
  };
}

export interface NotificationItemStatesProps {
  notifications: IallNotifications[];
  type: string;
}
