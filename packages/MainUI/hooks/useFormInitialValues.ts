import { useCallback, useEffect, useState } from 'react';
import { getFormInitialization } from '@workspaceui/etendohookbinder/src/hooks/useInitialData';

export interface FormInitializationResponse {
  columnValues: Record<
    string,
    {
      value: string;
      classicValue?: string;
      identifier?: string;
      entries?: Array<{ id: string; _identifier: string }>;
    }
  >;
  auxiliaryInputValues: Record<string, { value: string; classicValue?: string }>;
  sessionAttributes: Record<string, string>;
  dynamicCols: string[];
  attachmentExists: boolean;
  _readOnly?: boolean;
}

interface FormInitializationParams {
  tabId: string;
  mode: 'NEW' | 'EDIT';
  recordId?: string;
}

export const isRecordReadOnly = (formData: FormInitializationResponse): boolean => {
  if (formData.columnValues.Processed?.value === 'true') {
    return true;
  }

  if (formData.columnValues.DocStatus?.value === 'CO') {
    return true;
  }

  return false;
};

export function useFormInitialization({ tabId, mode, recordId }: FormInitializationParams) {
  const [formData, setFormData] = useState<FormInitializationResponse | null>(null);
  const [loading, setLoading] = useState(!!tabId);
  const [error, setError] = useState<Error | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!tabId) return;

    try {
      setLoading(true);
      setError(null);

      const getRowId = (mode: 'NEW' | 'EDIT', recordId?: string): string => {
        if (mode === 'EDIT' && !recordId) {
          throw new Error('Record ID is required in EDIT mode');
        }
        return mode === 'EDIT' ? recordId! : 'null';
      };

      const params = {
        MODE: mode,
        PARENT_ID: 'null',
        TAB_ID: tabId,
        ROW_ID: getRowId(mode, recordId),
        _action: 'org.openbravo.client.application.window.FormInitializationComponent',
      };

      const response = await getFormInitialization(params);

      setFormData({ ...response, _readOnly: isRecordReadOnly(response) });
    } catch (error) {
      console.error('Error fetching initial form data:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch initial data'));
    } finally {
      setLoading(false);
    }
  }, [tabId, mode, recordId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    formData,
    loading,
    error,
    refetch: fetchInitialData,
  };
}
