import { MRT_ColumnDef } from 'material-react-table';
import { TableData } from '../../../Form/FormView/types';

export const DEFAULT_COLUMNS: MRT_ColumnDef<TableData>[] = [
  {
    header: 'ID',
    accessorKey: 'id',
  },
  {
    header: 'Name',
    accessorKey: '_identifier',
  },
] as const;

export const TABLE_INITIAL_STATE = {
  density: 'compact' as const,
  pagination: {
    pageSize: 10,
    pageIndex: 0,
  },
} as const;

export const DIALOG_PROPS = {
  maxWidth: 'lg' as const,
  fullWidth: true,
} as const;

export const ICON_BUTTON_SIZE = 'small' as const;

export const LOADING_TEXT = 'Loading...' as const;
export const EMPTY_STATE_TEXT = 'No items selected' as const;
export const ADD_BUTTON_TEXT = 'Add' as const;
export const CLOSE_BUTTON_TEXT = 'Close' as const;
