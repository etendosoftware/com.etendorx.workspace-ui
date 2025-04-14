import { useCallback } from 'react';
import Modal from '../Modal';
import { ProcessDefinitionButton } from './types';
import { useTranslation } from '@/hooks/useTranslation';
import { FormProvider, useForm } from 'react-hook-form';
import BaseSelector from './selectors/BaseSelector';

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

  const handleExecute = useCallback(() => {
    onClose();
  }, [onClose]);

  const form = useForm();

  return (
    <Modal open={open}>
      <FormProvider {...form}>
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black/20 z-100">
          <div className="bg-white rounded-lg p-4">
            <div className="font-bold p-2">{button.name}</div>
            <div>
              <pre className="code max-h-80 text-xs overflow-auto">
                <code>{JSON.stringify(button.processDefinition, null, 2)}</code>
              </pre>
            </div>
            <div className="flex gap-4">
              {button.processDefinition.parameters.map(parameter => (
                <BaseSelector key={parameter.id} name={parameter.name} description={parameter.name} isMandatory />
              ))}
            </div>
            <div className="flex gap-4 items-center justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 mx-auto bg-[var(--color-etendo-main)] text-white rounded font-medium focus:outline-none hover:bg-[var(--color-etendo-dark)]">
                {t('common.close')}
              </button>
              <button
                onClick={handleExecute}
                className="px-4 py-2 mx-auto bg-[var(--color-etendo-main)] text-white rounded font-medium focus:outline-none hover:bg-[var(--color-etendo-dark)]">
                {t('common.execute')}
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
