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

import { Typography } from '@mui/material';
import {
  AttachMoneyOutlined,
  BarChartOutlined,
  LineStyleOutlined,
  LocalOfferOutlined,
  ReceiptOutlined,
  StackedBarChartOutlined,
} from '@mui/icons-material';

export const TABS_CONFIG = [
  {
    icon: <LineStyleOutlined />,
    label: 'Lines',
    numberOfItems: 20,
    isLoading: true,
    onClick: () => console.log('Navigating to Lines'),
    content: <Typography>Lines Content</Typography>,
    items: [],
  },
  {
    icon: '🏬',
    label: 'Discounts',
    numberOfItems: 0,
    onClick: () => console.log('Navigating to Discounts'),
    content: <Typography>Discounts Content</Typography>,
    items: [],
  },
  {
    icon: <StackedBarChartOutlined />,
    label: 'Tax',
    numberOfItems: 2,
    isLoading: true,
    onClick: () => console.log('Navigating to Tax'),
    content: <Typography>Tax Content</Typography>,
    items: [],
  },
  {
    icon: '🇦🇷',
    label: 'Payment Plan',
    numberOfItems: 0,
    onClick: () => console.log('Navigating to Payment Plan'),
    content: <Typography>Payment Plan Content</Typography>,
    items: [],
  },
  {
    icon: <ReceiptOutlined />,
    label: 'Sales Order',
    numberOfItems: 12,
    isLoading: true,
    onClick: () => console.log('Navigating to Sales Order'),
    content: <Typography>Sales Order Content</Typography>,
    items: [],
  },
  {
    icon: '📦',
    label: 'Purchases',
    numberOfItems: 3,
    onClick: () => console.log('Navigating to Purchases'),
    content: <Typography>Purchases Content</Typography>,
    items: [],
  },
  {
    icon: <BarChartOutlined />,
    label: 'Reports',
    numberOfItems: 8,
    onClick: () => console.log('Navigating to Reports'),
    content: <Typography>Reports Content</Typography>,
    items: [],
  },
  {
    icon: <AttachMoneyOutlined />,
    label: 'Finance',
    numberOfItems: 6,
    onClick: () => console.log('Navigating to Finance'),
    content: <Typography>Finance Content</Typography>,
    items: [],
  },
  {
    icon: <LineStyleOutlined />,
    label: 'Projects',
    numberOfItems: 5,
    onClick: () => console.log('Navigating to Projects'),
    content: <Typography>Projects Content</Typography>,
    items: [],
  },
  {
    icon: <LocalOfferOutlined />,
    label: 'Marketing',
    numberOfItems: 4,
    onClick: () => console.log('Navigating to Marketing'),
    content: <Typography>Marketing Content</Typography>,
    items: [],
  },
  {
    icon: <StackedBarChartOutlined />,
    label: 'Analysis',
    numberOfItems: 7,
    onClick: () => console.log('Navigating to Analysis'),
    content: <Typography>Analysis Content</Typography>,
    items: [],
  },
  {
    icon: '🇪🇸',
    label: 'World',
    numberOfItems: 9,
    onClick: () => console.log('Navigating to World'),
    content: <Typography>Portfolio Content</Typography>,
    items: [],
  },
  {
    icon: <ReceiptOutlined />,
    label: 'Billing',
    numberOfItems: 11,
    onClick: () => console.log('Navigating to Billing'),
    content: <Typography>Billing Content</Typography>,
    items: [],
  },
];
