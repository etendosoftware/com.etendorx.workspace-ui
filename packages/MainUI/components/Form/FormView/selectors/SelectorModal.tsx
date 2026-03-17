import { useMemo, useState, type UIEvent } from "react";
import { Dialog, DialogContent, IconButton, Box, Typography } from "@mui/material";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnFiltersState,
  type MRT_SortingState,
} from "material-react-table";
import { useDatasource } from "../../../../hooks/useDatasource";
import type { Field, EntityData, SelectorColumn } from "@workspaceui/api-client/src/api/types";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useSelected } from "@/hooks/useSelected";
import { buildEtendoContext } from "@/utils/contextUtils";
import { useTabContext } from "@/contexts/tab";
import { useFormContext } from "react-hook-form";
import { useStyle } from "../../../Table/styles";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/language";
import { useUserContext } from "@/hooks/useUserContext";
import {
  buildSelectorColumnDefs,
  buildDatasourceColumns,
  buildSelectorDatasourceParams,
} from "@/utils/form/selectors/selectorColumns";
import { useSelectorDefaultCriteria } from "./hooks/useSelectorDefaultCriteria";
import { useSelectorFilterHandlers } from "./hooks/useSelectorFilterHandlers";

interface SelectorModalProps {
  field: Field;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (record: EntityData) => void;
  currentDisplayValue?: string;
}

const SelectorModal = ({ field, isOpen, onClose, onSelect }: SelectorModalProps) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const { sx } = useStyle();
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const { graph } = useSelected();
  const { tab: currentTab } = useTabContext();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { getValues } = useFormContext();
  const { session } = useUserContext();

  const targetEntity = (field.selector?.datasourceName as string) || field.referencedEntity;
  const gridColumns = (field.selector?.gridColumns as SelectorColumn[]) || [];

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
  });

  const idFilterDisplayValues = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of defaultFilterResponse?.idFilters ?? []) {
      map.set(f.fieldName, f._identifier);
    }
    return map;
  }, [defaultFilterResponse]);

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
    ]
  );

  const _etendoContext = useMemo(() => {
    return currentTab ? buildEtendoContext(currentTab, graph) : ({} as Record<string, string>);
  }, [currentTab, graph]);

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

  const table = useMaterialReactTable({
    columns,
    data: records,
    enableTopToolbar: false,
    enableColumnFilters: true,
    enableColumnFilterModes: false,
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
      showColumnFilters: true,
    },
    muiTablePaperProps: { sx: sx.tablePaper },
    muiTableHeadCellProps: { sx: sx.tableHeadCell },
    muiTableBodyCellProps: { sx: sx.tableBodyCell },
    muiTableBodyProps: { sx: sx.tableBody },
    muiTableContainerProps: {
      onScroll: (event: UIEvent<HTMLDivElement>) => fetchMoreOnBottomReached(event.currentTarget),
      sx: { maxHeight: "60vh" },
    },
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        onSelect(row.original);
        onClose();
      },
      sx: { cursor: "pointer", ...sx.tableBodyRow },
    }),
    initialState: { density: "compact" },
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
    </Dialog>
  );
};

export default SelectorModal;
