import { Organization } from '../../../../storybook/src/stories/Components/Table/types';

export interface FormViewProps {
  data: Organization;
  onSave: () => void;
  onCancel: () => void;
}
