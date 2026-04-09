import { useEffect, useState } from "react";
import type { MRT_ColumnFiltersState } from "material-react-table";
import type { Field, SelectorColumn } from "@workspaceui/api-client/src/api/types";
import type { TranslateFunction } from "@/hooks/types";
import {
  fetchSelectorDefaultFilters,
  buildCriteriaFromDefaults,
  type SelectorCriteria,
  type DefaultFilterResponse,
} from "@/utils/form/selectors/defaultFilters";
import { preloadFiltersFromCriteria } from "@/utils/form/selectors/selectorColumns";
import { logger } from "@/utils/logger";
import { buildSelectorDefaultContext } from "@/utils/form/selectors/utils";

interface UseSelectorDefaultCriteriaParams {
  field: Field;
  isOpen: boolean;
  currentTab: { id: string; window: string; table?: string; fields: Record<string, any> } | null;
  getValues: () => Record<string, unknown>;
  session: Record<string, unknown> | null;
  t: TranslateFunction;
  setColumnFilters: React.Dispatch<React.SetStateAction<MRT_ColumnFiltersState>>;
}

interface UseSelectorDefaultCriteriaReturn {
  defaultCriteria: SelectorCriteria[] | null;
  defaultFilterResponse: DefaultFilterResponse | null;
  selectorDefinitionId: string | undefined;
}

export function useSelectorDefaultCriteria({
  field,
  isOpen,
  currentTab,
  getValues,
  session,
  t,
  setColumnFilters,
}: UseSelectorDefaultCriteriaParams): UseSelectorDefaultCriteriaReturn {
  const [defaultCriteria, setDefaultCriteria] = useState<SelectorCriteria[] | null>(null);
  const [defaultFilterResponse, setDefaultFilterResponse] = useState<DefaultFilterResponse | null>(null);
  const selectorDefinitionId = field.selector?._selectorDefinitionId as string | undefined;

  useEffect(() => {
    if (!isOpen || !selectorDefinitionId) {
      setDefaultCriteria(selectorDefinitionId ? null : []);
      return;
    }

    let cancelled = false;

    const fetchDefaults = async () => {
      try {
        const context = buildSelectorDefaultContext(getValues(), currentTab, session);
        const response = await fetchSelectorDefaultFilters(selectorDefinitionId, context);

        if (!cancelled) {
          const criteria = buildCriteriaFromDefaults(response, selectorDefinitionId);
          setDefaultFilterResponse(response);
          setDefaultCriteria(criteria);
          const cols = (field.selector?.gridColumns as SelectorColumn[]) || [];
          const preloaded = preloadFiltersFromCriteria(criteria, cols, response, t);
          if (preloaded.length > 0) {
            setColumnFilters((prev) => {
              const existingIds = new Set(prev.map((f) => f.id));
              const newFilters = preloaded.filter((f) => !existingIds.has(f.id));
              return newFilters.length > 0 ? [...prev, ...newFilters] : prev;
            });
          }
        }
      } catch (err) {
        logger.warn("Failed to fetch selector default filters", err);
        if (!cancelled) {
          setDefaultCriteria([]);
        }
      }
    };

    fetchDefaults();

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectorDefinitionId, currentTab, getValues, session, field.selector?.gridColumns, t, setColumnFilters]);

  return { defaultCriteria, defaultFilterResponse, selectorDefinitionId };
}
