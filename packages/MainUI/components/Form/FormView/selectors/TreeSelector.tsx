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
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import ChevronDown from "@workspaceui/componentlibrary/src/assets/icons/chevron-down.svg";
import ChevronRight from "@workspaceui/componentlibrary/src/assets/icons/chevron-right.svg";
import XIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import CheckIcon from "@workspaceui/componentlibrary/src/assets/icons/check-circle-filled.svg";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";
import { useSelectFieldOptions } from "@/hooks/useSelectFieldOptions";
import { buildFlatTreeList, type TreeNode } from "@/utils/form/treeUtils";
import { updateSelectorValue } from "@/utils/form/selectors/utils";
import { useDropdownPosition } from "@/components/Form/FormView/selectors/hooks/useDropdownPosition";
import DropdownPortal from "@/components/Form/FormView/selectors/components/Select/DropdownPortal";
import {
  handleKeyboardActivation,
  useFocusHandler,
  useHoverHandlers,
  useOpenDropdownEffect,
  useSearchHandler,
  useSearchTermHandler,
} from "@/utils/selectorUtils";
import { useTranslation } from "@/hooks/useTranslation";

interface TreeSelectorProps {
  field: Field;
  isReadOnly: boolean;
}

const isNodeSelectable = (node: TreeNode): boolean => !node.isCharacteristic;

function TreeSelectorCmp({ field, isReadOnly }: TreeSelectorProps) {
  const { t } = useTranslation();
  const { register, setValue, watch } = useFormContext();
  const fieldName = field.hqlName || field.columnName || field.name;
  const selectedValue = watch(fieldName);
  const currentIdentifier = watch(`${fieldName}$_identifier`);

  // --- Data fetching (same pattern as TableDirSelector) ---
  const { records, loading, refetch } = useTableDirDatasource({ field });
  const options = useSelectFieldOptions(field, records);

  // --- Build tree from flat options ---
  const treeNodes = useMemo(() => {
    const recordData = options
      .filter((opt) => opt.data && Object.keys(opt.data).length > 0)
      .map((opt) => opt.data ?? {});
    return buildFlatTreeList(recordData);
  }, [options]);

  // Lookup map for O(1) parent resolution in filters
  const nodeMap = useMemo(() => {
    const map = new Map<string, TreeNode>();
    for (const node of treeNodes) {
      map.set(node.id as string, node);
    }
    return map;
  }, [treeNodes]);

  // --- UI state ---
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isHovering, setIsHovering] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedLabel, setSelectedLabel] = useState("");

  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownId = useMemo(() => `tree-dropdown-${fieldName}`, [fieldName]);

  const handleSearchChange = useSearchHandler();

  // --- Visible nodes: search filter + collapse filter ---
  const visibleNodes = useMemo(() => {
    let filtered = treeNodes;

    if (searchTerm) {
      // Search: keep matches + their ancestor chain for context
      const lowerSearch = searchTerm.toLowerCase();
      const matchIds = new Set(
        treeNodes
          .filter((n) => (n._identifier as string).toLowerCase().includes(lowerSearch))
          .map((n) => n.id as string)
      );
      const keepIds = new Set(matchIds);
      for (const node of treeNodes) {
        if (matchIds.has(node.id as string)) {
          let current: TreeNode | undefined = node;
          while (current?.parentId && typeof current.parentId === "string") {
            keepIds.add(current.parentId);
            current = nodeMap.get(current.parentId);
          }
        }
      }
      filtered = filtered.filter((n) => keepIds.has(n.id as string));
    } else {
      // No search: apply collapse filter — hide children of collapsed parents
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

  // --- Selectable nodes only (for keyboard nav index) ---
  const selectableIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < visibleNodes.length; i++) {
      if (isNodeSelectable(visibleNodes[i])) {
        indices.push(i);
      }
    }
    return indices;
  }, [visibleNodes]);

  // --- Toggle collapse ---
  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // --- Selection ---
  const handleSelect = useCallback(
    (node: TreeNode) => {
      if (!isNodeSelectable(node)) return;
      const nodeId = node.id as string;
      updateSelectorValue(setValue, fieldName, nodeId, node);
      setSelectedLabel(node._identifier as string);
      setIsOpen(false);
      setHighlightedIndex(-1);
      setIsFocused(false);
    },
    [fieldName, setValue]
  );

  // --- Keyboard navigation (skips non-selectable nodes) ---
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
          const currentPos = selectableIndices.indexOf(prev);
          const nextPos = currentPos < 0 ? 0 : (currentPos + 1) % selectableIndices.length;
          return selectableIndices[nextPos];
        });
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectableIndices.length === 0) return;
        setHighlightedIndex((prev) => {
          const currentPos = selectableIndices.indexOf(prev);
          const nextPos = currentPos <= 0 ? selectableIndices.length - 1 : currentPos - 1;
          return selectableIndices[nextPos];
        });
        return;
      }

      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const node = visibleNodes[highlightedIndex];
        if (node) {
          if (isNodeSelectable(node)) {
            handleSelect(node);
          } else if (node.hasChildren) {
            toggleCollapse(node.id as string);
          }
        }
      }
    },
    [visibleNodes, highlightedIndex, selectableIndices, handleSelect, toggleCollapse]
  );

  // --- Dropdown open/close ---
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setIsFocused(false);
    setCollapsedNodes(new Set()); // reset collapse state
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isReadOnly) {
        setIsOpen((prev) => !prev);
        setIsFocused(true);
      }
    },
    [isReadOnly]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setValue(`${fieldName}$_identifier`, "", { shouldDirty: false });
      setValue(`${fieldName}_data`, null);
      setValue(fieldName, "", { shouldDirty: true, shouldValidate: true });
      setSelectedLabel("");
    },
    [fieldName, setValue]
  );

  // --- Blur / click-outside ---
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const relatedTarget = e.relatedTarget as Element | null;
      if (relatedTarget?.closest(`[data-dropdown-portal="${dropdownId}"]`)) return;
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInPortal = activeElement?.closest(`[data-dropdown-portal="${dropdownId}"]`);
        const isInWrapper = wrapperRef.current?.contains(activeElement);
        if (!isInPortal && !isInWrapper) closeDropdown();
      }, 150);
    },
    [closeDropdown, dropdownId]
  );

  const handleSearchBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const relatedTarget = e.relatedTarget as Element | null;
      if (wrapperRef.current?.contains(relatedTarget)) return;
      setTimeout(() => {
        const activeElement = document.activeElement;
        const isInPortal = activeElement?.closest(`[data-dropdown-portal="${dropdownId}"]`);
        const isInWrapper = wrapperRef.current?.contains(activeElement);
        if (!isInPortal && !isInWrapper) closeDropdown();
      }, 150);
    },
    [closeDropdown, dropdownId]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInWrapper = wrapperRef.current?.contains(target);
      const isInPortal = target.closest(`[data-dropdown-portal="${dropdownId}"]`);
      if (!isInWrapper && !isInPortal) closeDropdown();
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeDropdown, dropdownId]);

  // --- Shared hooks ---
  const { handleMouseEnter, handleMouseLeave } = useHoverHandlers(setIsHovering);
  const handleFocus = useFocusHandler(refetch);
  const handleSetSearchTerm = useSearchTermHandler(handleSearchChange, setSearchTerm);
  const handleScroll = useCallback(() => {}, []); // no infinite scroll for tree data
  const dropdownViewportData = useDropdownPosition(isOpen, triggerRef as React.RefObject<HTMLDivElement>);

  useOpenDropdownEffect(
    isOpen,
    setSearchTerm,
    setHighlightedIndex,
    searchInputRef as React.RefObject<HTMLInputElement>
  );

  // --- Sync selected label from form state ---
  useEffect(() => {
    const node = treeNodes.find((n) => (n.id as string) === selectedValue);
    setSelectedLabel(node ? (node._identifier as string) : currentIdentifier || selectedValue || "");
  }, [selectedValue, treeNodes, currentIdentifier]);

  // --- Scroll highlighted into view ---
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // --- Trigger styles (same as Select.tsx) ---
  const mainDivClassNames = useMemo(() => {
    const base =
      "w-full flex items-center justify-between px-3 pr-3 rounded-t tracking-normal h-10.5 border-0 border-b-2 transition-colors outline-none";
    if (isReadOnly) {
      return `${base} bg-transparent rounded-t-lg cursor-not-allowed border-b-2 border-dotted border-(--color-transparent-neutral-40) hover:border-dotted hover:border-(--color-transparent-neutral-70) hover:bg-transparent focus:border-dotted focus:border-(--color-transparent-neutral-70) focus:bg-transparent focus:text-(--color-transparent-neutral-80)`;
    }
    const active = "border-[#004ACA] text-[#004ACA] bg-[#E5EFFF]";
    const hover = "hover:border-(--color-transparent-neutral-100) hover:bg-(--color-transparent-neutral-10)";
    const focus = "focus:border-[#004ACA] focus:text-[#004ACA] focus:bg-[#E5EFFF] focus:outline-none cursor-pointer";
    const interactive = isFocused || isOpen ? active : hover;
    return `${base} bg-(--color-transparent-neutral-5) border-(--color-transparent-neutral-30) text-(--color-transparent-neutral-80) font-medium text-sm leading-5 ${interactive} ${focus}`;
  }, [isReadOnly, isFocused, isOpen]);

  const labelClassNames = useMemo(() => {
    const base = "text-sm truncate max-w-[calc(100%-40px)] font-medium";
    if (!selectedLabel) return `${base} text-baseline-60`;
    const isActive = (isFocused || isOpen) && !isReadOnly;
    return `${base} ${isActive ? "text-[#004ACA]" : "text-(--color-transparent-neutral-80)"}`;
  }, [selectedLabel, isFocused, isOpen, isReadOnly]);

  const chevronClassNames = useMemo(() => {
    const base = "w-5 h-5 transition-transform";
    const isActive = isFocused || isOpen;
    return `${base} ${isActive ? "text-(--color-baseline-100) rotate-180" : "text-(--color-transparent-neutral-60)"}`;
  }, [isFocused, isOpen]);

  const shouldShowClearButton = selectedLabel && (isHovering || isOpen) && !isReadOnly;

  // --- Rendered tree options ---
  const renderedOptions = useMemo(() => {
    if (loading && visibleNodes.length === 0) {
      return <li className="px-4 py-3 text-sm text-baseline-60">Loading...</li>;
    }
    if (visibleNodes.length === 0) {
      return <li className="px-4 py-3 text-sm text-baseline-60">No options found</li>;
    }

    return visibleNodes.map((node, index) => {
      const nodeId = node.id as string;
      const identifier = node._identifier as string;
      const selectable = isNodeSelectable(node);
      const isSelected = selectedValue === nodeId;
      const isHighlighted = highlightedIndex === index;
      const isCollapsed = collapsedNodes.has(nodeId);

      return (
        <li
          key={nodeId}
          aria-selected={isSelected}
          onClick={(e) => {
            e.stopPropagation();
            if (selectable) {
              handleSelect(node);
            } else if (node.hasChildren) {
              toggleCollapse(nodeId);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              if (selectable) {
                handleSelect(node);
              } else if (node.hasChildren) {
                toggleCollapse(nodeId);
              }
            }
          }}
          onMouseEnter={() => {
            if (selectable) setHighlightedIndex(index);
          }}
          className={`py-2.5 text-sm flex items-center justify-between focus:outline-none
            ${selectable ? "cursor-pointer hover:bg-baseline-10" : "cursor-default"}
            ${isHighlighted && selectable ? "bg-baseline-10" : ""}
            ${isSelected ? "bg-baseline-10" : ""}`}
          style={{ paddingLeft: `${16 + node.depth * 20}px`, paddingRight: "16px" }}>
          <span className="flex items-center gap-1.5 truncate mr-2">
            {node.hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(nodeId);
                }}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-baseline-60 hover:text-baseline-90">
                <ChevronRight
                  className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                  fill="currentColor"
                />
              </button>
            )}
            {!node.hasChildren && <span className="w-4 flex-shrink-0" />}
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
          </span>
          {isSelected && <CheckIcon className="fade-in-left flex-shrink-0" height={16} width={16} />}
        </li>
      );
    });
  }, [visibleNodes, highlightedIndex, selectedValue, collapsedNodes, handleSelect, toggleCollapse, loading]);

  return (
    <>
      <div
        ref={wrapperRef}
        className={`relative w-full font-['Inter'] ${isReadOnly ? "pointer-events-none" : ""}`}
        onBlur={handleBlur}
        aria-label={field.name}
        aria-readonly={isReadOnly}
        aria-required={field.isMandatory}
        aria-disabled={isReadOnly}
        aria-details={field.helpComment}
        tabIndex={-1}>
        <input {...register(fieldName)} type="hidden" readOnly={isReadOnly} />
        <div
          ref={triggerRef}
          onClick={handleClick}
          onKeyDown={(e) => handleKeyboardActivation(e, () => handleClick(e as unknown as React.MouseEvent))}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          tabIndex={isReadOnly ? -1 : 0}
          className={mainDivClassNames}>
          <span className={labelClassNames}>{selectedLabel || (!isReadOnly ? t("form.select.placeholder") : "")}</span>
          <div className="flex items-center flex-shrink-0 ml-2">
            {shouldShowClearButton && (
              <button
                type="button"
                onClick={handleClear}
                onKeyDown={(e) => handleKeyboardActivation(e, () => handleClear(e as unknown as React.MouseEvent))}
                className={`mr-1 hover:text-gray-600 transition-opacity opacity-100 focus:outline-none focus:ring-2 focus:ring-dynamic-light rounded ${
                  isFocused || isOpen ? "text-(--color-baseline-100)" : "text-(--color-transparent-neutral-60)"
                }`}
                aria-label="Clear selection">
                <XIcon />
              </button>
            )}
            {!isReadOnly && <ChevronDown fill="currentColor" className={chevronClassNames} />}
          </div>
        </div>
      </div>
      {!isReadOnly && (
        <DropdownPortal
          isOpen={isOpen}
          viewportData={dropdownViewportData}
          searchTerm={searchTerm}
          searchInputRef={searchInputRef as React.RefObject<HTMLInputElement>}
          handleSetSearchTerm={handleSetSearchTerm}
          handleKeyDown={handleKeyDown}
          handleSearchBlur={handleSearchBlur}
          handleFocus={handleFocus}
          listRef={listRef as React.RefObject<HTMLUListElement>}
          handleScroll={handleScroll}
          renderedOptions={renderedOptions}
          dropdownId={dropdownId}
        />
      )}
    </>
  );
}

export const TreeSelector = memo(TreeSelectorCmp);
export default TreeSelector;
