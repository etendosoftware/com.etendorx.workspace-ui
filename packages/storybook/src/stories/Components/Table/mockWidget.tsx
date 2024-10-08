import { Box } from '@mui/material';
import { Organization, Widget } from './types';
import SideIcon from '../../../../../ComponentLibrary/src/assets/icons/codesandbox.svg';
import TabWidget from '../../../../../ComponentLibrary/src/components/Widgets/TabWidget';
import { RecordContextType } from '../../../../../MainUI/src/contexts/record';
import { TranslationKeys } from '../../../../../ComponentLibrary/src/locales/types';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslateFunction = <K extends NestedKeyOf<TranslationKeys>>(
  key: K,
) => string;

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
    '#000000',
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

export const createWidgets = (
  selectedRecord: Organization | null,
  setSelectedRecord: RecordContextType['setSelectedRecord'],
  t: TranslateFunction,
) => {
  const widgets: Widget[] = [
    {
      id: '1',
      children: (
        <TabWidget
          onSave={() => {}}
          onCancel={() => {}}
          editButtonLabel={t('common.edit')}
          cancelButtonLabel={t('common.cancel')}
          saveButtonLabel={t('common.save')}
          noRecordText={t('table.labels.noRecord')}
          selectedRecord={selectedRecord}
          setSelectedRecord={setSelectedRecord}
        />
      ),
      icon: <SideIcon fill={colors.text[0]} />,
      iconButtonAction: () => {},
      tooltip: 'More information',
      title: 'Total Revenue',
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
      children: <Box>💰 754,320.50</Box>,
      size: 'half',
      title: 'Profit',
      icon: <SideIcon fill={colors.text[9]} />,
      iconButtonAction: () => {},
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
      title: 'Growth Rate',
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[5])} />,
      iconButtonAction: () => {},
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
      title: 'Active Users',
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[7])} />,
      iconButtonAction: () => {},
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
      title: 'Customer Satisfaction',
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[2])} />,
      iconButtonAction: () => {},
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
      title: 'Market Position',
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[4])} />,
      iconButtonAction: () => {},
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
      children: <Box>🏆 Top 10%</Box>,
      size: 'half',
      title: 'Market Position',
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[4])} />,
      iconButtonAction: () => {},
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
      children: <Box>🏆 Top 10%</Box>,
      size: 'half',
      title: 'Market Position',
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[4])} />,
      iconButtonAction: () => {},
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
      children: <Box>🏆 Top 10%</Box>,
      size: 'half',
      title: 'Market Position',
      icon: <SideIcon fill={getContrastColor(colors.backgrounds[4])} />,
      iconButtonAction: () => {},
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
