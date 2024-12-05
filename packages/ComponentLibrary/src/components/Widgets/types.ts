import { Organization } from '@workspaceui/storybook/src/stories/Components/Table/types';
import { FormViewProps } from '../FormView/types';

export interface TabWidgetProps {
  selectedRecord: Organization & FormViewProps['data'];
  setSelectedRecord: React.Dispatch<Organization | null>;
  onSave: (data: Organization) => void;
  onCancel: () => void;
  editButtonLabel: string | undefined;
  cancelButtonLabel: string | undefined;
  saveButtonLabel: string | undefined;
  noRecordText: string | undefined;
}
