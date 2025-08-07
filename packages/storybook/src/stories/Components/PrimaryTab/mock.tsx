/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { TabItem } from '@workspaceui/componentlibrary/src/components/PrimaryTab/types';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import Home from '@workspaceui/componentlibrary/src/assets/icons/home.svg';
import Person from '@workspaceui/componentlibrary/src/assets/icons/user.svg';
import Settings from '@workspaceui/componentlibrary/src/assets/icons/settings.svg';
import Info from '@workspaceui/componentlibrary/src/assets/icons/info.svg';
import Related from '@workspaceui/componentlibrary/src/assets/icons/grid.svg';
import Clip from '@workspaceui/componentlibrary/src/assets/icons/paperclip.svg';
import Tag from '@workspaceui/componentlibrary/src/assets/icons/tag.svg';
import Smile from '@workspaceui/componentlibrary/src/assets/icons/smile.svg';
import Chevrons from '@workspaceui/componentlibrary/src/assets/icons/chevrons-right.svg';

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
