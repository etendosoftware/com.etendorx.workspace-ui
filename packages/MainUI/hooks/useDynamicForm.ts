import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  FormInitializationResponse,
  FormInitializationParams,
  FormMode,
  Tab,
} from '@workspaceui/etendohookbinder/src/api/types';
import { logger } from '@/utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useUserContext } from './useUserContext';
import { ClientOptions } from '@workspaceui/etendohookbinder/src/api/client';
import { useMetadataContext } from './useMetadataContext';
import { getFieldsByInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';

const getRowId = (mode: FormMode, recordId?: string): string => {
  if (mode === FormMode.EDIT && !recordId) {
    throw new Error('Record ID is required in EDIT mode');
  }
  return mode === FormMode.EDIT ? recordId! : 'null';
};

export const buildFormInitializationParams = (tab: Tab, mode: FormMode, recordId?: string): URLSearchParams =>
  new URLSearchParams({
    MODE: mode,
    PARENT_ID: 'null',
    TAB_ID: tab.id,
    ROW_ID: getRowId(mode, recordId),
    _action: 'org.openbravo.client.application.window.FormInitializationComponent',
  });

const fetchFormInitialization = async (
  params: URLSearchParams,
  payload: ClientOptions['body'],
): Promise<FormInitializationResponse> => {
  try {
    const { data } = await Metadata.kernelClient.post(`?${params}`, payload);

    return data;
  } catch (error) {
    logger.error('Error fetching initial form data:', error);
    throw new Error('Failed to fetch initial data');
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
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: FormInitializationResponse }
  | { type: 'FETCH_ERROR'; payload: Error };

const initialState: State = {
  loading: true,
  error: null,
  formInitialization: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { loading: true, error: null, formInitialization: null };
    case 'FETCH_SUCCESS':
      return { loading: false, error: null, formInitialization: action.payload };
    case 'FETCH_ERROR':
      return { loading: false, error: action.payload, formInitialization: state.formInitialization };
    default:
      return state;
  }
};

export type UseDynamicForm = State & {
  refetch: () => Promise<void>;
};

export function useDynamicForm({ tab, mode, recordId }: FormInitializationParams): UseDynamicForm {
  const { setSession } = useUserContext();
  const { selected, tabs } = useMetadataContext();
  const [state, dispatch] = useReducer<React.Reducer<State, Action>>(reducer, initialState);
  const { error, formInitialization, loading } = state;
  const params = useMemo(
    () => (tab ? buildFormInitializationParams(tab, mode, recordId) : null),
    [tab, mode, recordId],
  );

  const refetch = useCallback(async () => {
    if (!params) return;

    dispatch({ type: 'FETCH_START' });

    try {
      const entityKeyColumn = Object.values(tab.fields).find(field => field.column.keyColumn);

      if (!entityKeyColumn) {
        throw new Error('Missing key column');
      }

      console.debug(tab);

      const parentColumns = tab.parentColumns.map(field => tab.fields[field]);
      const parent = tab.level > 0 ? selected[tab.level - 1] : {};
      const parentTab = tabs[tab.level - 1];
      const parentFields = getFieldsByInputName(parentTab);

      const parentData = parentColumns.reduce(
        (acc, field) => {
          const parentFieldName = parentFields[field.inputName].hqlName;
          acc[field.inputName] = parent[parentFieldName];
          return acc;
        },
        {} as Record<string, unknown>,
      );
      const payload = {
        ...parentData,
        inpKeyName: entityKeyColumn.inputName,
        inpTabId: tab.id,
        inpTableId: tab.table,
        inpkeyColumnId: entityKeyColumn.columnName,
        keyColumnName: entityKeyColumn.columnName,
        _entityName: tab.entityName,
        inpwindowId: tab.windowId,
      };

      console.debug(payload);

      const data = await fetchFormInitialization(params, payload);
      const storedInSessionAttributes = Object.entries(data.auxiliaryInputValues).reduce(
        (acc, [key, { value }]) => {
          acc[key] = value;

          return acc;
        },
        {} as Record<string, string>,
      );
      setSession(prev => ({ ...prev, ...storedInSessionAttributes, ...data.sessionAttributes }));
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      logger.error(err);
      dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err : new Error('Unknown error') });
    }
  }, [params, tab, selected, tabs, setSession]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return useMemo(
    () => ({ error, formInitialization, loading, refetch }) as UseDynamicForm,
    [error, formInitialization, loading, refetch],
  );
}
