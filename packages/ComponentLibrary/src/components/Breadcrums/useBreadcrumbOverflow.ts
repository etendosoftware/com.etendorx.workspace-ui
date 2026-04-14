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

import { type RefObject, useLayoutEffect, useMemo, useState } from "react";
import type { BreadcrumbItem } from "./types";

interface VisibleItemWithIndex {
  item: BreadcrumbItem;
  originalIndex: number;
}

interface UseBreadcrumbOverflowParams {
  containerRef: RefObject<HTMLElement | null>;
  items: BreadcrumbItem[];
}

interface UseBreadcrumbOverflowResult {
  visibleItemsWithIndex: VisibleItemWithIndex[];
  collapsedItems: BreadcrumbItem[];
  isCollapsed: boolean;
}

export function useBreadcrumbOverflow({
  containerRef,
  items,
}: UseBreadcrumbOverflowParams): UseBreadcrumbOverflowResult {
  const [collapsedCount, setCollapsedCount] = useState(0);

  useLayoutEffect(() => {
    // Reset stale collapse state whenever items change
    setCollapsedCount(0);

    // Never collapse when 2 or fewer items — first and last are always visible
    if (items.length <= 2) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      // In JSDOM both values are 0, so 0 <= 0 → never overflows (correct for tests)
      const maxCollapsible = Math.max(0, items.length - 2);
      if (container.scrollWidth > container.clientWidth) {
        // Collapse all middle items at once — single synchronous decision
        setCollapsedCount(maxCollapsible);
      } else {
        setCollapsedCount(0);
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [containerRef, items]);

  const isCollapsed = collapsedCount > 0;

  const { visibleItemsWithIndex, collapsedItems } = useMemo<{
    visibleItemsWithIndex: VisibleItemWithIndex[];
    collapsedItems: BreadcrumbItem[];
  }>(() => {
    if (!isCollapsed || items.length <= 2) {
      return {
        visibleItemsWithIndex: items.map((item, i) => ({ item, originalIndex: i })),
        collapsedItems: [],
      };
    }

    // collapsedItems = indices 1 to collapsedCount (middle items hidden)
    const hidden = items.slice(1, collapsedCount + 1);

    // visibleItems = [first, ...remaining middles, last]
    const visibleSlice: BreadcrumbItem[] = [
      items[0],
      ...items.slice(collapsedCount + 1, items.length - 1),
      items[items.length - 1],
    ];

    // Build an index map so originalIndex is always accurate (no indexOf)
    const indexMap = new Map<BreadcrumbItem, number>(items.map((item, i) => [item, i]));

    return {
      visibleItemsWithIndex: visibleSlice.map((item) => ({
        item,
        originalIndex: indexMap.get(item) ?? 0,
      })),
      collapsedItems: hidden,
    };
  }, [isCollapsed, collapsedCount, items]);

  return { visibleItemsWithIndex, collapsedItems, isCollapsed };
}
