import { Inter } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import './styles/global.css';
import App from './App';
import { ThemeRegistry } from '@workspaceui/componentlibrary/components/ThemeProvider';

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
      <body>
        <AppRouterCacheProvider>
          <ThemeRegistry>
            <App>{children}</App>
          </ThemeRegistry>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
