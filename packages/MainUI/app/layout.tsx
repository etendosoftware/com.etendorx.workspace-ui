import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/index.css';

const font = Inter({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin-ext'],
});

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: 'Etendo',
  description: 'Etendo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>{children}</body>
    </html>
  );
}
