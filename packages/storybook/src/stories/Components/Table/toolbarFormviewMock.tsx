import SaveIcon from '../../../../../ComponentLibrary/src/assets/icons/save.svg';
import CancelIcon from '../../../../../ComponentLibrary/src/assets/icons/corner-up-left.svg';
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
import { TOOLTIPS } from '../../../../../ComponentLibrary/src/components/Table/tableConstants';
import { theme } from '../../../../../ComponentLibrary/src/theme';

export const createFormViewToolbarConfig = (
  onSave: () => void,
  onCancel: () => void,
  toggleDropdown: () => void,
  toggleSidebar: () => void,
  isDropdownOpen: boolean,
  isSidebarOpen: boolean,
): {
  leftSection: ToolbarSectionConfig;
  centerSection: ToolbarSectionConfig;
  rightSection: ToolbarSectionConfig;
} => ({
  leftSection: {
    buttons: [
      {
        key: 'save',
        icon: <SaveIcon fill={theme.palette.baselineColor.neutral[0]} />,
        tooltip: 'Save',
        onClick: onSave,
      },
      {
        key: 'cancel',
        icon: <CancelIcon fill={theme.palette.baselineColor.neutral[0]} />,
        tooltip: 'Cancel',
        onClick: onCancel,
      },
      {
        key: 'refresh',
        icon: <RefreshIcon />,
        tooltip: TOOLTIPS.REFRESH,
        onClick: () => {},
      },
    ],
    style: {
      display: 'flex',
      gap: '0.25rem',
    },
  },
  centerSection: {
    buttons: [
      {
        key: 'print',
        icon: <Print />,
        tooltip: 'Print',
        onClick: () => {},
      },
      {
        key: 'copilot',
        icon: <Copilot />,
        tooltip: 'Copilot',
        onClick: () => {},
      },
      {
        key: 'delete',
        icon: <Trash />,
        tooltip: 'Delete',
        onClick: () => {},
      },
      {
        key: 'printer',
        icon: <Printer />,
        tooltip: 'Printer',
        onClick: () => {},
      },
      {
        key: 'copy',
        icon: <Copy />,
        tooltip: 'Copy',
        onClick: () => {},
      },
      {
        key: 'excel',
        icon: <Excel />,
        tooltip: 'Excel',
        onClick: () => {},
      },
      {
        key: 'mail',
        icon: <Mail />,
        tooltip: 'Mail',
        onClick: () => {},
      },
      {
        key: 'link',
        icon: <LinkIcon />,
        tooltip: 'Link',
        onClick: () => {},
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
        tooltip: TOOLTIPS.SEARCH,
        onClick: () => {},
      },
      {
        key: 'views',
        icon: <ChevronDownIcon />,
        tooltip: TOOLTIPS.VIEWS,
        onClick: () => {},
      },
      {
        key: 'filter',
        icon: <FilterIcon />,
        tooltip: TOOLTIPS.FILTER,
        onClick: () => {},
      },
      {
        key: 'columns',
        icon: <ColumnsIcon />,
        tooltip: TOOLTIPS.COLUMNS,
        onClick: () => {},
      },
      {
        key: 'sidebar',
        icon: <SidebarIcon />,
        tooltip: isSidebarOpen ? TOOLTIPS.CLOSE_SIDEBAR : TOOLTIPS.OPEN_SIDEBAR,
        onClick: toggleSidebar,
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
        tooltip: TOOLTIPS.DETAILS,
        onClick: toggleDropdown,
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
