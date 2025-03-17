import { Inter } from 'next/font/google';
import './styles/global.css';
import App from './App';
import ThemeProvider from '@workspaceui/componentlibrary/src/components/ThemeProvider';
import { ApiUrlProvider } from '@/contexts/api';
import { getApiUrl } from './actions';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiUrl = await getApiUrl();

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <ApiUrlProvider url={apiUrl}>
          <ThemeProvider>
            <App>{children}</App>
          </ThemeProvider>
        </ApiUrlProvider>
      </body>
    </html>
  );
}
