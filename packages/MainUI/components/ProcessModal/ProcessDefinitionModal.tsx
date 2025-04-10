import { useCallback } from 'react';
import Modal from '../Modal';
import { ProcessDefinitionButton } from './types';

interface ProcessDefinitionModalProps {
  onClose: () => void;
  open: boolean;
  button?: ProcessDefinitionButton;
}

interface ProcessDefinitionModalContentProps extends ProcessDefinitionModalProps {
  button: NonNullable<ProcessDefinitionModalProps['button']>;
}

function ProcessDefinitionModalContent({ onClose, button, open }: ProcessDefinitionModalContentProps) {
  const handleExecute = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal open={open}>
      <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black/20 z-100">
        <div className="bg-white rounded-lg p-4">
          <div className="font-bold p-2">{button.name}</div>
          <div>
            <pre className="code max-h-80 text-xs overflow-auto">
              <code>{JSON.stringify(button.processDefinition, null, 2)}</code>
            </pre>
          </div>
          <div className="flex gap-4">
            <div onClick={onClose} className="border p-2">
              Close
            </div>
            <div onClick={handleExecute} className="border p-2">
              Execute
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function ProcessDefinitionModal({ button, ...props }: ProcessDefinitionModalProps) {
  if (typeof button != 'undefined') {
    return <ProcessDefinitionModalContent {...props} button={button} />;
  }

  return null;
}
