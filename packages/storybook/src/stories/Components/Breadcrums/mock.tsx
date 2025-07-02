import type { BreadcrumbProps, BreadcrumbAction } from '@workspaceui/componentlibrary/src/components/Breadcrums/types';
import FavoriteIcon from '@workspaceui/componentlibrary/src/assets/icons/star.svg';
import ContentCopyIcon from '@workspaceui/componentlibrary/src/assets/icons/copy.svg';
import HelpIcon from '@workspaceui/componentlibrary/src/assets/icons/help-circle.svg';
import SettingsIcon from '@workspaceui/componentlibrary/src/assets/icons/settings.svg';
import { theme } from '@workspaceui/componentlibrary/src/theme';

export const mockDefaultActions: BreadcrumbAction[] = [
  {
    id: 'favorite',
    label: 'Add to favorites',
    icon: <FavoriteIcon fill={theme.palette.baselineColor.neutral[60]} />,
    toggle: true,
  },
  {
    id: 'duplicate',
    label: 'Copy window',
    icon: <ContentCopyIcon fill={theme.palette.baselineColor.neutral[60]} />,
    onClick: () => {},
  },
  {
    id: 'help',
    label: 'Help',
    icon: <HelpIcon fill={theme.palette.baselineColor.neutral[60]} />,
    onClick: () => {},
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon fill={theme.palette.baselineColor.neutral[60]} />,
    onClick: () => {},
  },
];

export const mockDefaultArgs: BreadcrumbProps = {
  onHomeClick: () => console.log('Home clicked'),
  items: [
    { id: '1', label: 'Super long item text name' },
    { id: '2', label: 'Super long item text name 2' },
    { id: '3', label: 'Super long item text name 3' },
    {
      id: '4',
      label: 'Super long item text name 4',
      actions: mockDefaultActions,
    },
  ],
};
