import Table from '../../components/Table';
import Layout from '../../components/layout';

export default function DynamicTablePage({ params }: { params: { windowId: string } }) {
  return (
    <Layout>
      <Table windowId={params.windowId} />
    </Layout>
  );
}
