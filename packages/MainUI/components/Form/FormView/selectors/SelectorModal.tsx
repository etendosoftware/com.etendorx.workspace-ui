import { useCallback, useMemo, useState, type UIEvent } from "react";
import { Dialog, DialogActions, DialogContent, IconButton, Box, Typography } from "@mui/material";
import Button from "@workspaceui/componentlibrary/src/components/Button/Button";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnFiltersState,
  type MRT_RowSelectionState,
  type MRT_SortingState,
  type MRT_TableOptions,
} from "material-react-table";
import { useDatasource } from "../../../../hooks/useDatasource";
import type { Field, EntityData, SelectorColumn, Tab } from "@workspaceui/api-client/src/api/types";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useSelected } from "@/hooks/useSelected";
import { buildEtendoContext } from "@/utils/contextUtils";
import { useTabContext } from "@/contexts/tab";
import { useFormContext } from "react-hook-form";
import { useStyle } from "../../../Table/styles";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/language";
import { useUserStore } from "@/stores/userStore";
import {
  buildSelectorColumnDefs,
  buildDatasourceColumns,
  buildSelectorDatasourceParams,
  getFilterType,
} from "@/utils/form/selectors/selectorColumns";
import type { FilterOption } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { buildBaseFilterParams, applySelectorSafeParams, applyTabContextParams } from "@/utils/form/selectors/utils";
import { useSelectorDefaultCriteria } from "./hooks/useSelectorDefaultCriteria";
import { useSelectorFilterHandlers } from "./hooks/useSelectorFilterHandlers";

interface SelectorModalProps {
  field: Field;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (record: EntityData) => void;
  currentDisplayValue?: string;
  /**
   * Optional override for the record-values getter. Used by grid cells that
   * live outside a `react-hook-form` `<FormProvider>` (or inside one whose
   * values describe a different scope, e.g. the parent process modal). When
   * omitted, falls back to `useFormContext().getValues`.
   */
  getValues?: () => Record<string, unknown>;
  /**
   * Optional override for the current tab. Used by grid cells whose ambient
   * `useTabContext()` returns the *outer* tab (e.g. the form-mode parent),
   * not the P&E grid's own tab. When omitted, falls back to `useTabContext().tab`.
   */
  currentTab?: Tab | null;
  /**
   * Enable multi-row selection. When true, row clicks toggle selection
   * (no auto-close), checkbox column appears, and the dialog footer renders
   * Cancel/Confirm buttons. Selection is reported via `onMultiSelect`.
   */
  multiSelect?: boolean;
  /**
   * IDs that should appear pre-selected when the modal opens. Used to round-trip
   * existing field values (e.g. CSV-stored multi-record selections).
   */
  initialSelectedIds?: string[];
  /**
   * Optional id→identifier map used to synthesize record stubs when a
   * pre-selected ID is not present in the currently loaded records page.
   * Avoids losing the human-readable label when the caller hits Confirm
   * without scrolling the row into view.
   */
  initialSelectedIdentifiersById?: Record<string, string>;
  /**
   * Called when the user confirms a multi-record selection. Receives the full
   * list of selected records (stubs `{id, _identifier}` are synthesized for IDs
   * that were pre-selected but not currently loaded in the grid).
   */
  onMultiSelect?: (records: EntityData[]) => void;
}

const SelectorModal = ({
  field,
  isOpen,
  onClose,
  onSelect,
  getValues: getValuesProp,
  currentTab: currentTabProp,
  multiSelect = false,
  initialSelectedIds,
  initialSelectedIdentifiersById,
  onMultiSelect,
}: SelectorModalProps) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const { sx } = useStyle();
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>(() =>
    Object.fromEntries((initialSelectedIds ?? []).map((id) => [id, true]))
  );
  const { graph } = useSelected();
  // `useTabContext()` returns `{}` (no `tab`) outside a TabContextProvider — safe.
  const { tab: tabFromContext } = useTabContext();
  const { t } = useTranslation();
  const { language } = useLanguage();
  // `useFormContext()` returns `null` outside a FormProvider — handle that.
  const formCtx = useFormContext();
  const session = useUserStore((s) => s.session);

  const getValues = getValuesProp ?? formCtx?.getValues ?? ((): Record<string, unknown> => ({}));
  const currentTab = currentTabProp ?? tabFromContext ?? null;

  const targetEntity = (field.selector?.datasourceName as string) || field.referencedEntity;
  const gridColumns = useMemo(() => {
    const cols = (field.selector?.gridColumns as SelectorColumn[]) || [];
    if (cols.length > 0) {
      return [...cols].sort((a, b) => (a.sortNo ?? 0) - (b.sortNo ?? 0));
    }
    // Some selector definitions (e.g. the multi-record OBUISEL "Multi account
    // status selector") ship with no OBUISEL_SELECTOR_FIELD rows, leaving
    // `selector.gridColumns` empty. Without at least one column the modal
    // would only render the checkbox column. Fall back to a single column
    // showing each record's `_identifier` so the user can still pick rows.
    if (targetEntity) {
      return [
        {
          id: `${field.id}-fallback-identifier`,
          header: field.name,
          accessorKey: "_identifier",
          enableSorting: true,
          enableFiltering: true,
          referenceId: "10",
          sortNo: 1,
        } as SelectorColumn,
      ];
    }
    return [];
  }, [field.selector?.gridColumns, field.id, field.name, targetEntity]);

  const datasourceColumns = useMemo(() => buildDatasourceColumns(gridColumns), [gridColumns]);

  const { defaultCriteria, defaultFilterResponse, selectorDefinitionId } = useSelectorDefaultCriteria({
    field,
    isOpen,
    currentTab,
    getValues,
    session,
    t,
    setColumnFilters,
  });

  const _etendoContext = useMemo(() => {
    return currentTab ? buildEtendoContext(currentTab, graph) : ({} as Record<string, string>);
  }, [currentTab, graph]);

  const filterExtraParams = useMemo(() => {
    const params = buildBaseFilterParams(field, _etendoContext, language || "");

    if (field.selector) {
      applySelectorSafeParams(params, field.selector as unknown as Record<string, unknown>);
    }

    if (currentTab) {
      applyTabContextParams(params, currentTab, getValues());
    }

    return params;
  }, [_etendoContext, currentTab, getValues, field, language]);

  const {
    advancedColumnFilters,
    handleTextFilterChange,
    handleBooleanFilterChange,
    handleDropdownFilterChange,
    handleLoadFilterOptions,
    handleLoadMoreFilterOptions,
  } = useSelectorFilterHandlers({
    datasourceColumns,
    targetEntity,
    currentTabId: currentTab?.id,
    setColumnFilters,
    extraParams: filterExtraParams,
  });

  const idFilterDisplayValues = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of defaultFilterResponse?.idFilters ?? []) {
      map.set(f.fieldName, f._identifier);
    }
    return map;
  }, [defaultFilterResponse]);

  const idFilterPreloadedOptions = useMemo(() => {
    const map = new Map<string, FilterOption[]>();
    for (const f of defaultFilterResponse?.idFilters ?? []) {
      const col = gridColumns.find((c) => c.accessorKey === f.fieldName);
      if (col && getFilterType(col.referenceId) === "dropdown") {
        map.set(f.fieldName, [{ id: f.id, label: f._identifier, value: f.id }]);
      }
    }
    return map;
  }, [defaultFilterResponse, gridColumns]);

  const columns = useMemo(
    () =>
      buildSelectorColumnDefs(gridColumns, {
        onTextFilterChange: handleTextFilterChange,
        onBooleanFilterChange: handleBooleanFilterChange,
        onDropdownFilterChange: handleDropdownFilterChange,
        onLoadFilterOptions: handleLoadFilterOptions,
        onLoadMoreFilterOptions: handleLoadMoreFilterOptions,
        columnFilterStates: advancedColumnFilters,
        columnFilters,
        t,
        idFilterDisplayValues,
        idFilterPreloadedOptions,
      }),
    [
      gridColumns,
      handleTextFilterChange,
      handleBooleanFilterChange,
      handleDropdownFilterChange,
      handleLoadFilterOptions,
      handleLoadMoreFilterOptions,
      advancedColumnFilters,
      columnFilters,
      t,
      idFilterDisplayValues,
      idFilterPreloadedOptions,
    ]
  );

  const datasourceParams = useMemo(
    () =>
      buildSelectorDatasourceParams({
        field,
        etendoContext: _etendoContext,
        language,
        sorting,
        currentTab,
        formValues: getValues(),
        columnFilters,
        defaultCriteria,
        defaultFilterResponse,
        gridColumns,
      }),
    [
      field,
      _etendoContext,
      language,
      sorting,
      currentTab,
      getValues,
      columnFilters,
      defaultCriteria,
      defaultFilterResponse,
      gridColumns,
    ]
  );

  const { records, loading, error, fetchMore, hasMoreRecords } = useDatasource({
    entity: targetEntity,
    params: datasourceParams,
    searchQuery: globalFilter,
    activeColumnFilters: columnFilters,
    columns: datasourceColumns,
    skip: !isOpen || !targetEntity || (Boolean(selectorDefinitionId) && defaultCriteria === null),
  });

  const fetchMoreOnBottomReached = (containerRefElement?: HTMLDivElement | null) => {
    if (containerRefElement) {
      const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
      if (scrollHeight - scrollTop - clientHeight < 200 && !loading && hasMoreRecords) {
        fetchMore();
      }
    }
  };

  const handleConfirmMultiSelect = useCallback(() => {
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    const recordById = new Map<string, EntityData>(records.map((r) => [String(r.id), r]));

    const resolved: EntityData[] = selectedIds.map((id) => {
      const loaded = recordById.get(id);
      if (loaded) return loaded;
      const identifier = initialSelectedIdentifiersById?.[id] ?? id;
      return { id, _identifier: identifier } as unknown as EntityData;
    });

    onMultiSelect?.(resolved);
    onClose();
  }, [rowSelection, records, initialSelectedIdentifiersById, onMultiSelect, onClose]);

  const multiTableOptions: Partial<MRT_TableOptions<EntityData>> = useMemo(
    () =>
      multiSelect
        ? {
            enableRowSelection: true,
            enableMultiRowSelection: true,
            getRowId: (row) => String(row.id),
            onRowSelectionChange: setRowSelection,
            muiTableBodyRowProps: ({ row }) => ({
              onClick: () => row.toggleSelected(),
              sx: { cursor: "pointer", ...sx.tableBodyRow },
            }),
          }
        : {
            enableRowSelection: false,
            enableMultiRowSelection: false,
            muiTableBodyRowProps: ({ row }) => ({
              onClick: () => {
                onSelect(row.original);
                onClose();
              },
              sx: { cursor: "pointer", ...sx.tableBodyRow },
            }),
          },
    [multiSelect, onSelect, onClose, sx.tableBodyRow]
  );

  const table = useMaterialReactTable({
    columns,
    data: records,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableColumnFilters: true,
    enableColumnFilterModes: false,
    enableSorting: true,
    enablePagination: false,
    manualFiltering: true,
    manualSorting: true,
    displayColumnDefOptions: {
      "mrt-row-select": {
        size: 48,
        muiTableHeadCellProps: {
          align: "center",
          sx: {
            backgroundColor: "rgba(0, 3, 13, 0.05)",
            verticalAlign: "middle",
            "& .Mui-TableHeadCell-Content": { justifyContent: "center", alignItems: "center" },
          },
        },
        muiTableBodyCellProps: {
          align: "center",
          sx: { verticalAlign: "middle" },
        },
      },
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: {
      isLoading: loading,
      showProgressBars: loading,
      globalFilter,
      columnFilters,
      sorting,
      showColumnFilters: true,
      rowSelection,
    },
    muiTablePaperProps: { sx: sx.tablePaper },
    muiTableHeadCellProps: { sx: sx.tableHeadCell },
    muiTableBodyCellProps: { sx: sx.tableBodyCell },
    muiTableBodyProps: { sx: sx.tableBody },
    muiTableContainerProps: {
      onScroll: (event: UIEvent<HTMLDivElement>) => fetchMoreOnBottomReached(event.currentTarget),
      sx: { maxHeight: "60vh" },
    },
    renderEmptyRowsFallback: () => (
      <div className="flex items-center justify-center p-6 w-full text-(--color-transparent-neutral-60)">
        {t("common.noDataAvailable")}
      </div>
    ),
    initialState: { density: "compact" },
    ...multiTableOptions,
  });

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth data-testid={`Dialog__${field.id}`}>
      <Box className="relative flex justify-center items-center p-4 border-b" data-testid={`Box__${field.id}`}>
        <Typography
          sx={{ fontSize: "1.125rem", fontWeight: 700, textTransform: "none", color: "text.primary" }}
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
      {multiSelect && (
        <DialogActions data-testid={`DialogActions__${field.id}`} className="px-4 py-3 gap-3">
          <Button
            variant="outlined"
            size="large"
            onClick={onClose}
            className="w-32"
            data-testid={`SelectorModalCancel__${field.id}`}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="filled"
            size="large"
            onClick={handleConfirmMultiSelect}
            className="w-32"
            data-testid={`SelectorModalConfirm__${field.id}`}>
            {t("common.confirm")}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default SelectorModal;
