/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import {
  MaterialReactTable,
  type MRT_ColumnFiltersState,
  type MRT_Row,
  useMaterialReactTable,
  type MRT_TableBodyRowProps,
  type MRT_TableInstance,
  type MRT_VisibilityState,
  type MRT_ExpandedState,
} from "material-react-table";
import { useStyle } from "./styles";
import type { DatasourceOptions, EntityData } from "@workspaceui/api-client/src/api/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "../../contexts/searchContext";
import ColumnVisibilityMenu from "../Toolbar/Menus/ColumnVisibilityMenu";
import { useDatasourceContext } from "@/contexts/datasourceContext";
import EmptyState from "./EmptyState";
import { useToolbarContext } from "@/contexts/ToolbarContext";
import { useLanguage } from "@/contexts/language";
import { useTreeModeMetadata } from "@/hooks/useTreeModeMetadata";
import useTableSelection from "@/hooks/useTableSelection";
import { ErrorDisplay } from "../ErrorDisplay";
import { useTranslation } from "@/hooks/useTranslation";
import { useTabContext } from "@/contexts/tab";
import { useDatasource } from "@/hooks/useDatasource";
import { useSelected } from "@/hooks/useSelected";
import { useColumns } from "@/hooks/table/useColumns";

type RowProps = (props: {
  isDetailPanel?: boolean;
  row: MRT_Row<EntityData>;
  table: MRT_TableInstance<EntityData>;
}) => Omit<MRT_TableBodyRowProps<EntityData>, "staticRowIndex">;

const getRowId = (row: EntityData) => String(row.id);
interface DynamicTableProps {
  setRecordId: React.Dispatch<React.SetStateAction<string>>;
  onRecordSelection?: (recordId: string) => void;
  isTreeMode?: boolean;
}

const DynamicTable = ({ setRecordId, onRecordSelection, isTreeMode = true }: DynamicTableProps) => {
  const [expanded, setExpanded] = useState<MRT_ExpandedState>({});
  const [loadedNodes, setLoadedNodes] = useState<Set<string>>(new Set()); // Track loaded child nodes
  const [childrenData, setChildrenData] = useState<Map<string, EntityData[]>>(new Map()); // Store children by parent ID
  const [flattenedRecords, setFlattenedRecords] = useState<EntityData[]>([]); // Combined parent + children records

  const { sx } = useStyle();
  const { searchQuery } = useSearch();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>({});
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);
  const { graph } = useSelected();

  const toggleColumnsDropdown = useCallback(
    (buttonRef?: HTMLElement | null) => {
      if (columnMenuAnchor) {
        setColumnMenuAnchor(null);
      } else {
        setColumnMenuAnchor(buttonRef || null);
      }
    },
    [columnMenuAnchor]
  );

  const handleCloseColumnMenu = useCallback(() => {
    setColumnMenuAnchor(null);
  }, []);
  const { registerDatasource, unregisterDatasource, registerRefetchFunction } = useDatasourceContext();
  const { registerActions } = useToolbarContext();
  const { tab, parentTab, parentRecord, parentRecords } = useTabContext();
  const { treeMetadata, loading: treeMetadataLoading } = useTreeModeMetadata(tab);
  const tabId = tab.id;
  const parentId = String(parentRecord?.id ?? "");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const clickTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Determinar si usar tree mode basado en metadata y prop (mover antes de todo)
  const shouldUseTreeMode = isTreeMode && treeMetadata.supportsTreeMode && !treeMetadataLoading;
  const treeEntity = shouldUseTreeMode ? treeMetadata.treeEntity || "90034CAE96E847D78FBEF6D38CB1930D" : tab.entityName;

  const baseColumns = useColumns(tab);

  // Modificar las columnas para tree mode
  const columns = useMemo(() => {
    if (!shouldUseTreeMode || !baseColumns.length) {
      return baseColumns;
    }

    // Clonar las columnas y modificar la primera para agregar iconos de jerarquía
    const modifiedColumns = [...baseColumns];
    const firstColumn = { ...modifiedColumns[0] };

    // Guardar el Cell original si existe
    const originalCell = firstColumn.Cell;

    // Crear una nueva función Cell que agregue iconos de jerarquía
    firstColumn.Cell = ({ renderedCellValue, row }: any) => {
      const level = row.original.__level || 0;
      const hasChildren = row.original.showDropIcon === true;

      // Iconos para diferentes tipos de nodos
      let icon = "";
      if (level === 0) {
        icon = hasChildren ? "📁" : "📄"; // Carpeta para padres con hijos, documento para hojas
      } else {
        icon = "└ 📄"; // Línea conectora para nodos hijos
      }

      return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ opacity: 0.6, fontSize: "12px" }}>{icon}</span>
          <span>{originalCell ? (originalCell as any)({ renderedCellValue, row }) : renderedCellValue}</span>
        </div>
      );
    };

    modifiedColumns[0] = firstColumn;
    return modifiedColumns;
  }, [baseColumns, shouldUseTreeMode]);

  // Definir query antes de loadChildNodes para evitar dependencia circular
  const query: DatasourceOptions = useMemo(() => {
    const fieldName = tab.parentColumns[0] || "id";
    const value = parentId;
    const operator = "equals";

    const options: DatasourceOptions = {
      windowId: tab.window,
      tabId: tab.id,
      isImplicitFilterApplied: tab.hqlfilterclause?.length > 0 || tab.sQLWhereClause?.length > 0,
      pageSize: 100,
    };

    if (language) {
      options.language = language;
    }

    if (value && value !== "" && value !== undefined) {
      options.criteria = [
        {
          fieldName,
          value,
          operator,
        },
      ];
    }
    return options;
  }, [
    tab.parentColumns,
    tab.window,
    tab.id,
    tab.hqlfilterclause?.length,
    tab.sQLWhereClause?.length,
    parentId,
    language,
  ]);

  // Función para cargar nodos hijos dinámicamente
  const loadChildNodes = useCallback(
    async (parentId: string, parentData: EntityData) => {
      if (!shouldUseTreeMode || loadedNodes.has(parentId)) {
        return; // Ya cargado o no en tree mode
      }

      console.log("📡 Cargando nodos hijos para parentId:", parentId);

      try {
        // Crear opciones específicas para cargar nodos hijos
        const childTreeOptions = {
          isTreeMode: true,
          windowId: tab.window,
          tabId: tab.id,
          referencedTableId: treeMetadata.referencedTableId || "155",
          parentId: parentId, // El ID del nodo padre que se expandió
        };

        // Hacer la consulta con parentId específico
        const childQuery = {
          ...query,
          // Agregar criterios específicos si es necesario
        };

        // Simular la carga (en la implementación real usaríamos loadData del useDatasource)
        const { datasource } = await import("@workspaceui/api-client/src/api/datasource");

        const safePageSize = 1000; // Por ahora cargamos muchos nodos hijos
        const startRow = 0;
        const endRow = safePageSize - 1;

        const processedParams = {
          ...childQuery,
          startRow,
          endRow,
          pageSize: safePageSize,
          parentId: parentId,
          tabId: childTreeOptions.tabId,
          windowId: childTreeOptions.windowId,
          referencedTableId: childTreeOptions.referencedTableId,
        };

        console.log("🚀 Enviando request para nodos hijos:", {
          entity: treeEntity,
          processedParams,
          parentData: { id: parentData.id, name: parentData.name || parentData._identifier },
        });

        const response = await datasource.get(treeEntity, processedParams);

        if (response.ok && response.data?.response?.data) {
          const childNodes = response.data.response.data;

          console.log("✅ Nodos hijos cargados:", {
            parentId,
            childCount: childNodes.length,
            children: childNodes.map((child: EntityData) => ({
              id: child.id,
              name: child.name || child._identifier,
            })),
          });

          // Guardar los nodos hijos en el estado
          setChildrenData((prev) => new Map(prev.set(parentId, childNodes)));
          setLoadedNodes((prev) => new Set(prev.add(parentId)));
        } else {
          console.error("❌ Error cargando nodos hijos:", response);
        }
      } catch (error) {
        console.error("❌ Excepción cargando nodos hijos:", error);
      }
    },
    [shouldUseTreeMode, loadedNodes, treeEntity, tab, treeMetadata, query]
  );

  // Función para construir la lista plana de registros con jerarquía
  const buildFlattenedRecords = useCallback(
    (
      parentRecords: EntityData[],
      expandedState: MRT_ExpandedState,
      childrenMap: Map<string, EntityData[]>
    ): EntityData[] => {
      const result: EntityData[] = [];

      for (const parentRecord of parentRecords) {
        // Agregar el registro padre con nivel 0
        const parentWithLevel = {
          ...parentRecord,
          __level: 0, // Nivel de indentación
          __isParent: true,
          __originalParentId: parentRecord.parentId,
        };
        result.push(parentWithLevel);

        // Si el nodo está expandido, agregar sus hijos
        const parentId = String(parentRecord.id);
        const isExpanded = typeof expandedState === "object" && expandedState[parentId];

        if (isExpanded && childrenMap.has(parentId)) {
          const children = childrenMap.get(parentId) || [];
          for (const childRecord of children) {
            const childWithLevel = {
              ...childRecord,
              __level: 1, // Nivel de indentación para hijos
              __isParent: false,
              __originalParentId: childRecord.parentId,
              __treeParentId: parentId, // ID del padre en el árbol
            };
            result.push(childWithLevel);
          }
        }
      }

      return result;
    },
    []
  );

  // Esta función se definirá después de obtener records

  const treeOptions = shouldUseTreeMode
    ? {
        isTreeMode: true,
        windowId: tab.window,
        tabId: tab.id,
        referencedTableId: treeMetadata.referencedTableId || "155",
        parentId: -1, // Empezar con nodos raíz
      }
    : undefined;

  // Debug logging
  console.log("🌳 Tree Mode Debug:", {
    isTreeMode,
    entityName: tab.entityName,
    treeMetadata,
    treeMetadataLoading,
    shouldUseTreeMode,
    treeEntity,
    treeOptions,
    windowId: tab.window,
    tabId: tab.id,
  });

  const {
    updateColumnFilters,
    toggleImplicitFilters,
    fetchMore,
    records,
    removeRecordLocally,
    error,
    refetch,
    loading,
    hasMoreRecords,
  } = useDatasource({
    entity: treeEntity,
    params: query,
    columns,
    searchQuery,
    skip: parentTab ? Boolean(!parentRecord || (parentRecords && parentRecords.length !== 1)) : false,
    treeOptions,
  });

  // Usar flattenedRecords para tree mode, records normales para table mode
  const displayRecords = shouldUseTreeMode ? flattenedRecords : records;

  // Actualizar registros planos cuando cambien los datos o el estado expandido
  useEffect(() => {
    if (shouldUseTreeMode) {
      const flattened = buildFlattenedRecords(records, expanded, childrenData);
      setFlattenedRecords(flattened);

      console.log("🔄 Actualizando registros planos:", {
        originalRecords: records.length,
        flattenedRecords: flattened.length,
        expandedNodes: Object.keys(expanded).filter((k) => expanded[k as keyof typeof expanded]),
      });
    } else {
      setFlattenedRecords(records);
    }
  }, [records, expanded, childrenData, shouldUseTreeMode, buildFlattenedRecords]);

  const handleColumnFiltersChange = useCallback(
    (updaterOrValue: MRT_ColumnFiltersState | ((prev: MRT_ColumnFiltersState) => MRT_ColumnFiltersState)) => {
      let isRealFilterChange = false;

      setColumnFilters((columnFilters) => {
        let newColumnFilters: MRT_ColumnFiltersState;

        if (typeof updaterOrValue === "function") {
          newColumnFilters = updaterOrValue(columnFilters);
        } else {
          newColumnFilters = updaterOrValue;
        }

        isRealFilterChange =
          JSON.stringify(newColumnFilters.map((f) => ({ id: f.id, value: f.value }))) !==
          JSON.stringify(columnFilters.map((f) => ({ id: f.id, value: f.value })));

        if (isRealFilterChange) {
          updateColumnFilters(newColumnFilters);
        }

        return newColumnFilters;
      });
    },
    [updateColumnFilters]
  );

  const handleTableSelectionChange = useCallback(
    (recordId: string) => {
      if (onRecordSelection) {
        onRecordSelection(recordId);
      }
    },
    [onRecordSelection]
  );

  const rowProps = useCallback<RowProps>(
    ({ row, table }) => {
      const record = row.original as Record<string, never>;
      const isSelected = row.getIsSelected();
      const rowId = String(record.id);

      return {
        onClick: (event) => {
          const existingTimeout = clickTimeoutsRef.current.get(rowId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            clickTimeoutsRef.current.delete(rowId);
          }

          const timeout = setTimeout(() => {
            if (!event.ctrlKey) {
              table.setRowSelection({});
            }
            row.toggleSelected();
            clickTimeoutsRef.current.delete(rowId);
          }, 250);

          clickTimeoutsRef.current.set(rowId, timeout);
        },

        onDoubleClick: (event) => {
          event.stopPropagation();

          const timeout = clickTimeoutsRef.current.get(rowId);
          if (timeout) {
            clearTimeout(timeout);
            clickTimeoutsRef.current.delete(rowId);
          }

          const parent = graph.getParent(tab);
          const parentSelection = parent ? graph.getSelected(parent) : undefined;

          if (!isSelected) {
            row.toggleSelected();
          }

          graph.setSelected(tab, row.original);

          if (parent && parentSelection) {
            setTimeout(() => graph.setSelected(parent, parentSelection), 10);
          }
          setRecordId(record.id);
        },

        sx: {
          ...(isSelected && {
            ...sx.rowSelected,
          }),
        },
        row,
        table,
      };
    },
    [graph, setRecordId, sx.rowSelected, tab]
  );

  const renderEmptyRowsFallback = useCallback(
    ({ table }: { table: MRT_TableInstance<EntityData> }) => <EmptyState table={table} />,
    []
  );

  const fetchMoreOnBottomReached = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const containerRefElement = event.target as HTMLDivElement;

      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (scrollHeight - scrollTop - clientHeight < 10 && !loading && hasMoreRecords) {
          fetchMore();
        }
      }
    },
    [fetchMore, hasMoreRecords, loading]
  );
  const expandedRef = useRef<MRT_ExpandedState>({});

  const table = useMaterialReactTable<EntityData>({
    muiTablePaperProps: { sx: sx.tablePaper },
    muiTableHeadCellProps: { sx: sx.tableHeadCell },
    muiTableBodyCellProps: ({ row, column }) => ({
      sx: {
        ...sx.tableBodyCell,
        // Agregar indentación para nodos hijos en la primera columna
        ...(shouldUseTreeMode &&
          column.id === columns[0]?.id && {
            paddingLeft: `${16 + ((row.original.__level as number) || 0) * 24}px`,
            position: "relative",
          }),
      },
    }),
    // Personalizar el renderizado de celdas para agregar iconos de jerarquía
    displayColumnDefOptions: shouldUseTreeMode
      ? {
          "mrt-row-expand": {
            size: 60,
          },
        }
      : undefined,
    muiTableBodyProps: { sx: sx.tableBody },
    layoutMode: "semantic",
    enableGlobalFilter: false,
    columns,
    data: displayRecords,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    positionToolbarAlertBanner: "none",
    muiTableBodyRowProps: rowProps,
    muiTableContainerProps: {
      ref: tableContainerRef,
      sx: { flex: 1, height: "100%", maxHeight: "100%" },
      onScroll: fetchMoreOnBottomReached,
    },
    enablePagination: false,
    enableStickyHeader: true,
    enableColumnVirtualization: true,
    enableRowVirtualization: true,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableExpanding: shouldUseTreeMode,
    paginateExpandedRows: false, // Importante para tree view
    getRowCanExpand: (row) => {
      // En tree mode, solo los nodos padre pueden expandirse
      const isParentNode = shouldUseTreeMode ? row.original.__isParent !== false : true;
      const canExpand = row.original.showDropIcon === true && isParentNode;

      if (shouldUseTreeMode) {
        console.log("🔍 Checking row expansion:", {
          id: row.original.id,
          showDropIcon: row.original.showDropIcon,
          isParentNode,
          __isParent: row.original.__isParent,
          __level: row.original.__level,
          canExpand,
        });
      }
      return canExpand;
    },
    // Configuración adicional para asegurar que los botones de expansión aparezcan
    initialState: shouldUseTreeMode
      ? {
          expanded: {},
        }
      : undefined,
    // Ya no necesitamos renderDetailPanel porque los nodos hijos son filas reales
    renderDetailPanel: undefined,
    onExpandedChange: (newExpanded) => {
      const prevExpanded = expandedRef.current;
      const newExpandedState = typeof newExpanded === "function" ? newExpanded(expanded) : newExpanded;

      setExpanded(newExpandedState);
      expandedRef.current = newExpandedState;

      // Verificar si newExpandedState es un objeto (Record<string, boolean>)
      if (typeof newExpandedState === "object" && newExpandedState !== null && !Array.isArray(newExpandedState)) {
        const prevExpandedObj =
          typeof prevExpanded === "object" && prevExpanded !== null && !Array.isArray(prevExpanded) ? prevExpanded : {};

        const prevKeys = Object.keys(prevExpandedObj).filter((k) => prevExpandedObj[k as keyof typeof prevExpandedObj]);
        const newKeys = Object.keys(newExpandedState).filter(
          (k) => newExpandedState[k as keyof typeof newExpandedState]
        );

        const expandedRowIds = newKeys.filter((k) => !prevKeys.includes(k));
        const collapsedRowIds = prevKeys.filter((k) => !newKeys.includes(k));

        // Carga dinámica de nodos hijos
        for (const id of expandedRowIds) {
          const rowData = displayRecords.find((record) => String(record.id) === id);
          console.log("🔍 Se expandió la fila:", {
            id,
            rowData: rowData ? { id: rowData.id, ...rowData } : "No encontrada",
          });

          if (shouldUseTreeMode && rowData && rowData.__isParent !== false) {
            // Solo cargar nodos hijos para nodos padre
            loadChildNodes(String(rowData.id), rowData);
          }
        }

        for (const id of collapsedRowIds) {
          const rowData = displayRecords.find((record) => String(record.id) === id);
          console.log("📁 Se colapsó la fila:", {
            id,
            rowData: rowData ? { id: rowData.id, ...rowData } : "No encontrada",
          });
        }

        console.log("📊 Estado de expansión actualizado:", {
          totalExpanded: newKeys.length,
          expandedIds: newKeys,
        });
      }
    },
    state: {
      columnFilters,
      columnVisibility,
      expanded: shouldUseTreeMode ? expanded : {},
      showColumnFilters: true,
      showProgressBars: loading,
    },
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId,
    enableColumnFilters: true,
    enableSorting: true,
    enableColumnResizing: true,
    enableColumnActions: true,
    manualFiltering: true,
    renderEmptyRowsFallback,
  });

  useTableSelection(tab, records, table.getState().rowSelection, handleTableSelectionChange);

  useEffect(() => {
    const handleGraphClear = (eventTab: typeof tab) => {
      if (eventTab.id === tab.id) {
        const currentSelection = table.getState().rowSelection;
        const hasTableSelection = Object.keys(currentSelection).some((id) => currentSelection[id]);

        if (hasTableSelection) {
          table.resetRowSelection(true);
        }
      }
    };

    graph.addListener("unselected", handleGraphClear);
    graph.addListener("unselectedMultiple", handleGraphClear);

    return () => {
      graph.removeListener("unselected", handleGraphClear);
      graph.removeListener("unselectedMultiple", handleGraphClear);
    };
  }, [graph, table, tabId, tab.id]);

  useEffect(() => {
    if (removeRecordLocally) {
      registerDatasource(tabId, removeRecordLocally);
    }

    registerRefetchFunction(tabId, refetch);

    return () => {
      unregisterDatasource(tabId);
    };
  }, [tabId, removeRecordLocally, registerDatasource, unregisterDatasource, registerRefetchFunction, refetch]);

  useEffect(() => {
    registerActions({
      refresh: refetch,
      filter: toggleImplicitFilters,
      save: async () => {},
      columnFilters: toggleColumnsDropdown,
    });
  }, [refetch, registerActions, toggleImplicitFilters, toggleColumnsDropdown]);

  if (error) {
    return (
      <ErrorDisplay title={t("errors.tableError.title")} description={error?.message} showRetry onRetry={refetch} />
    );
  }

  if (parentTab && !parentRecord) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-lg mb-2">{t("errors.selectionError.title")}</div>
          <div className="text-sm">{t("errors.selectionError.description")}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {shouldUseTreeMode && (
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      )}
      <div
        className={`h-full overflow-hidden rounded-3xl transition-opacity ${
          loading ? "opacity-60 cursor-progress cursor-to-children" : "opacity-100"
        }`}>
        <MaterialReactTable table={table} />

        <ColumnVisibilityMenu anchorEl={columnMenuAnchor} onClose={handleCloseColumnMenu} table={table} />
      </div>
    </>
  );
};

export default DynamicTable;
