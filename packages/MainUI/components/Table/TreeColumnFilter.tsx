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
import { buildFlatTreeList, type TreeNode } from "@/utils/form/treeUtils";
import { FIELD_REFERENCE_CODES } from "@/utils/form/constants";

/**
 * Maps reference IDs to their tree datasource IDs and HQL exists queries.
 * In Classic, these are hardcoded in ob-formitem-characteristics.js.
 * The backend metadata API does not expose this relationship.
 */
const TREE_REFERENCE_CONFIG: Record<string, { datasourceId: string; existsQuery: string }> = {
  [FIELD_REFERENCE_CODES.PRODUCT_CHARACTERISTICS.id]: {
    datasourceId: "BE2735798ECC4EF88D131F16F1C4EC72",
    existsQuery:
      "exists (from ProductCharacteristicValue v where e = v.product and v.characteristicValue.id in ($value))",
  },
};

const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
  padding: 0,
  marginRight: "0.5rem",
  "&.Mui-checked": {
    color: theme.palette.dynamicColor?.main,
  },
}));

interface TreeFilterNode extends TreeNode {
  filterValue: string;
}

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
}

/**
 * Builds tree hierarchy from FilterOptions that have parentId.
 * Returns a flat, depth-annotated list for rendering.
 */
function buildTreeFromOptions(options: FilterOption[]): TreeFilterNode[] {
  const records = options.map((opt) => ({
    id: opt.id,
    _identifier: opt.label,
    parentId: opt.parentId,
    isCharacteristic: opt.isCharacteristic,
    filterValue: opt.value,
  }));
  const nodes = buildFlatTreeList(records);
  return nodes as TreeFilterNode[];
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

  const options = isSelfLoading ? selfLoadedOptions : (externalOptions ?? []);
  const selectedValues = isSelfLoading ? selfSelectedValues : (externalSelectedValues ?? []);
  const loading = isSelfLoading ? selfLoading : externalLoading;

  const loadSelfOptions = useCallback(
    async (searchQuery?: string) => {
      if (!column) return;
      setSelfLoading(true);
      try {
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
    [entityName, column, tabId, fetchFilterOptions]
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  // Build tree hierarchy from options
  const treeNodes = useMemo(() => buildTreeFromOptions(options), [options]);

  // Node map for O(1) parent lookups
  const nodeMap = useMemo(() => {
    const map = new Map<string, TreeFilterNode>();
    for (const node of treeNodes) map.set(node.id as string, node);
    return map;
  }, [treeNodes]);

  // Filter: search + collapse
  const visibleNodes = useMemo(() => {
    let filtered = treeNodes;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const matchIds = new Set(
        treeNodes
          .filter((n) => (n._identifier as string).toLowerCase().includes(lowerSearch))
          .map((n) => n.id as string)
      );
      const keepIds = new Set(matchIds);
      for (const node of treeNodes) {
        if (matchIds.has(node.id as string)) {
          let current: TreeFilterNode | undefined = node;
          while (current?.parentId && typeof current.parentId === "string") {
            keepIds.add(current.parentId as string);
            current = nodeMap.get(current.parentId as string);
          }
        }
      }
      filtered = filtered.filter((n) => keepIds.has(n.id as string));
    } else {
      filtered = filtered.filter((node) => {
        let parentId = node.parentId as string | undefined;
        while (parentId) {
          if (collapsedNodes.has(parentId)) return false;
          const parent = nodeMap.get(parentId);
          parentId = parent?.parentId as string | undefined;
        }
        return true;
      });
    }

    return filtered;
  }, [treeNodes, searchTerm, collapsedNodes, nodeMap]);

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const getSelectedOptions = useCallback((ids: string[]) => options.filter((opt) => ids.includes(opt.id)), [options]);

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
        if (isSelfLoading && !selfLoaded) {
          loadSelfOptions();
        } else {
          onFocus?.();
        }
      }
      return !prev;
    });
  }, [onFocus, isSelfLoading, selfLoaded, loadSelfOptions]);

  // Keyboard: arrow keys skip non-selectable nodes
  const selectableIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < visibleNodes.length; i++) {
      if (!visibleNodes[i].isCharacteristic) indices.push(i);
    }
    return indices;
  }, [visibleNodes]);

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
        const node = visibleNodes[highlightedIndex];
        if (node && !node.isCharacteristic) handleSingleSelect(node.id as string);
        else if (node?.hasChildren) toggleCollapse(node.id as string);
      }
    },
    [visibleNodes, highlightedIndex, selectableIndices, handleSingleSelect, toggleCollapse]
  );

  const clickOutsideRefs = useMemo(() => [portalRef], []);
  useClickOutside(
    wrapperRef as React.RefObject<HTMLDivElement>,
    () => setIsOpen(false),
    clickOutsideRefs as React.RefObject<HTMLElement>[]
  );

  const handleOnSearch = useCallback(
    (term: string) => {
      if (isSelfLoading) {
        loadSelfOptions(term);
      } else {
        onSearch?.(term);
      }
      setIsDebouncing(false);
    },
    [onSearch, isSelfLoading, loadSelfOptions]
  );
  const debouncedSearch = useDebouncedCallback(handleOnSearch, 500);

  const handleSetSearchTerm = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const term = e.target.value;
      setSearchTerm(term);
      if (onSearch) setIsDebouncing(true);
      debouncedSearch(term);
    },
    [debouncedSearch, onSearch]
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
    if (!selectedLabels.length) return placeholder;
    if (selectedLabels.length === 1) return selectedLabels[0];
    return `${selectedLabels.length} selected`;
  }, [selectedLabels, placeholder]);

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
        const selectable = !node.isCharacteristic;
        const isSelected = selectedValues.includes(nodeId);
        const isHighlighted = highlightedIndex === index;
        const isCollapsed = collapsedNodes.has(nodeId);

        return (
          <li
            key={nodeId}
            aria-selected={isSelected}
            onClick={() => {
              if (selectable) handleSingleSelect(nodeId);
              else if (node.hasChildren) toggleCollapse(nodeId);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (selectable) handleSingleSelect(nodeId);
                else if (node.hasChildren) toggleCollapse(nodeId);
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle(nodeId);
                }}
                disableRipple
              />
            )}
            <span
              className={`truncate ${
                selectable
                  ? isSelected
                    ? "text-dynamic-dark font-medium"
                    : "text-baseline-90"
                  : "font-semibold text-baseline-60"
              }`}>
              {identifier}
            </span>
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
    selectedValues,
    collapsedNodes,
    handleSingleSelect,
    handleToggle,
    toggleCollapse,
    showSkeleton,
    showLoading,
    t,
  ]);

  return (
    <div ref={wrapperRef} className="relative w-full font-['Inter']" tabIndex={-1}>
      <div
        onClick={handleClick}
        onKeyDown={(e) => handleKeyboardActivation(e, handleClick)}
        className={`w-full flex items-center justify-between py-2 h-10 border-b border-baseline-10 hover:border-baseline-100 focus:outline-none focus:ring-2 focus:ring-dynamic-light
          ${isOpen ? "rounded border-b-0 border-dynamic-main ring-2 ring-dynamic-light" : ""}
          text-baseline-20 cursor-pointer hover:border-baseline-60 transition-colors outline-none`}>
        <div
          className={`w-full text-sm truncate max-w-[calc(100%-40px)] ${
            selectedLabels.length ? "text-baseline-90 font-medium" : "text-baseline-50 font-medium"
          }`}>
          {displayText}
        </div>
        <div className="flex items-center flex-shrink-0 ml-2">
          {selectedLabels.length > 0 && (
            <button
              type="button"
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
        minWidth={256}>
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
