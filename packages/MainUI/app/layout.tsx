import { Inter } from 'next/font/google';
import './styles/global.css';
import ThemeProvider from '@workspaceui/componentlibrary/src/components/ThemeProvider';
import Layout from '@/components/layout';
import ApiProviderWrapper from '@/contexts/api/wrapper';
import { DatasourceProvider } from '@/contexts/datasourceContext';
import LanguageProvider from '@/contexts/language';
import MetadataProvider from '@/contexts/metadata';
import { RecordProvider } from '@/contexts/record';
import SelectedProvider from '@/contexts/selected';
import UserProvider from '@/contexts/user';
import ModalContextProvider from '@/contexts/modal';

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
          <ModalContextProvider>
            <LanguageProvider>
              <ApiProviderWrapper>
                <SelectedProvider>
                  <RecordProvider>
                    <UserProvider>
                      <DatasourceProvider>
                        <MetadataProvider>
                          <SelectedProvider>
                            <Layout>{children}</Layout>
                          </SelectedProvider>
                        </MetadataProvider>
                      </DatasourceProvider>
                    </UserProvider>
                  </RecordProvider>
                </SelectedProvider>
              </ApiProviderWrapper>
            </LanguageProvider>
          </ModalContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
