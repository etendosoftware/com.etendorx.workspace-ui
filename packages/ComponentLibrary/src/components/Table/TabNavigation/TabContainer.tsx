import TabContent from './TabContent';
import type { TabProps } from '../../../../../storybook/src/stories/Components/Table/types';

const TabContainer: React.FC<TabProps> = ({
  isOpen,
  onClose,
  selectedRecord,
  noIdentifierLabel = '',
  noTypeLabel = '',
  handleFullSize,
  isFullSize,
}) => {
  return (
    <div className={`Record ${isOpen && 'open'}`}>
      <TabContent
        onClose={onClose}
        identifier={selectedRecord.identifier ?? noIdentifierLabel}
        type={selectedRecord.type ?? noTypeLabel}
        handleFullSize={handleFullSize}
        isFullSize={isFullSize}
      />
    </div>
  );
};

export default TabContainer;
