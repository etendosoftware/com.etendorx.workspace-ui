import { Box, Typography } from '@mui/material';
import SideIcon from '@workspaceui/componentlibrary/src/assets/icons/codesandbox.svg';
import TabWidget from '@workspaceui/componentlibrary/src/components/Widgets/TabWidget';
import { TranslateFunction } from '@workspaceui/mainui/hooks/types';

const colors = {
  backgrounds: [
    '#f0f4f8',
    '#d9e2ec',
    '#bcccdc',
    '#9fb3c8',
    '#829ab1',
    '#627d98',
    '#486581',
    '#334e68',
    '#243b53',
    '#102a43',
    '#243b45',
  ],
  text: [
    '#102a43',
    '#243b53',
    '#334e68',
    '#486581',
    '#627d98',
    '#829ab1',
    '#9fb3c8',
    '#bcccdc',
    '#d9e2ec',
    '#f0f4f8',
    '#ffffff',
  ],
  accents: [
    '#e6f6ff',
    '#bae3ff',
    '#7cc4fa',
    '#47a3f3',
    '#2186eb',
    '#0967d2',
    '#0552b5',
    '#03449e',
    '#01337d',
    '#002159',
  ],
};

const getContrastColor = (bgColor: string) => {
  const index = colors.backgrounds.indexOf(bgColor);
  return index >= 5 ? colors.text[9] : colors.text[0];
};

export const createWidgets = (t: TranslateFunction) => {
  const widgets = [
    {
      id: '1',
      children: (
        <TabWidget
          title={t('grid.items.erp.text')}
          content={
            <Typography variant="h3" fontWeight="bold">
              1,245,863.00 €
            </Typography>
          }
          noRecordText={t('table.labels.noRecord')}
        />
      ),
      icon: <SideIcon fill={colors.text[0]} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      title: t('grid.items.erp.text'),
      color: getContrastColor(colors.backgrounds[1]),
      bgcolor: colors.backgrounds[1],
      iconBgColor: colors.accents[2],
      iconButtonColor: getContrastColor(colors.backgrounds[1]),
      iconButtonHoverColor: colors.accents[4],
      iconButtonBgColor: colors.backgrounds[3],
      iconButtonHoverBgColor: colors.backgrounds[0],
      size: 'full',
    },
    {
      id: '2',
      children: <Box>💰 754,320.50 €</Box>,
      size: 'half',
      title: t('grid.items.tailored.text'),
      icon: <SideIcon fill={colors.text[9]} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      color: colors.text[10],
      bgcolor: colors.backgrounds[10],
      iconBgColor: colors.accents[7],
      iconButtonColor: colors.text[10],
      iconButtonHoverColor: colors.accents[5],
      iconButtonBgColor: colors.backgrounds[8],
      iconButtonHoverBgColor: colors.backgrounds[6],
    },
    {
      id: '3',
      children: <Box>📊 25.7%</Box>,
      size: 'half',
      title: t('grid.items.adaptable.text'),
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[5])} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      color: getContrastColor(colors.backgrounds[5]),
      bgcolor: colors.backgrounds[5],
      iconBgColor: colors.accents[4],
      iconButtonColor: getContrastColor(colors.backgrounds[5]),
      iconButtonHoverColor: colors.accents[6],
      iconButtonBgColor: colors.backgrounds[6],
      iconButtonHoverBgColor: colors.backgrounds[4],
    },
    {
      id: '4',
      children: <Box>👥 12,453</Box>,
      size: 'full',
      title: t('breadcrumb.newRecord'),
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[7])} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      color: getContrastColor(colors.backgrounds[7]),
      bgcolor: colors.backgrounds[7],
      iconBgColor: colors.accents[5],
      iconButtonColor: getContrastColor(colors.backgrounds[7]),
      iconButtonHoverColor: colors.accents[7],
      iconButtonBgColor: colors.backgrounds[8],
      iconButtonHoverBgColor: colors.backgrounds[6],
    },
    {
      id: '5',
      children: <Box>📈 89.3%</Box>,
      size: 'half',
      title: t('drawer.recentlyViewed'),
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[2])} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      color: getContrastColor(colors.backgrounds[2]),
      bgcolor: colors.backgrounds[2],
      iconBgColor: colors.accents[1],
      iconButtonColor: getContrastColor(colors.backgrounds[2]),
      iconButtonHoverColor: colors.accents[3],
      iconButtonBgColor: colors.backgrounds[1],
      iconButtonHoverBgColor: colors.backgrounds[0],
    },
    {
      id: '6',
      children: <Box>🏆 Top 10%</Box>,
      size: 'half',
      title: t('process.messageTitle'),
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[4])} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      color: getContrastColor(colors.backgrounds[4]),
      bgcolor: colors.backgrounds[4],
      iconBgColor: colors.accents[2],
      iconButtonColor: getContrastColor(colors.backgrounds[4]),
      iconButtonHoverColor: colors.accents[4],
      iconButtonBgColor: colors.backgrounds[3],
      iconButtonHoverBgColor: colors.backgrounds[2],
    },
    {
      id: '7',
      children: <Box>📦 1,245</Box>,
      size: 'half',
      title: t('navigation.activityButton.tooltip'),
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[4])} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      color: getContrastColor(colors.backgrounds[4]),
      bgcolor: colors.backgrounds[4],
      iconBgColor: colors.accents[2],
      iconButtonColor: getContrastColor(colors.backgrounds[4]),
      iconButtonHoverColor: colors.accents[4],
      iconButtonBgColor: colors.backgrounds[3],
      iconButtonHoverBgColor: colors.backgrounds[2],
    },
    {
      id: '8',
      children: <Box>🔄 87.5%</Box>,
      size: 'half',
      title: t('process.completedSuccessfully'),
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[4])} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      color: getContrastColor(colors.backgrounds[4]),
      bgcolor: colors.backgrounds[4],
      iconBgColor: colors.accents[2],
      iconButtonColor: getContrastColor(colors.backgrounds[4]),
      iconButtonHoverColor: colors.accents[4],
      iconButtonBgColor: colors.backgrounds[3],
      iconButtonHoverBgColor: colors.backgrounds[2],
    },
    {
      id: '9',
      children: <Box>⏱️ 98.2%</Box>,
      size: 'half',
      title: t('navigation.waterfall.tooltipButton'),
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[4])} />,
      iconButtonAction: () => {},
      tooltip: t('table.tooltips.details'),
      color: getContrastColor(colors.backgrounds[4]),
      bgcolor: colors.backgrounds[4],
      iconBgColor: colors.accents[2],
      iconButtonColor: getContrastColor(colors.backgrounds[4]),
      iconButtonHoverColor: colors.accents[4],
      iconButtonBgColor: colors.backgrounds[3],
      iconButtonHoverBgColor: colors.backgrounds[2],
    },
  ];
  return widgets;
};

export default createWidgets;
