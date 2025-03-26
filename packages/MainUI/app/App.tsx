'use client';

import { RecordProvider } from '@/contexts/record';
import SanityChecker from '../contexts/api';
import LanguageProvider from '../contexts/languageProvider';
import MetadataProvider from '../contexts/metadata';
import UserProvider from '../contexts/user';
import { DatasourceProvider } from '@/contexts/datasourceContext';
import { FormProvider } from 'react-hook-form';

export default function App({ children }: React.PropsWithChildren) {
  return (
    <LanguageProvider>
      <SanityChecker>
        <RecordProvider>
          <UserProvider>
            <DatasourceProvider>
              <MetadataProvider>
                <FormProvider>{children}</FormProvider>
              </MetadataProvider>
            </DatasourceProvider>
          </UserProvider>
        </RecordProvider>
      </SanityChecker>
    </LanguageProvider>
  );
}
