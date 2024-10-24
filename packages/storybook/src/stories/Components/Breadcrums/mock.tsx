import { BreadcrumbProps, BreadcrumbAction } from '../../../../../ComponentLibrary/src/components/Breadcrums/types';
import HomeIcon from '../../../../../ComponentLibrary/public/icons/home.svg';
import FavoriteIcon from '../../../../../ComponentLibrary/public/icons/star.svg';
import ContentCopyIcon from '../../../../../ComponentLibrary/public/icons/copy.svg';
import HelpIcon from '../../../../../ComponentLibrary/public/icons/help-circle.svg';
import SettingsIcon from '../../../../../ComponentLibrary/public/icons/settings.svg';
import { theme } from '../../../../../ComponentLibrary/src/theme';

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
  homeIcon: <HomeIcon fill={theme.palette.baselineColor.neutral[80]} />,
  homeText: 'Dashboard',
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
