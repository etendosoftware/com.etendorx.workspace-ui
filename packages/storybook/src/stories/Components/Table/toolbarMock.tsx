import PlusIcon from '@workspaceui/componentlibrary/src/assets/icons/plus.svg';
import RefreshIcon from '@workspaceui/componentlibrary/src/assets/icons/refresh-cw.svg';
import SearchIcon from '@workspaceui/componentlibrary/src/assets/icons/search.svg';
import FilterIcon from '@workspaceui/componentlibrary/src/assets/icons/filter.svg';
import ColumnsIcon from '@workspaceui/componentlibrary/src/assets/icons/columns.svg';
import ChevronDownIcon from '@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg';
import SidebarIcon from '@workspaceui/componentlibrary/src/assets/icons/sidebar.svg';
import LowerFlapIcon from '@workspaceui/componentlibrary/src/assets/icons/lower-flap.svg';
import Excel from '@workspaceui/componentlibrary/src/assets/icons/ilustration/excel.svg';
import Copilot from '@workspaceui/componentlibrary/src/assets/icons/sparks.svg';
import Print from '@workspaceui/componentlibrary/src/assets/icons/color-picker.svg';
import Trash from '@workspaceui/componentlibrary/src/assets/icons/trash-2.svg';
import Printer from '@workspaceui/componentlibrary/src/assets/icons/printer.svg';
import Copy from '@workspaceui/componentlibrary/src/assets/icons/copy.svg';
import Mail from '@workspaceui/componentlibrary/src/assets/icons/mail.svg';
import LinkIcon from '@workspaceui/componentlibrary/src/assets/icons/link.svg';
import { ToolbarSectionConfig } from './types';
import { theme } from '@workspaceui/componentlibrary/src/theme';

import { TranslationKeys } from '../../../../../ComponentLibrary/src/locales/types';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslateFunction = <K extends NestedKeyOf<TranslationKeys>>(key: K) => string;

const IconSize = 16;

export const createToolbarConfig = (
  toggleDropdown: () => void,
  toggleSidebar: () => void,
  handleExpandClick: () => void,
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
        key: 'new-line',
        icon: <PlusIcon />,
        iconText: 'New Line',
        tooltip: 'New Line',
        onClick: () => {},
        height: IconSize,
        width: IconSize,
        fill: theme.palette.baselineColor.neutral[0],
        sx: {
          padding: '0.75rem',
          maxHeight: '2rem',
          background: theme.palette.baselineColor.neutral[100],
          borderRadius: '6.25rem 0 0 6.25rem',
          color: theme.palette.baselineColor.neutral[0],
          '&:hover': {
            background: theme.palette.dynamicColor.main,
          },
        },
      },
      {
        key: 'expand',
        icon: <ChevronDownIcon />,
        tooltip: 'Expand',
        onClick: handleExpandClick,
        height: IconSize,
        width: IconSize,
        fill: theme.palette.baselineColor.neutral[0],
        sx: {
          background: theme.palette.baselineColor.neutral[100],
          borderRadius: '0 6.25rem 6.25rem 0',
          '&:hover': {
            background: theme.palette.dynamicColor.main,
          },
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
          marginLeft: '0.2rem',
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
      maxHeight: '2.5rem',
      gap: '0.05rem',
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
      padding: '.25rem',
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
        height: IconSize,
        width: IconSize,
      },
      {
        key: 'details',
        icon: <LowerFlapIcon />,
        tooltip: t('table.tooltips.details'),
        onClick: toggleDropdown,
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
        height: IconSize,
        width: IconSize,
      },
    ],
    style: {
      display: 'flex',
      gap: '0.25rem',
      background: `var(--Neutral-0, ${theme.palette.baselineColor.transparentNeutral[5]})`,
      borderRadius: '10rem',
      padding: '0.25rem',
    },
  },
});
