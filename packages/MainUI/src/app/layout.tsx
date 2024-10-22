import { Metadata } from 'next';
import ClientProviders from './components/ClientProviders';

export const metadata: Metadata = {
  title: 'Etendo',
  description: 'Etendo Application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
