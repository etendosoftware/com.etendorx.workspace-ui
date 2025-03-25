import { CircularProgress } from '@mui/material';
import { useTranslation } from '@/hooks/useTranslation';

export default function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="center-all flex-column">
      <CircularProgress />
      <span>{t('common.loading')}</span>
    </div>
  );
}
