import SaveIcon from '../../../../../ComponentLibrary/src/assets/icons/save.svg';
import PlusIcon from '../../../../../ComponentLibrary/src/assets/icons/plus.svg';
import RefreshIcon from '../../../../../ComponentLibrary/src/assets/icons/refresh-cw.svg';
import SearchIcon from '../../../../../ComponentLibrary/src/assets/icons/search.svg';
import FilterIcon from '../../../../../ComponentLibrary/src/assets/icons/filter.svg';
import ColumnsIcon from '../../../../../ComponentLibrary/src/assets/icons/columns.svg';
import ChevronDownIcon from '../../../../../ComponentLibrary/src/assets/icons/chevrons-down.svg';
import SidebarIcon from '../../../../../ComponentLibrary/src/assets/icons/sidebar.svg';
import LowerFlapIcon from '../../../../../ComponentLibrary/src/assets/icons/lower-flap.svg';
import Excel from '../../../../../ComponentLibrary/src/assets/icons/ilustration/excel.svg';
import Copilot from '../../../../../ComponentLibrary/src/assets/icons/sparks.svg';
import Print from '../../../../../ComponentLibrary/src/assets/icons/color-picker.svg';
import Trash from '../../../../../ComponentLibrary/src/assets/icons/trash-2.svg';
import Printer from '../../../../../ComponentLibrary/src/assets/icons/printer.svg';
import Copy from '../../../../../ComponentLibrary/src/assets/icons/copy.svg';
import Mail from '../../../../../ComponentLibrary/src/assets/icons/mail.svg';
import LinkIcon from '../../../../../ComponentLibrary/src/assets/icons/link.svg';
import { ToolbarSectionConfig } from '../../../../../storybook/src/stories/Components/Table/types';
import { theme } from '../../../../../ComponentLibrary/src/theme';
import { TranslationKeys } from '../../../../../ComponentLibrary/src/locales/types';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslateFunction = <K extends NestedKeyOf<TranslationKeys>>(
  key: K,
) => string;

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
          padding: '0.5rem',
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
        height: 16,
        width: 16,
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
        height: 16,
        width: 16,
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
        height: 16,
        width: 16,
      },
      {
        key: 'copilot',
        icon: <Copilot />,
        tooltip: 'Copilot',
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'delete',
        icon: <Trash />,
        tooltip: 'Delete',
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'printer',
        icon: <Printer />,
        tooltip: 'Printer',
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'copy',
        icon: <Copy />,
        tooltip: 'Copy',
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'excel',
        icon: <Excel />,
        tooltip: 'Excel',
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'mail',
        icon: <Mail />,
        tooltip: 'Mail',
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'link',
        icon: <LinkIcon />,
        tooltip: 'Link',
        onClick: () => {},
        height: 16,
        width: 16,
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
        height: 16,
        width: 16,
      },
      {
        key: 'views',
        icon: <ChevronDownIcon />,
        tooltip: t('table.tooltips.views'),
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'filter',
        icon: <FilterIcon />,
        tooltip: t('table.tooltips.filter'),
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'columns',
        icon: <ColumnsIcon />,
        tooltip: t('table.tooltips.columns'),
        onClick: () => {},
        height: 16,
        width: 16,
      },
      {
        key: 'sidebar',
        icon: <SidebarIcon />,
        tooltip: isSidebarOpen
          ? t('table.tooltips.closeSidebar')
          : t('table.tooltips.openSidebar'),
        onClick: toggleSidebar,
        height: 16,
        width: 16,
        fill: isSidebarOpen
          ? theme.palette.baselineColor.neutral[0]
          : theme.palette.baselineColor.neutral[80],
        hoverFill: isSidebarOpen
          ? theme.palette.baselineColor.neutral[20]
          : theme.palette.baselineColor.neutral[0],
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
        height: 16,
        width: 16,
        fill: isDropdownOpen
          ? theme.palette.baselineColor.neutral[0]
          : theme.palette.baselineColor.neutral[80],
        hoverFill: isDropdownOpen
          ? theme.palette.baselineColor.neutral[20]
          : theme.palette.baselineColor.neutral[0],
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
