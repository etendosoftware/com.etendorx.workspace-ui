import SaveIcon from '../../../../../ComponentLibrary/public/icons/save.svg';
import PlusIcon from '../../../../../ComponentLibrary/public/icons/plus.svg';
import RefreshIcon from '../../../../../ComponentLibrary/public/icons/refresh-cw.svg';
import SearchIcon from '../../../../../ComponentLibrary/public/icons/search.svg';
import FilterIcon from '../../../../../ComponentLibrary/public/icons/filter.svg';
import ColumnsIcon from '../../../../../ComponentLibrary/public/icons/columns.svg';
import ChevronDownIcon from '../../../../../ComponentLibrary/public/icons/chevrons-down.svg';
import SidebarIcon from '../../../../../ComponentLibrary/public/icons/sidebar.svg';
import LowerFlapIcon from '../../../../../ComponentLibrary/public/icons/lower-flap.svg';
import Excel from '../../../../../ComponentLibrary/public/icons/ilustration/excel.svg';
import Copilot from '../../../../../ComponentLibrary/public/icons/sparks.svg';
import Print from '../../../../../ComponentLibrary/public/icons/color-picker.svg';
import Trash from '../../../../../ComponentLibrary/public/icons/trash-2.svg';
import Printer from '../../../../../ComponentLibrary/public/icons/printer.svg';
import Copy from '../../../../../ComponentLibrary/public/icons/copy.svg';
import Mail from '../../../../../ComponentLibrary/public/icons/mail.svg';
import LinkIcon from '../../../../../ComponentLibrary/public/icons/link.svg';
import { ToolbarSectionConfig } from '../../../../../storybook/src/stories/Components/Table/types';
import { theme } from '../../../../../ComponentLibrary/src/theme';
import { TranslationKeys } from '../../../../../ComponentLibrary/src/locales/types';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslateFunction = <K extends NestedKeyOf<TranslationKeys>>(key: K) => string;

const IconSize = 16;

export const createFormViewToolbarConfig = (
  onSave: () => void,
  onCancel: () => void,
  toggleDropdown: () => void,
  toggleSidebar: () => void,
  isDropdownOpen: boolean,
  isSidebarOpen: boolean,
  t: TranslateFunction,
): {
  leftSection: ToolbarSectionConfig;
  centerSection: ToolbarSectionConfig;
  rightSection: ToolbarSectionConfig;
} => ({
  leftSection: {
    buttons: [
      {
        key: 'save',
        tooltip: t('common.save'),
        icon: <SaveIcon />,
        iconText: 'Save Changes',
        onClick: onSave,
        height: 14,
        width: 14,
        fill: theme.palette.baselineColor.neutral[0],
        sx: {
          padding: '0.75rem',
          maxHeight: '2rem',
          background: theme.palette.baselineColor.neutral[100],
          borderRadius: '6.25rem',
          color: theme.palette.baselineColor.neutral[0],
          '&:hover': {
            border: 'none',
            background: theme.palette.dynamicColor.main,
            borderRadius: '6.25rem',
          },
        },
      },
      {
        key: 'Add',
        tooltip: t('common.cancel'),
        icon: <PlusIcon />,
        onClick: onCancel,
        height: IconSize,
        width: IconSize,
        fill: theme.palette.baselineColor.neutral[0],
        sx: {
          background: theme.palette.baselineColor.neutral[100],
        },
      },
      {
        key: 'refresh',
        icon: <RefreshIcon />,
        tooltip: t('table.tooltips.refresh'),
        onClick: () => {},
        height: IconSize,
        width: IconSize,
        sx: {
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[30]}`,
        },
      },
    ],
    style: {
      display: 'flex',
      width: 'auto',
      alignItems: 'center',
      background: `var(--Neutral-0, ${theme.palette.baselineColor.neutral[0]})`,
      borderRadius: '10rem',
      padding: '0.25rem',
      gap: '0.25rem',
      maxHeight: '2.5rem',
    },
  },
  centerSection: {
    buttons: [
      {
        key: 'print',
        icon: <Print />,
        tooltip: 'Print',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'copilot',
        icon: <Copilot />,
        tooltip: 'Copilot',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'delete',
        icon: <Trash />,
        tooltip: 'Delete',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'printer',
        icon: <Printer />,
        tooltip: 'Printer',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'copy',
        icon: <Copy />,
        tooltip: 'Copy',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'excel',
        icon: <Excel />,
        tooltip: 'Excel',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'mail',
        icon: <Mail />,
        tooltip: 'Mail',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'link',
        icon: <LinkIcon />,
        tooltip: 'Link',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
    ],
    style: {
      display: 'flex',
      width: '100%',
      background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
      borderRadius: '10rem',
      padding: '0.25rem',
      gap: '0.25rem',
    },
  },
  rightSection: {
    buttons: [
      {
        key: 'search',
        icon: <SearchIcon />,
        tooltip: t('table.tooltips.search'),
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'views',
        icon: <ChevronDownIcon />,
        tooltip: t('table.tooltips.views'),
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'filter',
        icon: <FilterIcon />,
        tooltip: t('table.tooltips.filter'),
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'columns',
        icon: <ColumnsIcon />,
        tooltip: t('table.tooltips.columns'),
        onClick: () => {},
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'sidebar',
        icon: <SidebarIcon />,
        tooltip: isSidebarOpen ? t('table.tooltips.closeSidebar') : t('table.tooltips.openSidebar'),
        onClick: toggleSidebar,
        height: IconSize,
        width: IconSize,
        fill: isSidebarOpen ? theme.palette.baselineColor.neutral[0] : theme.palette.baselineColor.neutral[80],
        hoverFill: isSidebarOpen ? theme.palette.baselineColor.neutral[20] : theme.palette.baselineColor.neutral[0],
        sx: isSidebarOpen
          ? {
              backgroundColor: theme.palette.dynamicColor.main,
              '&:hover': {
                background: theme.palette.baselineColor.neutral[80],
              },
            }
          : {},
      },
      {
        key: 'details',
        icon: <LowerFlapIcon />,
        tooltip: t('table.tooltips.details'),
        onClick: toggleDropdown,
        height: IconSize,
        width: IconSize,
        fill: isDropdownOpen ? theme.palette.baselineColor.neutral[0] : theme.palette.baselineColor.neutral[80],
        hoverFill: isDropdownOpen ? theme.palette.baselineColor.neutral[20] : theme.palette.baselineColor.neutral[0],
        sx: isDropdownOpen
          ? {
              backgroundColor: theme.palette.dynamicColor.main,
              '&:hover': {
                background: theme.palette.baselineColor.neutral[80],
              },
            }
          : {},
      },
    ],
    style: {
      display: 'flex',
      gap: '0.25rem',
      background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
      borderRadius: '10rem',
      padding: '0.25rem',
      marginLeft: '0.25rem',
    },
  },
});
