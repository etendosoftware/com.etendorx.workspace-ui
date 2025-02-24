import { useCallback, useEffect, useMemo, useReducer } from 'react';
import {
  FormInitializationResponse,
  FormInitializationParams,
  FormMode,
} from '@workspaceui/etendohookbinder/src/api/types';
import { logger } from '@/utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import { getFieldsByColumnName, getFieldsByInputName } from '@workspaceui/etendohookbinder/src/utils/metadata';

const getRowId = (mode: FormMode, recordId?: string): string => {
  if (mode === FormMode.EDIT && !recordId) {
    throw new Error('Record ID is required in EDIT mode');
  }
  return mode === FormMode.EDIT ? recordId! : 'null';
};

const buildFormInitializationParams = (tabId: string, mode: FormMode, recordId?: string): URLSearchParams =>
  new URLSearchParams({
    MODE: mode,
    PARENT_ID: 'null',
    TAB_ID: tabId,
    ROW_ID: getRowId(mode, recordId),
    _action: 'org.openbravo.client.application.window.FormInitializationComponent',
  });

const fetchFormInitialization = async (params: URLSearchParams): Promise<FormInitializationResponse> => {
  try {
    const { data } = await Metadata.kernelClient.post(`?${params}`);
    return data;
  } catch (error) {
    logger.error('Error fetching initial form data:', error);
    throw new Error('Failed to fetch initial data');
  }
};

type State = {
  loading: boolean;
  error: Error | null;
  formInitialization: FormInitializationResponse | null;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: FormInitializationResponse }
  | { type: 'FETCH_ERROR'; payload: Error };

const initialState: State = {
  loading: false,
  error: null,
  formInitialization: null,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { loading: false, error: null, formInitialization: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export function useDynamicForm({ tab, mode, recordId }: FormInitializationParams) {
  const { record } = useSingleDatasource(tab.entityName, recordId);
  const [state, dispatch] = useReducer(reducer, initialState);
  const fieldsByColumnName = useMemo(() => getFieldsByColumnName(tab), [tab]);
  const fieldsByInputName = useMemo(() => getFieldsByInputName(tab), [tab]);

  const params = useMemo(
    () => (tab.id ? buildFormInitializationParams(tab.id, mode as FormMode, recordId) : null),
    [tab.id, mode, recordId],
  );

  const refetch = useCallback(async () => {
    if (!params) return;

    dispatch({ type: 'FETCH_START' });

    try {
      const data = await fetchFormInitialization(params);
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err : new Error('Unknown error') });
    }
  }, [params]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, record, refetch, fieldsByColumnName, fieldsByInputName };
}
