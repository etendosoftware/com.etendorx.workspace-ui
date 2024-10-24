import { useSingleDatasource } from '@workspaceui/etendohookbinder/hooks/useSingleDatasource';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import DynamicFormView from './DynamicFormView';
import { useParams } from 'next/navigation';

export default function DynamicForm() {
  const { windowData, tab } = useMetadataContext();
  const { recordId = '' } = useParams<{ recordId: string }>();
  const { record } = useSingleDatasource(tab?.entityName, recordId);

  if (!record) {
    return <span>Missing record</span>;
  } else if (!windowData || !tab) {
    return <span>Missing window metadata</span>;
  } else {
    return <DynamicFormView windowData={windowData} tab={tab} record={record} />;
  }
}
