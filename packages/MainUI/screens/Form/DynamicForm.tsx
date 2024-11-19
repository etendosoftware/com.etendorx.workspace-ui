import { useSingleDatasource } from '@workspaceui/etendohookbinder/src/hooks/useSingleDatasource';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import DynamicFormView from './DynamicFormView';
import { useParams } from 'next/navigation';
import { WindowParams } from '../../app/types';

export default function DynamicForm() {
  const { windowData, tab } = useMetadataContext();
  const { recordId = '' } = useParams<WindowParams>();
  const { record } = useSingleDatasource(tab?.entityName, recordId);

  if (!record) {
    return <span>Missing record</span>;
  } else if (!windowData || !tab) {
    return <span>Missing window metadata</span>;
  } else {
    return <DynamicFormView tab={tab} record={record} />;
  }
}
