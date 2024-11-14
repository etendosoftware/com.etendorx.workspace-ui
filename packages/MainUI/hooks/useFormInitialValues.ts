import { useCallback, useEffect, useState } from 'react';
import { getFormInitialization } from '@workspaceui/etendohookbinder/src/hooks/useInitialData';

interface FormInitializationResponse {
  columnValues: Record<
    string,
    {
      value: any;
      classicValue?: string;
      identifier?: string;
      entries?: Array<{ id: string; _identifier: string }>;
    }
  >;
  auxiliaryInputValues: Record<string, { value: string; classicValue?: string }>;
  sessionAttributes: Record<string, string>;
  dynamicCols: string[];
  attachmentExists: boolean;
}

export function useFormInitialization(tabId: string) {
  const [initialData, setInitialData] = useState<FormInitializationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!tabId) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        MODE: 'NEW',
        PARENT_ID: 'null',
        TAB_ID: tabId,
        ROW_ID: 'null',
        _action: 'org.openbravo.client.application.window.FormInitializationComponent',
      };

      const response = await getFormInitialization(params);

      setInitialData(response);
    } catch (error) {
      console.error('Error fetching initial form data:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch initial data'));
    } finally {
      setLoading(false);
    }
  }, [tabId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return {
    initialData,
    loading,
    error,
    refetch: fetchInitialData,
  };
}
