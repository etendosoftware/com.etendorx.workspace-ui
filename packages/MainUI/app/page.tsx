'use client';

import App from '@/App';
import TableView from '@/screens/Table';
import Layout from '@/components/layout';

export default function HomePage() {
  return (
    <App>
      <Layout>
        <TableView />
      </Layout>
    </App>
  );
}
