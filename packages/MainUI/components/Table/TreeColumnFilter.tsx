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

// @data-testid-ignore
import { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { handleKeyboardActivation, useClickOutside, useOpenDropdownEffect } from "@/utils/selectorUtils";
import { Checkbox, styled } from "@mui/material";
import ChevronDown from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import ChevronRight from "@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg";
import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import { useTranslation } from "@/hooks/useTranslation";
import { DropdownPortal } from "../Form/FormView/selectors/components/DropdownPortal";
import SearchInput from "../Form/FormView/selectors/components/Select/SearchInput";
import { useDebouncedCallback } from "./utils/performanceOptimizations";
import type { Column } from "@workspaceui/api-client/src/api/types";
import type { FilterOption, ColumnFilterState } from "@workspaceui/api-client/src/utils/column-filter-utils";
import { useColumnFilterData } from "@workspaceui/api-client/src/hooks/useColumnFilterData";
import { buildNodeMap, buildTreeFromFilterOptions, filterVisibleNodes, getNodeTextClass } from "@/utils/form/treeUtils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";
import {
  CHARACTERISTICS_TREE_DATASOURCE_ID,
  type CharacteristicsFilterContext,
  type CheckState,
  buildCharacteristicsExistsQuery,
  buildCharacteristicsLabel,
  buildCharacteristicsTreeParams,
  buildChildrenMap,
  buildLeafIdsIndex,
  getCheckState,
  resolveProductPath,
  toggleLeafSelection,
} from "@/utils/table/characteristicsFilter";

/** Product path of the base entity, used when the grid of the filter is unknown. */
const BASE_PRODUCT_PATH = "e";

/**
 * Maps reference IDs to their tree datasource IDs and HQL exists queries.
 * In Classic, these are hardcoded in ob-formitem-characteristics.js.
 * The backend metadata API does not expose this relationship.
 */
const TREE_REFERENCE_CONFIG: Record<string, { datasourceId: string; existsQuery: string }> = {
  [FIELD_REFERENCE_CODES.PRODUCT_CHARACTERISTICS.id]: {
    datasourceId: CHARACTERISTICS_TREE_DATASOURCE_ID,
    existsQuery: buildCharacteristicsExistsQuery(BASE_PRODUCT_PATH),
  },
};

/** Field name the criteria of a column use, as `LegacyColumnFilterUtils.createColumnFilterCriteria`. */
const getColumnFieldName = (column: Column): string =>
  ((column as Record<string, unknown>).filterFieldName as string) || column.columnName;

/** Returns the selected options in the order of the ids, taking them from the loaded or applied options. */
const resolveSelectedOptions = (ids: string[], options: FilterOption[], appliedOptions: FilterOption[]) => {
  const byId = new Map<string, FilterOption>();
  for (const option of [...appliedOptions, ...options]) byId.set(option.id, option);
  return ids.map((id) => byId.get(id)).filter((option): option is FilterOption => !!option);
};

/** Text of the filter cell of a characteristics filter, as Classic shows it. */
const getCharacteristicsDisplayText = (
  options: FilterOption[],
  appliedOptions: FilterOption[],
  selectedValues: string[]
): string => {
  const loadedIds = new Set(options.map((option) => option.id));
  const isTreeLoaded = selectedValues.every((id) => loadedIds.has(id));
  if (isTreeLoaded) return buildCharacteristicsLabel(options, selectedValues);
  return buildCharacteristicsLabel(appliedOptions, selectedValues);
};

const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
  padding: 0,
  marginRight: "0.5rem",
  "&.Mui-checked": {
    color: theme.palette.dynamicColor?.main,
  },
}));

interface TreeColumnFilterProps {
  options?: FilterOption[];
  selectedValues?: string[];
  onSelectionChange: (selectedIds: string[], selectedOptions?: FilterOption[]) => void;
  onSearch?: (term: string) => void;
  onFocus?: () => void;
  onLoadMore?: () => void;
  loading?: boolean;
  hasMore?: boolean;
  placeholder?: string;
  filterState?: ColumnFilterState;
  /** When provided, the component loads its own data using useColumnFilterData */
  column?: Column;
  entityName?: string;
  tabId?: string;
  /**
   * Grid of a Product Characteristics filter. With it, the filter follows Classic: it loads the tree of
   * the grid on every opening, sorts it, selects groups with their values and shows the Classic text.
   */
  characteristicsContext?: CharacteristicsFilterContext;
  /** Options applied in the grid filter; when provided they are the selection of a self-loading filter. */
  appliedOptions?: FilterOption[];
}

function TreeColumnFilterCmp({
  options: externalOptions,
  selectedValues: externalSelectedValues,
  onSelectionChange,
  onSearch,
  onFocus,
  loading: externalLoading = false,
  placeholder = "Select options...",
  column,
  entityName,
  tabId,
  characteristicsContext,
  appliedOptions,
}: TreeColumnFilterProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [isFetchingInitial, setIsFetchingInitial] = useState(false);

  // Self-loading mode: fetch data using useColumnFilterData when column/entityName are provided
  const isSelfLoading = !!column && !!entityName;
  const { fetchFilterOptions } = useColumnFilterData();
  const [selfLoadedOptions, setSelfLoadedOptions] = useState<FilterOption[]>([]);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfLoaded, setSelfLoaded] = useState(false);
  const [selfSelectedValues, setSelfSelectedValues] = useState<string[]>([]);

  const isCharacteristics = isSelfLoading && !!characteristicsContext;
  const searchesSelfOptions = isSelfLoading && !isCharacteristics;
  const appliedSelection = useMemo(() => appliedOptions ?? [], [appliedOptions]);
  const options = isSelfLoading ? selfLoadedOptions : (externalOptions ?? []);
  const loading = isSelfLoading ? selfLoading : externalLoading;
  const selectedValues = useMemo(() => {
    if (!isSelfLoading) return externalSelectedValues ?? [];
    if (appliedOptions) return appliedOptions.map((option) => option.id);
    return selfSelectedValues;
  }, [isSelfLoading, externalSelectedValues, appliedOptions, selfSelectedValues]);

  /** Loads the characteristics tree of the grid, with the exists query of its product path. */
  const loadCharacteristicsOptions = useCallback(async (): Promise<FilterOption[]> => {
    if (!column || !characteristicsContext) return [];
    const productPath = resolveProductPath(
      getColumnFieldName(column),
      characteristicsContext.entityName,
      characteristicsContext.alias
    );
    const result = await fetchFilterOptions({
      datasourceId: CHARACTERISTICS_TREE_DATASOURCE_ID,
      treeParams: buildCharacteristicsTreeParams(characteristicsContext, productPath),
    });
    const existsQuery = buildCharacteristicsExistsQuery(productPath);
    return result.map((opt) => ({ ...opt, existsQuery }));
  }, [column, characteristicsContext, fetchFilterOptions]);

  const loadSelfOptions = useCallback(
    async (searchQuery?: string) => {
      if (!column) return;
      setSelfLoading(true);
      try {
        if (isCharacteristics) {
          setSelfLoadedOptions(await loadCharacteristicsOptions());
          setSelfLoaded(true);
          return;
        }
        // Resolve datasource: check reference-specific mapping, then column metadata, then entity _distinct
        const refConfig = column.column?.reference ? TREE_REFERENCE_CONFIG[column.column.reference] : undefined;
        const refDatasourceId = refConfig?.datasourceId;
        const columnDatasourceId = refDatasourceId || column.datasourceId || column.selectorDefinitionId;

        const result = columnDatasourceId
          ? await fetchFilterOptions({
              datasourceId: String(columnDatasourceId),
              selectorDefinitionId: column.selectorDefinitionId as string | undefined,
              searchQuery,
              limit: 100,
            })
          : await fetchFilterOptions({
              datasourceId: entityName || "",
              searchQuery,
              limit: 100,
              distinctField: ((column as Record<string, unknown>).filterFieldName as string) || column.columnName,
              tabId,
            });

        // Attach existsQuery to options so criteria builder can use it for special filter format
        const enrichedResult = refConfig?.existsQuery
          ? result.map((opt) => ({ ...opt, existsQuery: refConfig.existsQuery }))
          : result;
        setSelfLoadedOptions(enrichedResult);
        setSelfLoaded(true);
      } catch {
        setSelfLoadedOptions([]);
      } finally {
        setSelfLoading(false);
      }
    },
    [entityName, column, tabId, fetchFilterOptions, isCharacteristics, loadCharacteristicsOptions]
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Build tree hierarchy from options; the characteristics tree is sorted on each level, as Classic
  const treeNodes = useMemo(
    () => buildTreeFromFilterOptions(options, { sortSiblings: isCharacteristics }),
    [options, isCharacteristics]
  );

  // Leaves below each node: selecting a group or a characteristic selects all its values
  const leafIndex = useMemo(() => {
    if (!isCharacteristics) return new Map<string, string[]>();
    return buildLeafIdsIndex(options, buildChildrenMap(options));
  }, [options, isCharacteristics]);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  // Options in the order of the tree on screen: Classic lists the selection in that order
  const optionsInTreeOrder = useMemo(() => {
    const byId = new Map(options.map((option) => [option.id, option]));
    return treeNodes.map((node) => byId.get(node.id as string)).filter((option): option is FilterOption => !!option);
  }, [options, treeNodes]);

  const nodeMap = useMemo(() => buildNodeMap(treeNodes), [treeNodes]);

  const visibleNodes = useMemo(
    () => filterVisibleNodes(treeNodes, nodeMap, searchTerm, collapsedNodes),
    [treeNodes, nodeMap, searchTerm, collapsedNodes]
  );

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const getSelectedOptions = useCallback((ids: string[]) => options.filter((opt) => ids.includes(opt.id)), [options]);

  const getNodeCheckState = useCallback(
    (nodeId: string): CheckState => getCheckState(leafIndex.get(nodeId) ?? [nodeId], selectedSet),
    [leafIndex, selectedSet]
  );

  /** Toggles a node of the characteristics tree with its values; only the values filter, as in Classic. */
  const handleCharacteristicsToggle = useCallback(
    (id: string) => {
      const newSelection = toggleLeafSelection(selectedValues, leafIndex.get(id) ?? [id]);
      if (isSelfLoading) setSelfSelectedValues(newSelection);
      onSelectionChange(newSelection, resolveSelectedOptions(newSelection, options, appliedSelection));
    },
    [selectedValues, leafIndex, isSelfLoading, onSelectionChange, options, appliedSelection]
  );

  const handleToggle = useCallback(
    (id: string) => {
      const newSelection = selectedValues.includes(id)
        ? selectedValues.filter((v) => v !== id)
        : [...selectedValues, id];
      if (isSelfLoading) setSelfSelectedValues(newSelection);
      onSelectionChange(newSelection, getSelectedOptions(newSelection));
    },
    [selectedValues, onSelectionChange, isSelfLoading, getSelectedOptions]
  );

  const handleSingleSelect = useCallback(
    (id: string) => {
      if (isSelfLoading) setSelfSelectedValues([id]);
      onSelectionChange([id], getSelectedOptions([id]));
      setIsOpen(false);
      setHighlightedIndex(-1);
      setSearchTerm("");
    },
    [onSelectionChange, isSelfLoading, getSelectedOptions]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isSelfLoading) setSelfSelectedValues([]);
      onSelectionChange([], []);
      setIsOpen(false);
      setSearchTerm("");
    },
    [onSelectionChange, isSelfLoading]
  );

  const handleClick = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) {
        setIsFetchingInitial(true);
        // The characteristics tree depends on the other filters of the grid: Classic reloads it on every opening
        if (isCharacteristics || (isSelfLoading && !selfLoaded)) {
          loadSelfOptions();
        } else {
          onFocus?.();
        }
      }
      return !prev;
    });
  }, [onFocus, isSelfLoading, selfLoaded, loadSelfOptions, isCharacteristics]);

  /** Click or Enter on a node: characteristics toggle with cascade; other trees select one value. */
  const activateNode = useCallback(
    (node: (typeof visibleNodes)[number] | undefined) => {
      if (!node) return;
      const nodeId = node.id as string;
      if (isCharacteristics) handleCharacteristicsToggle(nodeId);
      else if (!node.isCharacteristic) handleSingleSelect(nodeId);
      else if (node.hasChildren) toggleCollapse(nodeId);
    },
    [isCharacteristics, handleCharacteristicsToggle, handleSingleSelect, toggleCollapse]
  );

  // Keyboard: arrow keys skip non-selectable nodes
  const selectableIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < visibleNodes.length; i++) {
      if (isCharacteristics || !visibleNodes[i].isCharacteristic) indices.push(i);
    }
    return indices;
  }, [visibleNodes, isCharacteristics]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selectableIndices.length === 0) return;
        setHighlightedIndex((prev) => {
          const pos = selectableIndices.indexOf(prev);
          return selectableIndices[pos < 0 ? 0 : (pos + 1) % selectableIndices.length];
        });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectableIndices.length === 0) return;
        setHighlightedIndex((prev) => {
          const pos = selectableIndices.indexOf(prev);
          return selectableIndices[pos <= 0 ? selectableIndices.length - 1 : pos - 1];
        });
        return;
      }
      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        activateNode(visibleNodes[highlightedIndex]);
      }
    },
    [visibleNodes, highlightedIndex, selectableIndices, activateNode]
  );

  const clickOutsideRefs = useMemo(() => [portalRef], []);
  useClickOutside(
    wrapperRef as React.RefObject<HTMLDivElement>,
    () => setIsOpen(false),
    clickOutsideRefs as React.RefObject<HTMLElement>[]
  );

  const handleOnSearch = useCallback(
    (term: string) => {
      // The characteristics tree is searched locally: its datasource reads the criteria as grid filters
      if (isCharacteristics) {
        setIsDebouncing(false);
        return;
      }
      if (isSelfLoading) {
        loadSelfOptions(term);
      } else {
        onSearch?.(term);
      }
      setIsDebouncing(false);
    },
    [onSearch, isSelfLoading, loadSelfOptions, isCharacteristics]
  );
  const debouncedSearch = useDebouncedCallback(handleOnSearch, 500);

  const handleSetSearchTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
      // Self-loaded options are searched on the server too (the characteristics tree is searched locally).
      if (onSearch || searchesSelfOptions) setIsDebouncing(true);
      debouncedSearch(term);
    },
    [debouncedSearch, onSearch, searchesSelfOptions]
  );

  const handleSearchBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = e.relatedTarget as Element | null;
    if (wrapperRef.current?.contains(relatedTarget)) return;
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isInPortal = portalRef.current?.contains(activeElement);
      const isInWrapper = wrapperRef.current?.contains(activeElement);
      if (!isInPortal && !isInWrapper) setIsOpen(false);
    }, 150);
  }, []);

  useOpenDropdownEffect(
    isOpen,
    setSearchTerm,
    setHighlightedIndex,
    searchInputRef as React.RefObject<HTMLInputElement>
  );

  useEffect(() => {
    if (options.length > 0 && !loading && isFetchingInitial) setIsFetchingInitial(false);
  }, [options, loading, isFetchingInitial]);

  // Scroll highlighted into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const selectedLabels = useMemo(
    () => options.filter((o) => selectedValues.includes(o.id)).map((o) => o.label),
    [options, selectedValues]
  );

  const displayText = useMemo(() => {
    if (isCharacteristics && selectedValues.length > 0) {
      return getCharacteristicsDisplayText(optionsInTreeOrder, appliedSelection, selectedValues) || placeholder;
    }
    if (!selectedLabels.length) return placeholder;
    if (selectedLabels.length === 1) return selectedLabels[0];
    return `${selectedLabels.length} selected`;
  }, [selectedLabels, placeholder, isCharacteristics, optionsInTreeOrder, appliedSelection, selectedValues]);
  const hasSelection = selectedLabels.length > 0 || (isCharacteristics && selectedValues.length > 0);

  /** Check state of a row: groups and characteristics are partially checked when some values are. */
  const getRowCheckState = useCallback(
    (nodeId: string): CheckState => {
      if (isCharacteristics) return getNodeCheckState(nodeId);
      return selectedSet.has(nodeId) ? "checked" : "unchecked";
    },
    [isCharacteristics, getNodeCheckState, selectedSet]
  );

  /** Checkbox click: characteristics toggle with cascade; other trees add or remove one value. */
  const toggleNode = useCallback(
    (nodeId: string) => {
      if (isCharacteristics) handleCharacteristicsToggle(nodeId);
      else handleToggle(nodeId);
    },
    [isCharacteristics, handleCharacteristicsToggle, handleToggle]
  );

  const showSkeleton = isFetchingInitial && loading;
  const showLoading = loading || isDebouncing;

  const renderedOptions = useMemo(() => {
    if (showSkeleton) {
      return [1, 2, 3].map((i) => (
        <li key={`skeleton-${i}`} className="px-4 py-2 text-sm pointer-events-none">
          <div className="flex items-center gap-3 py-1">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${50 + i * 10}%` }} />
          </div>
        </li>
      ));
    }

    if (visibleNodes.length > 0) {
      return visibleNodes.map((node, index) => {
        const nodeId = node.id as string;
        const identifier = node._identifier as string;
        const selectable = isCharacteristics || !node.isCharacteristic;
        const checkState = getRowCheckState(nodeId);
        const isSelected = checkState === "checked";
        const isHighlighted = highlightedIndex === index;
        const isCollapsed = collapsedNodes.has(nodeId);

        return (
          <li
            key={nodeId}
            data-testid={`TreeColumnFilterNode__${nodeId}`}
            aria-selected={isSelected}
            onClick={() => activateNode(node)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activateNode(node);
              }
            }}
            onMouseEnter={() => {
              if (selectable) setHighlightedIndex(index);
            }}
            className={`py-2 text-sm flex items-center focus:outline-none
              ${selectable ? "cursor-pointer hover:bg-baseline-10" : "cursor-default"}
              ${isHighlighted && selectable ? "bg-baseline-10" : ""}
              ${isSelected ? "bg-baseline-10" : ""}`}
            style={{ paddingLeft: `${12 + node.depth * 18}px`, paddingRight: "12px" }}>
            {node.hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(nodeId);
                }}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-baseline-60 hover:text-baseline-90 mr-1">
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                  fill="currentColor"
                />
              </button>
            )}
            {!node.hasChildren && <span className="w-4 flex-shrink-0 mr-1" />}
            {selectable && (
              <CustomCheckbox
                size="small"
                checked={isSelected}
                indeterminate={checkState === "indeterminate"}
                inputProps={{ "aria-label": identifier }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(nodeId);
                }}
                disableRipple
              />
            )}
            <span className={`truncate ${getNodeTextClass(selectable, isSelected)}`}>{identifier}</span>
          </li>
        );
      });
    }

    if (!showLoading) {
      return [
        <li key="no-options" className="px-4 py-2 text-sm text-baseline-60">
          {t("multiselect.noOptionsFound")}
        </li>,
      ];
    }

    return null;
  }, [
    visibleNodes,
    highlightedIndex,
    collapsedNodes,
    activateNode,
    toggleNode,
    getRowCheckState,
    isCharacteristics,
    toggleCollapse,
    showSkeleton,
    showLoading,
    t,
  ]);

  return (
    <div ref={wrapperRef} className="relative w-full font-['Inter']" tabIndex={-1}>
      <div
        data-testid={`TreeColumnFilter__${column?.columnName ?? "options"}`}
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivation(e, handleClick)}
        className={`w-full flex items-center justify-between py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 focus:outline-none focus:ring-2 focus:ring-dynamic-light
          ${isOpen ? "rounded-md border border-(--ui-text-muted)!" : ""}
          text-baseline-20 cursor-pointer hover:border-baseline-60 transition-colors outline-none`}>
        <div
          className={`w-full text-sm truncate max-w-[calc(100%-40px)] ${
            hasSelection ? "text-baseline-90 font-medium" : "text-slate-400 font-medium"
          }`}>
          {displayText}
        </div>
        <div className="flex items-center flex-shrink-0 ml-2">
          {hasSelection && (
            <button
              type="button"
              data-testid="TreeColumnFilter__clear"
              onClick={handleClear}
              className="mr-1 text-baseline-60 hover:text-baseline-80 rounded">
              <CloseIcon className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            fill="currentColor"
            className={`w-5 h-5 text-baseline-60 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>
      <DropdownPortal
        isOpen={isOpen}
        triggerRef={wrapperRef as React.RefObject<HTMLElement>}
        portalRef={portalRef as React.RefObject<HTMLDivElement>}
        // The panel matches its column instead of sticking out of it.
        minWidth={0}
      >
        <SearchInput
          searchTerm={searchTerm}
          searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
          handleSetSearchTerm={handleSetSearchTerm}
          handleKeyDown={handleKeyDown}
          handleSearchBlur={handleSearchBlur}
          handleFocus={() => {}}
        />
        <ul ref={listRef} className="overflow-y-auto focus:outline-none mt-1" style={{ maxHeight: "200px" }}>
          {renderedOptions}
          {showLoading && !showSkeleton && (
            <li className="px-4 py-2 text-sm text-baseline-60 text-center">{t("multiselect.loadingOptions")}</li>
          )}
        </ul>
      </DropdownPortal>
    </div>
  );
}

export const TreeColumnFilter = memo(TreeColumnFilterCmp);
