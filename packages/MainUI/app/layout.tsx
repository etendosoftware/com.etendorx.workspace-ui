import { Metadata } from 'next/types';
import { Inter } from 'next/font/google';
import ApiProviderWrapper from '@/contexts/api/wrapper';
import './styles/global.css';
import ThemeProvider from '@workspaceui/componentlibrary/src/components/ThemeProvider';
import LanguageProvider from '@/contexts/language';
import UserProvider from '@/contexts/user';
import { DatasourceProvider } from '@/contexts/datasourceContext';
import MetadataProvider from '@/contexts/metadata';
import Layout from '@/components/layout';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Etendo',
  applicationName: 'Etendo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <ApiProviderWrapper>
          <ThemeProvider>
            <LanguageProvider>
              <UserProvider>
                <DatasourceProvider>
                  <MetadataProvider>
                    <Layout>{children}</Layout>
                  </MetadataProvider>
                </DatasourceProvider>
              </UserProvider>
            </LanguageProvider>
          </ThemeProvider>
        </ApiProviderWrapper>
      </body>
    </html>
  );
}
