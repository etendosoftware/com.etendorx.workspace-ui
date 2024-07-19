import { MRT_ColumnDef } from 'material-react-table';
import { Box, Link } from '@mui/material';
import { Organization } from './types';
import FolderIcon from '../../assets/icons/folder-minus.svg';
import FolderOpenIcon from '../../assets/icons/folder-plus.svg';
import { theme } from '../../theme';
import Tag from '../Tag';

export const getColumns = (): MRT_ColumnDef<Organization>[] => [
  {
    accessorKey: 'identificator',
    header: 'Identificator',
    Cell: ({ row, cell }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {row.getCanExpand() ? (
          row.getIsExpanded() ? (
            <FolderOpenIcon
              fill={theme.palette.dynamicColor.main}
              width={16}
              height={16}
            />
          ) : (
            <FolderIcon
              fill={theme.palette.dynamicColor.main}
              width={16}
              height={16}
            />
          )
        ) : (
          <Box sx={{ width: 16, height: 16 }} />
        )}
        <Link
          href="#"
          onClick={e => {
            e.preventDefault();
            console.log(`Clicked on ${cell.getValue<string>()}`);
          }}
          sx={{
            fontSize: '0.875rem',
            fontWeight: '500',
            lineHeight: '1.063rem',
            color: theme.palette.dynamicColor.main,
            textDecoration: 'none',
            paddingRight: '0.5rem',
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}>
          {cell.getValue<string>()}
        </Link>
      </Box>
    ),
    muiTableHeadCellProps: {
      sx: {
        borderLeft: 'none',
        background: theme.palette.baselineColor.transparentNeutral[5],
      },
    },
    muiTableBodyCellProps: {
      sx: {
        borderLeft: 'none',
        paddingLeft: 0,
        borderRight: `1px solid ${theme.palette.divider}`,
      },
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'active',
    header: 'Active',
    Cell: ({ cell }) => {
      const isActive = cell.getValue<boolean>();
      return (
        <Tag
          type={isActive ? 'success' : 'error'}
          label={isActive ? 'Yes' : 'No'}
        />
      );
    },
  },
  {
    accessorKey: 'groupLevel',
    header: 'Group Level',
    Cell: ({ cell }) => {
      const isGroup = cell.getValue<boolean>();
      return (
        <Tag
          type={isGroup ? 'success' : 'error'}
          label={isGroup ? 'Yes' : 'No'}
        />
      );
    },
  },
  {
    accessorKey: 'socialName',
    header: 'Social Name',
  },
  {
    accessorKey: 'organizationType',
    header: 'Organization Type',
  },
  {
    accessorKey: 'currency',
    header: 'Currency',
    Cell: ({ cell }) => {
      const currency = cell.getValue<string>();
      return <Tag type="draft" label={'$ ' + currency} />;
    },
  },
  {
    accessorKey: 'allowPeriodControl',
    header: 'Period Control',
    Cell: ({ cell }) => (cell.getValue<boolean>() ? 'Yes' : 'No'),
  },
  {
    accessorKey: 'calendar',
    header: 'Calendar',
  },
  {
    accessorKey: 'files',
    header: 'Files',
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    Cell: ({ cell }) => cell.getValue<string[]>().join(', '),
  },
  {
    accessorKey: 'reactions',
    header: 'Reactions',
  },
];
