import { TabItem } from '../../../../../ComponentLibrary/src/components/PrimaryTab/types';
import { theme } from '../../../../../ComponentLibrary/src/theme';
import Home from '../../../../../ComponentLibrary/public/icons/home.svg';
import Person from '../../../../../ComponentLibrary/public/icons/user.svg';
import Settings from '../../../../../ComponentLibrary/public/icons/settings.svg';
import Info from '../../../../../ComponentLibrary/public/icons/info.svg';
import Related from '../../../../../ComponentLibrary/public/icons/grid.svg';
import Clip from '../../../../../ComponentLibrary/public/icons/paperclip.svg';
import Tag from '../../../../../ComponentLibrary/public/icons/tag.svg';
import Smile from '../../../../../ComponentLibrary/public/icons/smile.svg';
import Chevrons from '../../../../../ComponentLibrary/public/icons/chevrons-right.svg';

export const defaultTabs: TabItem[] = [
  {
    id: 'details',
    icon: <Home fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Details',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'both',
  },
  {
    id: 'more-info',
    icon: <Person fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'More Information about',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'both',
  },
  {
    id: 'settings',
    icon: <Settings fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Settings',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'both',
  },
  {
    id: 'notes',
    icon: <Info fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Notes',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'both',
  },
  {
    id: 'related-items',
    icon: <Related fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Related Items',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'both',
  },
  {
    id: 'attached-files',
    icon: <Clip fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Attached Files',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'icon',
  },
  {
    id: 'tags',
    icon: <Tag fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Tags',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'icon',
  },
  {
    id: 'reactions',
    icon: <Smile fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Reactions',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'icon',
  },
];

export const onlyIconsTabs: TabItem[] = [
  {
    id: 'home',
    icon: <Home fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Home',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'icon',
  },
  {
    id: 'profile',
    icon: <Person fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Profile',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'icon',
  },
  {
    id: 'settings',
    icon: <Settings fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'Settings',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'icon',
  },
  {
    id: 'about',
    icon: <Info fill={theme.palette.baselineColor.neutral[60]} />,
    label: 'About',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'icon',
  },
];

export const onlyLabelsTabs: TabItem[] = [
  {
    id: 'home',
    icon: <Home />,
    label: 'Home',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'label',
  },
  {
    id: 'profile',
    icon: <Person />,
    label: 'Profile',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'label',
  },
  {
    id: 'settings',
    icon: <Settings />,
    label: 'Settings',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'label',
  },
  {
    id: 'about',
    icon: <Info />,
    label: 'About',
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[0],
    showInTab: 'label',
  },
];

export const defaultIcon = <Chevrons fill={theme.palette.baselineColor.neutral[80]} />;
