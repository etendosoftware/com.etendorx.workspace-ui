import { Organization } from '../../../../storybook/src/stories/Components/Table/types';

export interface TabWidgetProps {
  selectedRecord: Organization | null;
  setSelectedRecord: React.Dispatch<Organization | null>;
  onSave: (data: Organization) => void;
  onCancel: () => void;
  editButtonLabel: string | undefined;
  cancelButtonLabel: string | undefined;
  saveButtonLabel: string | undefined;
  noRecordText: string | undefined;
}
