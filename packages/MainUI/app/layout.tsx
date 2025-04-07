import { Inter } from 'next/font/google';
import './styles/global.css';
import ThemeProvider from '@workspaceui/componentlibrary/src/components/ThemeProvider';
import Layout from '@/components/layout';
import ApiProviderWrapper from '@/contexts/api/wrapper';
import { DatasourceProvider } from '@/contexts/datasourceContext';
import LanguageProvider from '@/contexts/languageProvider';
import MetadataProvider from '@/contexts/metadata';
import { RecordProvider } from '@/contexts/record';
import UserProvider from '@/contexts/user';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <ApiProviderWrapper>
              <RecordProvider>
                <UserProvider>
                  <DatasourceProvider>
                    <MetadataProvider>
                      <Layout>{children}</Layout>
                    </MetadataProvider>
                  </DatasourceProvider>
                </UserProvider>
              </RecordProvider>
            </ApiProviderWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
