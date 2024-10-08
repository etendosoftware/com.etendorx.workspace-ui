import TabContent from './TabContent';
import type { TabProps } from './types';

const TabContainer: React.FC<TabProps> = ({
  onClose,
  selectedRecord,
  noIdentifierLabel = '',
  noTypeLabel = '',
  handleFullSize,
  isFullSize,
}) => {
  return (
    <TabContent
      onClose={onClose}
      identifier={selectedRecord.identifier ?? noIdentifierLabel}
      type={selectedRecord.type ?? noTypeLabel}
      handleFullSize={handleFullSize}
      isFullSize={isFullSize}
    />
  );
};

export default TabContainer;
