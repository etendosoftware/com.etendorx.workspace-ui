import { Montserrat as Font } from 'next/font/google';
import './global.css';
import App from './App';

const font = Font({
  weight: ['100', '300', '400', '500', '700', '900'],
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div id="root" className={font.className}>
          <App>{children}</App>
        </div>
      </body>
    </html>
  );
}
