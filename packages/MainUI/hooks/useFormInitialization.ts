import { useTabContext } from "@/contexts/tab";
import { logger } from "@/utils/logger";
import type { ClientOptions } from "@workspaceui/etendohookbinder/src/api/client";
import { Metadata } from "@workspaceui/etendohookbinder/src/api/metadata";
import {
  type FormInitializationParams,
  type FormInitializationResponse,
  FormMode,
  type Tab,
} from "@workspaceui/etendohookbinder/src/api/types";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { FieldName } from "./types";
import useFormParent from "./useFormParent";
import { useUserContext } from "./useUserContext";

const getRowId = (mode: FormMode, recordId?: string | null): string => {
  return mode === FormMode.EDIT ? (recordId ?? "null") : "null";
};

export const buildFormInitializationParams = ({
  mode,
  tab,
  recordId,
  parentId,
}: {
  tab: Tab;
  mode: FormMode;
  recordId?: string | null;
  parentId?: string | null;
}): URLSearchParams =>
  new URLSearchParams({
    MODE: mode,
    PARENT_ID: parentId ?? "null",
    TAB_ID: tab.id,
    ROW_ID: getRowId(mode, recordId),
    _action: "org.openbravo.client.application.window.FormInitializationComponent",
  });

const fetchFormInitialization = async (
  params: URLSearchParams,
  payload: ClientOptions["body"],
): Promise<FormInitializationResponse> => {
  try {
    const { data } = await Metadata.kernelClient.post(`?${params}`, payload);

    return data;
  } catch (error) {
    logger.warn("Error fetching initial form data:", error);
    throw new Error("Failed to fetch initial data");
  }
};

type State =
  | {
      loading: true;
      error: null;
      formInitialization: null;
    }
  | {
      loading: false;
      error: null;
      formInitialization: FormInitializationResponse;
    }
  | {
      loading: false;
      error: Error;
      formInitialization: FormInitializationResponse | null;
    };

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: FormInitializationResponse }
  | { type: "FETCH_ERROR"; payload: Error };

const initialState: State = {
  loading: true,
  error: null,
  formInitialization: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "FETCH_START":
      return { loading: true, error: null, formInitialization: null };
    case "FETCH_SUCCESS":
      return { loading: false, error: null, formInitialization: action.payload };
    case "FETCH_ERROR":
      return { loading: false, error: action.payload, formInitialization: state.formInitialization };
    default:
      return state;
  }
};

export type useFormInitialization = State & {
  refetch: () => Promise<void>;
};

export function useFormInitialization({ tab, mode, recordId }: FormInitializationParams): useFormInitialization {
  const { setSession } = useUserContext();
  const { parentRecord: parent } = useTabContext();
  const [state, dispatch] = useReducer<React.Reducer<State, Action>>(reducer, initialState);
  const loaded = !!state.formInitialization;
  const { error, formInitialization, loading } = state;
  const parentData = useFormParent(FieldName.HQL_NAME);
  const parentId = parent?.id?.toString();
  const params = useMemo(
    () => (tab ? buildFormInitializationParams({ tab, mode, recordId, parentId }) : null),
    [tab, mode, recordId, parentId],
  );

  const refetch = useCallback(async () => {
    if (!params) return;

    dispatch({ type: "FETCH_START" });

    try {
      const entityKeyColumn = Object.values(tab.fields).find((field) => field.column.keyColumn);

      if (!entityKeyColumn) {
        throw new Error("Missing key column");
      }

      const payload = {
        ...parentData,
        inpKeyName: entityKeyColumn.inputName,
        inpTabId: tab.id,
        inpTableId: tab.table,
        inpkeyColumnId: entityKeyColumn.columnName,
        keyColumnName: entityKeyColumn.columnName,
        _entityName: tab.entityName,
        inpwindowId: tab.window,
      };

      const data = await fetchFormInitialization(params, payload);
      const storedInSessionAttributes = Object.entries(data.auxiliaryInputValues).reduce(
        (acc, [key, { value }]) => {
          acc[key] = value || "";

          return acc;
        },
        {} as Record<string, string>,
      );

      setSession((prev) => ({ ...prev, ...storedInSessionAttributes, ...data.sessionAttributes }));
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (err) {
      logger.warn(err);
      dispatch({ type: "FETCH_ERROR", payload: err instanceof Error ? err : new Error("Unknown error") });
    }
  }, [params, parentData, setSession, tab.entityName, tab.fields, tab.id, tab.table, tab.window]);

  useEffect(() => {
    if (!loaded) {
      refetch();
    }
  }, [loaded, refetch]);

  return useMemo(
    () => ({ error, formInitialization, loading, refetch }) as useFormInitialization,
    [error, formInitialization, loading, refetch],
  );
}
