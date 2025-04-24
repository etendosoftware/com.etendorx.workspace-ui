import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FormProvider, useForm } from 'react-hook-form';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { useTabContext } from '@/contexts/tab';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { executeStringFunction } from '@/utils/functions';
import CheckIcon from '../../../ComponentLibrary/src/assets/icons/check-circle.svg';
import CloseIcon from '../../../ComponentLibrary/src/assets/icons/x.svg';
import BaseSelector from './selectors/BaseSelector';
import { ProcessDefinitionModalContentProps, ProcessDefinitionModalProps } from './types';
import Modal from '../Modal';

function ProcessDefinitionModalContent({ onClose, button, open, onSuccess }: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const onProcess = button.processDefinition.onProcess;
  const onLoad = button.processDefinition.onLoad;
  const { selectedMultiple } = useMetadataContext();
  const { tab } = useTabContext();
  const tabId = tab?.id || '';
  const selectedRecords = selectedMultiple[tabId];
  const [parameters, setParameters] = useState(button.processDefinition.parameters);
  const [response, setResponse] = useState<{
    msgText: string;
    msgTitle: string;
    msgType: string;
  }>();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm();

  const handleClose = useCallback(() => {
    onClose();
    setResponse(undefined);
    setIsExecuting(false);
    setIsSuccess(false);
  }, [onClose]);

  const handleExecute = useCallback(async () => {
    if (onProcess && tab) {
      setIsExecuting(true);
      setIsSuccess(false);

      try {
        const result = await executeStringFunction(onProcess, { Metadata }, button.processDefinition, {
          buttonValue: 'DONE',
          windowId: tab.windowId,
          entityName: tab.entityName,
          recordIds: Object.keys(selectedRecords),
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
        console.error('Error executing process:', error);
        setResponse({
          msgText: error instanceof Error ? error.message : 'Unknown error',
          msgTitle: t('errors.internalServerError.title'),
          msgType: 'error',
        });
        setIsExecuting(false);
      }
    }
  }, [button.processDefinition, form, onProcess, selectedRecords, tab, onSuccess, t]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (onLoad && open && tab) {
        try {
          const result = await executeStringFunction(onLoad, { Metadata }, button.processDefinition, {
            selectedRecords,
            tabId,
          });
          setParameters(prev => {
            const newParameters = { ...prev };
            Object.entries(result).forEach(([parameterName, values]) => {
              const newOptions = values as string[];
              newParameters[parameterName].refList = newParameters[parameterName].refList.filter(option =>
                newOptions.includes(option.value),
              );
            });

            return newParameters;
          });
        } catch (error) {
          console.error('Error loading parameters:', error);
        }
      }
    };

    fetchOptions();
  }, [button.processDefinition, onLoad, open, selectedRecords, tab, tabId]);

  useEffect(() => {
    if (open) {
      setIsExecuting(false);
      setIsSuccess(false);
      setResponse(undefined);
    }
  }, [open]);

  return (
    <Modal open={open}>
      <FormProvider {...form}>
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-100 overflow-auto py-8">
          <div className="bg-white rounded-lg p-4 flex flex-col w-full max-w-2xl mx-auto">
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
            <div className="overflow-y-auto max-h-[60vh] p-1">
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

export default function ProcessDefinitionModal({ button, onSuccess, ...props }: ProcessDefinitionModalProps) {
  if (typeof button != 'undefined') {
    return <ProcessDefinitionModalContent {...props} button={button} onSuccess={onSuccess} />;
  }

  return null;
}
