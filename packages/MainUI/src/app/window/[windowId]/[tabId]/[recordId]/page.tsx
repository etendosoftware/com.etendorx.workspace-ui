import Layout from '../../../../components/layout';
import DynamicForm from 'src/screens/Form/DynamicForm';

export default function DynamicFormPage({ params }: { params: { windowId: string; tabId: string; recordId: string } }) {
  return (
    <Layout>
      <DynamicForm windowId={params.windowId} tabId={params.tabId} recordId={params.recordId} />
    </Layout>
  );
}
