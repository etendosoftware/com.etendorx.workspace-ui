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
        alert('execute process definition');
        setLoading(true);
        setError(null);
        const queryParams = new URLSearchParams({
          // _action: button.processDefinition.id,
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

        const entityName = button.processInfo?._entityName || tab?.entityName || 'SalesOrder';
        const baseUrl = `http://localhost:8080/etendo/SalesOrder/Header_Edition.html?IsPopUpCall=1`;

        logger.debug(button);

        const urlParams = new URLSearchParams();
        urlParams.append('IsPopUpCall', '1');
        urlParams.append('Command', `BUTTON`);
        urlParams.append('inpcOrderId', recordId);
        urlParams.append('_buttonValue', button.buttonText);
        urlParams.append('_entityName', entityName);
        urlParams.append('keyProperty', 'id');

        const fieldValues = buildPayloadByInputName(getValues(), fieldsByHqlName);
        Object.entries(fieldValues).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            urlParams.append(
              key,
              typeof value === 'object' ? ("id" in value && value.id ? value.id.toString() : JSON.stringify(value)) : value.toString(),
            );
          }
        });

        const popupName = 'etendoPopup' + new Date().getTime();
        const windowFeatures =
          'width=800,height=800,left=100,top=100,resizable=yes,scrollbars=yes,status=yes,menubar=no,toolbar=no,location=no';
        const popupWindow = window.open('', popupName, windowFeatures);

        if (!popupWindow) {
          throw new Error(
            'El navegador ha bloqueado la ventana emergente. Por favor, permite ventanas emergentes para este sitio.',
          );
        }

        popupWindow.document.write(`
          <html>
            <head>
              <title>Cargando...</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
                .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; margin: 20px auto; animation: spin 2s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              </style>
            </head>
            <body>
              <h2>Cargando el proceso de Etendo...</h2>
              <div class="spinner"></div>
              <p>Por favor espere...</p>
            </body>
          </html>
        `);

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${token}`,
          },
          body: urlParams,
          redirect: 'manual',
        });

        if (response.status === 302) {
          const redirectUrl = response.headers.get('Location');
          if (redirectUrl) {
            popupWindow.location.href = redirectUrl;
            return {
              success: true,
              message: 'Se ha abierto una ventana emergente con el proceso de Etendo.',
              popupOpened: true,
              redirected: true,
              redirectUrl,
            };
          }
        }

        const htmlResponse = await response.text();

        if (htmlResponse.includes('<FRAMESET') || htmlResponse.includes('<frameset')) {
          const frameUrlMatch =
            htmlResponse.match(/src="([^"]+)"[^>]*name="mainframe"/i) ||
            htmlResponse.match(/name="mainframe"[^>]*src="([^"]+)"/i);

          if (frameUrlMatch && frameUrlMatch[1]) {
            const frameUrl = frameUrlMatch[1];
            popupWindow.location.href = frameUrl;
            return {
              success: true,
              message: 'Se ha abierto una ventana emergente con el proceso de Etendo.',
              popupOpened: true,
              frameUrl,
            };
          }
        }

        popupWindow.document.open();
        popupWindow.document.write(htmlResponse);
        popupWindow.document.close();

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
    [fieldsByHqlName, getValues, tab, recordId, token],
  );

  const executeProcess = useCallback(
    async ({ button, recordId, params = {} }: ExecuteProcessParams): Promise<ProcessResponse> => {
      if (!token) {
        throw new Error('No authentication token available');
      }

      if (ProcessButtonType.PROCESS_ACTION in button) {
        logger.error('process action', button);

        return executeProcessAction({ button, recordId, params });
      } else if (ProcessButtonType.PROCESS_DEFINITION in button) {
        logger.error('process definition', button);

        return executeProcessDefinition({ button, recordId, params });
      } else {
        throw new Error('Unsupported process type');
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
