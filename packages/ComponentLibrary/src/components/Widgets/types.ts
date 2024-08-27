import { Organization } from '../../../../storybook/src/stories/Components/Table/types';

export interface TabWidgetProps {
  onSave: (data: Organization) => void;
  onCancel: () => void;
  editButtonLabel: string;
  cancelButtonLabel: string;
  saveButtonLabel: string;
}
