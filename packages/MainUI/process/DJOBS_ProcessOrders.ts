import { ProcessInfo } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { logger } from '@/utils/logger';

/**
 * Función que se ejecuta al cargar el proceso
 * @param process Información del proceso
 * @param context Contexto adicional (opcional)
 * @returns Objeto con las acciones disponibles
 */
export const onLoad = async (process: ProcessInfo, context?: any) => {
  try {
    const selectedRecords = context?.selectedRecords || [];
    const tabId = context?.tabId || '';

    const documentStatuses = [
      ...new Set(selectedRecords.map((record: any) => record.documentStatus || record.docstatus || record.docStatus)),
    ];

    const isProcessing = selectedRecords.some(
      (record: any) => (record.processing || record.isprocessing || 'N') === 'Y',
    )
      ? 'Y'
      : '';

    const queryParams = new URLSearchParams({
      _action: 'com.smf.jobs.defaults.ProcessOrdersDefaults',
    });

    const payload = {
      documentStatuses,
      isProcessing,
      tabId,
    };

    const { ok, data, status } = await Metadata.kernelClient.post(`?${queryParams}`, payload);

    if (!ok) {
      throw new Error(`HTTP error! status: ${status}`);
    }

    return {
      availableActions: data.actions || [],
      defaultAction: data.actions && data.actions.length > 0 ? data.actions[0] : null,
    };
  } catch (error) {
    logger.error('Error en DJOBS_ProcessOrders.onLoad:', error);
    return {
      availableActions: [],
      defaultAction: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Función que se ejecuta al procesar
 * @param process Información del proceso
 * @param params Parámetros del proceso
 * @returns Resultado del proceso
 */
export const onProcess = async (process: ProcessInfo, params: any) => {
  try {
    const recordIds = params.recordIds || [];
    const docAction = params.DocAction;
    const windowId = params.windowId || '';
    const entityName = params.entityName || 'Order';

    if (!recordIds.length || !docAction) {
      throw new Error('Faltan parámetros requeridos: recordIds o DocAction');
    }

    const queryParams = new URLSearchParams({
      processId: process.id,
      windowId,
      _action: 'com.smf.jobs.defaults.ProcessOrders',
    });

    const payload = {
      recordIds,
      _buttonValue: params.buttonValue || 'DONE',
      _params: {
        DocAction: docAction,
      },
      _entityName: entityName,
    };

    const { ok, data, status } = await Metadata.kernelClient.post(`?${queryParams}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!ok) {
      throw new Error(`HTTP error! status: ${status}`);
    }

    return data;
  } catch (error) {
    logger.error('Error en DJOBS_ProcessOrders.onProcess:', error);

    return {
      success: false,
      responseActions: [
        {
          showMsgInProcessView: {
            msgType: 'error',
            msgTitle: 'Error',
            msgText: error instanceof Error ? error.message : 'Unknown error',
          },
        },
      ],
    };
  }
};

export const metadata = {
  key: 'DJOBS_ProcessOrders',
};
