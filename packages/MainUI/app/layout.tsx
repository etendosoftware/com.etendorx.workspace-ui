import { Inter } from 'next/font/google';
import './styles/global.css';
import App from './App';
import { ThemeRegistry } from '@workspaceui/componentlibrary/src/components/ThemeProvider';

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
        <ThemeRegistry>
          <App>{children}</App>
        </ThemeRegistry>
      </body>
    </html>
  );
}
