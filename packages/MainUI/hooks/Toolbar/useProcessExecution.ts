import { useState, useCallback, useMemo } from 'react';
import { ProcessResponse } from '../../components/Toolbar/types';
import { ExecuteProcessParams } from './types';
import { ProcessButton, ProcessButtonType } from '@/components/ProcessModal/types';
import { useMetadataContext } from '../useMetadataContext';
import { useParams } from 'next/navigation';
import { API_METADATA_URL } from '@workspaceui/etendohookbinder/src/api/constants';
import { useApiContext } from '../useApiContext';

export function useProcessExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [iframeUrl, setIframeUrl] = useState('');
  const { tab, selected, windowId } = useMetadataContext();
  const { recordId } = useParams<{ recordId: string }>();
  const apiUrl = useApiContext();

  const currentRecord = useMemo(() => {
    const tabLevel = tab?.level ?? 0;
    return selected[tabLevel] || null;
  }, [tab?.level, selected]);

  const executeProcessAction = useCallback(
    async (button: ProcessButton): Promise<ProcessResponse> => {
      return new Promise((resolve, reject) => {
        try {
          setLoading(true);
          setError(null);

          if (!currentRecord) {
            throw new Error('No se ha cargado el registro correctamente');
          }

          const extractValue = (keys: string[], defaultValue: string): string => {
            for (const key of keys) {
              const value = currentRecord[key];
              if (value !== undefined && value !== null && value !== '') {
                return String(value);
              }
            }
            return defaultValue;
          };

          const docStatus = extractValue(['documentStatus', 'docstatus', 'docStatus', 'DOCSTATUS', 'DocStatus'], 'DR');
          const isProcessing = extractValue(
            ['processing', 'isprocessing', 'isProcessing', 'PROCESSING', 'Processing'],
            'N',
          );
          const adClientId = extractValue(
            ['adClientId', 'AD_Client_ID', 'aD_Client_ID', 'adclientid', 'AdClientId', 'client'],
            '23C59575B9CF467C9620760EB255B389',
          );
          const adOrgId = extractValue(
            ['adOrgId', 'AD_Org_ID', 'aD_Org_ID', 'adorgid', 'AdOrgId', 'organization'],
            '7BABA5FF80494CAFA54DEBD22EC46F01',
          );

          const isPostedProcess = button.id === 'Posted';
          const commandAction = 'BUTTONDocAction104';
          const baseUrl = `${apiUrl}${API_METADATA_URL}SalesOrder/Header_Edition.html`;
          const safeWindowId = windowId || (tab?.windowId ? String(tab.windowId) : '143');
          const safeTabId = tab?.id ? String(tab.id) : '186';
          const safeRecordId = String(currentRecord.id || recordId || '');

          const params = new URLSearchParams();
          params.append('IsPopUpCall', '1');
          params.append('Command', commandAction);
          params.append('inpcOrderId', safeRecordId);
          params.append('inpKey', safeRecordId);

          if (isPostedProcess) {
            params.append('inpdocstatus', docStatus);
            params.append('inpprocessing', isProcessing);
            params.append('inpdocaction', 'P');
          } else {
            params.append('inpdocstatus', docStatus);
            params.append('inpprocessing', isProcessing);
            params.append('inpdocaction', 'CO');
          }

          params.append('inpwindowId', safeWindowId);
          params.append('inpTabId', safeTabId);
          params.append('inpadClientId', adClientId);
          params.append('inpadOrgId', adOrgId);
          params.append('inpkeyColumnId', 'C_Order_ID');
          params.append('keyColumnName', 'C_Order_ID');

          const completeUrl = `${baseUrl}?${params.toString()}`;
          setIframeUrl(completeUrl);

          resolve({
            success: true,
            showInIframe: true,
            iframeUrl: completeUrl,
          });
        } catch (error) {
          const processError = error instanceof Error ? error : new Error('Process execution failed');
          setError(processError);
          reject(processError);
        } finally {
          setLoading(false);
        }
      });
    },
    [currentRecord, apiUrl, windowId, tab?.windowId, tab?.id, recordId],
  );

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
    iframeUrl,
    resetIframeUrl: () => setIframeUrl(''),
    currentRecord,
    recordsLoaded: !!currentRecord,
    recordsLoading: loading,
    recordData: currentRecord,
    recordId,
  };
}
