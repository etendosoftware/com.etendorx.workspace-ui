import { useState, useContext, useCallback, useMemo } from 'react';
import { UserContext } from '../../contexts/user';
import { ProcessResponse } from '../../components/Toolbar/types';
import { ExecuteProcessActionParams, ExecuteProcessDefinitionParams, ExecuteProcessParams } from './types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { ProcessButtonType } from '@/components/ProcessModal/types';
import { buildPayloadByInputName } from '@/utils';
import { useFormContext } from 'react-hook-form';
import { useMetadataContext } from '../useMetadataContext';
import { useParams } from 'next/navigation';
import { logger } from '@/utils/logger';

export function useProcessExecution() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { token } = useContext(UserContext);
  const { tab } = useMetadataContext();
  const formContext = useFormContext();
  const getValues = formContext?.getValues;
  const { recordId } = useParams<{ recordId: string }>();
  const fieldsByHqlName = useMemo(() => tab?.fields || {}, [tab?.fields]);

  const executeProcessDefinition = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessDefinitionParams): Promise<ProcessResponse> => {
      try {
        setLoading(true);
        setError(null);
        const queryParams = new URLSearchParams({
          processId: button.processDefinition.id,
        });

        const processParams: Record<string, unknown> = {};
        button.processInfo.parameters?.forEach(param => {
          if (params[param.id]) {
            processParams[param.id] = params[param.id];
          }
        });

        const payload = {
          recordIds: [recordId],
          _buttonValue: button.buttonText,
          _params: processParams,
          _entityName: button.processInfo?._entityName || '',
        };

        const { ok, data, status } = await Metadata.kernelClient.post(`?${queryParams}`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!ok) {
          throw new Error(`HTTP error! status: ${status}`);
        }

        if (data.response?.status === -1) {
          throw new Error(data.response.error?.message || 'Unknown server error');
        }

        return data;
      } catch (error) {
        console.error('useProcessExecution - Error details:', error);
        const processError = error instanceof Error ? error : new Error('Process execution failed');
        setError(processError);
        throw processError;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const executeProcessAction = useCallback(
    async ({ button }: ExecuteProcessActionParams): Promise<ProcessResponse> => {
      try {
        setLoading(true);
        setError(null);

        // URL base para las peticiones
        const baseUrl = `http://localhost:8080/etendo/SalesOrder/Header_Edition.html`;

        // Configuración de la ventana emergente
        const windowFeatures =
          'width=600,height=600,left=100,top=100,resizable=yes,scrollbars=yes,status=yes,menubar=no,toolbar=no,location=no';

        // Crear todos los parámetros necesarios
        const params = new URLSearchParams();

        // Parámetros básicos
        params.append('IsPopUpCall', '1');
        params.append('Command', 'BUTTONDocAction104');
        params.append('inpcOrderId', recordId || '');
        params.append('inpKey', recordId || '');
        params.append('inpdocstatus', 'DR'); // Parámetro requerido según el error
        params.append('inpprocessing', 'N');
        params.append('inpdocaction', 'CO'); // Acción "Book" (Completar)
        params.append('inpwindowId', tab?.windowId?.toString() || '143');
        params.append('inpTabId', tab?.id?.toString() || '186');
        params.append('inpTableId', tab?.table?.toString() || '259');
        params.append('inpadClientId', '23C59575B9CF467C9620760EB255B389');
        params.append('inpadOrgId', '7BABA5FF80494CAFA54DEBD22EC46F01');
        params.append('inpkeyColumnId', 'C_Order_ID');
        params.append('keyColumnName', 'C_Order_ID');
        params.append('inpKeyName', 'inpcOrderId');
        params.append('keyProperty', 'id');
        params.append('_UTCOffsetMiliseconds', (new Date().getTimezoneOffset() * -60000).toString());

        // Construir la URL completa con todos los parámetros
        const completeUrl = `${baseUrl}?${params.toString()}`;

        // Abrir directamente en el navegador, dejando que la aplicación web maneje todo el flujo
        window.open(completeUrl, '_blank', windowFeatures);

        return {
          success: true,
          message: 'Se ha abierto una ventana emergente con el proceso de Etendo.',
          popupOpened: true,
        };
      } catch (error) {
        console.error('useProcessExecution - Error details:', error);
        const processError = error instanceof Error ? error : new Error('Process execution failed');
        setError(processError);
        throw processError;
      } finally {
        setLoading(false);
      }
    },
    [tab, recordId],
  );

  const executeProcess = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessParams): Promise<ProcessResponse> => {
      if (!token) {
        logger.warn('No se encontró token de autenticación, se usará autenticación básica');
      }

      if (ProcessButtonType.PROCESS_ACTION in button) {
        logger.info('Ejecutando acción de proceso', button);
        return executeProcessAction({ button, recordId, params });
      } else if (ProcessButtonType.PROCESS_DEFINITION in button) {
        logger.info('Ejecutando definición de proceso', button);
        return executeProcessDefinition({ button, recordId, params });
      } else {
        throw new Error('Tipo de proceso no soportado');
      }
    },
    [executeProcessAction, executeProcessDefinition, token],
  );

  return {
    executeProcess,
    loading,
    error,
  };
}
