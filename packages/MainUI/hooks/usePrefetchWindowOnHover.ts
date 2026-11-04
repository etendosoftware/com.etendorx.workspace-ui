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
import { useCallback, useEffect, useRef } from "react";
import { useMetadataZustandStore } from "@/stores/metadataStore";
import { isExternalPageWindowId } from "@/utils/menu/externalMenuEntry";

/** Same delay the sidebar menu uses, so brushing past an item does not fire a request. */
const PREFETCH_HOVER_DELAY_MS = 150;

/**
 * Loads a window's metadata when the pointer rests on (or focus lands on) an item that opens it,
 * so the click finds it already in the store instead of waiting for the download.
 */
export function usePrefetchWindowOnHover() {
  const prefetchWindowData = useMetadataZustandStore((s) => s.prefetchWindowData);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefetchOnHover = useCallback(
    (windowId?: string | null) => {
      if (!windowId || isExternalPageWindowId(windowId)) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => prefetchWindowData(windowId), PREFETCH_HOVER_DELAY_MS);
    },
    [prefetchWindowData]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return prefetchOnHover;
}
