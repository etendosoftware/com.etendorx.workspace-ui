import { useMemo, useState, type UIEvent } from "react";
import { Dialog, DialogContent, IconButton, Box, Typography } from "@mui/material";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_SortingState,
} from "material-react-table";
import { useDatasource } from "../../../../hooks/useDatasource";
import type { Field, EntityData, SelectorColumn, Column } from "@workspaceui/api-client/src/api/types";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";

interface SelectorModalProps {
  field: Field;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (record: EntityData) => void;
}

const SelectorModal = ({ field, isOpen, onClose, onSelect }: SelectorModalProps) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);

  // Extract datasource and grid columns from field definition
  const datasourceName = field.selector?.datasourceName as string;
  const gridColumns = (field.selector?.gridColumns as SelectorColumn[]) || [];

  const columns = useMemo<MRT_ColumnDef<EntityData>[]>(
    () =>
      gridColumns.map((col) => ({
        accessorKey: col.accessorKey,
        header: col.header,
        enableSorting: col.enableSorting ?? true,
        enableColumnFilter: col.enableFiltering ?? true,
      })),
    [gridColumns]
  );

  const datasourceColumns = useMemo(
    () =>
      gridColumns.map(
        (col) =>
          ({
            id: col.id,
            name: col.header,
            header: col.header,
            columnName: col.accessorKey,
            _identifier: col.accessorKey,
            accessorFn: (v: Record<string, unknown>) => v[col.accessorKey],
            referencedTabId: null,
            reference: col.referenceId,
          }) as Column
      ),
    [gridColumns]
  );

  const { records, loading, error, fetchMore, hasMoreRecords } = useDatasource({
    entity: datasourceName,
    params: {
      sortBy: sorting.length > 0 ? `${sorting[0].id}${sorting[0].desc ? " desc" : ""}` : undefined,
    },
    searchQuery: globalFilter,
    activeColumnFilters: columnFilters,
    columns: datasourceColumns,
    skip: !isOpen || !datasourceName,
  });

  // Handle infinite scroll
  const fetchMoreOnBottomReached = (containerRefElement?: HTMLDivElement | null) => {
    if (containerRefElement) {
      const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
      if (scrollHeight - scrollTop - clientHeight < 200 && !loading && hasMoreRecords) {
        fetchMore();
      }
    }
  };

  const table = useMaterialReactTable({
    columns,
    data: records,
    enableTopToolbar: true,
    enableColumnFilters: true,
    enableSorting: true,
    enableRowSelection: false, // We use click on row to select
    enableMultiRowSelection: false,
    manualFiltering: true,
    manualSorting: true,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: {
      isLoading: loading,
      showProgressBars: loading,
      globalFilter,
      columnFilters,
      sorting,
    },
    muiTableContainerProps: {
      onScroll: (event: UIEvent<HTMLDivElement>) => fetchMoreOnBottomReached(event.currentTarget),
      sx: { maxHeight: "60vh" },
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        onSelect(row.original);
        onClose();
      },
      sx: { cursor: "pointer" },
    }),
    initialState: {
      showGlobalFilter: true,
    },
  });

  // Re-fetch when sorting changes (handled by useDatasource params dependency)

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth data-testid={"Dialog__" + field.id}>
      <Box className="flex justify-between items-center p-4 border-b" data-testid={"Box__" + field.id}>
        <Typography variant="h6" data-testid={"Typography__" + field.id}>
          {field.name}
        </Typography>
        <IconButton onClick={onClose} data-testid={"IconButton__" + field.id}>
          <CloseIcon className="w-6 h-6" data-testid={"CloseIcon__" + field.id} />
        </IconButton>
      </Box>
      <DialogContent className="p-0" data-testid={"DialogContent__" + field.id}>
        {error ? (
          <Box className="p-4 text-red-500" data-testid={"Box__" + field.id}>
            Error loading data: {error.message}
          </Box>
        ) : (
          <MaterialReactTable table={table} data-testid={"MaterialReactTable__" + field.id} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SelectorModal;
