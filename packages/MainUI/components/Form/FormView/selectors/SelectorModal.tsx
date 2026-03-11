import { useMemo, useState, type UIEvent, useEffect } from "react";
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
import { useSelected } from "@/hooks/useSelected";
import { buildEtendoContext } from "@/utils/contextUtils";
import { useTabContext } from "@/contexts/tab";
import { useFormContext } from "react-hook-form";
import { useStyle } from "../../../Table/styles";
import { useTranslation } from "@/hooks/useTranslation";
import { DEFAULT_PAGE_SIZE, SELECTOR_SAFE_PARAMS, DEFAULT_SORT_BY } from "@/utils/table/constants";
import { useLanguage } from "@/contexts/language";

interface SelectorModalProps {
  field: Field;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (record: EntityData) => void;
  currentDisplayValue?: string;
}

const SelectorModal = ({ field, isOpen, onClose, onSelect, currentDisplayValue }: SelectorModalProps) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const { sx } = useStyle();
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const { graph } = useSelected();
  const { tab: currentTab } = useTabContext();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { getValues } = useFormContext();

  // Initialize filters based on current value
  useEffect(() => {
    if (isOpen && currentDisplayValue && field.selector?.displayField) {
      setColumnFilters([
        {
          id: field.selector.displayField as string,
          value: [currentDisplayValue],
        },
      ]);
    }
  }, [isOpen, currentDisplayValue, field.selector?.displayField]);

  // Extract datasource and grid columns from field definition
  // We prioritize the specific datasourceName of the Selector because the backend uses it to generate tailored JSON responses
  // based on the injected _selectedProperties and filterClass.
  const targetEntity = (field.selector?.datasourceName as string) || field.referencedEntity;
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

  const _etendoContext = useMemo(() => {
    return currentTab ? buildEtendoContext(currentTab, graph) : ({} as Record<string, string>);
  }, [currentTab, graph]);

  // Combine context with current form values
  const datasourceParams = useMemo(() => {
    const selector = field.selector as Record<string, any> | undefined;

    const params: Record<string, any> = {
      ..._etendoContext,
      isSorting: true,
      language: language,
      _sortBy: selector?._sortBy || DEFAULT_SORT_BY,
      pageSize: DEFAULT_PAGE_SIZE,
      IsSelectorItem: "true",
      _requestType: "Window",
      targetProperty: field.hqlName || field.columnName,
      columnName: field.column?.dBColumnName || field.columnName,
    };

    // Parse and inject INP context parameters from the form state
    const values = getValues();
    if (currentTab?.fields) {
      for (const tabField of Object.values(currentTab.fields)) {
        if (tabField.inputName) {
          const val = values[tabField.hqlName] ?? values[tabField.inputName] ?? values[tabField.id];
          if (val !== undefined && val !== null) {
            params[tabField.inputName] = String(val);
          }
        }
      }
    }

    if (currentTab) {
      params.windowId = currentTab.window;
      params.tabId = currentTab.id;
      params.inpwindowId = currentTab.window;
      params.inpTabId = currentTab.id;
      params.adTabId = currentTab.id;
    }

    if (selector) {
      for (const param of SELECTOR_SAFE_PARAMS) {
        if (selector[param] !== undefined && selector[param] !== null) {
          params[param] = selector[param];
        }
      }
    }

    if (sorting.length > 0) {
      params.sortBy = `${sorting[0].id}${sorting[0].desc ? " desc" : ""}`;
    }

    // Ensure _org mirrors ad_org_id (required by backend datasource)
    if (params.inpadOrgId && !params._org) params._org = params.inpadOrgId;

    return params;
  }, [language, sorting, field, _etendoContext, currentTab, getValues, isOpen]);

  const { records, loading, error, fetchMore, hasMoreRecords } = useDatasource({
    entity: targetEntity,
    params: datasourceParams,
    searchQuery: globalFilter,
    activeColumnFilters: columnFilters,
    columns: datasourceColumns,
    skip: !isOpen || !targetEntity,
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
    enableTopToolbar: false, // Match table behavior by hiding top toolbar
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: false,
    enableRowSelection: false,
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
      showColumnFilters: true, // Force column filters visible to match table
    },
    muiTablePaperProps: {
      sx: sx.tablePaper,
    },
    muiTableHeadCellProps: {
      sx: sx.tableHeadCell,
    },
    muiTableBodyCellProps: {
      sx: sx.tableBodyCell,
    },
    muiTableBodyProps: {
      sx: sx.tableBody,
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
      sx: {
        cursor: "pointer",
        ...sx.tableBodyRow,
      },
    }),
    initialState: {
      density: "compact", // Match table density
    },
  });

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth data-testid={`Dialog__${field.id}`}>
      <Box className="relative flex justify-center items-center p-4 border-b" data-testid={`Box__${field.id}`}>
        <Typography
          sx={{
            fontSize: "1.125rem",
            fontWeight: 700,
            textTransform: "none",
            color: "text.primary",
          }}
          data-testid={`Typography__${field.id}`}>
          {field.name}
        </Typography>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8 }} data-testid={`IconButton__${field.id}`}>
          <CloseIcon className="w-6 h-6" data-testid={`CloseIcon__${field.id}`} />
        </IconButton>
      </Box>
      <DialogContent className="p-0 m-0 overflow-hidden flex flex-col" data-testid={`DialogContent__${field.id}`}>
        <div className="flex-1 min-h-0">
          {error ? (
            <Box className="p-4 text-red-500" data-testid={`Box__${field.id}`}>
              {t("errors.missingData.title")}
            </Box>
          ) : (
            <MaterialReactTable table={table} data-testid={`MaterialReactTable__${field.id}`} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectorModal;
