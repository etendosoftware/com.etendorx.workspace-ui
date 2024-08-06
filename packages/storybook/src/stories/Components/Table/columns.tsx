import { MRT_ColumnDef } from 'material-react-table';
import { Box, Link, SxProps, Theme } from '@mui/material';
import {
  Organization,
  OrganizationLabels,
} from '../../../../../storybook/src/stories/Components/Table/types';
import FolderIcon from '../../../../../ComponentLibrary/src/assets/icons/folder-minus.svg';
import FolderOpenIcon from '../../../../../ComponentLibrary/src/assets/icons/folder-plus.svg';
import { theme } from '../../../../../ComponentLibrary/src/theme';
import Tag from '../../../../../ComponentLibrary/src/components/Tag';
import { sx } from '../../../../../ComponentLibrary/src/components/NotificationsModal/styles';

export const getColumns = (
  labels: Partial<OrganizationLabels> = {},
): MRT_ColumnDef<Organization>[] => [
  {
    accessorKey: 'identificator',
    header: labels.identificator ?? 'Identificator',
    Cell: ({ row, cell }) => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          paddingLeft: `${row.depth * 1.25}rem`,
        }}>
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
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
          }}
          sx={sx.linkStyles as SxProps<Theme>}>
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
    header: labels.name ?? 'Name',
  },
  {
    accessorKey: 'description',
    header: labels.description ?? 'Description',
  },
  {
    accessorKey: 'active',
    header: labels.active ?? 'Active',
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
    header: labels.groupLevel ?? 'Group Level',
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
    header: labels.socialName ?? 'Social Name',
  },
  {
    accessorKey: 'organizationType',
    header: labels.organizationType ?? 'Organization Type',
  },
  {
    accessorKey: 'currency',
    header: labels.currency ?? 'Currency',
    Cell: ({ cell }) => {
      const currency = cell.getValue<string>();
      return <Tag type="draft" label={'$ ' + currency} />;
    },
  },
  {
    accessorKey: 'allowPeriodControl',
    header: labels.allowPeriodControl ?? 'Period Control',
    Cell: ({ cell }) => (cell.getValue<boolean>() ? 'Yes' : 'No'),
  },
  {
    accessorKey: 'calendar',
    header: labels.calendar ?? 'Calendar',
  },
  {
    accessorKey: 'files',
    header: labels.files ?? 'Files',
  },
  {
    accessorKey: 'tags',
    header: labels.tags ?? 'Tags',
    Cell: ({ cell }) => cell.getValue<string[]>().join(', '),
  },
  {
    accessorKey: 'reactions',
    header: labels.reactions ?? 'Reactions',
  },
];
