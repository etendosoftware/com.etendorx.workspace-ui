import { Box } from '@mui/material';
import { Modal } from '..';
import CloseRecordIcon from '../../assets/icons/close-record.svg';

interface StatusModalProps {
  statusText: string;
}

const StatusModal: React.FC<StatusModalProps> = ({ statusText }) => {
  return (
    <Modal tittleHeader="Register" HeaderIcon={CloseRecordIcon}>
      <Box sx={{ paading: 0 }}>{statusText}</Box>
    </Modal>
  );
};

export default StatusModal;
