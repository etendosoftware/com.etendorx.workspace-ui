import { useCallback, useMemo, useReducer } from "react";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { logger } from "@/utils/logger";
import { buildProcessPayload } from "@/utils";
import type { EntityValue, Tab } from "@workspaceui/api-client/src/api/types";
import type { ProcessDefaultsResponse } from "@/components/ProcessModal/types/ProcessParameterExtensions";
import { PROCESS_TYPES, WINDOW_SPECIFIC_KEYS } from "@/utils/processes/definition/constants";
import type { ProcessType } from "@/components/ProcessModal/types";

export interface ProcessInitializationParams {
  processId: string;
  windowId?: string;
  recordId?: string;
  enabled?: boolean;
  // Add record and tab for complete payload building
  record?: Record<string, unknown>;
  tab?: Tab;
  type: ProcessType;
}

const buildProcessInitializationParams = ({
  processId,
  windowId,
}: {
  processId: string;
  windowId?: string;
}): URLSearchParams => {
  const params = new URLSearchParams({
    processId,
    _action: "org.openbravo.client.application.process.DefaultsProcessActionHandler",
  });

  if (windowId) {
    params.append("windowId", windowId);
  }

  return params;
};

const fetchProcessInitialization = async (
  params: URLSearchParams,
  payload: Record<string, EntityValue>
): Promise<ProcessDefaultsResponse> => {
  try {
    const { data } = await Metadata.kernelClient.post(`?${params}`, payload);

    return {
      defaults: data?.defaults || data || {},
      filterExpressions: data?.filterExpressions || {},
      refreshParent: !!data?.refreshParent,
    };
  } catch (error) {
    logger.warn("Error fetching process initialization data:", error);
    throw new Error("Failed to fetch process defaults");
  }
};

type State =
  | {
      loading: true;
      error: null;
      processInitialization: null;
    }
  | {
      loading: false;
      error: null;
      processInitialization: ProcessDefaultsResponse;
    }
  | {
      loading: false;
      error: Error;
      processInitialization: ProcessDefaultsResponse | null;
    };

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: ProcessDefaultsResponse }
  | { type: "FETCH_ERROR"; payload: Error }
  | { type: "SKIP" };

const initialState: State = {
  loading: true,
  error: null,
  processInitialization: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "FETCH_START":
      return { loading: true, error: null, processInitialization: null };
    case "FETCH_SUCCESS":
      return { loading: false, error: null, processInitialization: action.payload };
    case "FETCH_ERROR":
      return { loading: false, error: action.payload, processInitialization: state.processInitialization };
    case "SKIP":
      return {
        loading: false,
        error: null,
        processInitialization: { defaults: {}, filterExpressions: {}, refreshParent: false },
      };
    default:
      return state;
  }
};

export type UseProcessInitialization = State & {
  refetch: (contextData?: Record<string, EntityValue>) => Promise<void>;
};

/**
 * Hook for fetching process default values using DefaultsProcessActionHandler
 * Adapts the FormInitialization pattern for ProcessModal usage
 */
export function useProcessInitialization({
  processId,
  windowId,
  recordId,
  enabled = true,
  record,
  tab,
  type,
}: ProcessInitializationParams): UseProcessInitialization {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { error, processInitialization, loading } = state;

  const params = useMemo(
    () => (processId && enabled ? buildProcessInitializationParams({ processId, windowId }) : null),
    [processId, windowId, enabled]
  );

  const fetch = useCallback(
    async (contextData: Record<string, EntityValue> = {}) => {
      if (!params || !enabled) return;

      try {
        let payload: Record<string, EntityValue>;

        if (record && tab) {
          const processPayload = buildProcessPayload(record, tab, {}, contextData);

          const windowConfig = windowId ? WINDOW_SPECIFIC_KEYS[windowId] : undefined;
          const extraKey = windowConfig ? { [windowConfig.key]: windowConfig.value(record) } : {};

          payload = {
            ...Object.fromEntries(
              Object.entries(processPayload).map(([key, value]) => [
                key,
                value === null ? null : String(value), // Convert to EntityValue compatible types
              ])
            ),
            ...extraKey,
            processId,
            windowId: windowId || "",
            recordId: recordId || "",
            _requestType: "defaults",
            _timestamp: Date.now().toString(),
          };
        } else {
          // Fallback to basic payload if record/tab not available
          payload = {
            ...contextData,
            processId,
            windowId: windowId || null,
            recordId: recordId || "",
            _requestType: "defaults",
            _timestamp: Date.now().toString(),
          };
        }

        logger.debug(`Fetching process defaults for process ${processId}`, {
          windowId,
          recordId,
          contextKeys: Object.keys(contextData),
          hasCompletePayload: !!(record && tab),
          payloadFieldsCount: Object.keys(payload).length,
        });

        const data = await fetchProcessInitialization(params, payload);

        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        logger.error(`Error fetching process defaults for ${processId}:`, err);
        dispatch({ type: "FETCH_ERROR", payload: err instanceof Error ? err : new Error("Unknown error") });
      }
    },
    [params, enabled, processId, windowId, recordId, record, tab]
  );

  const refetch = useCallback(
    async (contextData: Record<string, EntityValue> = {}) => {
      if (!params || !enabled) return;
      dispatch({ type: "FETCH_START" });
      await fetch(contextData);
    },
    [params, enabled, fetch]
  );

  // Auto-fetch on mount if enabled and type is process_definition
  // For other types, skip loading and set empty defaults
  useMemo(() => {
    if (type !== PROCESS_TYPES.PROCESS_DEFINITION) {
      dispatch({ type: "SKIP" });
      return;
    }
    if (enabled && params) {
      fetch();
    }
  }, [enabled, params, fetch, type]);

  return useMemo(
    () => ({ error, processInitialization, loading, refetch }) as UseProcessInitialization,
    [error, processInitialization, loading, refetch]
  );
}
