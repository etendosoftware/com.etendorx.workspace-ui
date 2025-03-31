import { RecordProvider } from '@/contexts/record';
import LanguageProvider from '../contexts/languageProvider';
import MetadataProvider from '../contexts/metadata';
import UserProvider from '../contexts/user';
import { DatasourceProvider } from '@/contexts/datasourceContext';
import ApiProviderWrapper from '@/contexts/api/wrapper';

export default function App({ children }: React.PropsWithChildren) {
  return (
    <LanguageProvider>
      <ApiProviderWrapper>
        <RecordProvider>
          <UserProvider>
            <DatasourceProvider>
              <MetadataProvider>{children}</MetadataProvider>
            </DatasourceProvider>
          </UserProvider>
        </RecordProvider>
      </ApiProviderWrapper>
    </LanguageProvider>
  );
}
