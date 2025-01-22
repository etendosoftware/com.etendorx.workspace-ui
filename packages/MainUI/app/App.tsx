'use client';

import { RecordProvider } from '@/contexts/record';
import SanityChecker from '../components/SanityChecker';
import LanguageProvider from '../contexts/languageProvider';
import MetadataProvider from '../contexts/metadata';
import UserProvider from '../contexts/user';

export default function App({ children }: React.PropsWithChildren) {
  return (
    <LanguageProvider>
      <SanityChecker>
        <RecordProvider>
          <UserProvider>
            <MetadataProvider>{children}</MetadataProvider>
          </UserProvider>
        </RecordProvider>
      </SanityChecker>
    </LanguageProvider>
  );
}
