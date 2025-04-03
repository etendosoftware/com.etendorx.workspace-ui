import { useTranslation } from '@/hooks/useTranslation';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  maxWidth?: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, maxWidth }) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full text-center py-8"
      style={{ maxWidth: `${maxWidth}px` }}>
      <div className="w-16 h-8 text-gray-300"></div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title || t('table.labels.emptyRecords')}</h3>
      <p className="text-sm text-gray-500 max-w-md mb-4">{description || t('status.noRecords')}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
