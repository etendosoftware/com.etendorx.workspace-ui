import { Widget } from '@workspaceui/storybook/src/stories/Components/Table/types';
import { Translations } from '../../RegisterModal/types';

export interface SidebarContentProps {
  icon: React.ReactNode;
  identifier: string | null;
  title: string | null;
  widgets: Widget[];
  onClose: () => void;
  translations: Translations;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: {
    icon: React.ReactNode;
    identifier: string | null;
    title: string | null;
  };
  widgets: Widget[];
  translations: Translations;
}
