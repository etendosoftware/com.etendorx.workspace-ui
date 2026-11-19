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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { type RefObject, useCallback, useEffect, useRef } from "react";
import { isGridViewportUnfilled } from "@/components/Table/utils/viewportFill";

interface UseFillGridViewportParams {
  /** Scrollable container of the grid. */
  containerRef: RefObject<HTMLElement | null>;
  /** Number of rows loaded, so the check runs again once a page is rendered. */
  recordCount: number;
  loading: boolean;
  hasMoreRecords: boolean;
  /** Set when the last load failed: the grid does not retry by itself. */
  error?: unknown;
  /** Requests the next page. */
  fetchMore: () => void;
}

/**
 * Keeps requesting pages while the loaded rows do not fill the height of the grid.
 *
 * The grid asks for its next page when it is scrolled to the bottom. With a small page size (the
 * `dataPageSize` preference) on a tall screen, the first page leaves no scroll bar and the rest of the
 * records could never be reached. Like the classic grid, which loads the rows its visible area needs, this
 * requests the next page after each load, and when the grid is resized, until a scroll bar appears or there
 * are no more records.
 *
 * Only one request is in flight at a time (two `fetchMore` calls would skip a page). A failed load is not
 * retried, and neither is a load that added no rows (a search replaces the rows instead of adding them), until
 * the number of rows changes: an error or a stalled query never turns into a chain of requests.
 */
export function useFillGridViewport({
  containerRef,
  recordCount,
  loading,
  hasMoreRecords,
  error,
  fetchMore,
}: UseFillGridViewportParams): void {
  const isRequestPendingRef = useRef(false);
  const wasLoadingRef = useRef(loading);
  const recordCountRef = useRef(recordCount);
  recordCountRef.current = recordCount;
  /** Rows when the pending request was sent. */
  const requestedAtCountRef = useRef<number | null>(null);
  /** Rows after a request that added none: no more requests until the number of rows changes. */
  const stalledAtCountRef = useRef<number | null>(null);

  // A request is over once its load finishes; the render right after fetchMore (still not loading) is not.
  useEffect(() => {
    if (wasLoadingRef.current && !loading && isRequestPendingRef.current) {
      isRequestPendingRef.current = false;
      if (recordCountRef.current <= (requestedAtCountRef.current ?? 0)) {
        stalledAtCountRef.current = recordCountRef.current;
      }
    }
    wasLoadingRef.current = loading;
  }, [loading]);

  const fillViewport = useCallback(() => {
    const container = containerRef.current;
    const isStalled = stalledAtCountRef.current === recordCount;
    if (!container || loading || !hasMoreRecords || error || isRequestPendingRef.current || isStalled) {
      return;
    }
    if (!isGridViewportUnfilled(container)) {
      return;
    }
    isRequestPendingRef.current = true;
    requestedAtCountRef.current = recordCount;
    fetchMore();
  }, [containerRef, loading, hasMoreRecords, error, fetchMore, recordCount]);

  // After each render of new rows (fillViewport changes with recordCount): effects run once the DOM holds
  // them, so the heights are up to date.
  useEffect(() => {
    fillViewport();
  }, [fillViewport]);

  // A taller grid (split view resized, window maximized) can leave room for more rows.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => fillViewport());
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, fillViewport]);
}
