import { Organization } from '../../../../storybook/src/stories/Components/Table/types';
import { RecordContextType } from '../../../../MainUI/src/contexts/record';

export interface TabWidgetProps {
  selectedRecord: Organization | null;
  setSelectedRecord: RecordContextType['setSelectedRecord'];
  onSave: (data: Organization) => void;
  onCancel: () => void;
  editButtonLabel: string;
  cancelButtonLabel: string;
  saveButtonLabel: string;
  noRecordText: string;
}
