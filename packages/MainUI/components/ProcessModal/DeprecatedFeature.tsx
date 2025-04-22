import { useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { ProcessDeprecatedModallProps } from './types';
import CloseIcon from '../../../ComponentLibrary/src/assets/icons/x.svg';
import WarningIcon from '../../../ComponentLibrary/src/assets/icons/alert-triangle.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { useStyle } from './styles';
import { Button } from '@mui/material';

const DeprecatedFeatureModal = ({ isOpen, onClose, title, message }: ProcessDeprecatedModallProps) => {
  const { t } = useTranslation();
  const { styles } = useStyle();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/50">
      <div className="relative bg-white flex flex-col w-full max-w-md border-4 border-gray-300 rounded-xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 rounded-t-xl bg-[var(--color-baseline-10)]">
          <h2 className="text-lg font-semibold">{title || t('common.processTitle')}</h2>
          <IconButton onClick={onClose} sx={styles.clearButtonHover}>
            <CloseIcon />
          </IconButton>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <WarningIcon fill="red" width={32} height={32} />
          </div>
          <p className="text-center text-lg font-medium mb-4">{message || t('process.deprecatedFeature')}</p>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-center rounded-b-xl bg-[var(--color-baseline-10)]">
          <Button onClick={handleClose} variant="contained">
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeprecatedFeatureModal;
