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

import { useEffect, useRef } from "react";
import type { MRT_ColumnFiltersState, MRT_SortingState, MRT_VisibilityState } from "material-react-table";
import { logger } from "@/utils/logger";
import { parseGridConfiguration, rawRecordToSavedView } from "@/utils/savedViews/transform";
import type { RawSavedViewRecord } from "@/utils/savedViews/types";
import { useUserContext } from "@/hooks/useUserContext";

const SAVED_VIEWS_URL = "/api/meta/saved-views";

interface ApplyViewState {
  filters: MRT_ColumnFiltersState;
  visibility: MRT_VisibilityState;
  sorting: MRT_SortingState;
  order: string[];
  implicitFilterApplied: boolean;
}

interface UseAutoApplyDefaultViewParams {
  tabId: string;
  windowIdentifier: string;
  onApplyView: (state: ApplyViewState) => void;
}

/**
 * Fetches the default saved view for a tab and applies it automatically,
 * once per window open session (keyed by windowIdentifier + tabId).
 */
export function useAutoApplyDefaultView({ tabId, windowIdentifier, onApplyView }: UseAutoApplyDefaultViewParams): void {
  const { token } = useUserContext();
  const appliedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!tabId || !windowIdentifier || !token) return;

    const key = `${windowIdentifier}_${tabId}`;
    if (appliedRef.current.has(key)) return;

    let cancelled = false;

    async function fetchAndApply() {
      try {
        const url = `${SAVED_VIEWS_URL}?tab=${encodeURIComponent(tabId)}&isdefault=true`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          logger.warn("[useAutoApplyDefaultView] Failed to fetch default view for tab:", tabId, res.status);
          return;
        }

        const json = (await res.json()) as { response?: { status?: number; data?: unknown[] } };

        if (cancelled) return;

        if (json?.response?.status !== 0) {
          logger.warn("[useAutoApplyDefaultView] Non-zero status fetching default view for tab:", tabId);
          return;
        }

        const records = (json.response?.data ?? []) as RawSavedViewRecord[];
        if (records.length === 0) return;

        const sv = rawRecordToSavedView(records[0]);
        const config = parseGridConfiguration(sv.gridConfiguration);

        if (!config) {
          logger.warn("[useAutoApplyDefaultView] Default view has no parseable config:", sv.name);
          return;
        }

        appliedRef.current.add(key);
        onApplyView({
          filters: config.filters,
          visibility: config.visibility,
          sorting: config.sorting,
          order: config.order,
          implicitFilterApplied: config.implicitFilterApplied,
        });
      } catch (err) {
        logger.error("[useAutoApplyDefaultView] Failed to fetch default view:", err);
      }
    }

    fetchAndApply();

    return () => {
      cancelled = true;
    };
  }, [tabId, windowIdentifier, token, onApplyView]);
}
