import { Inter } from 'next/font/google';
import './globals.css';
import { ConvexClientProvider } from '@/providers/convex-client-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Orbital AI',
  description: 'Your intelligent AI assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
