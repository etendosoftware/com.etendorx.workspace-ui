'use client';

import SanityChecker from '../components/SanityChecker';
import LanguageProvider from '../contexts/languageProvider';
import MetadataProvider from '../contexts/metadata';
import UserProvider from '../contexts/user';
import useOBUtilities from '@/hooks/useOBUtilities';

export default function App({ children }: React.PropsWithChildren) {
  useOBUtilities();

  return (
    <LanguageProvider>
      <SanityChecker>
        <UserProvider>
          <MetadataProvider>{children}</MetadataProvider>
        </UserProvider>
      </SanityChecker>
    </LanguageProvider>
  );
}
