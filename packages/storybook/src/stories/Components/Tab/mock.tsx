import { TabContent } from '../../../../../ComponentLibrary/src/components/Tab/types';
import HomeIcon from '../../../../../ComponentLibrary/src/assets/icons/home.svg';
import BankIcon from '../../../../../ComponentLibrary/src/assets/icons/gift.svg';
import MoreIcon from '../../../../../ComponentLibrary/src/assets/icons/chevrons-right.svg';
import XIcon from '../../../../../ComponentLibrary/src/assets/icons/x.svg';
import { theme } from '../../../../../ComponentLibrary/src/theme';

export const mockTabs: TabContent[] = [
  {
    id: 'tab1',
    title: '💳 Pedido de venta',
    icon: <BankIcon />,
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[60],
    children: <div>Content for Tab 1</div>,
  },
  {
    id: 'tab2',
    title: '📦 Envío de mercancias',
    icon: <BankIcon />,
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[60],
    children: <div>Content for Tab 2</div>,
  },
  {
    id: 'tab3',
    title: 'Organizacion',
    icon: <BankIcon />,
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[60],
    children: <div>Content for Tab 3</div>,
  },
  {
    id: 'tab4',
    title: 'Cuenta Bancaria',
    icon: <BankIcon />,
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[60],
    children: <div>Content for Tab 4</div>,
  },
];

export const singleTab: TabContent[] = [mockTabs[0]];

export const manyTabs: TabContent[] = [
  ...mockTabs,
  {
    id: 'tab5',
    title: 'Tab 5',
    icon: <BankIcon />,
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[60],
    children: <div>Content for Tab 5</div>,
  },
  // Puedes continuar añadiendo más tabs aquí
];

export const longTabNames: TabContent[] = [
  {
    id: 'long1',
    title: 'This is a very long tab name 1',
    icon: <BankIcon />,
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[60],
    children: <div>Content 1</div>,
  },
  {
    id: 'long2',
    title: 'This is a very long tab name 2',
    icon: <BankIcon />,
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[60],
    children: <div>Content 2</div>,
  },
  {
    id: 'long3',
    title: 'This is a very long tab name 3',
    icon: <BankIcon />,
    fill: theme.palette.baselineColor.neutral[60],
    hoverFill: theme.palette.baselineColor.neutral[60],
    children: <div>Content 3</div>,
  },
];

export const icons = {
  homeIcon: <HomeIcon />,
  moreIcon: <MoreIcon />,
  closeIcon: <XIcon fill={theme.palette.baselineColor.neutral[80]} />,
};

export const customIcons = {
  homeIcon: <HomeIcon fill={theme.palette.dynamicColor.main} />,
  moreIcon: <MoreIcon fill={theme.palette.dynamicColor.main} />,
  closeIcon: <XIcon fill={theme.palette.dynamicColor.main} />,
};
