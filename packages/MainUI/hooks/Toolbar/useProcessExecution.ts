import { useState, useCallback, useMemo } from 'react';
import { ProcessResponse } from '../../components/Toolbar/types';
import { ExecuteProcessParams } from './types';
import { ProcessButton, ProcessButtonType } from '@/components/ProcessModal/types';
import { useMetadataContext } from '../useMetadataContext';
import { useParams } from 'next/navigation';

export function useProcessExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { tab, selected } = useMetadataContext();
  const { recordId } = useParams<{ recordId: string }>();

  const currentRecord = useMemo(() => {
    const tabLevel = tab?.level ?? 0;
    return selected[tabLevel] || null;
  }, [tab?.level, selected]);

  const executeProcessAction = useCallback(async (_button: ProcessButton): Promise<ProcessResponse> => {
    return new Promise((resolve, reject) => {
      try {
        setLoading(true);
        setError(null);
        resolve({
          success: false,
          showDeprecatedFeatureModal: true,
          message: 'This feature is not available yet. We are sorry for the troubles.',
        });
      } catch (error) {
        const processError = error instanceof Error ? error : new Error('Process execution failed');
        setError(processError);
        reject(processError);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const executeProcess = useCallback(
    async ({ button }: ExecuteProcessParams): Promise<ProcessResponse> => {
      if (ProcessButtonType.PROCESS_ACTION in button) {
        return executeProcessAction(button);
      } else {
        throw new Error('Unsupported process type');
      }
    },
    [executeProcessAction],
  );

  return {
    executeProcess,
    loading,
    error,
    currentRecord,
    recordsLoaded: !!currentRecord,
    recordsLoading: loading,
    recordData: currentRecord,
    recordId,
  };
}
