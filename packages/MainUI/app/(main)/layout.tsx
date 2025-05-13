import Layout from '@/components/layout';
import { DatasourceProvider } from '@/contexts/datasourceContext';
import MetadataProvider from '@/contexts/metadata';
import UserProvider from '@/contexts/user';
import SelectedProvider from '@/contexts/selected';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <DatasourceProvider>
        <MetadataProvider>
          <SelectedProvider>
            <Layout>{children}</Layout>
          </SelectedProvider>
        </MetadataProvider>
      </DatasourceProvider>
    </UserProvider>
  );
}
