import { useParams } from 'react-router-dom';
import { useSingleDatasource } from '@workspaceui/etendohookbinder/hooks/useSingleDatasource';
import { useMetadataContext } from '../../hooks/useMetadataContext';
import DynamicFormView from './DynamicFormView';
import Spinner from '@workspaceui/componentlibrary/components/Spinner';

export default function DynamicForm() {
  const { windowData, tab } = useMetadataContext();
  const { recordId = '' } = useParams<{ recordId: string }>();
  const { record } = useSingleDatasource(tab?.entityName, recordId);

  if (!record || !windowData || !tab) {
    return <Spinner />;
  } else {
    return <DynamicFormView windowData={windowData} tab={tab} record={record} />;
  }
}
