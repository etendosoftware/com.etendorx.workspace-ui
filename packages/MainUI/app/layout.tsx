import { Inter } from 'next/font/google';
import App from '@/App';
import '@/index.css';

const font = Inter({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin-ext'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>
        <div id="root">
          <App>{children}</App>
        </div>
      </body>
    </html>
  );
}
