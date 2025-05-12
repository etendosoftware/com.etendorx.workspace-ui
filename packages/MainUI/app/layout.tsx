import { Inter } from 'next/font/google';
import './styles/global.css';
import ThemeProvider from '@workspaceui/componentlibrary/src/components/ThemeProvider';
import Layout from '@/components/layout';
import ApiProviderWrapper from '@/contexts/api/wrapper';
import { DatasourceProvider } from '@/contexts/datasourceContext';
import LanguageProvider from '@/contexts/language';
import MetadataProvider from '@/contexts/metadata';
import UserProvider from '@/contexts/user';
import SelectedProvider from '@/contexts/selected';
import { Metadata } from 'next/types';

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
        <ThemeProvider>
          <LanguageProvider>
            <ApiProviderWrapper>
              <UserProvider>
                <DatasourceProvider>
                  <MetadataProvider>
                    <SelectedProvider>
                      <Layout>{children}</Layout>
                    </SelectedProvider>
                  </MetadataProvider>
                </DatasourceProvider>
              </UserProvider>
            </ApiProviderWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
