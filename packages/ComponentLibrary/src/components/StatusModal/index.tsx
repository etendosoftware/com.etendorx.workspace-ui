import { Box } from '@mui/material';
import { Modal } from '..';
import CheckIcon from '../../assets/icons/check.svg';
import SaveIcon from '../../assets/icons/save.svg';
import { useTranslation } from '../../../../MainUI/src/hooks/useTranslation';

interface StatusModalProps {
  statusText: string;
}

const StatusModal: React.FC<StatusModalProps> = ({ statusText }) => {
  const { t } = useTranslation();

  return (
    <Modal
      showHeader={false}
      saveButtonLabel={t('common.save')}
      secondaryButtonLabel={t('common.cancel')}
      SaveIcon={SaveIcon}>
      <Box
        sx={{
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
        <Box
          sx={{
            background: 'green',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '1rem',
          }}>
          <CheckIcon fill="white" />
        </Box>
        <Box sx={{ marginBottom: '1rem' }}>{statusText}</Box>
      </Box>
    </Modal>
  );
};

export default StatusModal;
