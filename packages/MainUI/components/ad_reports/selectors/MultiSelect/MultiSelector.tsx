import { useStyle } from "@/components/Table/styles";
import { useDatasource } from "@/hooks/useDatasource";
import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from "@mui/material";
import { type MRT_Row, MaterialReactTable } from "material-react-table";
import { useCallback, useMemo, useState } from "react";
import type { MultiSelectProps, Option, SelectorTableProps, TableData } from "../../../Form/FormView/types";
import { SearchBar } from "./SearchBar";
import { SelectedItemsContainer } from "./SelectedItemsContainer";
import { DEFAULT_COLUMNS, DIALOG_PROPS, TABLE_INITIAL_STATE } from "./constants";

const SelectorTable: React.FC<SelectorTableProps & { selectedIds: string[] }> = ({
  data,
  onRowClick,
  columns,
  title,
  selectedIds,
}) => {
  const { sx } = useStyle();

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      enableRowSelection
      enableMultiRowSelection={false}
      getRowId={(row) => String(row.id)}
      // biome-ignore lint/performance/noAccumulatingSpread: <explanation>
      state={{ rowSelection: selectedIds.reduce((acc, id) => ({ ...acc, [id]: true }), {}) }}
      renderTopToolbarCustomActions={() => (
        <Box sx={sx.titleContainer}>
          <Typography>{title}</Typography>
        </Box>
      )}
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => onRowClick(row),
        sx: {
          ...sx.tableBody,
          cursor: "pointer",
        },
      })}
      muiTablePaperProps={{
        sx: sx.tablePaper,
      }}
      muiTableHeadCellProps={{
        sx: sx.tableHeadCell,
      }}
      muiTableBodyCellProps={{
        sx: sx.tableBodyCell,
      }}
      initialState={TABLE_INITIAL_STATE}
    />
  );
};

const MultiSelect: React.FC<MultiSelectProps> = ({
  value = [],
  onChange,
  readOnly,
  title,
  entity,
  columns = DEFAULT_COLUMNS,
}) => {
  const [open, setOpen] = useState(false);
  const { sx } = useStyle();
  const { records = [], loading } = useDatasource({ entity });

  const selectedOptions = useMemo(() => {
    const normalizeValue = (value: string | string[] | undefined): string[] => {
      if (Array.isArray(value)) {
        return value;
      }
      if (value) {
        return [value];
      }
      return [];
    };
    const typedRecords = records as TableData[];

    return typedRecords
      .filter((record) => normalizeValue(value).includes(String(record.id)))
      .map((record) => ({
        id: String(record.id),
        title: String(record._identifier || record.name || ""),
        value: String(record.id),
      }));
  }, [value, records]);

  const selectedIds = useMemo(() => {
    return selectedOptions.map((option) => option.id);
  }, [selectedOptions]);

  const tableData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return records as TableData[];
  }, [records]);

  const handleRowClick = useCallback(
    (row: MRT_Row<TableData>) => {
      const record = row.original;
      const option: Option = {
        id: String(record.id),
        title: String(record._identifier || record.name || ""),
        value: String(record.id),
      };

      const exists = selectedOptions.some((item) => item.id === option.id);
      const newOptions = exists
        ? selectedOptions.filter((item) => item.id !== option.id)
        : [...selectedOptions, option];

      onChange(newOptions.map((opt) => opt.id));
    },
    [onChange, selectedOptions],
  );

  const handleRemoveItem = useCallback(
    (id: string) => {
      const newOptions = selectedOptions.filter((item) => item.id !== id);
      onChange(newOptions.map((opt) => opt.id));
    },
    [onChange, selectedOptions],
  );

  const handleClear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  if (loading) return <div>Loading...</div>;

  return (
    <Box sx={sx.multiSelectContainer}>
      <Box sx={sx.contentContainer}>
        <Typography>{title}</Typography>
        <SelectedItemsContainer items={selectedOptions} onRemove={handleRemoveItem} />
      </Box>
      <SearchBar
        readOnly={readOnly}
        onClear={handleClear}
        onOpen={() => setOpen(true)}
        hasItems={selectedOptions.length > 0}
      />
      <Dialog open={open} onClose={() => setOpen(false)} {...DIALOG_PROPS}>
        <DialogContent sx={sx.dialogContent}>
          <SelectorTable
            data={tableData}
            onRowClick={handleRowClick}
            columns={columns}
            title={title || ""}
            selectedIds={selectedIds}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MultiSelect;
