import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FormProvider, useForm } from 'react-hook-form';
import { useTabContext } from '@/contexts/tab';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { executeStringFunction } from '@/utils/functions';
import CheckIcon from '../../../ComponentLibrary/src/assets/icons/check-circle.svg';
import CloseIcon from '../../../ComponentLibrary/src/assets/icons/x.svg';
import BaseSelector from './selectors/BaseSelector';
import { ProcessDefinitionModalContentProps } from './types';
import Modal from '../Modal';
import Loading from '../loading';
import { logger } from '@/utils/logger';
import { useSelected } from '@/contexts/selected';

export default function ProcessDefinitionModal({ onClose, button, open, onSuccess }: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const onProcess = button?.processDefinition.onProcess;
  const onLoad = button?.processDefinition.onLoad;
  const { graph } = useSelected();
  const { tab } = useTabContext();
  const tabId = tab?.id || '';
  const selectedRecords = graph.getSelectedMultiple(tab);
  const [parameters, setParameters] = useState(button?.processDefinition.parameters ?? {});
  const [response, setResponse] = useState<{
    msgText: string;
    msgTitle: string;
    msgType: string;
  }>();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm();

  const handleExecute = useCallback(async () => {
    if (onProcess && tab && button) {
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
        setIsExecuting(false);
      } catch (error) {
        logger.warn('Error executing process:', error);
        setResponse({
          msgText: error instanceof Error ? error.message : 'Unknown error',
          msgTitle: t('errors.internalServerError.title'),
          msgType: 'error',
        });
        setIsExecuting(false);
      }
    }
  }, [button, form, onProcess, selectedRecords, tab, onSuccess, t]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (onLoad && open && tab && button) {
        try {
          setLoading(true);
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
        } catch (error) {
          logger.warn('Error loading parameters:', error);
        } finally {
          setLoading(false);
        }
      } else if (open) {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [button, onLoad, open, selectedRecords, tab, tabId]);

  useEffect(() => {
    if (open && button) {
      setLoading(true);
      setIsExecuting(false);
      setIsSuccess(false);
      setResponse(undefined);
      setParameters(button.processDefinition.parameters);
    }
  }, [button, open]);

  return (
    <Modal open={open} onClose={onClose}>
      <FormProvider {...form}>
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-100 overflow-auto py-8">
          <div className="bg-white rounded-lg p-4 flex flex-col w-full max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{button?.name}</h3>
              </div>
              <button
                onClick={isExecuting ? undefined : onClose}
                className="p-1 rounded-full hover:bg-(--color-baseline-10)"
                disabled={isExecuting}>
                <CloseIcon />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-1 relative">
              <div
                className={`absolute transition-opacity inset-0 flex items-center pointer-events-none justify-center bg-white ${loading ? 'opacity-100' : 'opacity-0'}`}>
                <Loading />
              </div>
              <div className={`transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
                {!isSuccess &&
                  Object.values(parameters).map(parameter => <BaseSelector key={parameter.id} parameter={parameter} />)}
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
              </div>
            </div>
            <div className="flex gap-4 justify-end mt-4">
              <button
                onClick={isExecuting ? undefined : onClose}
                className="transition px-4 py-2 border border-(--color-baseline-60) text-(--color-baseline-90) rounded font-medium focus:outline-none hover:bg-(--color-transparent-neutral-10)"
                disabled={isExecuting}>
                {t('common.close')}
              </button>
              <button
                onClick={isExecuting ? undefined : handleExecute}
                className="transition px-4 py-2 text-white rounded font-medium flex items-center gap-2 bg-(--color-etendo-dark) hover:bg-(--color-etendo-main)"
                disabled={isExecuting || isSuccess}>
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
