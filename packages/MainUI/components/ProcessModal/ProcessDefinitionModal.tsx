import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FormProvider, useForm } from 'react-hook-form';
import { useTabContext } from '@/contexts/tab';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { executeStringFunction } from '@/utils/functions';
import CheckIcon from '../../../ComponentLibrary/src/assets/icons/check-circle.svg';
import CloseIcon from '../../../ComponentLibrary/src/assets/icons/x.svg';
import BaseSelector from './selectors/BaseSelector';
import { ProcessDefinitionModalContentProps, ProcessDefinitionModalProps } from './types';
import Modal from '../Modal';
import Loading from '../loading';
import { logger } from '@/utils/logger';
import { useSelected } from '@/contexts/selected';
import WindowReferenceGrid from './WindowReferenceGrid';
import { buildPayloadByInputName } from '@/utils';
import { useUserContext } from '@/hooks/useUserContext';

function ProcessDefinitionModalContent({ onClose, button, open, onSuccess }: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const onProcess = button.processDefinition.onProcess;
  const onLoad = button.processDefinition.onLoad;
  const { graph } = useSelected();
  const { tab, record } = useTabContext();
  const tabId = tab?.id || '';
  const selectedRecords = graph.getSelectedMultiple(tabId);
  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const [response, setResponse] = useState<{
    msgText: string;
    msgTitle: string;
    msgType: string;
  }>();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { session } = useUserContext();

  const [gridSelection, setGridSelection] = useState<any[]>([]);

  const entityName = tab.entityName;

  const FALLBACK_RESULT = {};

  const recordValues = useMemo(() => {
    if (!record || !tab?.fields) return FALLBACK_RESULT;

    return buildPayloadByInputName(record, tab.fields);
  }, [record, tab?.fields]);

  useEffect(() => {
    console.debug('Record values:', recordValues);
  }, [recordValues]);

  const form = useForm();

  const handleClose = useCallback(() => {
    setResponse(undefined);
    setIsExecuting(false);
    setIsSuccess(false);
    setLoading(true);
    setParameters(button.processDefinition.parameters);
    onClose();
  }, [button.processDefinition.parameters, onClose]);

  const hasWindowReference = useMemo(() => {
    return Object.values(parameters).some(param => param.reference === 'FF80818132D8F0F30132D9BC395D0038');
  }, [parameters]);

  const handleWindowReferenceExecute = useCallback(async () => {
    if (tab) {
      setIsExecuting(true);
      setIsSuccess(false);

      try {
        const processId = button.processDefinition.id;
        const javaClassName = button.processDefinition.javaClassName;

        const params = new URLSearchParams({
          processId,
          windowId: tab.windowId,
          _action: javaClassName,
        });

        const payload = {
          C_Order_ID: tabId,
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
          setResponse({
            msgText: response.data.message.text || '',
            msgTitle:
              response.data.message.severity === 'success'
                ? t('process.completedSuccessfully')
                : t('process.processError'),
            msgType: response.data.message.severity,
          });

          if (response.data.message.severity === 'success') {
            setIsSuccess(true);
            if (onSuccess) {
              onSuccess();
            }
          }
        } else if (response?.data) {
          setResponse({
            msgText: 'Process completed successfully',
            msgTitle: t('process.completedSuccessfully'),
            msgType: 'success',
          });

          setIsSuccess(true);
          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (error) {
        console.error('Process execution error:', error);
        logger.warn('Error executing process:', error);
        setResponse({
          msgText: error instanceof Error ? error.message : 'Unknown error',
          msgTitle: t('errors.internalServerError.title'),
          msgType: 'error',
        });
      } finally {
        setIsExecuting(false);
      }
    }
  }, [
    tab,
    button.processDefinition.id,
    button.processDefinition.javaClassName,
    tabId,
    gridSelection,
    entityName,
    t,
    onSuccess,
  ]);

  const handleExecute = useCallback(async () => {
    console.debug('gridSelection:', gridSelection);

    if (hasWindowReference) {
      console.log('Executing window reference process...');
      await handleWindowReferenceExecute();
    } else if (onProcess && tab) {
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

        setResponse(result.responseActions[0].showMsgInProcessView);

        if (result.responseActions[0].showMsgInProcessView.msgType === 'success') {
          setIsSuccess(true);

          if (onSuccess) {
            onSuccess();
          }
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
    }
  }, [
    hasWindowReference,
    gridSelection,
    onProcess,
    tab,
    handleWindowReferenceExecute,
    button.processDefinition,
    selectedRecords,
    form,
    onSuccess,
    t,
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
      if (open) {
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
      }
    };

    fetchOptions();
  }, [button.processDefinition, onLoad, open, selectedRecords, tab, tabId]);

  return (
    <Modal open={open}>
      <FormProvider {...form}>
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-100 p-4 sm:p-24 md:p-24">
          <div className="bg-white rounded-lg p-4 flex flex-col w-full max-w-full max-h-full mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{button.name}</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-(--color-baseline-10)"
                disabled={isExecuting}>
                <CloseIcon />
              </button>
            </div>
            <div className="  relative">
              <div
                className={`absolute transition-opacity inset-0 flex items-center pointer-events-none justify-center bg-white ${loading ? 'opacity-100' : 'opacity-0'}`}>
                <Loading />
              </div>
              <div className={`transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
                {response ? (
                  <div
                    className={`p-3 rounded mb-4 border-l-4 ${
                      response.msgType === 'success'
                        ? 'bg-green-50 border-(--color-success-main)'
                        : 'bg-gray-50 border-(--color-etendo-main)'
                    }`}>
                    <h4 className="font-bold text-sm">{response.msgTitle}</h4>
                    <p className="text-sm">{response.msgText}</p>
                  </div>
                ) : null}
                {!isSuccess && (
                  <>
                    {Object.values(parameters).map(parameter => {
                      if (parameter.reference === 'FF80818132D8F0F30132D9BC395D0038') {
                        return (
                          <>
                            <WindowReferenceGrid
                              key={parameter.id}
                              parameter={parameter}
                              onSelectionChange={setGridSelection}
                              tabId={tabId}
                              windowId={tab?.windowId}
                              processId={button.processDefinition.id}
                              entityName={entityName}
                              recordValues={recordValues}
                              session={session}
                            />
                          </>
                        );
                      }
                      return <BaseSelector key={parameter.id} parameter={parameter} />;
                    })}
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-4">
              <button
                onClick={handleClose}
                className="transition px-4 py-2 border border-(--color-baseline-60) text-(--color-baseline-90) rounded font-medium focus:outline-none hover:bg-(--color-transparent-neutral-10)"
                disabled={isExecuting}>
                {t('common.close')}
              </button>
              <button
                onClick={handleExecute}
                className="transition px-4 py-2 text-white rounded font-medium flex items-center gap-2 bg-(--color-etendo-dark) hover:bg-(--color-etendo-main)"
                disabled={isExecuting || isSuccess || (hasWindowReference && gridSelection.length === 0)}>
                {isExecuting ? (
                  <span className="animate-pulse">{t('common.loading')}...</span>
                ) : isSuccess ? (
                  <span className="flex items-center gap-2">
                    <CheckIcon fill="white" />
                    {t('process.completedSuccessfully')}
                  </span>
                ) : (
                  <>
                    {CheckIcon && <CheckIcon fill="white" />}
                    {t('common.execute')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </FormProvider>
    </Modal>
  );
}

export default function ProcessDefinitionModal({ button, onSuccess, ...props }: ProcessDefinitionModalProps) {
  if (button) {
    return <ProcessDefinitionModalContent {...props} button={button} onSuccess={onSuccess} />;
  }

  return null;
}
