import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FormProvider, useForm } from 'react-hook-form';
import { useTabContext } from '@/contexts/tab';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { executeStringFunction } from '@/utils/functions';
import CheckIcon from '../../../ComponentLibrary/src/assets/icons/check-circle.svg';
import CloseIcon from '../../../ComponentLibrary/src/assets/icons/x.svg';
import BaseSelector from './selectors/BaseSelector';
import {
  ProcessDefinitionModalContentProps,
  ProcessDefinitionModalProps,
  RecordValues,
  ResponseMessage,
} from './types';
import Modal from '../Modal';
import Loading from '../loading';
import { logger } from '@/utils/logger';
import { useSelected } from '@/contexts/selected';
import WindowReferenceGrid from './WindowReferenceGrid';
import { buildPayloadByInputName } from '@/utils';
import { useUserContext } from '@/hooks/useUserContext';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

export const FALLBACK_RESULT = {};
const WINDOW_REFERENCE_ID = 'FF80818132D8F0F30132D9BC395D0038';

function ProcessDefinitionModalContent({ onClose, button, open, onSuccess }: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const { graph } = useSelected();
  const { tab, record } = useTabContext();
  const { session } = useUserContext();
  const form = useForm();

  const { onProcess, onLoad } = button.processDefinition;
  const processId = button.processDefinition.id;
  const javaClassName = button.processDefinition.javaClassName;

  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const [response, setResponse] = useState<ResponseMessage>();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gridSelection, setGridSelection] = useState<unknown[]>([]);

  const tabId = tab?.id || '';
  const entityName = tab?.entityName || '';
  const selectedRecords = graph.getSelectedMultiple(tabId);
  const windowReferenceTab = parameters.grid?.window?.tabs?.[0] as Tab;

  const recordValues: RecordValues = useMemo(() => {
    if (!record || !tab?.fields) return FALLBACK_RESULT;
    return buildPayloadByInputName(record, tab.fields);
  }, [record, tab?.fields]);

  const hasWindowReference = useMemo(() => {
    return Object.values(parameters).some(param => param.reference === WINDOW_REFERENCE_ID);
  }, [parameters]);

  const handleClose = useCallback(() => {
    if (isExecuting) return;
    setResponse(undefined);
    setIsExecuting(false);
    setIsSuccess(false);
    setLoading(true);
    setParameters(button.processDefinition.parameters);
    onClose();
  }, [button.processDefinition.parameters, isExecuting, onClose]);

  const handleWindowReferenceExecute = useCallback(async () => {
    if (!tab) return;

    setIsExecuting(true);
    setIsSuccess(false);

    try {
      const params = new URLSearchParams({
        processId,
        windowId: tab.windowId,
        _action: javaClassName,
      });

      const payload = {
        C_Order_ID: recordValues.inpcOrderId,
        inpcOrderId: tabId,
        _buttonValue: 'DONE',
        _params: {
          grid: {
            _selection: gridSelection,
          },
        },
        _entityName: entityName,
      };

      const response = await Metadata.kernelClient.post(`?${params}`, payload);

      if (response?.data?.message) {
        const isSuccessResponse = response.data.message.severity === 'success';

        setResponse({
          msgText: response.data.message.text || '',
          msgTitle: isSuccessResponse ? t('process.completedSuccessfully') : t('process.processError'),
          msgType: response.data.message.severity,
        });

        if (isSuccessResponse) {
          setIsSuccess(true);
          onSuccess?.();
        }
      } else if (response?.data) {
        setResponse({
          msgText: 'Process completed successfully',
          msgTitle: t('process.completedSuccessfully'),
          msgType: 'success',
        });

        setIsSuccess(true);
        onSuccess?.();
      }
    } catch (error) {
      logger.warn('Error executing process:', error);
      setResponse({
        msgText: error instanceof Error ? error.message : 'Unknown error',
        msgTitle: t('errors.internalServerError.title'),
        msgType: 'error',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [tab, processId, javaClassName, recordValues.inpcOrderId, tabId, gridSelection, entityName, t, onSuccess]);

  const handleExecute = useCallback(async () => {
    if (hasWindowReference) {
      await handleWindowReferenceExecute();
      return;
    }

    if (!onProcess || !tab) return;

    setIsExecuting(true);
    setIsSuccess(false);

    try {
      const result = await executeStringFunction(onProcess, { Metadata }, button.processDefinition, {
        buttonValue: 'DONE',
        windowId: tab.windowId,
        entityName: tab.entityName,
        recordIds: selectedRecords?.map(r => r.id),
        ...form.getValues(),
      });

      const responseMessage = result.responseActions[0].showMsgInProcessView;
      setResponse(responseMessage);

      if (responseMessage.msgType === 'success') {
        setIsSuccess(true);
        onSuccess?.();
      }
    } catch (error) {
      logger.warn('Error executing process:', error);
      setResponse({
        msgText: error instanceof Error ? error.message : 'Unknown error',
        msgTitle: t('errors.internalServerError.title'),
        msgType: 'error',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [
    hasWindowReference,
    handleWindowReferenceExecute,
    onProcess,
    tab,
    button.processDefinition,
    selectedRecords,
    form,
    t,
    onSuccess,
  ]);

  useEffect(() => {
    if (open) {
      setIsExecuting(false);
      setIsSuccess(false);
      setResponse(undefined);
      setParameters(button.processDefinition.parameters);
      setGridSelection([]);
    }
  }, [button.processDefinition.parameters, open]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!open) return;

      try {
        setLoading(true);

        if (onLoad && tab) {
          const result = await executeStringFunction(onLoad, { Metadata }, button.processDefinition, {
            selectedRecords,
            tabId,
          });

          setParameters(prev => {
            const newParameters = { ...prev };

            Object.entries(result).forEach(([parameterName, values]) => {
              const newOptions = values as string[];
              newParameters[parameterName] = { ...newParameters[parameterName] };
              newParameters[parameterName].refList = newParameters[parameterName].refList.filter(option =>
                newOptions.includes(option.value),
              );
            });

            return newParameters;
          });
        }

        setTimeout(() => {
          setLoading(false);
        }, 300);
      } catch (error) {
        logger.warn('Error loading parameters:', error);
        setLoading(false);
      }
    };

    fetchOptions();
  }, [button.processDefinition, onLoad, open, selectedRecords, tab, tabId]);

  const renderResponse = () => {
    if (!response) return null;

    const isSuccessMessage = response.msgType === 'success';
    const messageClasses = `p-3 rounded mb-4 border-l-4 ${
      isSuccessMessage ? 'bg-green-50 border-(--color-success-main)' : 'bg-gray-50 border-(--color-etendo-main)'
    }`;

    return (
      <div className={messageClasses}>
        <h4 className="font-bold text-sm">{response.msgTitle}</h4>
        <p className="text-sm" dangerouslySetInnerHTML={{ __html: response.msgText }} />
      </div>
    );
  };

  const renderParameters = () => {
    if (isSuccess) return null;

    return Object.values(parameters).map(parameter => {
      if (parameter.reference === WINDOW_REFERENCE_ID) {
        return (
          <WindowReferenceGrid
            key={parameter.id}
            parameter={parameter}
            onSelectionChange={setGridSelection}
            tabId={tabId}
            tab={tab}
            windowId={tab?.windowId}
            processId={processId}
            entityName={entityName}
            recordValues={recordValues}
            session={session}
            windowReferenceTab={windowReferenceTab}
          />
        );
      }

      return <BaseSelector key={parameter.id} parameter={parameter} />;
    });
  };

  const renderActionButton = () => {
    if (isExecuting) {
      return <span className="animate-pulse">{t('common.loading')}...</span>;
    }

    if (isSuccess) {
      return (
        <span className="flex items-center gap-2">
          <CheckIcon fill="white" />
          {t('process.completedSuccessfully')}
        </span>
      );
    }

    return (
      <>
        {CheckIcon && <CheckIcon fill="white" />}
        {t('common.execute')}
      </>
    );
  };

  const isActionButtonDisabled = isExecuting || isSuccess || (hasWindowReference && gridSelection.length === 0);

  return (
    <Modal open={open}>
      <FormProvider {...form}>
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{button.name}</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-(--color-baseline-10)"
                disabled={isExecuting}>
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className={`relative ${isExecuting ? 'animate-pulse cursor-progress cursor-to-children' : ''}`}>
                <div
                  className={`absolute transition-opacity inset-0 flex items-center pointer-events-none justify-center bg-white ${
                    loading ? 'opacity-100' : 'opacity-0'
                  }`}>
                  <Loading />
                </div>
                <div className={`transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
                  {renderResponse()}
                  {renderParameters()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-4 justify-center mx-4 mb-4">
              <button
                onClick={handleClose}
                className="transition px-4 py-2 border border-(--color-baseline-60) text-(--color-baseline-90) rounded-full w-full
                font-medium focus:outline-none hover:bg-(--color-transparent-neutral-10)"
                disabled={isExecuting}>
                {t('common.close')}
              </button>
              <button
                onClick={handleExecute}
                className="transition px-4 py-2 text-white rounded-full w-full justify-center font-medium flex items-center gap-2 bg-(--color-baseline-100) hover:bg-(--color-etendo-main)"
                disabled={isActionButtonDisabled}>
                {renderActionButton()}
              </button>
            </div>
          </div>
        </div>
      </FormProvider>
    </Modal>
  );
}

export default function ProcessDefinitionModal({ button, onSuccess, ...props }: ProcessDefinitionModalProps) {
  if (!button) return null;

  return <ProcessDefinitionModalContent {...props} button={button} onSuccess={onSuccess} />;
}
