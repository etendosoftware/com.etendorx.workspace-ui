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

        const baseUrl = `http://localhost:8080/etendo/SalesOrder/Header_Edition.html`;

        const urlParams = new URLSearchParams();
        urlParams.append('Command', `BUTTONDocAction104`);
        urlParams.append('inpcOrderId', recordId || '');
        urlParams.append('keyProperty', 'id');
        urlParams.append('inpKeyName', 'inpcOrderId');
        urlParams.append('keyColumnName', 'C_Order_ID');
        urlParams.append('keyPropertyType', '_id_13');
        urlParams.append('inpProcessId', '104');
        urlParams.append('_UTCOffsetMiliseconds', (new Date().getTimezoneOffset() * -60000).toString());
        urlParams.append('inpdocaction', 'CO');
        if (tab?.id) urlParams.append('inpTabId', tab.id.toString());
        if (tab?.windowId) urlParams.append('inpwindowId', tab.windowId.toString());
        if (tab?.table) urlParams.append('inpTableId', tab.table.toString());
        urlParams.append('inpkeyColumnId', 'C_Order_ID');
        urlParams.append('inpdocstatus', 'DR');
        urlParams.append('inpprocessing', 'N');
        urlParams.append('inpprocessed', 'N');
        urlParams.append('inpissotrx', 'Y');
        urlParams.append('inpposted', 'N');

        let formValues = {};
        try {
          if (getValues && typeof getValues === 'function') {
            const values = getValues();
            formValues = buildPayloadByInputName(values, fieldsByHqlName);
          }
        } catch (e) {
          logger.error('No se pudo obtener valores del formulario, usando datos del tab');
        }

        if (tab?.fields) {
          Object.entries(tab.fields).forEach(([_, field]) => {
            if (field && 'columnName' in field && field.columnName) {
              const paramName = `inp${field.columnName.toLowerCase()}`;

              const fieldKey = field.inputName || paramName;
              if (formValues[fieldKey] !== undefined && formValues[fieldKey] !== null) {
                urlParams.append(
                  paramName,
                  typeof formValues[fieldKey] === 'object'
                    ? 'id' in formValues[fieldKey] && formValues[fieldKey].id
                      ? formValues[fieldKey].id.toString()
                      : JSON.stringify(formValues[fieldKey])
                    : formValues[fieldKey].toString(),
                );
              } else if ('defaultValue' in field && field.defaultValue) {
                urlParams.append(paramName, field.defaultValue.toString());
              } else {
                urlParams.append(paramName, 'undefined');
              }
            }
          });
        }

        // Asegurar que los parámetros clave estén presentes
        if (!urlParams.has('inpadClientId')) urlParams.append('inpadClientId', '23C59575B9CF467C9620760EB255B389');
        if (!urlParams.has('inpadOrgId')) urlParams.append('inpadOrgId', '7BABA5FF80494CAFA54DEBD22EC46F01');

        try {
          // Primera solicitud - con parámetros correctos
          const firstUrl = `${baseUrl}?IsPopUpCall=1`;
          logger.info('Iniciando primera solicitud POST a', firstUrl);

          // Ejecutamos la primera solicitud y esperamos a que se complete
          const firstResponse = await fetch(firstUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: token ? `Bearer ${token}` : `Basic ${btoa('admin:admin')}`,
            },
            body: urlParams.toString(),
            credentials: 'include',
          });

          // Consumimos completamente la respuesta
          const firstResponseText = await firstResponse.text();
          logger.info('Primera solicitud completada. Status:', firstResponse.status);

          await new Promise(resolve => setTimeout(resolve, 800));

          const cookies = firstResponse.headers.get('Set-Cookie');
          logger.info('Cookies obtenidas:', cookies ? 'Sí' : 'No');

          const secondUrl = `${baseUrl}?Command=BUTTON104`;
          logger.info('Iniciando segunda solicitud GET a', secondUrl);

          const secondResponse = await fetch(secondUrl, {
            method: 'GET',
            headers: {
              Accept: 'text/html,application/xhtml+xml,application/xml',
              Authorization: token ? `Bearer ${token}` : `Basic ${btoa('admin:admin')}`,
              ...(cookies ? { Cookie: cookies } : {}),
              Referer: firstUrl,
            },
            credentials: 'include',
          });

          const html = await secondResponse.text();
          logger.info('Segunda solicitud completada. Status:', secondResponse.status);

          const windowFeatures =
            'width=600,height=600,left=100,top=100,resizable=yes,scrollbars=yes,status=yes,menubar=no,toolbar=no,location=no';
          const popupWindow = window.open('', '_blank', windowFeatures);

          if (popupWindow) {
            popupWindow.document.open();
            popupWindow.document.write(html);
            popupWindow.document.close();
            logger.info('Ventana emergente abierta y contenido escrito');
          } else {
            throw new Error('No se pudo abrir la nueva ventana (pop-up bloqueado)');
          }

          return {
            success: true,
            message: 'Se ha abierto una ventana emergente con el proceso de Etendo.',
            popupOpened: true,
          };
        } catch (fetchError) {
          logger.error('Error al realizar la solicitud:', fetchError);
          throw fetchError;
        }
      } catch (error) {
        console.error('useProcessExecution - Error details:', error);
        const processError = error instanceof Error ? error : new Error('Process execution failed');
        setError(processError);
        throw processError;
      } finally {
        setLoading(false);
      }
    },
    [tab, recordId, token, fieldsByHqlName, getValues],
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
