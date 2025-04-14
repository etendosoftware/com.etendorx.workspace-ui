import { ProcessBindings } from '@workspaceui/etendohookbinder/src/api/types';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { logger } from '@/utils/logger';

/**
 * Función que se ejecuta al cargar el proceso
 * @param process Información del proceso
 * @param context Contexto adicional (opcional)
 * @returns Objeto con las acciones disponibles
 */
export const onLoad: ProcessBindings['onLoad'] = async (process, context) => {
  try {
    const selectedRecords = context.selectedRecords;
    const tabId = context?.tabId || '';

    const values = Object.values(selectedRecords);

    const documentStatuses = Array.from(new Set(values.map(record => record.documentStatus)));

    const isProcessing = values.some(record => (record.processing || record.isprocessing || 'N') === 'Y') ? 'Y' : '';

    const queryParams = new URLSearchParams({
      _action: `${process.javaClassName}Defaults`,
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
      DocAction: data.actions,
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
export const onProcess: ProcessBindings['onProcess'] = async (process, params) => {
  try {
    const recordIds = params.recordIds;
    const docAction = params.DocAction;
    const windowId = params.windowId;
    const entityName = params.entityName;

    const queryParams = new URLSearchParams({
      processId: process.id,
      windowId,
      _action: 'com.smf.jobs.defaults.ProcessOrders',
    });

    const payload = {
      recordIds,
      _buttonValue: params.buttonValue,
      _params: {
        DocAction: docAction,
      },
      _entityName: entityName,
    };

    const { ok, data, status } = await Metadata.kernelClient.post(`?${queryParams}`, payload);

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
