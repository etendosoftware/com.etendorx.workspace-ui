import { useCallback, useEffect, useState } from 'react';
import Modal from '../Modal';
import { ProcessDefinitionButton } from './types';
import { useTranslation } from '@/hooks/useTranslation';
import { FormProvider, useForm } from 'react-hook-form';
import BaseSelector from './selectors/BaseSelector';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { useTabContext } from '@/contexts/tab';
import { logger } from '@/utils/logger';
import { useProcessMetadata } from '@/hooks/useProcessMetadata';

interface ProcessDefinitionModalProps {
  onClose: () => void;
  open: boolean;
  button?: ProcessDefinitionButton;
}

interface ProcessDefinitionModalContentProps extends ProcessDefinitionModalProps {
  button: NonNullable<ProcessDefinitionModalProps['button']>;
}

function ProcessDefinitionModalContent({ onClose, button, open }: ProcessDefinitionModalContentProps) {
  const { t } = useTranslation();
  const { metadata } = useProcessMetadata(button);
  const onProcess = metadata?.onProcess;
  const onLoad = metadata?.onLoad;
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

  const form = useForm();

  const handleExecute = useCallback(async () => {
    if (onProcess && tab) {
      const result = await onProcess(button.processDefinition, {
        buttonValue: 'DONE',
        windowId: tab.windowId,
        entityName: tab.entityName,
        recordIds: Object.keys(selectedRecords),
        ...form.getValues(),
      });
      setResponse(result.responseActions[0].showMsgInProcessView);
    }
  }, [button.processDefinition, form, onProcess, selectedRecords, tab]);

  useEffect(() => {
    const f = async () => {
      if (onLoad && open && tab) {
        const result = await onLoad(button.processDefinition, { selectedRecords, tabId });
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
      }
    };

    f().catch(logger.warn);
  }, [button.processDefinition, onLoad, open, selectedRecords, tab, tabId]);

  return (
    <Modal open={open}>
      <FormProvider {...form}>
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black/50 z-100">
          <div className="bg-white rounded-lg p-4 flex flex-column gap-4">
            <div className="font-bold p-2 text-center">{button.name}</div>
            <div className="flex gap-4">
              {Object.values(parameters).map(parameter => (
                <BaseSelector key={parameter.id} parameter={parameter} />
              ))}
            </div>
            {response ? (
              <div>
                <b>{response.msgTitle}</b>
                <p>{response.msgText}</p>
              </div>
            ) : null}
            <div className="flex gap-2 items-center justify-center">
              <button
                onClick={handleExecute}
                className="transition px-4 py-2 bg-[var(--color-etendo-main)] text-white rounded font-medium focus:outline-none hover:bg-[var(--color-etendo-dark)]">
                {t('common.execute')}
              </button>
              <button
                onClick={onClose}
                className="transition px-4 py-2 bg-[var(--color-neutral-1000)] text-white rounded font-medium focus:outline-none hover:bg-[var(--color-etendo-dark)]">
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      </FormProvider>
    </Modal>
  );
}

export default function ProcessDefinitionModal({ button, ...props }: ProcessDefinitionModalProps) {
  if (typeof button != 'undefined') {
    return <ProcessDefinitionModalContent {...props} button={button} />;
  }

  return null;
}
