'use client';

import SanityChecker from '../components/SanityChecker';
import { LanguageProvider } from '../contexts/languageProvider';
import MetadataProvider from '../contexts/metadata';
import UserProvider from '../contexts/user';

export default function App({ children }: React.PropsWithChildren) {
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
